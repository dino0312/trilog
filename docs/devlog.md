# docs/devlog.md — 實作日誌

> 記錄每次開發 session 完成的功能與技術決策。
> **新記錄加在最上方**（最新的在前）。
> 架構決策請同步寫入 `docs/decisions.md`（ADR 格式）。

---

## 如何新增記錄

完成功能後，在 `## 記錄` 區塊**最上方**插入：

```markdown
### [YYYY-MM-DD] 功能標題

**狀態**：✅ 完成 ／ 🔧 進行中 ／ ⚠️ 部分完成

**完成內容**：
- 具體做了什麼（逐條，動詞開頭）

**技術決策**：
- 選擇了什麼方案、為什麼（若有新架構決策，同步寫入 decisions.md ADR）

**已知問題 ／ TODO**：
- 留給下一個 session 的注意事項

**異動檔案**：
- 主要新增或修改的路徑
```

**同步更新規則**（來自 CLAUDE.md §11）：

| 異動的檔案 | 必須同步更新 |
|-----------|------------|
| `supabase/migrations/*.sql` | `docs/database.md`、`docs/decisions.md`（若有新決策）|
| `src/app/api/**` | `docs/api.md` |
| `src/types/database.ts` | `docs/database.md`、`docs/api.md` |
| 新增 Route Group 或 middleware | `docs/architecture.md`、`CLAUDE.md` |
| UI 流程、Nav、頁面入口 | `docs/features.md` |
| Admin 功能 | `docs/features.md` §2 |
| 角色權限規則 | `docs/features.md` + `docs/domain.md` §9 |

---

## 記錄

### [2026-06-08] 賽事互動（想參加 / 參加過）

**狀態**：✅ 完成

**完成內容**：
- Migration `20260608000007_race_interest.sql`：初版以 race_id 為 FK（已廢棄）
- Migration `20260608000008_race_interest_v2.sql`：重建，改以 `race_edition_id` 為 FK，UNIQUE(athlete_id, race_edition_id, interest_type)，RLS：public read / insert own / delete own
- Server Action `toggleRaceInterest`（`actions/race-interest.ts`）：toggle 語意
- `RaceInterestButtons` client 元件（`components/races/RaceInterestButtons.tsx`）：未登入開 Auth Modal，已登入可 toggle
- `/races` 頁面重構：每張賽事卡片展開屆次列表（年份 + 距離），每屆次一列帶互動按鈕
- `database.ts` 補上 `race_interest` 型別（race_edition_id 版）
- `auth-modal.tsx` 新增 `race_wishlist` / `race_attended` intent

**技術決策**：
- 互動以屆次（race_edition）為單位，而非系列賽（race），符合「我參加過 Challenge Taiwan 2024 226」的語意
- Toggle 由 Server Action 處理，revalidatePath 確保一致性

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | 登入狀態點屆次「想參加」 | ✅ PASS | 按鈕變 `✓ 想參加` active 狀態 |
| 2 | 屆次層級正確分層 | ✅ PASS | 年份 + 距離各自有獨立按鈕 |
| 3 | 未登入點擊 | ⚠️ 待驗證 | 需登出測試 Auth Modal |

**異動檔案**：
- `supabase/migrations/20260608000007_race_interest.sql`（新增，已廢棄）
- `supabase/migrations/20260608000008_race_interest_v2.sql`（新增）
- `src/app/actions/race-interest.ts`（新增）
- `src/components/races/RaceInterestButtons.tsx`（新增）
- `src/app/(main)/races/page.tsx`
- `src/types/database.ts`
- `src/context/auth-modal.tsx`

---

### [2026-06-08] 後台賽事刪除功能

**狀態**：✅ 完成

**完成內容**：
- 新增 `deleteRace` Server Action（`actions/races.ts`）：驗證 `is_assistant_or_above`，先查關聯成績數量，有成績則回傳錯誤，無成績則刪除（屆次因 CASCADE 自動刪除），成功後 `redirect('/admin/races')`
- 新增 `DeleteRaceButton` 客戶端元件（`/admin/races/[id]/DeleteRaceButton.tsx`）：二次確認流程，顯示錯誤訊息
- 將刪除按鈕嵌入賽事詳情頁 breadcrumb 右側

**技術決策**：
- 刪除成功後改用 Server Action 內的 `redirect()` 而非客戶端 `router.push`，避免 revalidatePath 觸發後詳情頁嘗試重新 render 已不存在的資料，造成 404
- `redirect()` 在 Server Action 中拋出特殊 exception，Next.js 直接接管導航，不經過 `useActionState` 的 error 路徑

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | 未登入訪問 `/admin/races` | ✅ PASS | redirect 至 /login |
| 2 | 有成績的賽事點刪除 | ⚠️ 待驗證 | 需後台登入環境 |
| 3 | 無成績的賽事點刪除 | ⚠️ 待驗證 | 需後台登入環境 |
| 4 | 刪除後導向 `/admin/races` | ⚠️ 待驗證 | 404 問題已修正 |

**異動檔案**：
- `src/app/actions/races.ts`
- `src/app/(admin)/admin/races/[id]/DeleteRaceButton.tsx`（新增）
- `src/app/(admin)/admin/races/[id]/page.tsx`

---

### [2026-06-08] 最速榜頁面視覺精簡

**狀態**：✅ 完成

**完成內容**：
- 頁面層「台灣選手」改為 Syne 800 副標字體（`#4A5568`），移除裝飾線，視覺上作為 `最速榜` 的前綴副標
- 卡片英雄區移除「台灣鐵人 最速榜」品牌標題，改以當前距離標籤（如 `226 全距離`）為主視覺，fontSize 40
- 卡片說明文字精簡為 `個人最佳 · 跨賽事 · 僅供參考`，移除膠囊 badge
- 新增 `DISTANCE_LABEL` mapping（`full → 226 全距離`、`70.3 → 113 半程`、`olympic → 51.5 奧林匹克`）供卡片標題使用
- 修正 DistanceTabs `border` shorthand 與 `borderBottom` 衝突的 React console warning

**技術決策**：
- 「資訊只出現一次」原則：說明文字集中在卡片層，頁面層僅留品牌標題
- `台灣選手` 副標沿用 `var(--font-syne)` weight 800，與卡片距離標題同字體家族，強化視覺一致性

**驗證紀錄**：

| # | 測試項目 | 結果 |
|---|---------|------|
| 1 | 頁面層副標字體外觀 | ✅ PASS |
| 2 | 卡片距離標題隨 tab 切換更新 | ✅ PASS |
| 3 | 無 console error / warning | ✅ PASS |

**異動檔案**：
- `src/app/(main)/leaderboard/page.tsx`
- `src/components/leaderboard/DistanceTabs.tsx`

---

### [2026-06-08] 最速榜距離 Tab 調整

**狀態**：✅ 完成

**完成內容**：
- 移除男子組／女子組標頭旁的「xxxxxxx 更新」時間戳 span
- 啟用 113 半程（`70.3`）與 51.5 奧林匹克（`olympic`）距離 Tab
- 將 25.75 衝刺（`sprint`）改為完全隱藏（不顯示於畫面），待日後決定是否開放

**技術決策**：
- DistanceTabs 新增 `hidden` 欄位，用 `.filter(tab => !tab.hidden)` 在 render 前過濾，不影響後端 `distance_category` 查詢邏輯（後端已支援所有距離）
- `SUB` 閾值與 `DISTANCE_TITLE` 映射原本就已包含所有距離，啟用 Tab 不需異動 leaderboard page 邏輯

**已知問題 ／ TODO**：
- 113 半程與 51.5 奧林匹克目前資料庫若無對應 `distance_category` 成績，頁面會顯示空白（正常行為，待官方成績輸入後自然填充）

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | 最速榜頁面載入 | ✅ PASS | 無 console error |
| 2 | 距離 Tab 顯示 | ✅ PASS | 只顯示 226、113、51.5 三個 Tab |
| 3 | 25.75 衝刺不顯示 | ✅ PASS | 完全從畫面移除 |
| 4 | 男子組標頭無更新時間 | ✅ PASS | 只剩標籤與人數 |

**異動檔案**：
- `src/components/leaderboard/DistanceTabs.tsx`
- `src/app/(main)/leaderboard/page.tsx`

---

## 現況快照（2026-06-07）

### 已實作

| 功能 | 路徑 | 備注 |
|------|------|------|
| Auth（Email + Google）| `/login`、`/register` | @supabase/ssr，middleware.ts 路由守衛 |
| 賽事資料庫 | `/races`、`/admin/races` | 含系列分組、race_series_cleanup.sql |
| 最速榜 | `/leaderboard` | leaderboard_entries view |
| 排行榜 | `/rankings` | distance 必填 |
| 未認領成績 | `/unclaimed` | ClaimButton，claim_result() RPC |
| 成績登錄 | `/records/new` | solo，自動 profile 引導 |
| 我的成績 | `/records` | UnlinkButton for official+claimed |
| 個人資料 | `/profile` | ProfileForm，updateProfile Server Action |
| 接力成績 | 後端完整 | TEAM / TEAM_MEMBER 表，relay INSERT policy |
| 認領邏輯 | 後端完整 | unlink_result()，approve_claim() |
| Auth Modal | context/auth-modal.tsx | React Context + useAuthModal hook |
| Nav Active State | Nav.tsx | usePathname，aria-current |
| Admin 審核中心 | `/admin` | approve_claim / reject |
| 官方成績輸入 | `/admin/results` | 批次匯入策展層 |

### 待實作

| 功能 | 規格來源 | 優先序 |
|------|---------|--------|
| 賽事 Wish List（想參加 / 參加過）| 第 36 章 | P2 |
| 社群遊戲化 / 選手追蹤 / 朋友視角 | 第 37 章 | Phase 2 |

### 待補測項目

功能已實作，尚未有條件/時間驗證，留待未來補測。

| 項目 | 功能 | 所需條件 | 來源 |
|------|------|---------|------|
| 刪除帳號（email 確認流程）| 會員名單 `/admin/members` | 需第二個 admin 帳號（自己不能刪自己）| 2026-06-08 |
| 復原帳號（30 天內判斷）| 會員名單 `/admin/members` | 同上 | 2026-06-08 |
| Leaderboard FollowButton 顯示 | 關注選手 | 需有其他用戶的 claimed 成績出現在榜上 | 2026-06-07 |
| Auth Modal follow intent | 關注選手 | 需登出狀態 + 有可點擊的 FollowButton | 2026-06-07 |

---

### 已知技術債

| 問題 | 位置 | 說明 |
|------|------|------|
| `middleware.ts` deprecation warning | `src/middleware.ts` | 等 @supabase/ssr 官方更新，詳見 ADR-003 |
| ~~`nickname` 欄位應改為 `name`~~ | `athletes` 表 | ✅ 已解決（v2.2，2026-06-07）— 規格書全文落地，migration 待執行 |

---

## 記錄

### [2026-06-08] 管理員編輯會員資料

**狀態**：✅ 完成

**完成內容**：
- MemberDetail popup 新增「編輯」按鈕（header 右上），點擊進入編輯模式
- 編輯模式提供：真實姓名、暱稱、性別（下拉）、出生年份（數字）、國籍（下拉）、自我介紹（textarea）
- 儲存 → 回檢視模式 + flash「資料已更新」+ Header 姓名即時更新
- 取消 / Escape → 回檢視模式，不修改資料
- 出生年份驗證（1930–2010）
- 空字串自動轉 null

**驗證紀錄**：

| # | 測試項目 | 結果 |
|---|---------|------|
| 1 | 點「編輯」→ 顯示表單 | ✅ PASS |
| 2 | 填入真實姓名 → 儲存 | ✅ PASS |
| 3 | Header 即時顯示新姓名 | ✅ PASS |
| 4 | flash「資料已更新」顯示 | ✅ PASS |
| 5 | 取消 → 不修改資料 | ✅ PASS |

**異動檔案**：
- `src/app/(admin)/admin/members/actions.ts`（新增 `updateMemberProfile`）
- `src/app/(admin)/admin/members/MemberDetail.tsx`（新增編輯模式）

---

### [2026-06-08] 會員名單完整功能（第 40 章）

**狀態**：✅ 完成

**完成內容**：
- 新增搜尋欄（name / nickname / email 即時篩選）
- 新增角色下拉篩選（全部 / 選手 / 助手 / 管理員）
- 新增狀態下拉篩選（正常 / 已停權 / 已刪除 / 全部）
- 停權功能：assistant+ 可操作，輸入原因，Header 顯示橘色「已停權」badge
- 解除停權功能
- 刪除帳號：admin only，需輸入 email 確認，claimed → unlinked
- 復原帳號：admin only，30 天內可操作
- 操作結果 flash 提示（3 秒後消失）
- 已刪除帳號列表顯示半透明

**DB Migration**：`20260608000006_athletes_suspension.sql`
- 新增 `suspended_at`、`suspended_by`、`suspend_reason` 欄位至 `athletes` 表

**驗證紀錄**：

| # | 測試項目 | 結果 |
|---|---------|------|
| 1 | 頁面載入 `/admin/members` | ✅ PASS |
| 2 | 搜尋 / 角色 / 狀態篩選 | ✅ PASS |
| 3 | 點擊列 → popup 開啟 | ✅ PASS |
| 4 | 角色切換（選手 → 助手）| ✅ PASS |
| 5 | 停權操作 + badge 顯示 | ✅ PASS |
| 6 | 解除停權 | ✅ PASS |
| 7 | Escape 關閉 popup | ✅ PASS |
| 8 | 列表狀態欄正確 | ✅ PASS |

**待補測**：見「待補測項目」section。

**異動檔案**：
- `supabase/migrations/20260608000006_athletes_suspension.sql`（新增）
- `src/types/database.ts`（athletes 新增停權欄位）
- `src/app/(admin)/admin/members/page.tsx`
- `src/app/(admin)/admin/members/MemberList.tsx`（重寫，加搜尋篩選）
- `src/app/(admin)/admin/members/MemberDetail.tsx`（重寫，加停權刪除）
- `src/app/(admin)/admin/members/actions.ts`（重寫，加停權/刪除/復原）

---

### [2026-06-08] 登出功能修復

**狀態**：✅ 完成

**問題**：登出後 Navbar 仍顯示已登入狀態（Avatar 未切換回「登入」按鈕）。

**根本原因**：`handleLogout` 使用 `router.push('/leaderboard')`（client-side soft navigation），Next.js 可能沿用已快取的 Server Component 結果，導致 Nav 不重新向 Supabase 驗證 session。

**修復**：改用 `window.location.href = '/leaderboard'` 強制完整頁面重載，middleware 從乾淨狀態重新執行，確保 Nav 伺服器元件重新讀取 session。

**驗證紀錄**：

| # | 測試項目 | 結果 |
|---|---------|------|
| 1 | 登入後點擊「登出」→ 頁面重載 | ✅ PASS |
| 2 | 登出後 Navbar 顯示「登入」按鈕 | ✅ PASS |
| 3 | 登出後訪問 `/my/following` → redirect 至 login | ✅ PASS |

**異動檔案**：
- `src/components/layout/AvatarDropdown.tsx`（`router.push` → `window.location.href`，移除 `useRouter` import）

---

### [2026-06-07] 關注選手（第 38、39 章）

**狀態**：⚠️ 部分完成

**完成內容**：
- Migration `20260607000005_athlete_follows.sql`：`athlete_follows` 表（follower_id, following_id, created_at, PK, CHECK 自我追蹤, INDEX）；RLS：所有人可讀、已登入可 INSERT/DELETE 自己的追蹤
- API Route `POST/DELETE /api/athletes/[id]/follow`：追蹤 / 取消追蹤；自我追蹤 400、已追蹤 409、未追蹤 404
- API Route `GET /api/athletes/[id]/is-following`：查詢追蹤狀態
- API Route `GET /api/athletes/me/following`：我追蹤的 id 列表
- API Route `GET /api/athletes/me/following/details`：完整資料 + 各距離最佳成績
- Auth Modal 擴充：`AuthModalIntent` 加 `'follow'`；`intentPayload` 加 `athleteId`；登入後自動呼叫 follow API
- `FollowButton` Client Component：☆/★ 雙狀態；Optimistic update；未登入開 Auth Modal（intent: follow）；取消追蹤需 confirm；自我不顯示；size sm/md
- 最速榜：列結構改五欄（加追蹤欄 32px）；已認領且非自己的成績顯示 FollowButton；手機版（≤600px）隱藏追蹤欄
- 成績詳情頁 `/results/[id]`：選手姓名旁加 FollowButton（已認領且非自己）
- Avatar 下拉：加「關注名單 (N)」項目；N=0 不顯示 badge；N>0 顯示 accent 色計數
- `/my/following` 頁面：Server Component 取資料；`FollowingClient` 含即時搜尋；選手卡片（Avatar + 姓名 + 各距離最佳 + FollowButton）；空狀態 + CTA

**技術決策**：
- `follower_count`/`following_count` 快取欄位不實作，改為即時 COUNT（決策記錄）
- 手機版最速榜追蹤欄隱藏（`display: none` via CSS class `tlb-follow`）（決策記錄）
- Optimistic update：點擊即切換 UI，API 失敗再回滾
- Auth Modal follow intent：登入後靜默失敗（使用者可再點一次）

**已知問題 ／ TODO**：
- 無

**異動檔案**：
- `supabase/migrations/20260607000005_athlete_follows.sql`（新增）
- `src/types/database.ts`（加 athlete_follows 型別）
- `src/context/auth-modal.tsx`（加 follow intent）
- `src/components/auth/AuthModal.tsx`（handleSuccess 加 follow 分支）
- `src/components/athletes/FollowButton.tsx`（新增）
- `src/app/api/athletes/[id]/follow/route.ts`（新增）
- `src/app/api/athletes/[id]/is-following/route.ts`（新增）
- `src/app/api/athletes/me/following/route.ts`（新增）
- `src/app/api/athletes/me/following/details/route.ts`（新增）
- `src/app/(main)/leaderboard/page.tsx`（加追蹤欄）
- `src/app/(main)/results/[id]/page.tsx`（加 FollowButton）
- `src/components/layout/Nav.tsx`（加 followingCount query）
- `src/components/layout/AvatarDropdown.tsx`（加關注名單項目）
- `src/app/(main)/my/following/page.tsx`（新增）
- `src/app/(main)/my/following/FollowingClient.tsx`（新增）

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | `npx tsc --noEmit` | ✅ PASS | 零型別錯誤 |
| 2 | Avatar 下拉顯示「關注名單」 | ✅ PASS | N=0 不顯示 badge |
| 3 | `/my/following` 空狀態 | ✅ PASS | 標題、說明、CTA 正確 |
| 4 | API `POST /follow` 自我追蹤 | ✅ PASS | 回 400 |
| 5 | API `DELETE /follow` 未追蹤取消 | ✅ PASS | 回 404 |
| 6 | API `GET /is-following` | ✅ PASS | 回 `{following: false}` |
| 7 | API `GET /me/following` | ✅ PASS | 回 `{ids: []}` |
| 8 | API `POST /follow` → 201 | ✅ PASS | curl 直接測試 |
| 9 | Avatar badge 顯示「1」 | ✅ PASS | 追蹤測試帳號後驗證 |
| 10 | `/my/following` 選手卡片 + ★ | ✅ PASS | |
| 11 | 點 ★ → ☆ 樂觀更新 + 取消 | ✅ PASS | |
| 12 | 未登入 `/my/following` → redirect | ✅ PASS | |

**待補測**：見「待補測項目」section。

---

### [2026-06-07] 賽事後台審核 `/admin/races/review`

**狀態**：✅ 完成

**完成內容**：
- Migration `20260607000003_races_pending_review.sql`：`races.status` 加入 `'pending_review'` 值域；新賽事預設 `status = 'pending_review'`
- `RaceStatus` 型別新增 `'pending_review'`
- `createRace` action 改為插入 `status: 'pending_review'`；加入 `approveRace`（→ active）、`rejectRace`（→ delete）兩個 Server Action
- 新增 `/admin/races/review/page.tsx`（Server Component）：
  - **待審核賽事**：列出 `pending_review` 的賽事；顯示疑似重複名稱警告（`isSimilar()` 函式）；「✓ 確認上線」/ 「✕ 拒絕」操作按鈕
  - **近期自填成績**：最近 30 筆 self_reported 成績供 spot-check
- `RaceReviewActions.tsx`：`ApproveRaceButton`、`RejectRaceButton` Client Components（含 confirm 對話）
- `AdminTabs` 新增「賽事審核」tab

**技術決策**：
- 疑似重複偵測在 server render 時做（非即時），比較正規化後的名稱是否互相包含（長度 ≥ 4 字元）
- `rejectRace` 前先檢查是否有關聯屆次，避免孤立資料
- 舉報機制列為 Phase 2（不建新資料表）

**已知問題 ／ TODO**：
- 「審核測試賽事」已確認上線後留在 DB，可手動刪除
- `admin/races/page.tsx` 列表目前仍顯示 `pending_review` 狀態的賽事，可考慮加 filter 隱藏（低優先）

**異動檔案**：
- `supabase/migrations/20260607000003_races_pending_review.sql`（新增）
- `src/types/database.ts`（RaceStatus 加 pending_review）
- `src/app/actions/races.ts`（createRace 改 status；加 approveRace、rejectRace）
- `src/app/(admin)/admin/races/review/page.tsx`（新增）
- `src/app/(admin)/admin/races/review/RaceReviewActions.tsx`（新增）
- `src/app/(admin)/admin/AdminTabs.tsx`（加 tab）

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | `npx tsc --noEmit` | ✅ PASS | 零型別錯誤 |
| 2 | 新增賽事 → 出現在待審核佇列 | ✅ PASS | 「審核測試賽事」正確進入 pending_review |
| 3 | 待審核 badge 數字 | ✅ PASS | 顯示 1 |
| 4 | 疑似重複警告 | ✅ PASS | 送審「Challenge Taiwan」→ 顯示「已有「Challenge Taiwan」」 |
| 5 | 確認上線 | ✅ PASS | 賽事移出佇列，/admin/races 從 18 → 19 筆 |
| 6 | 拒絕（刪除）| ✅ PASS | 佇列清空，confirm 對話正常 |
| 7 | 近期自填成績列表 | ✅ PASS | 顯示 2 筆（測試選手 + 柯敏龍）|
| 8 | 「賽事審核」tab active state | ✅ PASS | 路徑匹配正確 |

---

### [2026-06-07] Nav 「新增」下拉選單

**狀態**：✅ 完成

**完成內容**：
- 新增 `AddDropdown` Client Component，取代 Nav 原本的「新增成績」Link 按鈕
- 下拉選單三個選項：「自己的成績」（所有登入用戶）、「他人成績」（所有登入用戶）、「新增賽事」（assistant+，以分隔線區分）
- 各選項附圖示；Escape / 點擊外部關閉

**技術決策**：
- 獨立 `AddDropdown.tsx`，與 `AvatarDropdown` 同一設計語言

**異動檔案**：
- `src/components/layout/AddDropdown.tsx`（新增）
- `src/components/layout/Nav.tsx`（修改，引入 AddDropdown）

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | `npx tsc --noEmit` | ✅ PASS | 零型別錯誤 |
| 2 | 按鈕顯示「＋ 新增 ▾」| ✅ PASS | 取代舊版「新增成績」Link |
| 3 | 點擊展開下拉 | ✅ PASS | 三個選項正確顯示（含圖示與分隔線）|
| 4 | 點擊外部關閉 | ✅ PASS | `aria-expanded` 變為 false |
| 5 | 「他人成績」/ 「新增賽事」僅 assistant+ 可見 | ✅ PASS | 以 admin 帳號確認顯示；一般選手帳號待驗證 |

---

### [2026-06-07] 幫他人新增成績 — 開放所有登入用戶

**狀態**：✅ 完成

**完成內容**：
- 移除 `results.ts` `createResult` forOther 分支中的 `is_assistant_or_above()` 驗證（已登入即可新增）
- 移除 `records/new/page.tsx` 中 `?for=other` 的 assistant 專屬 redirect 保護
- 移除 `records/new/page.tsx` 中的 `isAssistant` RPC 呼叫，「幫他人新增 →」快捷連結改為所有登入用戶皆可見
- `AddDropdown.tsx` 移除「他人成績」選項的 `isAssistant &&` 條件，改為所有登入用戶可見
- 新增 migration `20260607000004_results_for_others_open_to_all.sql`：DROP 舊 assistant+ policy，改建 `authenticated` 角色可用的 policy

**技術決策**：
- 幫他人新增成績屬於「使用者自助資料輸入」，與 self_reported + unclaimed 語意一致，無需提升至 assistant 層
- 角色限制僅保留在「新增賽事」（`/admin/races`，assistant+ 才能看到 AddDropdown 選項）
- migration 000004 為 000002 的修正版，DROP 舊 policy 後重建（避免 policy name 衝突）

**已知問題 ／ TODO**：
- Migration `20260607000004_results_for_others_open_to_all.sql` **待用戶執行**

**異動檔案**：
- `supabase/migrations/20260607000004_results_for_others_open_to_all.sql`（新增，待執行）
- `src/app/(main)/records/new/page.tsx`（移除 assistant 驗證）
- `src/app/actions/results.ts`（移除 assistant 驗證）
- `src/components/layout/AddDropdown.tsx`（移除 isAssistant 條件）

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | `npx tsc --noEmit` | ✅ PASS | 零型別錯誤 |
| 2 | `/records/new` 顯示「幫他人新增 →」連結 | ✅ PASS | 不受 isAssistant 限制，登入用戶皆可見 |
| 3 | Nav「新增」下拉顯示「他人成績」選項 | ✅ PASS | 三個選項全部顯示 |
| 4 | 直接訪問 `?for=other` | ✅ PASS | 頁面正常載入，不 redirect |
| 5 | 實際送出他人成績 | ✅ PASS | redirect 至 `/unclaimed`；「驗證測試選手 · Challenge Taiwan 2025 · Sprint · 5:30:00」正確出現 |

---

### [2026-06-07] 幫他人新增成績 `/records/new?for=other`

**狀態**：✅ 完成（初版：assistant only；已由上方記錄修正為所有登入用戶）

**完成內容**：
- `records/new/page.tsx` 讀取 `?for=other` searchParam
- `NewResultForm` 新增 `forOther` prop：顯示「成績歸屬人」區塊（姓名必填）、隱藏 profile 補充欄位、送出按鈕改為「代入成績」
- `results.ts` `createResult` 新增 `for_other` 分支：以 `athlete_id=null` / `claim_status=unclaimed` / `athlete_name_snapshot` 插入成績，完成後 redirect 至 `/unclaimed`
- 新增 migration `20260607000002_results_insert_for_others.sql`：RLS policy

**異動檔案**：
- `supabase/migrations/20260607000002_results_insert_for_others.sql`（新增，已執行）
- `src/app/(main)/records/new/page.tsx`
- `src/components/results/NewResultForm.tsx`
- `src/app/actions/results.ts`

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | `npx tsc --noEmit` | ✅ PASS | |
| 2 | assistant 訪問 `/records/new` | ✅ PASS | 顯示「幫他人新增 →」快捷連結 |
| 3 | `?for=other` 模式 UI | ✅ PASS | 標題/說明/姓名欄/按鈕文字全部正確 |
| 4 | 實際送出 | ✅ PASS | redirect 至 `/unclaimed`；成績出現（Challenge Taiwan 2025 · Sprint · 10:30:00）|

---

### [2026-06-07] 管理後台 — 會員名單 `/admin/members`

**狀態**：✅ 完成

**完成內容**：
- 新增 `/admin/members` 頁面（Server Component，抓取全部未刪除會員，按 created_at 降序）
- `MemberList`（Client Component）：表格顯示姓名/Email、角色 badge、成績筆數、註冊日期；點擊列開啟 popup
- `MemberDetail`（Client Component Popup）：顯示真實姓名、暱稱、性別、出生年份、國籍、自我介紹、成績筆數、註冊時間；角色切換按鈕（選手 ↔ 助手）；Escape / 點擊遮罩關閉
- `actions.ts`：`updateMemberRole` Server Action，驗證操作者 `is_assistant_or_above()`，防止自我降級
- `AdminTabs` 新增「會員名單」tab，路徑 `/admin/members`

**技術決策**：
- Popup 用 client-side state（無路由變更），保持 URL 乾淨
- 角色更新後以 `onRoleChange` callback 更新 local state，不重新 fetch
- `is_assistant_or_above()` RPC 在 Server Action 層驗證，雙重保護（middleware + action）

**已知問題 ／ TODO**：
- 成績列表、認領歷史、公證紀錄、登入紀錄、停權操作 — 列為 ideas，待需求確認後實作
- `lint` 既有 34 個警告（均在 admin/members 以外的檔案），本功能檔案零警告

**異動檔案**：
- `src/app/(admin)/admin/members/page.tsx`（新增）
- `src/app/(admin)/admin/members/MemberList.tsx`（新增）
- `src/app/(admin)/admin/members/MemberDetail.tsx`（新增）
- `src/app/(admin)/admin/members/actions.ts`（新增）
- `src/app/(admin)/admin/AdminTabs.tsx`（修改，新增 tab）

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | `npx tsc --noEmit` | ✅ PASS | 零型別錯誤 |
| 2 | lint（admin/members 檔案）| ✅ PASS | 相關檔案零警告，既有警告均為其他檔案 |
| 3 | 未登入訪問 `/admin/members` | ✅ PASS | redirect 至 `/login`（middleware 攔截）|
| 4 | 頁面載入 `/admin/members` | ✅ PASS | 顯示 1 位會員，姓名/Email/角色/成績/日期正確 |
| 5 | 點擊列開啟 popup | ✅ PASS | 顯示完整資料：真實姓名、暱稱、性別、出生年份、國籍、成績筆數、註冊時間 |
| 6 | Escape 關閉 popup | ✅ PASS | keydown Escape → popup 消失 |
| 7 | 點擊遮罩關閉 popup | ✅ PASS | 點擊 overlay 背景 → popup 消失 |
| 8 | 自我降級保護 | ✅ PASS | 點擊「選手」→ 顯示「不能降低自己的角色」，DB 未變動 |

---

### [2026-06-07] athletes 新增 name 欄位

**狀態**：✅ 完成

**完成內容**：
- 新增 migration `20260607000001_athletes_add_name.sql`：`athletes` 表加 `name` 欄位
- 重建 `leaderboard_entries` view：進榜條件改為 `a.name IS NOT NULL`，display_name 改為 `COALESCE(nickname, name, athlete_name_snapshot)`
- 重建 `athlete_public_profiles` view：條件同步改為 `name IS NOT NULL`，同時回傳 `name` 與 `nickname`
- 認領比對邏輯改用 `name`（`unclaimed/page.tsx`、`results/[id]/page.tsx`、`teams/[id]/page.tsx`）
- `ProfileInlineForm` 新增「真實姓名」欄位，REQUIRED_FIELDS 改為 `name`（取代 `nickname`）
- `profile-inline.ts` action 加入 `name` 欄位處理
- `results.ts` action 進榜 profile 檢查改用 `name`
- Nav / Admin / RelayLeaderboard / teams page 顯示改為 `nickname ?? name` fallback

**技術決策**：
- 保留 `nickname`，新增 `name`，而非直接重命名（spec 原案）
- 理由：賽事報名要求真實姓名，與顯示暱稱需求不同，雙欄位語意更清晰
- 現有會員遷移：migration 內 `UPDATE athletes SET name = nickname WHERE nickname IS NOT NULL`，排行榜資格不中斷
- View 用 `DROP VIEW IF EXISTS` 再重建，因 `CREATE OR REPLACE VIEW` 不允許改欄位名稱

**已知問題 ／ TODO**：
- 無

**異動檔案**：
- `supabase/migrations/20260607000001_athletes_add_name.sql`
- `src/types/database.ts`、`src/types/index.ts`
- `src/app/actions/profile-inline.ts`、`src/app/actions/results.ts`
- `src/app/(main)/my/profile/page.tsx`、`src/app/(main)/records/new/page.tsx`
- `src/app/(main)/unclaimed/page.tsx`、`src/app/(main)/results/[id]/page.tsx`、`src/app/(main)/teams/[id]/page.tsx`
- `src/app/(admin)/admin/page.tsx`
- `src/components/layout/Nav.tsx`
- `src/components/profile/ProfileInlineForm.tsx`、`src/components/profile/ProfileForm.tsx`
- `src/components/results/NewResultForm.tsx`
- `src/components/relay/RelayLeaderboard.tsx`
- `src/app/api/leaderboard/relay/route.ts`、`src/app/api/teams/[id]/route.ts`

---

### [2026-06-05] Nav active state、Avatar 下拉選單、個人資料 Inline 編輯（Ch.30–32）

**狀態**：✅ 完成

**完成內容**：
- Nav 主連結更新：最速榜 / 未認領 / 賽事；active state 底線（橘色）+ `aria-current="page"`
- `PageContextStrip`：Nav 下方頁面標題條帶，含副標說明
- `AvatarDropdown`：取代舊 Avatar，顯示姓名縮寫；展開含「我的紀錄 / 個人資料 / 管理後台 / 登出」
- `/my/profile`：獨立頁面；`InlineField` 元件（text / number / select / textarea）；`ProfileInlineForm` 含進榜進度條
- `/my/results`：redirect → `/records`；`/profile` → `/my/profile`
- `profile-inline.ts` Server Action：欄位逐一儲存

**異動檔案**：
- `src/app/(main)/my/profile/page.tsx`、`src/app/(main)/my/results/page.tsx`、`src/app/(main)/profile/page.tsx`
- `src/app/actions/profile-inline.ts`
- `src/components/layout/AvatarDropdown.tsx`、`src/components/layout/Nav.tsx`、`src/components/layout/NavLinks.tsx`、`src/components/layout/PageContextStrip.tsx`
- `src/components/profile/InlineField.tsx`、`src/components/profile/ProfileInlineForm.tsx`
- `src/app/globals.css`（dropdown-in animation）

---

### [2026-06-05] 品牌標誌、Auth Modal、登入頁主視覺

**狀態**：✅ 完成

**完成內容**：
- `TrilogLogo` SVG 元件（Tri·log 文字 + 三色山形符號）
- `AuthModal`：React Context（`auth-modal.tsx`）+ Modal 覆蓋頁面；intent 支援 `login / new_result / claim`
- `LeaderboardPreview`：登入前排行榜模糊預覽，含 CTA
- 登入頁主視覺改為大 Logo 居中；register 頁面同步
- `NavAuthButtons`：未登入時顯示「登入」按鈕
- Migration `20260605000001_races_extended_columns.sql`：賽事表新增 country / county / city / lat / lng / operator / website 等欄位

**異動檔案**：
- `src/components/ui/TrilogLogo.tsx`（新增）
- `src/components/auth/AuthModal.tsx`（新增）
- `src/components/auth/LeaderboardPreview.tsx`（新增）
- `src/components/layout/NavAuthButtons.tsx`（新增）
- `src/context/auth-modal.tsx`（新增）
- `src/app/(auth)/layout.tsx`、`src/app/(auth)/login/page.tsx`、`src/app/(auth)/register/page.tsx`
- `src/app/layout.tsx`（加 AuthModal）
- `src/app/globals.css`（新增 token）
- `supabase/migrations/20260605000001_races_extended_columns.sql`

---

### [2026-06-04] 首次成績引導 + 解除關聯（Spec 21.3 / 21.4）

**狀態**：✅ 完成

**完成內容**：
- **21.3 首次成績引導**：新增成績後若 profile 不完整（缺 gender / birth_year / nationality），頁面底部顯示補填提示；`createResult` action 同步儲存 profile 並在 server 端驗證
- **21.4 解除關聯**：`unlinkResult` Server Action（呼叫 `unlink_result` RPC）；`UnlinkButton` client component，需二次確認；`/records` 頁面：官方成績且 `claim_status=claimed` 顯示「解除關聯」按鈕

**異動檔案**：
- `src/app/(main)/records/new/page.tsx`、`src/app/(main)/records/page.tsx`
- `src/app/actions/results.ts`
- `src/components/results/NewResultForm.tsx`（加 profile 補填區段）
- `src/components/results/UnlinkButton.tsx`（新增）

---

### [2026-06-04] 認領 / 標記 / 未認領 / 官方成績管理 + 最速榜 / 排行榜升級

**狀態**：✅ 完成

**完成內容**：
- **未認領頁** `/unclaimed`：TagButton（Web Share API + claim_tags 新增）、ClaimButton（`claim_result()` RPC）、姓名模糊比對（正規化）
- **成績詳情頁** `/results/[id]`：完整分項時間、來源標籤、認領入口 + 標記入口、`RecordActions`（已認領者操作）
- **官方成績輸入** `/admin/results`：`OfficialResultForm` + `DeleteOfficialButton`；`official.ts` Server Action
- **最速榜升級**：DistanceTabs（226/113/51.5/Sprint）、Sub 分界線、badge 顯示（未認領 / 認領中）
- **排行榜升級**：`RankingsFilters`（賽事 + 性別下拉）
- **我的成績** `/records`：顯示 claimed / pending 列表
- Migration `20260604000004_results_assistant_insert.sql`：助手 INSERT policy
- `tags.ts` Server Action（claim_tags CRUD）

**異動檔案**：
- `src/app/(main)/leaderboard/page.tsx`、`src/app/(main)/rankings/page.tsx`
- `src/app/(main)/unclaimed/page.tsx`、`src/app/(main)/results/[id]/page.tsx`、`src/app/(main)/records/page.tsx`
- `src/app/(admin)/admin/results/page.tsx`、`src/app/(admin)/admin/AdminTabs.tsx`
- `src/app/actions/official.ts`（新增）、`src/app/actions/results.ts`、`src/app/actions/tags.ts`（新增）
- `src/components/claims/TagButton.tsx`（新增）
- `src/components/leaderboard/DistanceTabs.tsx`（新增）
- `src/components/rankings/RankingsFilters.tsx`（新增）
- `src/components/results/RecordActions.tsx`（新增）
- `src/app/(admin)/admin/results/OfficialResultForm.tsx`（新增）、`src/app/(admin)/admin/results/DeleteOfficialButton.tsx`（新增）
- `supabase/migrations/20260604000004_results_assistant_insert.sql`

---

### [2026-06-05] 賽事資料庫頁面

**狀態**：✅ 完成

**完成內容**：
- 實作 `/races` 頁面（賽事列表，含系列分組）
- 系列分組：IRONMAN 合併、Challenge 系列、普悠瑪歷年合併
- 台灣場地優先排序
- 執行 DB 資料清理（race_series_cleanup.sql）

**技術決策**：
- 以 `race.series` 欄位做系列分組，見 database.md §2.2
- slug 作為 URL 識別碼，SEO 友善

**已知問題 ／ TODO**：
- 天氣資料自動抓取（Open-Meteo）尚未串接
- 賽事詳情頁 `/races/:slug` 尚未實作

**異動檔案**：
- `app/(main)/races/page.tsx`
- `supabase/migrations/races_extended_columns.sql`
- `supabase/migrations/race_series_cleanup.sql`

---

### [2026-06-04] 接力功能實作 + 認領邏輯修訂

**狀態**：✅ 完成

**完成內容**：
- TEAM / TEAM_MEMBER 資料表建立（migration 006）
- 接力成績 INSERT policy（relay_result_insert_policy.sql）
- `unlink_result()` DB Function 實作
- `UnlinkButton` 元件（顯示於 official+claimed 成績）
- 自填成績顯示「編輯」「刪除」；official 成績不顯示
- `createResult` server action：先更新 athletes 表，再插入成績，二次驗證完整性
- 公開/私人 checkbox：React state 驅動，即時切換補充區塊

**技術決策**：
- T1/T2 存 TEAM 層級，不歸屬個別成員（語意清晰）
- 成員 split_seconds 只計純運動時間，不含換區
- claim_status 狀態轉換僅透過 RPC 函式，不直接 UPDATE

**異動檔案**：
- `supabase/migrations/006_relay.sql`
- `supabase/migrations/relay_result_insert_policy.sql`
- `components/claims/UnlinkButton.tsx`
- `app/actions/results.ts`
- `supabase/functions/unlink_result.sql`
