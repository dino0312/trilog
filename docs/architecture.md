# docs/architecture.md — 系統架構

> 說明 Tri·log 的技術架構、模組職責、資料流與部署方式。  
> 目標：讓新加入的開發者理解「一個 HTTP request 從瀏覽器到資料庫的完整路徑」。

---

## 1. 系統全景

```
瀏覽器
  │
  ▼
Vercel Edge Network
  │  (CDN + Edge Middleware：session 驗證、路由守衛)
  │
  ├─── 靜態資源 → CDN 直接回傳
  │
  └─── 動態請求
         ├─── Server Components → SSR HTML（SEO 頁面）
         └─── Route Handlers → JSON（API 端點）
                    │
                    ├─── Supabase PostgreSQL（主資料庫）
                    ├─── Supabase Auth（用戶認證）
                    ├─── Supabase Storage（完賽證書）
                    └─── Open-Meteo API（天氣資料，僅助手操作時）
```

---

## 2. 目錄結構與模組職責

### `src/app/` — 頁面與 API

採用 Next.js App Router 的 **Route Groups** 分區：

**`(main)/` 群組**：有頂部導覽列的主應用頁面
- `/leaderboard`：公開排行榜，SSR 預渲染，有 SEO 價值
- `/records`：個人成績列表（需登入）
- `/records/new`：新增成績（需登入）
- `/profile`：個人資料（需登入）

**`(auth)/` 群組**：全螢幕置中的認證頁面
- `/login`、`/register`

**為什麼用 Route Groups**：讓兩組頁面使用完全不同的 Layout，而不是在同一個 Layout 裡做 `pathname` 判斷。Route Group 名稱（括號內）不出現在 URL。

**`api/`**：Route Handlers，回傳 JSON，不回傳 HTML。

### `src/lib/` — 服務層

```
supabase/
  client.ts    建立瀏覽器端 Supabase client（用於 Client Components）
  server.ts    建立 Server Component / Route Handler 用的 client
  middleware.ts 建立 Edge Middleware 用的 client，同時包含路由守衛邏輯

utils/
  cn.ts        className 合併工具（clsx + tailwind-merge）
  time.ts      秒數 ↔ HH:MM:SS 轉換（secondsToTime / timeToSeconds / timeDelta）
```

**為什麼有三個 Supabase client**：Next.js 的三個執行環境（瀏覽器、Server Component、Edge）存取 Cookie 的方式各不同，`@supabase/ssr` 要求分別建立對應的 client 才能正確刷新 JWT session。

### `src/types/` — 型別定義

```
database.ts  對應 PostgreSQL schema 的型別定義
             (Database, 8 張表的 Row/Insert/Update, 3 個 View, 4 個 Function)

index.ts     應用層業務型別
             (Athlete, Race, RaceEdition, Result, LeaderboardRow, Team...)
```

**使用規範**：`database.ts` 是底層 DB 型別，`index.ts` 是應用層型別。元件和 API 使用 `index.ts` 的型別，Supabase client 使用 `database.ts` 的 `Database` 泛型。

### `src/middleware.ts` — Edge 路由守衛

每個 HTTP request 到達頁面前都會經過這裡：

1. 呼叫 `updateSession()` 刷新 Supabase JWT session
2. 呼叫 `supabase.auth.getUser()` 取得目前用戶
3. 受保護路徑（`/records`、`/profile`）未登入時 redirect `/login`
4. 認證頁面（`/login`、`/register`）已登入時 redirect `/leaderboard`

**⚠️ 重要限制**：`createServerClient()` 和 `getUser()` 之間**不能放任何程式碼**，否則 token 自動刷新會靜默失敗。

**⚠️ 已知包袱**：Next.js 16 將此文件更名為 `proxy.ts`，目前仍用 `middleware.ts`，build 時有 deprecation warning。遷移計畫見 `docs/decisions.md` ADR-003。

---

## 3. 請求流程

### 3.1 SSR 頁面請求（公開頁面，如排行榜）

```
瀏覽器 GET /leaderboard
  → Edge Middleware：無 session → 路徑是公開的，放行
  → Server Component：
      createClient() (server)
      → supabase.from('leaderboard_entries').select(...)
      → PostgreSQL RLS 過濾：is_public=true AND claim_status IN (...)
      → 回傳資料
  → React Server Component 渲染 HTML
  → 瀏覽器收到完整 HTML（SEO 可索引）
```

### 3.2 受保護頁面請求（如新增成績）

```
瀏覽器 GET /records/new
  → Edge Middleware：getUser() → null（未登入）
  → redirect → /login?redirectTo=/records/new
```

### 3.3 已登入後的 API 請求（如新增成績）

```
瀏覽器 POST /api/results（帶 session cookie）
  → Edge Middleware：getUser() → user（已登入）→ 放行
  → Route Handler：
      createClient() (server)
      supabase.auth.getUser() → 確認 user
      驗證 request body
      → supabase.from('results').insert(...)
      → RLS 驗證：auth.uid() = athlete_id AND source_credibility = 'self_reported'
      → 回傳 201 { data: result }
```

### 3.4 認領成績流程

```
瀏覽器 POST /api/results/:id/claim
  → Route Handler：
      user = getUser()
      → supabase.rpc('claim_result', { p_result_id: id })
      → DB Function（SECURITY DEFINER）：
          SELECT ... FOR UPDATE（鎖定）
          驗證 claim_status IN ('unclaimed', 'unlinked')
          UPDATE results SET athlete_id=uid, claim_status='pending'
          RETURN { success: true, claim_status: 'pending' }
  → 回傳 200 { data: { claim_status: 'pending', message: '等待審核' } }
```

---

## 4. 資料流

### 4.1 排行榜資料流

```
results (raw data)
  + race_editions
  + races
  + athletes

  ↓ leaderboard_entries VIEW 過濾與組合

排行榜 View 輸出
  ↓ 應用層加上 RANK() window function

最終排行榜資料（含 rank、delta_seconds）
  ↓ Route Handler / Server Component 回傳

前端 UI 渲染
```

### 4.2 成績可信度升級流程

```
自填成績 (self_reported)
  → 上傳完賽證書
  → claim_status: unclaimed → pending
  → 助手審核
  → approve_claim() DB Function
  → source_credibility: self_reported → certificate
  → claim_status: pending → claimed
  → 排行榜顯示「已公證」徽章
```

### 4.3 標記通知流程

```
知情人看到未認領成績
  → POST /api/results/:id/tags
  → DB trigger 驗證（上限 5 人、狀態）
  → results.claim_tag_count +1
  → generate_claim_share_text() 產生分享文字
  → 知情人透過 Web Share API 傳給選手
  → 選手收到連結，進行認領流程
```

---

## 5. 設計 Token 系統

Tri·log 使用 Variation C「Modern Sport Tech」深色主題。Token 定義在 `globals.css`，透過 Tailwind v4 的 `@theme inline` 語法映射為 utility class。

**設計意圖**：CSS Custom Properties 讓未來主題切換容易（只需改 `:root` 的值），Tailwind class 讓元件開發便利（`className="bg-bg-card text-accent"`）。

**Token 結構**：

| 類別 | 變數前綴 | 說明 |
|------|---------|------|
| 背景層級 | `--bg`, `--bg-alt`, `--bg-card`, `--bg-elev` | 深淺層次，卡片有陰影感 |
| 邊框 | `--border`, `--border-strong` | 不同強度的分隔線 |
| 文字 | `--ink` ~ `--ink-4` | 從最亮到最淡的四個層級 |
| 強調色 | `--accent` (薄荷綠), `--blue`, `--red` | 主色 + 游泳/自行車/跑步三色 |
| 語意色 | `--good`, `--warn`, `--bad` | 狀態反饋 |

**規則**：新增 token 時，`:root {}` 和 `@theme inline {}` 必須同時更新。

---

## 6. 外部服務整合

### Supabase（核心基礎設施）

- **Auth**：Email / Google / Apple 登入，session 以 HttpOnly cookie 儲存
- **PostgreSQL**：主資料庫，含 RLS、trigger、view、function
- **Storage**：完賽證書檔案（PDF/JPG/PNG），桶名稱為 `certificates`

### Open-Meteo（天氣資料）

- 觸發時機：助手新增賽事屆次（POST /api/races/:slug/editions）
- 查詢 URL：`https://archive-api.open-meteo.com/v1/archive`
- 參數：`latitude`, `longitude`, `start_date`, `end_date`, `daily`
- **完全免費，無需 API Key**，失敗不影響屆次建立

### Resend（Email 通知，Phase 2）

- 觸發時機：新用戶註冊後，系統比對策展層是否有對應的未認領成績
- 設定：`RESEND_API_KEY` 環境變數
- 尚未整合

---

## 7. 部署架構

```
GitHub main branch
  ↓ push
Vercel（自動部署）
  ├── Production: trilog.run
  └── Preview: 每個 PR 自動產生預覽 URL

Supabase Cloud
  ├── PostgreSQL（含所有 migration）
  ├── Auth
  └── Storage
```

**CI/CD 流程**：push 到 main → Vercel 自動 build → 通過後部署 production。

**DB migration**：目前手動透過 `supabase db push` 或 Supabase Dashboard SQL Editor 執行。未來可整合到 GitHub Actions。

**環境變數管理**：
- 開發：`.env.local`（gitignored）
- 正式：Vercel Dashboard 的 Environment Variables

---

## 8. 授權模型

```
HTTP Request
  │
  ▼
Middleware（Edge）
  └── session 驗證、路由守衛（頁面層）
  
  ↓
Route Handler
  └── business rule 驗證（業務層）
  
  ↓
Supabase Client
  └── RLS（資料庫層，最後防線）
```

三層防護，缺一不可：
- Middleware 防止未登入用戶進入需要登入的頁面
- Route Handler 驗證業務規則（如分項加總、狀態合法性）
- RLS 確保即使 API 被繞過，資料層仍有保護

---

## 9. 效能考量

### 排行榜查詢

主要索引：`idx_results_leaderboard (race_edition_id, total_seconds)` WHERE 公開+已認領  
設計：複合 partial index，過濾絕大多數不符合條件的列，排行榜查詢直接命中索引。

### 標記數快取

`results.claim_tag_count` 是反正規化欄位，由 trigger 維護，排行榜查詢不需 JOIN `claim_tags` 表計算標記數。

### 年齡組計算

在 `leaderboard_entries` view 中實時計算（`FLOOR((year - birth_year) / 5) * 5`），不需要額外的年齡組欄位。每次查詢都依當前年份重算，確保跨年度正確。

### 姓名全文搜尋

`idx_results_name_snapshot` 使用 GIN index on `to_tsvector('simple', athlete_name_snapshot)`，支援選手搜尋自己未認領的成績。
