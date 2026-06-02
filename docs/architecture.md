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
         ├─── Server Actions → 表單提交（auth / results / profile / claims）
         └─── Route Handlers → JSON（API 端點）
                    │
                    ├─── Supabase PostgreSQL（主資料庫）
                    ├─── Supabase Auth（用戶認證）
                    ├─── Supabase Storage（完賽證書）
                    └─── Open-Meteo API（天氣資料，僅助手操作時）
```

---

## 2. 頁面地圖與串接關係

### 頁面清單

| 路徑 | 說明 | 需登入 | Layout |
|------|------|--------|--------|
| `/` | redirect → `/leaderboard` | 否 | — |
| `/leaderboard` | 公開排行榜，距離/性別篩選 | 否 | main (含 Nav) |
| `/unclaimed` | 未認領成績瀏覽，搜尋姓名，認領入口 | 否（認領需登入）| main |
| `/records` | 我的成績列表，顯示 pending 狀態 | **是** | main |
| `/records/new` | 新增成績表單 | **是** | main |
| `/profile` | 個人資料編輯、登出 | **是** | main |
| `/login` | 登入表單 | 否 | auth (全螢幕) |
| `/register` | 註冊表單 | 否 | auth (全螢幕) |

### 頁面間導向關係

```
未登入訪客流程：
  / → /leaderboard（首頁）
  /leaderboard ─→ /unclaimed（搜尋未認領成績）
  /unclaimed ──→ /login（點「這是我的成績」觸發）
  /login ──────→ /register（切換）
  /register ───→ /login（切換）
  /login ──────→ [redirectTo] 或 /leaderboard（登入成功）

已登入用戶流程：
  Nav ─────────→ /leaderboard / /unclaimed / /records / /profile
  /records ────→ /records/new（+ 新增按鈕）
  /records/new ─→ /records（儲存成功後）
  /profile ────→ /login（登出後）
  /login ──────→ /leaderboard（middleware 擋回）
  /register ───→ /leaderboard（middleware 擋回）

Middleware 守衛（每個 request 都經過）：
  受保護路徑（/records, /profile）未登入 → /login?redirectTo=<原路徑>
  認證頁面（/login, /register）已登入 → /leaderboard
```

### Nav 元件顯示規則

**未登入**：排行榜 · 未認領 | 登入 · 註冊  
**已登入**：排行榜 · 未認領 · 我的紀錄 | [+ 新增] [首字母頭像→/profile]

---

## 3. 目錄結構與模組職責

### `src/app/` — 頁面與 API

```
app/
  (main)/
    layout.tsx          含 Nav 的主 Layout
    leaderboard/page.tsx  公開排行榜（Server Component + searchParams 篩選）
    unclaimed/page.tsx    未認領成績（Server Component + ClaimButton Client）
    records/
      page.tsx            我的成績（Server Component，需登入）
      new/page.tsx        新增成績（NewResultForm Client Component）
    profile/page.tsx      個人資料（ProfileForm Client Component）

  (auth)/
    layout.tsx            全螢幕置中 Layout
    login/page.tsx        LoginForm（useSearchParams 讀取 redirectTo）
    register/page.tsx     RegisterForm

  actions/
    auth.ts               signUp / signIn / signOut（Server Actions）
    results.ts            createResult（Server Action）
    profile.ts            updateProfile（Server Action）
    claims.ts             claimResult（Server Action，呼叫 DB RPC）

  api/
    health/route.ts       連線測試
    races/route.ts        GET 賽事列表（供前端 select 使用）
```

### `src/components/` — UI 元件

```
components/
  layout/
    Nav.tsx             頂部導覽列（Server Component，讀取 user session）
  auth/
    LoginForm.tsx       登入表單（useActionState）
    RegisterForm.tsx    註冊表單（useActionState）
  results/
    NewResultForm.tsx   新增成績表單（fetch /api/races 動態載入選單）
  profile/
    ProfileForm.tsx     個人資料表單（useActionState）
  claims/
    ClaimButton.tsx     認領按鈕（useActionState，嵌入 unclaimed 頁）
  ui/
    Button.tsx          通用按鈕（primary / ghost variant）
    Input.tsx           帶 label 的 input 欄位
```

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
             (Database, 8 張表的 Row/Insert/Update/Relationships,
              3 個 View, 4 個 Function)

index.ts     應用層業務型別
             (Athlete, Race, RaceEdition, Result, LeaderboardRow, Team...)
```

---

## 4. 請求流程

### 4.1 SSR 頁面請求（公開頁面，如排行榜）

```
瀏覽器 GET /leaderboard
  → Edge Middleware：路徑是公開的，放行（仍刷新 session）
  → Server Component：
      createClient() (server)
      → supabase.from('leaderboard_entries').select(...)
      → PostgreSQL RLS 過濾：is_public=true AND claim_status IN (...)
  → React Server Component 渲染 HTML → 瀏覽器（SEO 可索引）
```

### 4.2 受保護頁面請求

```
瀏覽器 GET /records/new（未登入）
  → Edge Middleware：getUser() → null
  → redirect → /login?redirectTo=/records/new

瀏覽器 POST /login（填入帳密）
  → Server Action signIn()：supabase.auth.signInWithPassword()
  → 成功 → redirect('/records/new')（讀取 redirectTo hidden input）
```

### 4.3 表單提交（Server Action）

```
瀏覽器填寫新增成績表單 → 點擊「儲存成績」
  → Server Action createResult()：
      1. createClient() (server) → auth.getUser() 確認登入
      2. 解析並驗證 formData
      3. supabase.from('results').insert({...})
      4. RLS 驗證：auth.uid() = athlete_id AND source_credibility = 'self_reported'
      5. redirect('/records')
```

### 4.4 認領成績流程

```
未認領成績頁 → 點「這是我的成績」
  → Server Action claimResult()：
      supabase.rpc('claim_result', { p_result_id })
      → DB Function（SECURITY DEFINER）：
          SELECT ... FOR UPDATE（防 race condition）
          驗證 claim_status IN ('unclaimed', 'unlinked')
          UPDATE results SET athlete_id=uid, claim_status='pending', claimed_at=now()
      → revalidatePath('/records') + revalidatePath('/unclaimed')
  → ClaimButton 顯示「✓ 申請已提交」
  → /records 頁面顯示該成績「⏳ 待審核」
```

---

## 5. 資料流

### 5.1 排行榜資料流

```
results + race_editions + races + athletes
  ↓ leaderboard_entries VIEW（過濾、組合、計算 age_group）
  ↓ Server Component query（加 searchParams 篩選）
  ↓ 前端 UI 渲染（secondsToTime 格式化）
```

### 5.2 成績可信度升級流程

```
self_reported → 上傳證書 → pending → 助手 approve_claim() → certificate + claimed
official（策展層）→ 認領申請 → pending → 助手審核 → claimed
```

---

## 6. 外部服務整合

### Supabase
- **Auth**：Email 登入，session 以 HttpOnly cookie 儲存
- **PostgreSQL**：主資料庫，含 RLS、trigger、view、function
- **Storage**：完賽證書（Phase 2）

### Open-Meteo（天氣，Phase 2）
- 助手新增賽事屆次時自動抓取，免費無需 Key

### Resend（Email，Phase 2）
- 新用戶比對策展層成績，發通知信

---

## 7. 部署架構

```
GitHub main → Vercel 自動部署 → trilog.run（production）
                              → PR preview URL（每個 PR）

Supabase Cloud：PostgreSQL + Auth
```

**環境變數**：開發用 `.env.local`（gitignored），正式用 Vercel Dashboard。

---

## 8. 授權模型（三層防護）

```
Middleware（Edge）   → 頁面層路由守衛
Server Action       → 業務規則驗證（auth.getUser() + 欄位驗證）
Supabase RLS        → 資料庫層最後防線
```

三層缺一不可，即使 Server Action 被繞過，RLS 仍擋住非法操作。

---

## 9. 效能考量

- **排行榜索引**：`idx_results_leaderboard (race_edition_id, total_seconds)` partial index，只含公開+已認領成績
- **標記數快取**：`results.claim_tag_count` 由 trigger 維護，排行榜查詢不需 JOIN claim_tags
- **年齡組實時計算**：在 View 中計算，跨年度自動正確
- **姓名全文搜尋**：GIN index on `to_tsvector('simple', athlete_name_snapshot)`
