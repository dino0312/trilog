# Tri·log — Architecture Decision Records (ADR)

> **格式說明**：每個 ADR 記錄一個重要決策的「當下脈絡」、「選擇理由」、「放棄的選項」與「後果」。  
> 狀態：🟢 Accepted（已採用）｜🟡 Pending（待確認）｜🔴 Superseded（已被取代）｜⚠️ Technical Debt（技術包袱）

---

## 目錄

| # | 決策 | 狀態 | 影響範圍 |
|---|------|------|---------|
| [ADR-001](#adr-001) | 技術堆疊選型 | 🟢 | 全域 |
| [ADR-002](#adr-002) | Next.js App Router + Route Groups | 🟢 | 前端路由 |
| [ADR-003](#adr-003) | `middleware.ts` 暫緩遷移至 `proxy.ts` | ⚠️ | Edge 路由守衛 |
| [ADR-004](#adr-004) | 三個 Supabase Client 各司其職 | 🟢 | 認證 / 資料存取 |
| [ADR-005](#adr-005) | 時間以整數秒（integer）儲存 | 🟢 | 資料庫 / 排行榜 |
| [ADR-006](#adr-006) | CHECK constraints 取代 PostgreSQL ENUM | 🟢 | 資料庫 Schema |
| [ADR-007](#adr-007) | `source_credibility` 合併兩個舊欄位 | 🟢 | 資料模型 |
| [ADR-008](#adr-008) | `claim_status` 四狀態含 `unlinked` | 🟢 | 資料模型 |
| [ADR-009](#adr-009) | `claim_tag_count` 反正規化快取 | 🟢 | 效能 |
| [ADR-010](#adr-010) | Solo / Relay 分項時間分叉儲存 | 🟢 | 資料模型 |
| [ADR-011](#adr-011) | 策展層（Curated Layer）冷啟動設計 | 🟢 | 產品 / 資料模型 |
| [ADR-012](#adr-012) | Row Level Security 取代 Application-level 授權 | 🟢 | 安全性 |
| [ADR-013](#adr-013) | SECURITY DEFINER 函式管理角色判斷 | 🟢 | 安全性 |
| [ADR-014](#adr-014) | 選手軟刪除（Soft Delete）+ 1 個月緩衝 | 🟢 | 資料保留 |
| [ADR-015](#adr-015) | `athlete_name_snapshot` 永久保留 | 🟢 | 資料完整性 |
| [ADR-016](#adr-016) | Race slug 取代 UUID 作為 URL 識別碼 | 🟢 | SEO / API 設計 |
| [ADR-017](#adr-017) | Nickname 為排行榜進榜必要條件 | 🟢 | 產品規則 |
| [ADR-018](#adr-018) | CSS Custom Properties 橋接 Tailwind v4 主題 | 🟢 | 前端樣式 |

---

## ADR-001

### 技術堆疊選型：Next.js + TypeScript + Tailwind CSS + Supabase

**狀態**：🟢 Accepted（2026-06-02）

#### 背景脈絡

Tri·log 是一個由**個人開發者**（兼創辦人）主導的 Side Project，初期需要：

1. 以最低成本（趨近於零）啟動
2. 快速迭代，從 idea 到 MVP 的週期要短
3. 技術選型需對 **Claude Code 友善**（AI 輔助開發的可靠度是實際生產力考量）
4. 具備長期維護性（社群活躍、文件完善）

#### 決策

| 層次 | 選擇 | 核心理由 |
|------|------|---------|
| 框架 | Next.js 16 + TypeScript | App Router 整合前後端，無需獨立 API server；Vercel 原生支援；Claude Code 掌握度高 |
| 樣式 | Tailwind CSS v4 | Claude Code 生成 UI 的首選工具；無需維護 CSS 檔案；設計稿（Trilog-html）已驗證可行性 |
| 後端 / DB | Supabase (PostgreSQL) | Auth + Database + Storage 三合一；免費方案足夠 MVP；Claude Code 熟悉 |
| 部署 | Vercel | 零設定 CI/CD；Next.js 原生整合；自動 Preview 環境 |
| 天氣 API | Open-Meteo | 完全免費，無需 API Key，歷史天氣查詢支援完整 |
| Email | Resend | 免費 3,000 封/月；API 設計簡潔 |
| 語言 | TypeScript 全程 | 型別安全讓 Claude Code 生成的程式碼更可靠，重構更安全 |

#### 放棄的選項

| 放棄的方案 | 放棄理由 |
|-----------|---------|
| **Express / Fastify 獨立後端** | 需維護兩個 repo / 兩套部署；個人專案成本過高 |
| **Prisma + 自建 PostgreSQL** | 需要 managed DB 費用（$15+/月）；Supabase 免費方案已夠用 |
| **Firebase / MongoDB** | 無法使用 SQL 的 Window Function 做排行榜；Supabase 的 RLS 更適合本專案的多角色權限需求 |
| **Remix** | 社群規模小於 Next.js；Claude Code 對 Next.js App Router 掌握度更高 |
| **styled-components / CSS Modules** | 開發速度慢於 Tailwind；設計 token 系統難以與 Tailwind 整合 |
| **Visual Crossing（天氣 API）** | 免費方案有配額限制；Open-Meteo 完全免費且無需金鑰 |

#### 後果

- ✅ 單一 repo 涵蓋前後端，維護成本低
- ✅ Vercel + Supabase 免費方案可撐到 8,000+ MAU
- ✅ TypeScript 嚴格模式讓 AI 生成的程式碼更可預期
- ⚠️ 綁定 Vercel 部署平台（遷移至其他平台需要調整）
- ⚠️ 綁定 Supabase（未來規模成長需要評估遷移至 RDS）

#### 不能改動的規則

> **所有時間戳欄位必須使用 `timestamptz`（帶時區的 timestamp）**，不得使用 `timestamp`。Supabase 的 `auth.users` 使用 UTC，混用會造成認領時間 / 軟刪除計算錯誤。

---

## ADR-002

### Next.js App Router + Route Groups 分區

**狀態**：🟢 Accepted（2026-06-02）

#### 背景脈絡

Tri·log 有兩種截然不同的頁面佈局：

- **主應用**（排行榜、成績、Profile）：有頂部導覽列、深色背景
- **認證頁**（登入、註冊）：全螢幕置中、無導覽列

同時，排行榜需要 **SSR**（對 SEO 關鍵），成績表單需要客戶端互動。

#### 決策

採用 Next.js App Router 的 **Route Groups** 語法：

```
app/
├── (main)/         # 主應用 — 有 Nav Layout
│   ├── leaderboard/
│   ├── records/
│   └── profile/
└── (auth)/         # 認證頁 — 全螢幕置中 Layout
    ├── login/
    └── register/
```

Route Group 的括號（`(name)`）不出現在實際 URL，因此：
- `/leaderboard`、`/records`、`/profile` 使用主應用 Layout
- `/login`、`/register` 使用認證 Layout
- 兩組頁面的 Layout **完全獨立**，不需要條件判斷

#### 放棄的選項

| 放棄的方案 | 放棄理由 |
|-----------|---------|
| **在根 Layout 做條件判斷** | `if (pathname === '/login') { no nav }` 的邏輯容易隨路由增加而失控 |
| **Pages Router** | 不支援 Server Component；SEO 需要額外 `getServerSideProps`；Next.js 官方已逐步移往 App Router |

#### 後果

- ✅ 每個 Layout 職責單一，不需要 `pathname` 判斷
- ✅ `(main)/layout.tsx` 未來可直接放置 TopNav 元件，不影響認證頁
- ✅ Server Component 讓排行榜頁面可 SSR，對 SEO 友善
- ⚠️ App Router 的 Server Component / Client Component 邊界需要開發者理解（新手易犯：在 Server Component 裡使用 `useState`）

#### 不能改動的規則

> **Route Group 名稱不能出現在 URL**。`(main)` 和 `(auth)` 只是資料夾組織，刪除括號會破壞 URL 結構與 Layout 分區。

---

## ADR-003

### `middleware.ts` 暫緩遷移至 `proxy.ts`

**狀態**：⚠️ Technical Debt（已知，刻意暫緩）

#### 背景脈絡

Next.js 16.x 將 `middleware.ts` 更名為 `proxy.ts`（功能相同，僅改名以更準確反映其用途）。目前 build 時出現 deprecation warning：

```
⚠ The "middleware" file convention is deprecated.
  Please use "proxy" instead.
  Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
```

#### 現狀

專案目前仍使用 `src/middleware.ts`。功能完全正常，只是有 warning。

#### 為什麼暫緩

1. **`@supabase/ssr` 的文件和範例尚未全面更新至 `proxy.ts`**。強行遷移可能引入 session 刷新相關的 subtle bug。
2. **功能無差異**：`proxy.ts` 的 API 與 `middleware.ts` 完全相同，只是 export 函式名稱建議改為 `proxy`（也支援 `default export`）。
3. **風險低，緊急度低**：deprecation warning 不影響執行，Next.js 保證相容性直到下個 major version。

#### 遷移方案（何時做）

當 `@supabase/ssr` 官方文件出現 `proxy.ts` 範例後，按以下步驟遷移：

```bash
# 1. 將 src/middleware.ts → src/proxy.ts
mv src/middleware.ts src/proxy.ts

# 2. 修改 export 函式名稱（擇一）
# 方案 A：改名 export
export async function proxy(request: NextRequest) { ... }
# 方案 B：維持 default export（Next.js 兩者都支援）
export default async function(request: NextRequest) { ... }
```

同步修改 `src/lib/supabase/middleware.ts` → `src/lib/supabase/proxy.ts`（改名以對齊）。

#### 後果

- ⚠️ Build 時每次出現 deprecation warning（目前無法完全消除）
- ⚠️ 若未來 Next.js major version 移除 `middleware.ts` 支援，需要緊急遷移
- ✅ 功能完全正常，不影響 session 管理與路由守衛

#### 不能改動的規則

> **在 `createServerClient` 和 `supabase.auth.getUser()` 之間不能插入任何邏輯**。這是 `@supabase/ssr` 的強制要求，順序錯誤會導致 token 刷新靜默失敗，造成用戶被錯誤登出。

---

## ADR-004

### 三個 Supabase Client 各司其職

**狀態**：🟢 Accepted（2026-06-02）

#### 背景脈絡

Next.js App Router 有三個不同的執行環境，各自讀寫 Cookie 的方式不同：

| 環境 | Cookie 存取方式 |
|------|--------------|
| **瀏覽器** | `document.cookie` |
| **Server Component** | `cookies()` from `next/headers`（只能在 request 期間讀寫） |
| **Edge Middleware** | `request.cookies`（只能從 `NextRequest` 讀） |

Supabase Auth 用 Cookie 儲存 JWT session。如果用錯 client，session 無法正確讀取或刷新。

#### 決策

建立三個對應的 client 檔案：

```
src/lib/supabase/
├── client.ts      → createBrowserClient()   — 瀏覽器端 ('use client' 元件)
├── server.ts      → createServerClient()    — Server Component / Route Handler
└── middleware.ts  → createServerClient()    — Edge Middleware（另一個設定方式）
```

#### 各檔案的使用時機

| 檔案 | 使用時機 | 例子 |
|------|---------|------|
| `client.ts` | Client Component 內的 supabase 操作 | 表單送出、即時更新 |
| `server.ts` | Server Component 資料預取、Route Handler | 排行榜 SSR、API endpoints |
| `middleware.ts` | Edge Middleware session 驗證 | `proxy.ts` / `middleware.ts` 路由守衛 |

#### 放棄的選項

| 放棄的方案 | 放棄理由 |
|-----------|---------|
| **單一 client 通吃** | 不同環境的 Cookie API 不兼容，強制統一會導致 runtime 錯誤 |
| **只在 server 用 service_role key** | service_role key 繞過 RLS，前端直接使用有安全風險 |

#### 後果

- ✅ 各環境 session 讀寫正確
- ✅ anon key 暴露在前端是安全的（RLS 限制了資料存取）
- ⚠️ 新進 RD 容易混淆三個 client 的用途，需要靠本文件說明

#### 不能改動的規則

> **`NEXT_PUBLIC_SUPABASE_ANON_KEY` 可以公開（前端使用），但 `SUPABASE_SERVICE_ROLE_KEY` 絕對不能出現在任何前端程式碼或 `NEXT_PUBLIC_` 環境變數中**。service_role key 繞過 RLS，一旦洩漏等於開放資料庫完整讀寫權限。

---

## ADR-005

### 時間以整數秒（integer）儲存，UI 負責格式化

**狀態**：🟢 Accepted（2026-06-02）

#### 背景脈絡

鐵人三項成績時間的核心操作：

1. **排行榜排序**：`ORDER BY total_seconds ASC`
2. **計算時間差**：`total_seconds - leader_seconds`
3. **分項加總驗證**：`swim + t1 + bike + t2 + run = total`
4. **UI 顯示**：`7282` → `"2:01:22"`

#### 決策

所有時間欄位（`total_seconds`、`swim_seconds`、`t1_seconds`、`bike_seconds`、`t2_seconds`、`run_seconds`）以 **`integer`（秒）** 儲存。

UI 顯示時呼叫 `src/lib/utils/time.ts` 的工具函式：

```typescript
secondsToTime(7282)  // → "2:01:22"
timeToSeconds("2:01:22")  // → 7282
timeDelta("2:01:22", "1:52:18")  // → "+9:04"
```

#### 放棄的選項

| 放棄的方案 | 放棄理由 |
|-----------|---------|
| **`text` 儲存 "HH:MM:SS"** | 字串排序錯誤（"1:52:18" < "2:01:22" 字串上不成立）；需要解析才能做算術 |
| **PostgreSQL `interval` 型別** | 排序正確，但 Supabase JS client 回傳格式不統一；型別系統整合繁瑣 |
| **毫秒 (`bigint`)** | 鐵人三項成績計時精度為秒，毫秒無意義；整數較大不利閱讀 |

#### 後果

- ✅ 排行榜 `ORDER BY total_seconds` 效率最佳，可直接使用複合索引
- ✅ 算術運算（差值、加總驗證）直接用整數，無需解析
- ✅ 前後端共用同一套工具函式
- ⚠️ 資料庫 query 結果直接看到的是數字（如 `7282`），需要在 SQL console 心算或呼叫工具函式才知道是幾小時幾分

#### 不能改動的規則

> **永遠不要在資料庫直接儲存 "HH:MM:SS" 字串**。如果需要支援毫秒精度（未來計時系統），改用毫秒整數，UI 工具函式對應調整，而非改用字串。

---

## ADR-006

### CHECK constraints 取代 PostgreSQL ENUM type

**狀態**：🟢 Accepted（2026-06-02）

#### 背景脈絡

Schema 中有多個欄位需要限定值域，例如：
- `source_credibility`: `official | certificate | self_reported`
- `claim_status`: `unclaimed | pending | claimed | unlinked`
- `distance_category`: `sprint | olympic | 70.3 | full`

PostgreSQL 提供兩種方式：
1. `CREATE TYPE ... AS ENUM (...)` — 原生 ENUM 型別
2. `CHECK (col IN ('val1', 'val2'))` — 文字欄位 + 檢查約束

#### 決策

使用 **CHECK constraints** 而非 PostgreSQL ENUM。

#### 理由

| 面向 | ENUM | CHECK constraint |
|------|------|-----------------|
| **新增值域** | 需要 `ALTER TYPE` — 在大型生產表上是危險操作（鎖表）| 只需 `ALTER TABLE ... DROP CONSTRAINT ... ADD CONSTRAINT` — 更快更安全 |
| **遷移** | ENUM 值不能輕易刪除（需要 rewrite table）| 刪除舊值只需更新 CHECK |
| **Supabase 型別生成** | 生成的 TypeScript ENUM 型別需要特殊處理 | 直接對應 `string` / `union type`，與 TypeScript 自然整合 |
| **跨版本相容** | ENUM 名稱衝突難以處理 | 無此問題 |

具體情境：spec v11 中 `claim_status` 從 3 個值增加到 4 個（加入 `unlinked`），CHECK constraint 只需修改一行，ENUM 則需要多步驟 migration。

#### 後果

- ✅ 值域變更（新增或修改）的 migration 更簡單安全
- ✅ TypeScript 型別用 union type 直接表達（`'official' | 'certificate' | 'self_reported'`）
- ⚠️ 資料庫本身不顯示「這個欄位有哪些合法值」，需要查看 migration 或 TypeScript 型別

#### 不能改動的規則

> **不能在 migration 中引入 PostgreSQL ENUM type**。統一使用 CHECK constraint。新增值域時，先在 `src/types/database.ts` 更新 union type，再在對應的 migration SQL 中更新 CHECK constraint。

---

## ADR-007

### `source_credibility` 合併 `source_type` + `verification_status` 兩個舊欄位

**狀態**：🟢 Accepted（spec v11 22.2 決策，2026-06-02 實作）

#### 背景脈絡

早期設計（spec v0.1 ~ v10）用兩個獨立欄位描述成績來源：

| 舊欄位 | 值 | 意義 |
|--------|---|------|
| `source_type` | `curated` / `community` | 誰建立這筆成績 |
| `verification_status` | `unverified` / `pending` / `verified` | 有沒有公證 |

這兩個欄位存在語意重疊：`curated + verified` 等同於「官方策展且已確認」，`community + verified` 等同於「選手上傳且審核通過」。

#### 決策

在 spec v11 22.2 版本中，合併為單一欄位 **`source_credibility`**：

| 值 | 可信度 | 說明 | 來源 |
|----|-------|------|------|
| `official` | 最高 | 策展層，來自官方賽事結果 | 助手建立 |
| `certificate` | 高 | 上傳完賽證書，人工審核通過 | 選手上傳後升級 |
| `self_reported` | 低 | 選手自填，無附加驗證 | 選手自行登錄 |

**升級路徑（單向）**：`self_reported` → `certificate`

**不變原則**：`official` 不可降級。選手認領 `official` 成績並上傳公證後，維持 `official`（資料來源本身沒有改變）。

資料庫層以 trigger 強制執行：
```sql
-- validate_source_credibility_transition()
IF OLD.source_credibility = 'official' AND NEW.source_credibility != 'official'
  RAISE EXCEPTION '官方成績不可降級';
```

#### 後果

- ✅ 消除語意模糊，一個欄位清楚表達「這筆成績可信度如何」
- ✅ 排行榜顯示規則簡化（只需依此一欄位決定顯示的標章）
- ⚠️ 如果未來需要「來源」和「驗證」獨立表達（例如：官方成績但驗證失敗），需要拆回兩個欄位

#### 不能改動的規則

> **`official` → 任何其他值的轉換被資料庫 trigger 鎖死，不可繞過**。如果真的需要更正官方成績的可信度，只能由 admin 直接以 service_role 操作，且需要記錄原因。

---

## ADR-008

### `claim_status` 四狀態含 `unlinked` 隱私衝突解法

**狀態**：🟢 Accepted（spec v11 21.4 決策，2026-06-02 實作）

#### 背景脈絡

**問題**：選手可能在不知情的情況下被策展層建檔（例如：助手收錄接力賽成績）。選手後來發現後不想讓資料公開，但策展層有「永久保留公共資料」的原則。

早期三狀態設計（`unclaimed / pending / claimed`）無法解決「已認領後反悔」的情況——刪除認領等於破壞公共記錄完整性。

#### 決策

加入第四個狀態 `unlinked`，完整狀態機如下：

```
unclaimed → pending → claimed → unlinked → pending（可重新認領）
             ↓ 拒絕
           unclaimed
```

`unlinked` 的語意：
- 選手解除與帳號的關聯
- 成績以**公共資料**繼續保留於策展層
- `athlete_id` 重設為 `null`
- `athlete_name_snapshot` 保留（歷史紀錄）
- 排行榜顯示「未認領標示」（不顯示帳號頭像）
- 帳號刪除時，所有 `claimed` 成績自動變更為 `unlinked`

#### 放棄的選項

| 放棄的方案 | 放棄理由 |
|-----------|---------|
| **直接刪除認領記錄** | 破壞策展層完整性，其他人可能已截圖或引用這筆成績 |
| **加 `is_hidden` flag** | 與 `claim_status` 語意重疊，增加複雜度 |
| **保留並隱藏整筆成績** | 違反策展層永久保留原則；`unlinked` 只是移除「帳號關聯」，成績本身仍公開 |

#### 後果

- ✅ 策展層資料完整性不受個別選手操作影響
- ✅ 選手隱私受到保護（個人帳號頁面不再顯示此成績）
- ✅ 帳號刪除時有乾淨的資料降級路徑
- ⚠️ 開發者需要理解「排行榜顯示但無帳號關聯」是正常狀態，不是資料異常

#### 不能改動的規則

> **帳號刪除時必須將所有 `claimed` 成績變更為 `unlinked`，不得刪除這些成績**。社群層（`self_reported`）的成績 1 個月後永久刪除，但策展層（`official`）的成績永遠保留公共資料，只移除帳號關聯。

---

## ADR-009

### `claim_tag_count` 反正規化快取於 `results` 表

**狀態**：🟢 Accepted（2026-06-02）

#### 背景脈絡

排行榜頁面每次顯示時，需要對每一列成績顯示「已有 N 人通知本人」的標記數。

標準正規化作法：每次查詢時 `COUNT(claim_tags WHERE result_id = r.id)`，對每列都做一次子查詢或 JOIN。

若排行榜顯示 50 列，就需要 50 次計數查詢或一次大 JOIN。在成績數量增加後，這會成為效能瓶頸。

#### 決策

在 `results` 表上直接維護 `claim_tag_count` 整數欄位，由 trigger **自動同步**：

```sql
-- 新增標記時 +1（含上限 5 人驗證）
CREATE TRIGGER claim_tags_on_insert BEFORE INSERT ON claim_tags
  FOR EACH ROW EXECUTE FUNCTION handle_claim_tag_insert();

-- 刪除標記時 -1（不低於 0）
CREATE TRIGGER claim_tags_on_delete AFTER DELETE ON claim_tags
  FOR EACH ROW EXECUTE FUNCTION handle_claim_tag_delete();
```

排行榜查詢直接讀 `results.claim_tag_count`，無需 JOIN。

#### 放棄的選項

| 放棄的方案 | 放棄理由 |
|-----------|---------|
| **每次查詢 COUNT** | N+1 查詢問題；隨資料量增長線性惡化 |
| **應用層快取（Redis）** | 增加基礎設施複雜度；初期沒有必要 |
| **Materialized View** | 需要手動或排程刷新；即時性差 |

#### 後果

- ✅ 排行榜查詢效能不受標記數量影響
- ✅ Trigger 保證計數與實際資料一致（沒有 cache invalidation 問題）
- ⚠️ 批次操作（例如 admin 批次刪除標記）會觸發大量 trigger，需要注意效能
- ⚠️ 直接用 SQL 繞過 trigger 操作 `claim_tags` 表（例如資料修復）後，需要手動重新計算 `claim_tag_count`

#### 不能改動的規則

> **任何新增或刪除 `claim_tags` 的操作都必須透過正常的 SQL INSERT / DELETE，讓 trigger 自動維護 `claim_tag_count`**。如果需要批次資料操作，必須在操作後執行：
> ```sql
> UPDATE results r
> SET claim_tag_count = (SELECT COUNT(*) FROM claim_tags WHERE result_id = r.id);
> ```

---

## ADR-010

### Solo / Relay 分項時間分叉儲存

**狀態**：🟢 Accepted（spec v11 22.1 決策，2026-06-02 實作）

#### 背景脈絡

早期設計試圖將 solo 和 relay 用同一個 `results` 表結構統一，relay 的分項時間也放在 `results` 表的 `swim_seconds / bike_seconds / run_seconds` 欄位。

**問題**：

- Solo 的換區（T1/T2）是**個人表現**，屬於個人時間
- Relay 的換區是**團隊交接成本**，無法歸屬特定成員
- Relay 成員的分項時間需要綁定到「誰負責哪個項目」（`disciplines` 欄位）
- 若強制統一，relay 的 `swim_seconds` 到底代表「第一棒游泳成員的時間」還是「整支隊伍的游泳時間」？語意不清。

#### 決策

**RESULT 表分叉**（spec 22.1）：

```
solo  → RESULT 保留所有分項欄位（swim/t1/bike/t2/run/total）
relay → RESULT 只保留 total_seconds
          ↓
         TEAM（t1_seconds, t2_seconds）
          ↓
         TEAM_MEMBER（disciplines[], split_seconds）
```

資料庫層以 CHECK constraint 強制：
```sql
CONSTRAINT relay_splits_must_be_null CHECK (
  result_type != 'relay' OR (
    swim_seconds IS NULL AND t1_seconds IS NULL AND
    bike_seconds IS NULL AND t2_seconds IS NULL AND run_seconds IS NULL
  )
)
```

**不允許從 total - swim - bike - run 反推 T1/T2**：反推在晶片計時切點差異、缺漏分項時會得到錯誤數字，且語意上換區時間不是衍生值，而是實測值。

#### 後果

- ✅ Solo 和 Relay 的資料語意清晰，不互相污染
- ✅ 接力成員可以獨立認領自己的分項，不影響其他成員
- ⚠️ 排行榜查詢接力成績需要 JOIN `teams` 表，比 solo 多一層
- ⚠️ 應用層新增接力成績需要同時寫入 `results` + `teams` + `team_members` 三張表（需要 transaction）

#### 不能改動的規則

> **接力成績（`result_type = 'relay'`）的 `swim/t1/bike/t2/run_seconds` 必須為 null**，由資料庫 CHECK constraint 強制。任何試圖在這些欄位存入接力資料的程式碼都會被資料庫拒絕。分項時間統一存 `team_members.split_seconds`，換區時間存 `teams.t1_seconds / t2_seconds`。

---

## ADR-011

### 策展層（Curated Layer）解決冷啟動問題

**狀態**：🟢 Accepted（spec v11 14 章，2026-06-02 實作）

#### 背景脈絡

平台最大的冷啟動問題：**上線第一天排行榜是空的，沒有用戶願意加入一個空的排行榜。**

一般解法：積極拉使用者進來，但這對個人開發者成本太高。

#### 決策

設計**兩層資料來源**：

| 層次 | 資料來源 | 說明 |
|------|---------|------|
| **策展層 Curated** | 助手主動建立，來自官方賽事結果 | 上線前預先建立歷史成績，不依賴用戶註冊 |
| **社群層 Community** | 選手自行登錄 | 隨用戶成長逐步豐富 |

策展層成績：
- `source_credibility = 'official'`
- `athlete_id = null`（未認領）
- `athlete_name_snapshot` = 原始姓名
- 排行榜顯示「未認領」標示

「未認領」本身是有價值的狀態：
- 知名選手的未認領成績在鐵人三項圈產生討論（社群很小，「有人認識 XX 嗎」是真實會發生的互動）
- 選手搜尋自己名字時發現成績已在平台，認領行為自然發生
- 「你的紀錄已經在這裡等你了」的訊息框架比「快來註冊」的轉換率更高

#### 後果

- ✅ 上線第一天就有完整的各距離歷史最速紀錄
- ✅ 未認領成績是行銷資產（可定期發布「本月最受關注的未認領紀錄」）
- ✅ 解決雞生蛋蛋生雞問題：不需要用戶就有內容，有了內容才吸引用戶
- ⚠️ 需要助手投入時間預先建立策展層資料（初期由建立者擔任）
- ⚠️ 需要 `claim_status` 四狀態機制處理隱私衝突（見 ADR-008）

#### 不能改動的規則

> **策展層成績（`source_credibility = 'official'`）永遠不會因任何操作而被刪除**，即使對應的選手帳號刪除後也保留公共資料。選手只能透過 `unlinked` 狀態解除帳號關聯，無法消除策展層的公共記錄。

---

## ADR-012

### Row Level Security（RLS）取代 Application-level 授權

**狀態**：🟢 Accepted（2026-06-02）

#### 背景脈絡

授權邏輯（「誰可以看哪些資料」「誰可以改哪些資料」）可以放在兩個地方：

1. **應用層**：在 Next.js Route Handler 或 Server Action 裡寫 `if (user.id !== record.athlete_id) throw 403`
2. **資料庫層**：PostgreSQL Row Level Security (RLS)，在 SQL 層面自動過濾

#### 決策

採用 **資料庫層 RLS**，作為主要存取控制機制。

RLS 的每張表都有明確的 policy，例如：
```sql
-- results 表：只有本人才看得到自己的私人成績
CREATE POLICY "results_public_read" ON results
  FOR SELECT USING (
    is_public = true
    OR claim_status IN ('unclaimed', 'unlinked')
    OR athlete_id = auth.uid()   ← 由 Supabase 自動注入
  );
```

**應用層的職責**：驗證請求格式、業務邏輯（如分項加總）、錯誤處理。

#### 放棄的選項

| 放棄的方案 | 放棄理由 |
|-----------|---------|
| **只在應用層做授權** | 每個 API endpoint 都需要手動加判斷，容易漏掉；未來新增 endpoint 時容易忘記 |
| **關閉 RLS，應用層全責** | Supabase 的 anon key 是公開的，如果有人直接呼叫 Supabase API（而非透過 Next.js），就能繞過授權 |

#### 後果

- ✅ 即使繞過 Next.js 直接呼叫 Supabase，RLS 仍然保護資料
- ✅ 授權邏輯集中在 migration SQL，不分散到各個 endpoint
- ✅ 排行榜查詢自動只回傳公開資料，不需要在應用層加 `WHERE is_public = true`
- ⚠️ RLS policy 複雜後難以偵錯（資料「神奇消失」可能是 RLS 過濾了）
- ⚠️ RLS policy 有效能成本，每次查詢都需要評估 policy 條件

#### 不能改動的規則

> **所有 8 張主表都必須啟用 RLS（`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`）**，新增資料表時必須同時建立對應的 RLS policy。沒有 policy 的表在 RLS 啟用後對所有人拒絕（等同無 policy = 全部拒絕），這是 PostgreSQL 的預設行為。

---

## ADR-013

### SECURITY DEFINER 函式集中管理角色判斷

**狀態**：🟢 Accepted（2026-06-02）

#### 背景脈絡

RLS policy 裡需要判斷「目前用戶的角色是不是 assistant 以上？」這個查詢需要讀取 `athletes` 表。

**問題**：`athletes` 表本身也有 RLS。如果在 RLS policy 裡直接查詢 `athletes.role`，會形成遞迴（`athletes` 的 RLS policy 在評估中，又需要查詢 `athletes`）。

#### 決策

將角色判斷封裝為 `SECURITY DEFINER` 函式：

```sql
CREATE OR REPLACE FUNCTION public.is_assistant_or_above()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER   -- 以函式擁有者（postgres）身份執行，繞過 RLS
SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT role IN ('assistant', 'admin')
     FROM public.athletes
     WHERE id = auth.uid() AND deleted_at IS NULL),
    false
  );
$$;
```

`SECURITY DEFINER` 表示此函式以**函式定義者（postgres superuser）**的身份執行，而非呼叫者身份。這讓它可以繞過 RLS 讀取 `athletes.role`，同時不對外暴露整個 `athletes` 表。

相關函式：`get_my_role()`, `is_admin()`, `is_race_editor(race_id)`

#### 後果

- ✅ 解決 RLS 遞迴問題
- ✅ 角色判斷邏輯集中在一個地方，所有 policy 共用
- ⚠️ `SECURITY DEFINER` 函式需要謹慎維護——它繞過 RLS，如果邏輯有 bug 可能開洞
- ⚠️ `SET search_path = public` 是必要的安全設定，防止 search path injection 攻擊

#### 不能改動的規則

> **所有 `SECURITY DEFINER` 函式必須設定 `SET search_path = public`**，防止惡意 schema 劫持。這是 Supabase 官方要求的安全實踐，缺少這個設定會在 Supabase Dashboard 的安全建議中出現警告。

---

## ADR-014

### 選手帳號軟刪除 + 1 個月緩衝期

**狀態**：🟢 Accepted（spec v11 13.3 決策，2026-06-02 實作）

#### 背景脈絡

用戶申請刪除帳號後，如果立即清除資料：
- 反悔時無法恢復（用戶體驗差）
- 符合台灣《個資法》的「1 個月緩衝期」設計
- 社群層成績（`self_reported`）應該隨帳號刪除，但需要 1 個月後才真正清除

策展層成績（`official`）不受帳號刪除影響（見 ADR-008 / ADR-011）。

#### 決策

`athletes` 表使用 `deleted_at timestamptz` 欄位做軟刪除：

```sql
-- 用戶申請刪除帳號
UPDATE athletes SET deleted_at = now() WHERE id = auth.uid();

-- 同時：所有 claimed 成績變更為 unlinked
UPDATE results SET claim_status = 'unlinked', athlete_id = null
WHERE athlete_id = auth.uid() AND claim_status = 'claimed';
```

1 個月後，排程（Supabase cron / Vercel cron）執行永久清除：
```sql
DELETE FROM athletes WHERE deleted_at < now() - INTERVAL '1 month';
-- athletes 的 CASCADE 會自動清除 results（社群層）
```

RLS 的 `deleted_at IS NULL` 條件確保已申請刪除的帳號在 1 個月緩衝期內仍可被自己讀取（讓用戶能匯出資料），但不出現在公開頁面。

#### 後果

- ✅ 符合台灣《個資法》對資料刪除的要求
- ✅ 用戶在 1 個月內可以申請復原
- ⚠️ 需要排程任務定期清除 `deleted_at < now() - 1 month` 的記錄（目前尚未實作）
- ⚠️ Supabase cascade delete 會一起刪除所有社群層成績，需要確認 `ON DELETE CASCADE` 設定正確

#### 不能改動的規則

> **不可對 `athletes` 表執行硬刪除（`DELETE FROM athletes`），一律使用軟刪除（`UPDATE athletes SET deleted_at = now()`）**，除非是排程任務清除超過 1 個月的軟刪除記錄。

---

## ADR-015

### `athlete_name_snapshot` 永久保留於 `results` 表

**狀態**：🟢 Accepted（2026-06-02）

#### 背景脈絡

策展層建立成績時，選手可能尚未在平台上有帳號，此時 `athlete_id = null`，只有 `athlete_name_snapshot`（從官方賽事結果取得的姓名）。

選手認領成績後，`athlete_id` 更新為選手的 UUID。但如果後來選手：
- 修改 nickname（帳號顯示名稱）
- 申請 `unlinked`（解除關聯）
- 刪除帳號

**問題**：這些操作不應該抹去「這個人曾經在這場比賽出賽」的歷史事實。

#### 決策

`athlete_name_snapshot` 欄位：
- 由助手在建立策展層成績時填入（來源：官方賽事成績單）
- **認領後不更新**（即使選手的 nickname 不同，snapshot 保留原始賽事登錄姓名）
- **unlinked 後不清除**（仍作為公共記錄的一部分）
- **帳號刪除後不清除**（只移除 `athlete_id` 關聯）

排行榜顯示時：
```sql
-- 已認領：優先顯示帳號 nickname；未認領：顯示 snapshot
COALESCE(a.nickname, r.athlete_name_snapshot) AS display_name
```

#### 後果

- ✅ 選手改名或刪帳後，歷史比賽記錄仍然可搜尋
- ✅ 策展層資料可信度不受帳號操作影響
- ⚠️ 如果官方成績單上的姓名有誤（例如：拼音錯誤），需要助手手動更正 snapshot，不能由選手自行修改

#### 不能改動的規則

> **選手不可以自行修改 `athlete_name_snapshot`**，此欄位只能由助手（`source_credibility = 'official'` 的建立者）更新。選手認領後想要在排行榜顯示不同名字，更新帳號的 `nickname` 欄位即可（`COALESCE` 會優先顯示 nickname）。

---

## ADR-016

### Race slug 取代 UUID 作為 URL 識別碼

**狀態**：🟢 Accepted（2026-06-02）

#### 背景脈絡

資料庫主鍵使用 UUID（例如 `550e8400-e29b-41d4-a716-446655440000`），但 URL 設計需要考慮：
- **SEO**：搜尋引擎對有意義的 slug 有更好的抓取效果
- **可讀性**：`trilog.run/races/ironman-taiwan` 比 `trilog.run/races/550e8400-...` 更易分享
- **穩定性**：UUID 不會因為賽事改名而變動

#### 決策

`races` 表同時有：
- `id uuid PRIMARY KEY`：內部 JOIN / Foreign Key 使用
- `slug text UNIQUE NOT NULL`：URL 識別碼，如 `ironman-taiwan`、`penghu-tri`

API 設計：
```
GET /api/races/ironman-taiwan         ← 用 slug
GET /api/races/ironman-taiwan/editions/2024
```

`RACE_EDITION` 則用 `(race_slug, year)` 的組合識別，不另建 edition slug。

#### 放棄的選項

| 放棄的方案 | 放棄理由 |
|-----------|---------|
| **UUID 直接用於 URL** | 不利 SEO；URL 不可讀 |
| **只用 slug，不用 UUID 做主鍵** | slug 可能需要變更（賽事改名）；UUID 是穩定的 FK 引用 |
| **自動生成 slug** | 自動從名稱生成可能產生衝突；手動設定更可控 |

#### 後果

- ✅ URL 友善，利於 SEO 和社群分享
- ✅ Slug 變更不影響資料庫內部的 UUID FK 關係
- ⚠️ 需要手動為每個賽事設定 slug，助手建立賽事時需注意命名規範
- ⚠️ Slug 一旦公開後不應輕易變更（會破壞已分享的連結）；如需變更應加 301 redirect

#### 不能改動的規則

> **Slug 格式規範：全小寫英文 + 數字，以連字號（`-`）分隔，不含特殊字元**（例如 `ironman-taiwan`、`challenge-taiwan`、`70-3-pingtung`）。一旦賽事頁面上線，不可在未設置 redirect 的情況下修改 slug。

---

## ADR-017

### Nickname 為排行榜進榜必要條件

**狀態**：🟢 Accepted（spec v11 21.2 決策，2026-06-02 實作）

#### 背景脈絡

早期設計（spec v0.1）允許匿名成績進入排行榜（顯示「匿名選手」）。

**問題**：匿名成績的出現降低排行榜公信力。其他選手無法判斷這些成績是否真實，也無法找到成績的所有人追問。

#### 決策

規則（spec 21.2）：

> **進入排行榜的成績，選手必須填寫顯示名稱（nickname）。**  
> 不強制真實姓名，顯示名稱可為暱稱，但不可為空白或純空格。  
> 未填寫 nickname 的成績仍可私人保存，但不出現在任何排行榜。

例外：**策展層未認領成績使用 `athlete_name_snapshot`**，不受此限制。

在 `leaderboard_entries` View 中執行：
```sql
AND (
  r.claim_status = 'unclaimed'          -- 策展層未認領：用 snapshot 顯示
  OR COALESCE(a.nickname, '') != ''     -- 已認領：需有 nickname
)
```

#### 後果

- ✅ 排行榜的每一筆成績都有可追溯的顯示名稱
- ✅ 減少灌水行為（雖非完全防範）
- ⚠️ 新用戶的第一筆成績如果沒有填 nickname 就設為公開，成績會被新增但不顯示在排行榜（可能造成混淆）
- ⚠️ UI 層需要在設定公開成績前主動提示「請先填寫顯示名稱」

#### 不能改動的規則

> **修改 `leaderboard_entries` View 的 nickname 過濾邏輯時，必須同時更新這條規則**。不可在不修改 View 的情況下讓匿名成績進入排行榜（例如：在應用層繞過 View 直接查詢 `results` 表再手動過濾）。

---

## ADR-018

### CSS Custom Properties 橋接 Tailwind v4 主題系統

**狀態**：🟢 Accepted（2026-06-02）

#### 背景脈絡

Tri·log 的設計系統（Variation C · Modern Sport Tech）有一套完整的 Design Token：
- 8 個背景層級（`--bg`, `--bg-alt`, `--bg-card`, `--bg-elev`, ...）
- 4 個文字層級（`--ink`, `--ink-2`, `--ink-3`, `--ink-4`）
- 運動項目顏色（`--swim`, `--bike`, `--run`）

設計稿（`Trilog-html`）用 CSS Custom Properties 定義，並在 JSX 中以 `style={{ color: 'var(--accent)' }}` 使用。

Tailwind v4 引入了 `@theme inline` 機制，讓 CSS Custom Properties 可以直接映射為 Tailwind utility class。

#### 決策

使用 Tailwind v4 的 `@theme inline` 語法橋接：

```css
/* globals.css */
:root {
  --accent: #66c6be;      /* ← 定義 CSS 變數 */
}

@theme inline {
  --color-accent: var(--accent);   /* ← 橋接到 Tailwind 主題 */
}
```

之後可在 JSX 使用 Tailwind class：
```tsx
<div className="text-accent bg-bg-card border-border">
```

也可繼續使用 CSS 變數（漸進式遷移）：
```tsx
<div style={{ color: 'var(--accent)' }}>
```

#### 放棄的選項

| 放棄的方案 | 放棄理由 |
|-----------|---------|
| **只用 Tailwind config 設定顏色** | Tailwind v4 的 `tailwind.config.ts` 語法有重大改變；`@theme inline` 是 v4 的官方推薦方式 |
| **只用 CSS 變數** | 無法使用 Tailwind 的 utility class（如 `hover:bg-accent`、`dark:text-ink-3`），需要手寫 CSS |
| **棄用 Trilog-html 的 Design Token** | 設計稿已經過三個 Variation 的視覺驗證，有完整的設計系統，不應重新設計 |

#### 後果

- ✅ 保留設計稿的 token 系統，視覺一致性有保障
- ✅ 元件可以使用 Tailwind utility class（響應式、hover、focus 等）
- ✅ 設計 token 在 CSS 和 Tailwind 都可用，支援漸進式遷移
- ⚠️ 顏色名稱需要在 CSS 變數（`--ink-3`）和 Tailwind class（`text-ink-3`）兩個地方保持同步
- ⚠️ `@theme inline` 是 Tailwind v4 的特性，從 Tailwind v3 遷移時需要修改

#### 不能改動的規則

> **新增設計 token 時，必須同時在 `globals.css` 的 `:root {}` 定義 CSS 變數，以及在 `@theme inline {}` 中定義對應的 Tailwind 映射**。只加其中一個會導致另一種使用方式失效。Token 命名遵循 `--{category}-{variant}` 格式（如 `--bg-card`、`--ink-3`）。

---

## 附錄：不可違反的全域規則總表

整理所有 ADR 的「不能改動的規則」：

| # | 規則 | 違反後果 |
|---|------|---------|
| 1 | 所有時間戳欄位使用 `timestamptz`，不用 `timestamp` | 時區錯誤、軟刪除計算異常 |
| 2 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` 可公開，`SERVICE_ROLE_KEY` 絕不出現在前端 | 資料庫完整讀寫權限洩漏 |
| 3 | 不能在 `createServerClient` 和 `supabase.auth.getUser()` 之間插入邏輯 | Token 刷新靜默失敗，用戶錯誤登出 |
| 4 | 不在資料庫儲存 HH:MM:SS 字串，一律用整數秒 | 排序錯誤、無法算術運算 |
| 5 | 不使用 PostgreSQL ENUM type，一律 CHECK constraint | 值域變更需要危險的鎖表操作 |
| 6 | `official` 可信度不可降級（由 trigger 強制） | 破壞策展層資料可信度基礎 |
| 7 | 帳號刪除時 `claimed` 成績→`unlinked`，不刪除策展層成績 | 破壞公共記錄完整性 |
| 8 | `claim_tag_count` 必須透過 trigger 維護，批次操作後需重新計算 | 排行榜顯示錯誤的標記數 |
| 9 | Relay 的分項時間存 `team_members`，不存 `results`（CHECK constraint 強制） | 資料語意污染，solo / relay 排行榜混亂 |
| 10 | 策展層成績永遠不被刪除 | 破壞冷啟動設計，失去平台內容 |
| 11 | 所有新資料表必須啟用 RLS 並建立 policy | 資料庫資料對所有人完全開放 |
| 12 | `SECURITY DEFINER` 函式必須設定 `SET search_path = public` | Search path injection 安全漏洞 |
| 13 | 選手帳號只做軟刪除，不做硬刪除 | 違反個資法 1 個月緩衝期要求 |
| 14 | `athlete_name_snapshot` 只有助手可更新，選手不可自行修改 | 策展層原始記錄被篡改 |
| 15 | Race slug 上線後不可在沒有 redirect 的情況下修改 | 已分享連結全部失效 |
| 16 | 修改排行榜 nickname 過濾邏輯必須同時更新 ADR-017 | 匿名成績進入排行榜，公信力受損 |
| 17 | 新增 Design Token 必須同時更新 CSS 變數和 `@theme inline` | 部分使用方式失效 |

---

*文件建立：2026-06-02*  
*對應 spec 版本：trilog_spec_v11（v1.0）*  
*下次更新時機：新增重要技術決策、技術包袱狀態變更、規則有例外情形*
