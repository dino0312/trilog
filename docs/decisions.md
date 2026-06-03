# docs/decisions.md — 架構決策記錄（ADR）

> 記錄每個重要技術決策的背景、理由與後果。  
> 新決策加在最後；修改既有決策標注狀態變更並說明原因。

**狀態說明**：  
🟢 Accepted — 目前有效  
⚠️ Technical Debt — 已知包袱，有計畫處理  
🔴 Superseded — 已被更新的決策取代

---

## ADR-001：技術堆疊選型

**狀態**：🟢 Accepted

**背景**：個人開發者主導的 Side Project，優先考量三個條件：Claude Code 熟悉度高、開發社群活躍、初期成本趨近於零。

**決策**：Next.js 16 + TypeScript + Tailwind CSS v4 + Supabase + Vercel

**核心理由**：
- Next.js App Router 整合前後端，無需獨立 API server
- Supabase 提供 Auth + DB + Storage 三合一，免費方案支撐早期用戶
- Claude Code 對這個組合的掌握度最高，AI 輔助開發效率最佳
- Vercel 對 Next.js 原生支援，零設定 CI/CD

**放棄的方案**：Express 獨立後端（維護成本高）、Firebase（不支援 SQL Window Function）、Remix（社群規模小）。

**限制**：綁定 Vercel 部署平台和 Supabase 服務，規模成長後需評估遷移至 AWS。

---

## ADR-002：Next.js App Router + Route Groups

**狀態**：🟢 Accepted

**背景**：主應用（有 Nav）和認證頁（全螢幕置中）需要完全不同的 Layout，同時排行榜需要 SSR 支援 SEO。

**決策**：使用 Route Groups `(main)/` 和 `(auth)/`，分別配置獨立 Layout。

**理由**：Route Group 名稱不出現在 URL，讓 Layout 完全解耦，不需要在根 Layout 裡做 `pathname` 條件判斷。

**後果**：每個 Layout 職責單一；未來新增頁面時，放入對應的 Group 即可繼承 Layout，不需要修改現有程式碼。

---

## ADR-003：`middleware.ts` 暫緩遷移至 `proxy.ts`

**狀態**：⚠️ Technical Debt

**背景**：Next.js 16 將 `middleware.ts` 更名為 `proxy.ts`，功能完全相同，只是名稱改變。目前 build 時出現 deprecation warning。

**決策**：暫緩遷移，繼續使用 `middleware.ts`。

**理由**：`@supabase/ssr` 的官方文件尚未更新至 `proxy.ts`。在缺乏可靠範例的情況下遷移，可能引入 session 刷新相關的 subtle bug，風險大於當下的 warning。

**遷移計畫**：等 `@supabase/ssr` 官方文件出現 `proxy.ts` 範例後執行：
1. `src/middleware.ts` → `src/proxy.ts`
2. 函式名稱建議改為 `proxy` 或用 `default export`
3. `src/lib/supabase/middleware.ts` → `src/lib/supabase/proxy.ts`（命名對齊）

**當前影響**：每次 build 出現一行 deprecation warning，功能完全正常。

---

## ADR-004：三個 Supabase Client 各司其職

**狀態**：🟢 Accepted

**背景**：Next.js App Router 有三個執行環境（瀏覽器、Server Component、Edge Middleware），各自存取 Cookie 的方式不同。Supabase Auth 的 JWT session 存在 Cookie 中。

**決策**：建立三個對應的 client 檔案：`client.ts`（瀏覽器）、`server.ts`（Server/Route Handler）、`middleware.ts`（Edge）。

**理由**：不同環境若使用錯誤的 client，session 無法正確讀取或刷新，導致用戶被錯誤登出。

**不可改動的規則**：在 `createServerClient()` 和 `supabase.auth.getUser()` 之間**不能插入任何程式碼**。這是 `@supabase/ssr` 的強制要求，違反會導致 token 刷新靜默失敗。

---

## ADR-005：時間以整數秒（integer）儲存

**狀態**：🟢 Accepted

**背景**：成績時間的核心操作：排行榜排序、時間差計算、分項加總驗證。

**決策**：所有時間欄位以 `integer`（秒）儲存，UI 負責呼叫 `secondsToTime()` 格式化。

**理由**：整數排序效率最佳，可直接命中複合 index；算術運算無需解析字串；`"2:01:22"` 這樣的字串排序結果錯誤（字串比較 ≠ 時間比較）。

**不可改動的規則**：永遠不要在資料庫儲存 HH:MM:SS 字串。

---

## ADR-006：CHECK constraints 取代 PostgreSQL ENUM

**狀態**：🟢 Accepted

**背景**：多個欄位需要限定值域（`source_credibility`、`claim_status`、`distance_category` 等）。

**決策**：使用 `CHECK (col IN ('a','b','c'))` 而非 PostgreSQL `CREATE TYPE ... AS ENUM`。

**理由**：新增值域時只需修改 `CHECK` constraint，不需 `ALTER TYPE`（可能在大表上鎖表）。具體案例：`claim_status` 從三個值新增 `unlinked` 時，只改了一行 migration。

**TypeScript 對應**：使用 union type（`'a' | 'b' | 'c'`），與 string CHECK constraint 自然對應。

---

## ADR-007：`source_credibility` 合併兩個舊欄位

**狀態**：🟢 Accepted（spec v11 22.2 決策）

**背景**：早期設計有 `source_type`（curated/community）和 `verification_status`（unverified/pending/verified）兩個欄位，語意重疊。

**決策**：合併為單一欄位 `source_credibility`：`official` / `certificate` / `self_reported`。

**理由**：兩個欄位的組合（curated+verified）完全可以用一個值（official）表達，維護兩個同步的欄位增加出錯可能。

**關鍵規則**：可信度只能升級，不可降級（DB trigger 強制）。認領通過後，`official` 維持 `official`，`self_reported` 升為 `certificate`——因為「認領」改變的是帳號關聯，不改變資料來源的本質。

---

## ADR-008：`claim_status` 四狀態含 `unlinked`

**狀態**：🟢 Accepted（spec v11 21.4 決策）

**背景**：選手可能在不知情的情況下被策展層建檔（如接力賽）。認領後反悔時，早期的三狀態設計（unclaimed/pending/claimed）無法優雅地處理「解除關聯但保留公共記錄」的需求。

**決策**：新增第四個狀態 `unlinked`——選手解除帳號關聯，成績回到公共狀態但不消失。

**理由**：直接刪除認領記錄會破壞策展層完整性。`unlinked` 讓選手保有隱私選擇，同時維護公共資料的可信度。

**狀態機**：`unclaimed → pending → claimed → unlinked`（可重新認領回 pending）

---

## ADR-009：`claim_tag_count` 反正規化快取

**狀態**：🟢 Accepted

**背景**：排行榜每列需要顯示「已有 N 人通知本人」的標記數。每次 JOIN 計算 COUNT 會在成績量增加後成為效能瓶頸。

**決策**：在 `results` 表直接維護 `claim_tag_count` 整數欄位，由 trigger 自動同步。

**理由**：排行榜查詢直讀欄位，無需 JOIN。Trigger 保證計數與實際資料一致，無 cache invalidation 問題。

**不可改動的規則**：透過 trigger 以外的方式操作 `claim_tags` 後，需手動重新計算 `claim_tag_count`。

---

## ADR-010：Solo / Relay 分項時間分叉儲存

**狀態**：🟢 Accepted（spec v11 22.1 決策）

**背景**：Solo 的換區是個人表現；Relay 的換區是隊伍交接成本，無法歸屬特定成員。強制統一會使資料語意不清。

**決策**：`result_type = 'relay'` 時，分項時間不存在 `results` 表（CHECK constraint 強制為 null），改存 `team_members.split_seconds`；換區時間存 `teams.t1/t2_seconds`。

**不可改動的規則**：不允許從 `total - swim - bike - run` 反推 T1/T2。反推在晶片計時差異時會得到錯誤數字，且語意上換區是實測值而非衍生值。

---

## ADR-011：策展層（Curated Layer）解決冷啟動

**狀態**：🟢 Accepted

**背景**：平台最大挑戰是冷啟動——上線第一天排行榜是空的，沒有內容就沒有用戶，沒有用戶就沒有內容。

**決策**：允許助手預先建立「未認領」的官方成績（`source_credibility = 'official'`, `athlete_id = NULL`），在排行榜上正常顯示，等待選手認領。

**效果**：上線第一天就有有意義的內容；「未認領」狀態本身成為社群話題（「有人認識 XX 嗎？叫他來認領」）；訊息框架從「快來註冊」變成「你的紀錄已經在這裡等你了」。

**不可改動的規則**：策展層成績（`source_credibility = 'official'`）永遠不刪除，即使對應帳號刪除後也保留為公共資料。

---

## ADR-012：RLS 作為主要存取控制

**狀態**：🟢 Accepted

**背景**：Supabase 的 anon key 是公開的，任何人可以直接呼叫 Supabase API。若只在 Next.js API 層做授權，繞過 Next.js 就可以無限制存取資料。

**決策**：所有 8 張資料表啟用 Row Level Security，RLS 是最後一道防線。Next.js 的 Route Handler 做業務邏輯驗證，RLS 做資料存取控制。

**不可改動的規則**：所有新資料表必須 `ENABLE ROW LEVEL SECURITY`，無 policy 的表在 RLS 啟用後對所有人拒絕（這是 PostgreSQL 的預設行為，是安全的 fail-safe）。

---

## ADR-013：SECURITY DEFINER 函式管理角色判斷

**狀態**：🟢 Accepted

**背景**：RLS policy 需要查詢 `athletes.role` 來判斷角色，但 `athletes` 本身也有 RLS，這會造成遞迴評估問題。

**決策**：將角色判斷封裝為 `SECURITY DEFINER` 函式（`is_assistant_or_above()`、`is_admin()` 等），以函式定義者（postgres superuser）身份執行，繞過 RLS。

**安全要求**：所有 `SECURITY DEFINER` 函式必須加 `SET search_path = public`，防止 search path injection 攻擊。

---

## ADR-014：選手軟刪除 + 1 個月緩衝

**狀態**：🟢 Accepted

**背景**：台灣《個資法》要求提供一段緩衝期讓用戶申請復原，同時需要清楚的資料清除路徑。

**決策**：`athletes.deleted_at` 軟刪除，1 個月後由排程永久清除。刪帳時：`claimed` 成績 → `unlinked`；`self_reported` 成績 1 個月後刪除；`official` 策展層成績永久保留。

**不可改動的規則**：不對 `athletes` 表做硬刪除，一律通過 `deleted_at` 軟刪除。

---

## ADR-015：`athlete_name_snapshot` 永久保留

**狀態**：🟢 Accepted

**背景**：策展層建立成績時，選手可能尚未有帳號，只有姓名字串。認領後若選手改名或刪帳，歷史比賽記錄不應消失。

**決策**：`athlete_name_snapshot` 在認領後不更新、在解除關聯後不清除、在帳號刪除後不清除，永久作為歷史紀錄保留。

**排行榜顯示**：已認領時優先顯示帳號 `nickname`；未認領時顯示 `athlete_name_snapshot`（在 view 中用 `COALESCE` 實作）。

**不可改動的規則**：`athlete_name_snapshot` 只有助手可以更新（更正錯誤的官方姓名），選手本人不可修改。

---

## ADR-016：Race slug 取代 UUID 作 URL 識別碼

**狀態**：🟢 Accepted

**背景**：URL 是排行榜和賽事頁面的重要入口，對 SEO 和社群分享有直接影響。

**決策**：`races` 表同時有 UUID（內部 FK）和 `slug`（URL 識別碼）。API 路由用 `slug`（如 `/api/races/ironman-taiwan`），資料庫 FK 用 UUID。

**格式規範**：全小寫英數連字號（如 `ironman-taiwan`、`challenge-taiwan`），由助手建立時手動設定。

**不可改動的規則**：Slug 一旦公開後不可在未設置 301 redirect 的情況下修改，否則已分享的連結全部失效。

---

## ADR-017：Nickname 為排行榜進榜必要條件

**狀態**：🟢 Accepted（spec v11 21.2 決策）

**背景**：早期允許「匿名選手」進入排行榜，但這降低了排行榜的公信力——其他選手無法判斷這些成績是否真實。

**決策**：已認領的成績若選手 `nickname` 為 null，不進入排行榜。策展層未認領成績用 `athlete_name_snapshot`，不受此限制。

**實作位置**：`leaderboard_entries` view 的 WHERE 條件中過濾。

**不可改動的規則**：修改 `leaderboard_entries` view 時，必須保留 nickname 過濾邏輯。

---

## ADR-018：CSS Custom Properties 橋接 Tailwind v4

**狀態**：🟢 Accepted

**背景**：設計系統（Trilog-html Variation C）用 CSS Custom Properties 定義了完整的設計 token。Tailwind v4 引入 `@theme inline` 語法，可以直接映射 CSS 變數為 utility class。

**決策**：在 `globals.css` 中，`:root {}` 定義 CSS 變數，`@theme inline {}` 橋接到 Tailwind 主題。兩種使用方式並存：`style={{ color: 'var(--accent)' }}` 和 `className="text-accent"` 都可用。

**理由**：保留設計稿的 token 系統確保視覺一致性；同時提供 Tailwind utility class 讓元件享有響應式、hover、focus 等功能。

**不可改動的規則**：新增 token 時，`:root {}` 和 `@theme inline {}` 必須同時更新。

---

## ADR-019：GitHub Actions Keep-Alive 取代升級 Supabase Pro

**狀態**：🟢 Accepted

**背景**：Supabase Free 方案在連續 7 天無任何 API 請求後會自動暫停專案，用戶首次訪問需等待 20–30 秒喚醒，體驗極差。升級 Supabase Pro（$25/月）可解除此限制，但對早期個人專案而言成本不划算。

**決策**：使用 GitHub Actions Scheduled Workflow，每週一 09:00 UTC 自動呼叫 `/api/health` endpoint，維持 Supabase 活躍狀態，暫不升級 Supabase Pro。

**實作**：`.github/workflows/keep-alive.yml`
- 排程：`cron: '0 9 * * 1'`（每週一 09:00 UTC，台灣時間 17:00）
- 呼叫 `${{ vars.APP_URL }}/api/health`，回傳非 200 時 workflow 失敗並發 GitHub 通知
- 支援 `workflow_dispatch` 手動觸發測試

**部署前置作業**：
1. Vercel 部署後，到 GitHub repo → Settings → Variables → New repository variable
2. 新增 `APP_URL` = `https://你的網域.vercel.app`

**成本分析**：

| 方案 | 月費 | 缺點 |
|------|------|------|
| Supabase Pro | $25/月 | 有持續費用 |
| GitHub Actions Keep-Alive | $0/月 | 每週一次 ping，極低資源消耗 |

GitHub Actions Free 每月 2,000 分鐘，keep-alive 一年 52 次 × 約 1 分鐘 = **52 分鐘**，遠低於免費額度。

**升級觸發條件**：月活躍用戶超過 500 人，或資料庫接近 450 MB（免費上限 500 MB），再評估升級 Supabase Pro。

---

## 全域不可違反規則速查表

| # | 規則 | 違反後果 |
|---|------|---------|
| 1 | 時間戳用 `timestamptz`，不用 `timestamp` | 時區錯誤，軟刪除計算異常 |
| 2 | `SERVICE_ROLE_KEY` 不出現在前端 | 資料庫完整權限洩漏 |
| 3 | `createServerClient()` 和 `getUser()` 之間不插程式碼 | Token 刷新失敗，用戶錯誤登出 |
| 4 | 時間不存字串，只存整數秒 | 排序錯誤 |
| 5 | 用 CHECK constraint，不用 PostgreSQL ENUM | 值域變更需危險的鎖表操作 |
| 6 | `official` 可信度不可降級（trigger 強制）| 公信力基礎崩解 |
| 7 | 帳號刪除時 `claimed` → `unlinked`，不刪策展層 | 破壞公共記錄完整性 |
| 8 | `claim_tag_count` 必須透過 trigger 維護 | 排行榜顯示錯誤標記數 |
| 9 | Relay 分項在 team_members，不在 results（CHECK 強制）| 資料語意污染 |
| 10 | 策展層成績永遠不刪除 | 冷啟動設計失效，失去平台內容 |
| 11 | 新表必須 ENABLE RLS + policy | 資料對 anon key 完全開放 |
| 12 | SECURITY DEFINER 函式必須 `SET search_path = public` | Search path injection 漏洞 |
| 13 | 不對 athletes 做硬刪除 | 違反個資法緩衝期要求 |
| 14 | `athlete_name_snapshot` 只有助手可改 | 策展層記錄被篡改 |
| 15 | Slug 上線後不改（或要設 redirect）| 已分享連結失效 |
| 16 | `leaderboard_entries` view 保留 nickname 過濾 | 匿名成績進榜，公信力受損 |
| 17 | 新增 token 時 `:root {}` 和 `@theme inline {}` 同時更新 | Tailwind class 或 CSS 變數失效 |
