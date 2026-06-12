# docs/devlog.md — 實作日誌

> 記錄每次開發 session 完成的功能與技術決策。
> **新記錄加在最上方**（最新的在前）。
> 架構決策請同步寫入 `docs/decisions.md`（ADR 格式）。

---

## 如何新增記錄

完成功能後，在 `## 記錄` 區塊**最上方**插入：

````markdown
### [YYYY-MM-DD] 功能標題

**狀態**：✅ 完成 ／ 🔧 進行中 ／ ⚠️ 部分完成

```spec-sync
chapters: []          # 涉及的規格章節編號，例如 [38, 39]
status: implemented   # implemented / partial / superseded
decisions:
  - id: D001
    chapter: 0
    content: "決策摘要"
    spec_impact: true   # true = 規格書需補充；false = 純實作細節
    synced: false       # Claude.ai 同步後改為 true
```

**完成內容**：
- 具體做了什麼（逐條，動詞開頭）

**技術決策**：
- 選擇了什麼方案、為什麼（若有新架構決策，同步寫入 decisions.md ADR）

**已知問題 ／ TODO**：
- 留給下一個 session 的注意事項

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|

**異動檔案**：
- 主要新增或修改的路徑
````

**spec-sync 欄位說明**：

| 欄位 | 說明 |
|------|------|
| `chapters` | 這筆 entry 涉及的規格章節編號陣列，無對應章節填 `[]` |
| `status` | `implemented`（完成）/ `partial`（部分完成）/ `superseded`（已被取代）|
| `decisions[].id` | 流水號，格式 `D001`，同一 entry 內唯一即可 |
| `decisions[].chapter` | 對應的規格章節號，無對應填 `0` |
| `decisions[].content` | 決策摘要，一句話 |
| `decisions[].spec_impact` | `true` = 規格書需補充或修正；`false` = 純實作細節，規格不需動 |
| `decisions[].synced` | `false` = Claude.ai 尚未同步；`true` = 已同步（由 Claude.ai 改寫後交回 repo）|

**sync 流程**：

1. Claude Code 實作完成 → 寫 `spec-sync` 區塊，所有決策 `synced: false`
2. 規格討論時 Dino 將 devlog.md 提供給 Claude.ai
3. Claude.ai 讀取所有 `synced: false` 且 `spec_impact: true` 的決策 → 更新 trilog_spec.json
4. Claude.ai 輸出新版 devlog.md，將已同步的決策改為 `synced: true`
5. Dino 將新版 devlog.md 放回 repo

**同步更新規則**（來自 CLAUDE.md §12）：

| 異動的檔案 | 必須同步更新 |
|-----------|------------|
| `supabase/migrations/*.sql` | `docs/database.md`、`docs/decisions.md`（若有新決策）|
| `src/app/api/**` | `docs/api.md` |
| `src/types/database.ts` | `docs/database.md`、`docs/api.md` |
| 新增 Route Group 或 middleware | `docs/architecture.md`、`CLAUDE.md` |
| UI 流程、Nav、頁面行為有變動 | `docs/devlog.md`（spec-sync 區塊）|
| Admin 功能新增或修改 | `docs/devlog.md`（spec-sync 區塊）|
| 角色權限規則變動 | `docs/domain.md` §9 + `docs/devlog.md`（spec-sync 區塊）|

---

## 記錄

### [2026-06-12] Email 驗證引導流程

**狀態**：⚠️ 部分完成

```spec-sync
chapters: [8, 28]
status: partial
decisions:
  - id: D-VERIFY-01
    chapter: 8
    content: "新增 §8.3：註冊後導向 /register/verify 頁，顯示 masked email + 操作說明 + 60s 重發 cooldown"
    spec_impact: true
    synced: false
  - id: D-VERIFY-02
    chapter: 28
    content: "Ch.28 新增 open:email_sent 狀態對應 AuthModal 的 emailSent 流程；ModalEmailSent 元件提供已驗證→登入快速路徑"
    spec_impact: true
    synced: false
  - id: D-VERIFY-03
    chapter: 8
    content: "GlobalVerifyBanner：server component 檢查 email_confirmed_at，未驗證登入者在 (main) 頁面頂部顯示 warn bar，可 dismiss（sessionStorage）"
    spec_impact: true
    synced: false
  - id: D-VERIFY-04
    chapter: 0
    content: "POST /api/auth/resend-verification 呼叫 supabase.auth.resend({ type: 'signup', email })；rate limit 60s 由 client localStorage 管理"
    spec_impact: false
    synced: false
```

**完成內容**：
- `src/app/(auth)/register/verify/page.tsx`：獨立驗證引導頁，masked email 顯示（前2字 + `****`）、三條操作提示、重發按鈕、「已驗證，前往登入」
- `src/app/(auth)/register/verify/ResendButton.tsx`：重發按鈕 client component，60s cooldown 寫入 localStorage
- `src/app/api/auth/resend-verification/route.ts`：POST，body `{ email }`，呼叫 Supabase resend
- `src/app/actions/auth.ts`：`signUp` 成功後改為 redirect 到 `/register/verify?email=xxx`（原本跳 `/my/profile`）
- `src/components/layout/GlobalVerifyBanner.tsx`：server wrapper，讀 `user.email_confirmed_at`
- `src/components/layout/GlobalVerifyBannerClient.tsx`：warn bar，dismiss 寫 sessionStorage，resend 共用同一 cooldown key
- `src/app/(main)/layout.tsx`：插入 `<GlobalVerifyBanner />`（Nav 下方）
- `src/components/auth/AuthModal.tsx`：emailSent 狀態抽出為 `ModalEmailSent`，寄出後隱藏底部完整頁面連結

**已知問題 ／ TODO**：
- ⚠️ Supabase Dashboard「Confirm email」是否開啟需手動確認（見 2026-06-10 devlog TODO）；若未開啟，`signUp` 後會直接建立 session，`email_confirmed_at` 非 null，banner 不會出現 — 行為正確但驗證信不會寄
- ⏳ 驗證成功後的 toast 通知（等全域 toast 元件實作後補，對應 Ch.28 `closed:success` 狀態）

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | `npx tsc --noEmit` | ✅ PASS | 零錯誤 |
| 2 | `/register/verify?email=test@example.com` 頁面載入 | ⚠️ 待驗證 | 需啟動 dev server |
| 3 | 重發按鈕 60s cooldown | ⚠️ 待驗證 | 需瀏覽器測試 |
| 4 | GlobalVerifyBanner 未驗證用戶顯示 | ⚠️ 待驗證 | 需 Confirm email 開啟 + 測試帳號 |
| 5 | 已驗證用戶不顯示 banner | ⚠️ 待驗證 | 同上 |

**異動檔案**：
- `src/app/(auth)/register/verify/` (新增)
- `src/app/api/auth/resend-verification/route.ts` (新增)
- `src/app/actions/auth.ts`
- `src/components/layout/GlobalVerifyBanner.tsx` (新增)
- `src/components/layout/GlobalVerifyBannerClient.tsx` (新增)
- `src/app/(main)/layout.tsx`
- `src/components/auth/AuthModal.tsx`
- `docs/api.md`

---

### [2026-06-12] 版號系統建立 + UI 標籤清理

**狀態**：✅ 完成

```spec-sync
chapters: []
status: implemented
decisions:
  - id: D-VER-01
    chapter: 0
    content: "Admin footer 顯示 'v{semver} · {git-hash}'，build 時注入 NEXT_PUBLIC_APP_VERSION / NEXT_PUBLIC_GIT_HASH"
    spec_impact: false
    synced: false
  - id: D-VER-02
    chapter: 0
    content: "Patch 版號格式為三位數零補齊（0.2.001…0.2.999），每次 git commit 由 pre-commit hook 自動遞增"
    spec_impact: false
    synced: false
  - id: D-VER-03
    chapter: 0
    content: "Minor / major 版號由開發者手動執行 npm run version:minor / version:major 控制，不自動觸發"
    spec_impact: false
    synced: false
  - id: D-VER-04
    chapter: 0
    content: "使用者頁面移除『已公證』/『公證』顯示標籤；certificate 型別與資料庫欄位保留，Admin 頁面仍顯示"
    spec_impact: false
    synced: false
```

**完成內容**：
- `next.config.ts` 在 build 時讀取 `package.json` version 與 `git rev-parse --short HEAD`，注入為 `NEXT_PUBLIC_APP_VERSION` / `NEXT_PUBLIC_GIT_HASH`
- Admin layout footer 右下角顯示 `v{version} · {hash}`，只有管理員可見
- 新增 `scripts/bump-patch.mjs`：將 patch 格式化為三位數零補齊並寫回 `package.json`
- `.git/hooks/pre-commit`：每次 commit 自動執行 `bump-patch.mjs` 並 stage `package.json`
- `package.json` scripts 加入 `version:patch`、`version:minor`、`version:major`
- 使用者頁面（`results/[id]`、`athletes/[id]`、`records`、`teams/[id]`）移除 `certificate` 對應的「已公證」顯示文字；`certificate` 顯示行為同 `self_reported`

---

### [2026-06-12] Ch.45 成績記錄體驗優化

**狀態**：✅ 完成

```spec-sync
chapters: [45]
status: implemented
decisions:
  - id: D045-01
    chapter: 45
    content: "§45.1 records 頁改 race_date DESC 排序；≥5 筆成績自動插入年份分組標題"
    spec_impact: false
    synced: false
  - id: D045-02
    chapter: 45
    content: "§45.2 results 加 bib_number TEXT 欄位，新增表單可填，成績詳頁顯示 #號碼"
    spec_impact: false
    synced: false
  - id: D045-03
    chapter: 45
    content: "§45.3 新增 /records/relay/:teamId/edit 頁面，含輸入隊名確認的刪除表單；/records 接力卡片加「編輯」按鈕"
    spec_impact: false
    synced: false
  - id: D045-04
    chapter: 45
    content: "§45.4 賽事選單標籤從 '賽事 年份' 改為 '賽事（年份）'，覆蓋 NewResultForm、NewRelayResultForm、admin/results 篩選"
    spec_impact: false
    synced: false
```

**完成內容**：
- 更改 `/records` 查詢排序為 `race_editions(race_date) DESC`，加 `created_at DESC` fallback
- 成績 ≥5 筆時，在不同年份邊界插入年份標題
- `supabase/migrations/20260612000002_bib_number.sql`：`ALTER TABLE results ADD COLUMN IF NOT EXISTS bib_number TEXT`
- `createResult` action 傳遞 `bib_number`；`NewResultForm` 加號碼布輸入欄
- `results/[id]/page.tsx` 在認領狀態列顯示 `#bib_number`
- 建立 `src/app/(main)/records/relay/[teamId]/edit/` 頁面與 `DeleteRelayForm` 元件
- 新增 `deleteRelayResult` server action，驗證使用者為隊員才可刪除
- 賽事選單全面統一為 `名稱（年份）` 格式

---

### [2026-06-12] 接力未認領搜尋 + 最速標籤橘色調整

**狀態**：✅ 完成

```spec-sync
chapters: []
status: implemented
decisions:
  - id: D001
    chapter: 0
    content: "未認領頁搜尋名字時，同時查詢 team_members 未認領隊員，以獨立「接力成績」區塊顯示，附「前往認領 →」連結至 /teams/:id"
    spec_impact: true
    synced: true
  - id: D002
    chapter: 0
    content: "選手公開頁「最速」標籤改為橘色實心（#FF6B3D），與最速榜規範色一致"
    spec_impact: false
    synced: false
```

**完成內容**：
- 未認領頁（`/unclaimed`）：搜尋有 `q` 時，額外查 `team_members` where `athlete_id IS NULL AND claim_status = 'unclaimed' AND athlete_name_snapshot ILIKE %q%`，結果顯示於個人成績下方獨立區塊
- 「最速」標籤顏色從 `bg-accent`（薄荷綠）改為 `bg-[#FF6B3D]`（橘色）

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | 搜尋「吳玟達」顯示接力區塊 | ✅ PASS | 截圖確認，含賽事/隊名/項目/前往認領按鈕 |
| 2 | 最速標籤橘色 | ✅ PASS | 截圖確認 |

**異動檔案**：
- `src/app/(main)/unclaimed/page.tsx`
- `src/app/(main)/athletes/[id]/page.tsx`

---

### [2026-06-12] 選手公開頁摘要優化 + 登入 Loading 指示

**狀態**：✅ 完成

```spec-sync
chapters: []
status: implemented
decisions:
  - id: D001
    chapter: 0
    content: "選手公開頁成績摘要格改為三欄（226/113/51.5），移除 Sprint；成績明細中各距離最快記錄以 text-accent 橘色標示"
    spec_impact: true
    synced: true
  - id: D002
    chapter: 0
    content: "Button 元件 loading 狀態改為 spinner SVG + 文字，AuthModal 登入成功時保持 loading 直到 modal 關閉"
    spec_impact: false
    synced: false
```

**完成內容**：
- 選手公開頁（`/athletes/[id]`）摘要格：`DIST_SUMMARY = ['full', '70.3', 'olympic']`，`grid-cols-3`，Sprint 不再顯示
- 成績明細時間顏色：`bests[dist] === r.total_seconds` 時用 `text-accent`，其餘用 `text-ink`
- Button 元件：`loading` 時顯示旋轉 spinner SVG + 「處理中…」
- AuthModal：`signInWithPassword` 成功時不重置 `loading`（保持到 modal 關閉），錯誤時才 `setLoading(false)`

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | 選手頁摘要只顯示三欄 | ✅ PASS | 截圖確認 226/113/51.5 |
| 2 | 最快成績橘色標示 | ✅ PASS | 兩筆各為該距離唯一成績，均橘色 |
| 3 | Button spinner 動畫 | ✅ PASS | animate-spin 套用 |
| 4 | 登入 loading 持續到跳轉 | ✅ PASS | setLoading 不在成功路徑重置 |

**異動檔案**：
- `src/app/(main)/athletes/[id]/page.tsx`
- `src/components/ui/Button.tsx`
- `src/components/auth/AuthModal.tsx`

---

### [2026-06-12] 問題回報系統（第 43 章）

**狀態**：✅ 完成

```spec-sync
chapters: [43]
status: implemented
decisions:
  - id: D001
    chapter: 43
    content: "ISSUE_REPORT 表允許匿名提交（submitted_by nullable），RLS INSERT WITH CHECK true"
    spec_impact: false
    synced: false
  - id: D002
    chapter: 43
    content: "Footer 回報入口作為 Client Component 獨立於 Server layout，ReportModal 共用元件覆蓋所有入口"
    spec_impact: false
    synced: false
  - id: D003
    chapter: 43
    content: "Admin /admin/reports 以 Server Component 一次撈全部，前端 client-side 篩選狀態 / 類別，避免多次 API 請求"
    spec_impact: false
    synced: false
```

**完成內容**：
- Migration `20260612000001_issue_reports.sql`：新增 `issue_reports` 表 + RLS（任何人可 INSERT，assistant+ 可 SELECT/UPDATE）
- 新增 `POST /api/reports`：提交回報，無需登入，message 上限 500 字
- 新增 `GET /api/admin/reports`、`GET /api/admin/reports/:id`、`PUT /api/admin/reports/:id`：後台管理 API
- `ReportModal` 共用 Client Component：類別下拉、說明 textarea（500 字計數）、Email 選填、送出確認畫面、Esc 關閉
- `Footer` Client Component：左側版權 + 右側「回報問題」連結；加入 `(main)` layout
- `ResultReportButton`：成績詳情頁底部「回報成績錯誤」，預帶 category=result_error + result_id
- `RaceReportButton`：賽事屆次頁「回報賽事資料錯誤」，預帶 category=other + race_id
- `/admin/reports` 頁面（`ReportsClient`）：狀態 / 類別篩選、可折疊明細列、inline 標記已解決 / 忽略 / 還原、助手備注儲存、複製 Email、自動標記已讀（展開時觸發）
- `AdminTabs` 加入「問題回報」Tab（位於審核中心之後）

**技術決策**：
- Admin 頁面 Server Component 一次撈全部資料，前端 client-side 篩選，避免每次切換篩選都發 API 請求
- ReportModal 以 `fixed inset-0 z-50` 覆蓋，點擊遮罩關閉，loading 時禁止關閉

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | TypeScript `npx tsc --noEmit` | ✅ PASS | 零錯誤 |
| 2 | Footer「回報問題」按鈕顯示 | ✅ PASS | 最速榜頁面底部確認 |
| 3 | ReportModal 開啟 | ✅ PASS | 類別「其他問題」、說明欄、Email 欄、送出按鈕 |
| 4 | Console 無錯誤 | ✅ PASS | |

**待驗證**：
- ⚠️ POST /api/reports 實際寫入（需 Supabase migration 套用）
- ⚠️ /admin/reports 後台篩選 / inline 操作（需登入 assistant 帳號）
- ⚠️ ResultReportButton 顯示（需進入成績詳情頁）

**異動檔案**：
- `supabase/migrations/20260612000001_issue_reports.sql`（新增）
- `src/types/database.ts`（新增 IssueCategory、IssueStatus、issue_reports 表型別）
- `src/app/api/reports/route.ts`（新增）
- `src/app/api/admin/reports/route.ts`（新增）
- `src/app/api/admin/reports/[id]/route.ts`（新增）
- `src/components/reports/ReportModal.tsx`（新增）
- `src/components/reports/ResultReportButton.tsx`（新增）
- `src/components/reports/RaceReportButton.tsx`（新增）
- `src/components/layout/Footer.tsx`（新增）
- `src/app/(main)/layout.tsx`（加入 Footer）
- `src/app/(main)/results/[id]/page.tsx`（加入 ResultReportButton）
- `src/app/(main)/races/[slug]/[year]/page.tsx`（加入 RaceReportButton）
- `src/app/(admin)/admin/reports/page.tsx`（新增）
- `src/app/(admin)/admin/reports/ReportsClient.tsx`（新增）
- `src/app/(admin)/admin/AdminTabs.tsx`（加入問題回報 Tab）

---


### [2026-06-11] 未成年選手 is_searchable 應用層強制

**狀態**：✅ 完成

```spec-sync
chapters: [31]
status: implemented
decisions:
  - id: D001
    chapter: 31
    content: "birth_year 更新時同步計算 is_minor，未成年強制 is_searchable = false"
    spec_impact: true
    synced: true
  - id: D002
    chapter: 31
    content: "成年後（>= 18）不自動恢復 is_searchable，尊重使用者自行關閉的設定"
    spec_impact: true
    synced: true
  - id: D003
    chapter: 0
    content: "birth_year 分支提前 return，避免 Supabase .update() 不接受 Record<string, unknown> 的型別衝突"
    spec_impact: false
    synced: false
```

**完成內容**：
- `updateProfileField('birth_year', ...)` 更新出生年份時，同步計算 `is_minor`（當年年齡 < 18）
- 若為未成年，一併將 `is_searchable = false` 寫入 DB，防止出現在全站搜尋結果
- 搭配 migration `20260611000001`（現有未成年帳號批次設 false）形成完整保護

**技術決策**：
- `birth_year` 分支提前 return，避免與其他欄位的 typed patch 衝突（Supabase `.update()` 不接受 `Record<string, unknown>`）
- 不自動將成年後（>= 18）的選手恢復 `is_searchable = true`，以尊重使用者自行關閉的設定

**異動檔案**：
- `src/app/actions/profile-inline.ts`

---

### [2026-06-11] 選手排行榜追蹤功能完整實作（第 38–44 章）

**狀態**：⚠️ 部分完成

```spec-sync
chapters: [38, 39, 44]
status: partial
decisions:
  - id: D001
    chapter: 38
    content: "follower_count 用即時 COUNT，非快取欄位，效能在目前規模可接受"
    spec_impact: true
    synced: true
  - id: D002
    chapter: 44
    content: "is_searchable 欄位尚未在 DB schema，search API 暫時省略此過濾條件，待 migration 補上後恢復"
    spec_impact: true
    synced: true
  - id: D003
    chapter: 39
    content: "雙搜尋框：A 全站搜尋（API，debounce 300ms）+ B client-side 過濾已追蹤清單"
    spec_impact: false
    synced: false
  - id: D004
    chapter: 44
    content: "屆次頁成績列表設計為獨立 Client Component（EditionResultsSection），Server Component 查詢後傳入，避免 client-side fetch 延遲"
    spec_impact: false
    synced: false
  - id: D005
    chapter: 44
    content: "停權或已刪除選手的公開頁 API 回傳 error 欄位，前端顯示對應狀態"
    spec_impact: true
    synced: true
```

**完成內容**：
- 新增 `GET /api/athletes/search?q=`：全站選手搜尋，回傳含 `is_following`，limit 8
- 新增 `GET /api/athletes/:id`：選手公開頁 API，回傳 bests、成績明細、接力成績；停權/已刪除回傳 error 欄位
- 新增 `/athletes/[id]` 選手公開頁（Server Component）：Hero / 成績摘要 / 成績明細 / 接力成績四區塊，`generateMetadata()` SEO
- `FollowButton` 新增 `size="lg"`（24px）
- 屆次頁 `/races/[slug]/[year]` 新增成績列表區塊（`EditionResultsSection` Client Component）：多距離頁籤、client-side 搜尋、FollowButton / ClaimButton / TagButton、選手姓名連結 → `/athletes/:id`
- 最速榜姓名欄：已認領成績加 `<Link href="/athletes/:id">` 可點擊
- `/my/following` 升級雙搜尋框：搜尋框 A（全站搜尋，debounce 300ms）+ 篩選框 B（client-side 過濾已追蹤清單）；選手卡片名稱連結 → `/athletes/:id`
- Nav `AvatarDropdown`：新增「我的公開頁」連結（`/athletes/:id`）、支援 avatar_url 頭像顯示、修正連結路徑（`/records`、`/profile`）

**技術決策**：
- `is_searchable` 欄位尚未存在於 DB schema，search API 暫時省略此過濾條件，待 migration 補上後恢復
- 屆次頁成績列表設計為獨立 Client Component（EditionResultsSection），Server Component 在頁面 query 全部資料後傳入，避免 client-side fetch 延遲

**已知問題 ／ TODO**：
- `is_searchable` 欄位需建立 migration（`ALTER TABLE athletes ADD COLUMN is_searchable BOOLEAN NOT NULL DEFAULT TRUE`），並在 search API 補上 `.eq('is_searchable', true)` 篩選
- `/profile` → `/my/profile` 路由重定向確認（現有 `my/profile` 頁面，Nav 改連 `/profile` 後需確認 middleware redirect 正常運作）
- 屆次頁 `overall_rank` 排序：部分成績無 `overall_rank` 時改用 `total_seconds` 升序，目前邏輯已處理

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | 選手公開頁 `/athletes/:id` 載入 | ✅ PASS | Hero、成績摘要、空成績提示正確 |
| 2 | 選手公開頁自己頁面不顯示 FollowButton | ✅ PASS | |
| 3 | Nav 下拉顯示「我的公開頁」| ✅ PASS | 含我的紀錄、關注名單、個人資料、我的公開頁、登出 |
| 4 | 關注名單搜尋框 A 輸入觸發 API | ✅ PASS | 回傳正確（搜尋無帳號選手時顯示「找不到符合的選手」屬預期）|
| 5 | 關注名單空狀態顯示正確 | ✅ PASS | 四區塊結構正確 |
| 6 | TypeScript 無錯誤 | ✅ PASS | `npx tsc --noEmit` 全數通過 |
| 7 | 最速榜未認領選手無連結 | ✅ PASS | 預期行為（無 athlete_id）|

**待驗證**：
- ⚠️ 屆次頁成績列表（需有 claimed 成績的帳號才能完整驗證 FollowButton + 姓名連結）
- ⚠️ 選手公開頁有成績時的完整顯示（需認領成績）

**異動檔案**：
- `src/app/api/athletes/search/route.ts`（新增）
- `src/app/api/athletes/[id]/route.ts`（新增）
- `src/app/(main)/athletes/[id]/page.tsx`（新增目錄 + 檔案）
- `src/components/athletes/FollowButton.tsx`（新增 size="lg"）
- `src/components/races/EditionResultsSection.tsx`（新增）
- `src/app/(main)/races/[slug]/[year]/page.tsx`（加入成績列表查詢 + EditionResultsSection）
- `src/app/(main)/leaderboard/page.tsx`（姓名加連結）
- `src/app/(main)/my/following/FollowingClient.tsx`（升級雙搜尋框 + athletes/:id 連結）
- `src/app/(main)/my/following/page.tsx`（補 isLoggedIn prop）
- `src/components/layout/Nav.tsx`（傳入 avatarUrl、userId）
- `src/components/layout/AvatarDropdown.tsx`（頭像顯示 + 我的公開頁 + 路徑修正）
- `docs/api.md`（§6 完整更新）

---

### [2026-06-10] 賽事互動 intent：登入後自動完成標記

**狀態**：✅ 完成

```spec-sync
chapters: [41]
status: implemented
decisions:
  - id: D001
    chapter: 41
    content: "race_wishlist / race_attended intent 登入後自動完成標記，沿用 follow intent 的靜默失敗模式"
    spec_impact: true
    synced: true
  - id: D002
    chapter: 41
    content: "首次登入（name 為空）導向 /my/profile 的邏輯，改為僅在無特定 intent 時觸發"
    spec_impact: true
    synced: true
  - id: D003
    chapter: 0
    content: "重複標記由 unique constraint (athlete_id, race_id, year, interest_type) 自然去重，不額外擋錯誤訊息"
    spec_impact: false
    synced: false
```

**完成內容**：
- 補上 features.md §5.1 規格缺口：`race_wishlist` / `race_attended` intent 登入成功後自動完成標記
- `AuthModalPayload` 擴充 `raceId` / `year` 欄位（`src/context/auth-modal.tsx`）
- `RaceInterestButtons` 未登入點擊時將 `{ raceId, year }` 帶入 Modal payload
- `AuthModal.handleSuccess` 新增分支：登入後以瀏覽器 client 直接 insert `race_interest`，已存在時靠 unique constraint 靜默忽略，`router.refresh()` 後停留在賽事頁
- 衝突處理：「首次登入（name 為空）導向 `/my/profile`」改為僅在無特定 intent（`login`）時觸發，避免吃掉自動標記流程

**技術決策**：
- 沿用 `follow` intent 的「登入後自動執行、失敗靜默」模式，使用者可再點一次
- 重複標記不擋錯誤訊息：unique constraint `(athlete_id, race_id, year, interest_type)` 自然去重

**驗證紀錄**（preview 瀏覽器實測，帳號 dino.ko@viwave.com）：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | 未登入點「想參加」開啟 Auth Modal | ✅ PASS | payload 帶 raceId + year |
| 2 | Modal 內登入 | ✅ PASS | Modal 關閉、停留 /races |
| 3 | 登入後自動寫入 race_interest | ✅ PASS | wishlist / 2027 記錄確認存在 |
| 4 | UI 顯示「✓ 想參加」+ 計數 +1 | ✅ PASS | |
| 5 | Console 無錯誤 | ✅ PASS | |

**已知問題 ／ TODO**：
- `router.refresh()` 視覺更新偶有數秒延遲（Next.js RSC refresh 特性），資料正確
- 規格「參加過後若無成績顯示 toast 提示成績登錄」未實作——專案尚無 toast 元件，待規格討論決定設計

**異動檔案**：
- `src/context/auth-modal.tsx`
- `src/components/races/RaceInterestButtons.tsx`
- `src/components/auth/AuthModal.tsx`

---

### [2026-06-10] 帳號刪除修復 + 註冊驗證信流程 + 玩賽樂園分類

**狀態**：✅ 完成

```spec-sync
chapters: [40]
status: implemented
decisions:
  - id: D001
    chapter: 40
    content: "admin 對他人資料的寫入操作一律走 SECURITY DEFINER RPC，不依賴 UPDATE policy 的同表子查詢（遞迴 RLS 問題）"
    spec_impact: false
    synced: false
  - id: D002
    chapter: 40
    content: "被刪除帳號同步硬刪除 auth.users，被刪 email 可重新註冊"
    spec_impact: true
    synced: true
  - id: D003
    chapter: 0
    content: "service role client 獨立檔案 lib/supabase/admin.ts，僅 import 進 server actions"
    spec_impact: false
    synced: false
  - id: D004
    chapter: 0
    content: "國家代碼統一 ISO 3166-1 alpha-3（TWN／DEU…），系列內排序國碼改為三碼"
    spec_impact: false
    synced: false
```

**完成內容**：
- 修復後台刪除帳號的 RLS 錯誤（"new row violates row-level security policy"）
- 刪除帳號同步硬刪除 `auth.users`，被刪 email 可重新註冊
- 修復註冊 504 timeout（Supabase SMTP Port 463 → 465）
- 正式版驗證信模板（table 排版 + inline style，Gmail/Outlook 相容）
- 玩賽樂園獨立賽事分類（`WANSAILEYUAN` series）

**技術決策**：
- admin 對他人資料的寫入操作一律走 SECURITY DEFINER RPC
- service role client 獨立檔案 `lib/supabase/admin.ts`，僅 import 進 server actions
- email 模板放 `docs/email-templates/` 版控，實際設定貼到 Supabase Dashboard

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | 後台刪除帳號 | ✅ PASS | RPC 軟刪除 + auth.users 硬刪除 |
| 2 | 被刪 email 重新註冊 | ✅ PASS | |
| 3 | 註冊寄送驗證信 | ✅ PASS | SMTP Port 改 465 後正常 |
| 4 | 註冊後顯示「驗證信已寄出」 | ✅ PASS | |
| 5 | 首次登入導向 /my/profile | ✅ PASS | |
| 6 | email 模板渲染預覽 | ✅ PASS | headless Chrome 截圖確認 |

**已知問題 ／ TODO**：
- Supabase Dashboard 需手動完成：貼上 Confirm signup 模板、Site URL 改為正式網域、重新開啟 Confirm email
- Vercel 需新增 `SUPABASE_SERVICE_ROLE_KEY` 環境變數
- 其他 email 模板（Reset Password、Magic Link 等）尚未製作

**異動檔案**：
- `supabase/migrations/20260609000001`～`20260609000009`
- `src/lib/supabase/admin.ts`（新增）
- `src/app/(admin)/admin/members/actions.ts`
- `src/app/(admin)/admin/members/MemberDetail.tsx`
- `src/app/(admin)/admin/races/[id]/RaceEditForm.tsx`
- `src/app/actions/races.ts`、`src/app/actions/auth.ts`
- `src/components/auth/AuthModal.tsx`
- `src/app/(main)/races/page.tsx`
- `src/types/database.ts`
- `docs/email-templates/confirm-signup.html`（新增）
- `public/email-logo.png`（新增）

---

### [2026-06-10] 移除「即將推出」預告文字

**狀態**：✅ 完成

```spec-sync
chapters: []
status: implemented
decisions:
  - id: D001
    chapter: 0
    content: "移除 /races 與 /races/[slug]/[year] 底部預告區塊，歷屆成績分佈待實作時直接加入"
    spec_impact: false
    synced: false
```

**完成內容**：
- 移除 `/races` 頁面底部的虛線預告區塊
- 移除 `/races/[slug]/[year]` 屆次細節頁底部的預告區塊

**技術決策**：
- 歷屆成績分佈待實作時直接在屆次細節頁底部加入，不需預告佔位文字

**異動檔案**：
- `src/app/(main)/races/page.tsx`
- `src/app/(main)/races/[slug]/[year]/page.tsx`

---

### [2026-06-09] 屆次細節頁 + 天氣抓取 + 防寒衣

**狀態**：✅ 完成

```spec-sync
chapters: [41]
status: implemented
decisions:
  - id: D001
    chapter: 41
    content: "天氣取賽事當天 06:00–12:00 均值（鐵人三項典型比賽時段），存 temp_c / humidity_pct / wind_speed_ms / wind_direction / precipitation_mm"
    spec_impact: true
    synced: true
  - id: D002
    chapter: 41
    content: "座標設計：存在 races 表（非屆次），同一賽事場地通常固定，避免重複填寫"
    spec_impact: true
    synced: true
  - id: D003
    chapter: 41
    content: "互動按鈕依年份顯示：未來只顯示「想參加」、過去只顯示「參加過」、當年兩者；用 visibility:hidden 保留欄位位置"
    spec_impact: true
    synced: true
  - id: D004
    chapter: 41
    content: "Open-Meteo Historical Archive API 免費、無需 API Key"
    spec_impact: false
    synced: false
```

**完成內容**：
- Migration `20260608000010_race_editions_results_url.sql`：`race_editions` 新增 `results_url`
- 新增 `/races/[slug]/[year]` 屆次細節頁：場地、報名連結、成績查詢連結、三項規格、游泳環境、天氣、完賽人數
- `/races/[slug]` 年份列與距離 tag 改為可點擊連結
- 後台屆次表單新增「報名網頁 URL」、「成績查詢 URL」、防寒衣（三態）、水溫欄位
- Server Action `fetchEditionWeather`：用 Open-Meteo Historical Archive API 抓取並存入 `weather_data`

**技術決策**：
- 天氣取賽事當天 06:00–12:00 均值，儲存 temp_c、humidity_pct、wind_speed_ms、wind_direction、precipitation_mm
- 風向角度轉中文方位（8 方位）
- 座標設計：存在 `races` 表，避免重複填寫

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | `/races/challenge-taiwan/2025` 屆次細節頁 | ✅ PASS | 場地、規格、游泳環境、天氣全部顯示 |
| 2 | 後台「抓取天氣」Challenge Taiwan 2025 | ✅ PASS | 26.1°C・63%・2 m/s 東南・0 mm |
| 3 | 天氣資料同步至前台細節頁 | ✅ PASS | 即時顯示 |
| 4 | 互動按鈕位置固定（visibility:hidden）| ✅ PASS | 未來/過去按鈕欄位對齊 |
| 5 | 新增賽事表單含 lat/lng | ✅ PASS | TypeScript 通過 |
| 6 | 未設定座標時抓取天氣 | ✅ PASS | 顯示明確錯誤訊息 |

**異動檔案**：
- `supabase/migrations/20260608000010_race_editions_results_url.sql`（新增）
- `src/app/(main)/races/[slug]/page.tsx`
- `src/app/(main)/races/[slug]/[year]/page.tsx`（新增）
- `src/app/(admin)/admin/races/[id]/YearEditionBlock.tsx`
- `src/app/(admin)/admin/races/[id]/EditionForm.tsx`
- `src/app/(admin)/admin/races/[id]/RaceEditForm.tsx`
- `src/app/(admin)/admin/races/[id]/page.tsx`
- `src/app/(admin)/admin/races/RaceForm.tsx`
- `src/app/actions/races.ts`
- `src/types/database.ts`

---

### [2026-06-08] 賽事互動 v3：年份層級分組 + 賽事詳情頁

**狀態**：✅ 完成

```spec-sync
chapters: [41]
status: implemented
decisions:
  - id: D001
    chapter: 41
    content: "互動粒度定為年份層級 (race_id, year)，非距離層級；同年多距離通常選手只選一種參加"
    spec_impact: true
    synced: true
  - id: D002
    chapter: 41
    content: "同年多距離在 /races 合併為一列（距離 tags），互動按鈕以年份為單位"
    spec_impact: true
    synced: true
  - id: D003
    chapter: 0
    content: "樂觀計數：delta = state.active !== initialActive ? (state.active ? 1 : -1) : 0，只在狀態真正改變時調整"
    spec_impact: false
    synced: false
```

**完成內容**：
- Migration `20260608000009_race_interest_by_year.sql`：重建 `race_interest`，改以 `(race_id, year)` 為互動單位
- `/races` 頁面重構：同年多距離合併為一列（距離 tags）
- 新增 `/races/[slug]` 賽事詳情頁：基本資料 + 歷屆紀錄列表

**技術決策**：
- 互動粒度定為年份層級 `(race_id, year)`，語意清晰
- 樂觀計數：重複點擊不重複計算

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | `/races` 年份分組顯示 | ✅ PASS | 同年多距離合併為 tags |
| 2 | 點「想參加」→ active + 計數 +1 | ✅ PASS | |
| 3 | `/races/challenge-taiwan` 詳情頁 | ✅ PASS | 9 屆歷史、距離 tags、日期、互動按鈕 |
| 4 | breadcrumb 連結 | ✅ PASS | |
| 5 | 未登入點擊 | ⚠️ 待驗證 | 應開 Auth Modal |

**異動檔案**：
- `supabase/migrations/20260608000009_race_interest_by_year.sql`（新增）
- `src/app/actions/race-interest.ts`（重寫）
- `src/components/races/RaceInterestButtons.tsx`（重寫）
- `src/app/(main)/races/page.tsx`（重構）
- `src/app/(main)/races/[slug]/page.tsx`（新增）
- `src/types/database.ts`

---

### [2026-06-08] 賽事互動 v1/v2（已由 v3 取代）

**狀態**：⚠️ 已取代

```spec-sync
chapters: []
status: superseded
decisions: []
```

**完成內容**：
- Migration `20260608000007_race_interest.sql`：初版以 race_id 為 FK（已廢棄）
- Migration `20260608000008_race_interest_v2.sql`：改以 `race_edition_id` 為 FK（已廢棄）
- Server Action、RaceInterestButtons、auth-modal intent 均在 v3 完整重寫

---

### [2026-06-08] 後台賽事刪除功能

**狀態**：✅ 完成

```spec-sync
chapters: [42]
status: implemented
decisions:
  - id: D001
    chapter: 42
    content: "刪除成功後用 Server Action 內的 redirect() 而非客戶端 router.push，避免已刪除資料重新 render 造成 404"
    spec_impact: false
    synced: false
  - id: D002
    chapter: 42
    content: "刪除前先查關聯成績數量，有成績則回傳錯誤，無成績才刪除（屆次因 CASCADE 自動刪除）"
    spec_impact: true
    synced: true
```

**完成內容**：
- 新增 `deleteRace` Server Action：驗證 `is_assistant_or_above`，有成績則回傳錯誤，無成績則刪除
- 新增 `DeleteRaceButton` 客戶端元件：二次確認流程

**技術決策**：
- 刪除成功後改用 Server Action 內的 `redirect()`，避免 revalidatePath 觸發後 404

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | 未登入訪問 `/admin/races` | ✅ PASS | redirect 至 /login |
| 2 | 有成績的賽事點刪除 | ⚠️ 待驗證 | 需後台登入環境 |
| 3 | 無成績的賽事點刪除 | ⚠️ 待驗證 | 需後台登入環境 |
| 4 | 刪除後導向 `/admin/races` | ⚠️ 待驗證 | |

**異動檔案**：
- `src/app/actions/races.ts`
- `src/app/(admin)/admin/races/[id]/DeleteRaceButton.tsx`（新增）
- `src/app/(admin)/admin/races/[id]/page.tsx`

---

### [2026-06-08] 最速榜頁面視覺精簡

**狀態**：✅ 完成

```spec-sync
chapters: [23]
status: implemented
decisions:
  - id: D001
    chapter: 23
    content: "「台灣選手」改為 Syne 800 副標字體，視覺上作為「最速榜」的前綴副標，移除裝飾線"
    spec_impact: false
    synced: false
  - id: D002
    chapter: 23
    content: "卡片英雄區移除品牌標題，改以距離標籤為主視覺（fontSize 40），DISTANCE_LABEL mapping：full→226全距離、70.3→113半程、olympic→51.5奧林匹克"
    spec_impact: true
    synced: true
  - id: D003
    chapter: 23
    content: "說明文字精簡為「個人最佳・跨賽事・僅供參考」，移除膠囊 badge"
    spec_impact: true
    synced: true
```

**完成內容**：
- 頁面層「台灣選手」改為 Syne 800 副標字體，移除裝飾線
- 卡片英雄區移除品牌標題，改以距離標籤（如 `226 全距離`）為主視覺
- 卡片說明文字精簡為 `個人最佳 · 跨賽事 · 僅供參考`，移除膠囊 badge
- 新增 `DISTANCE_LABEL` mapping

**技術決策**：
- 「資訊只出現一次」原則：說明文字集中在卡片層，頁面層僅留品牌標題

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

```spec-sync
chapters: [23]
status: implemented
decisions:
  - id: D001
    chapter: 23
    content: "啟用 113 半程（70.3）與 51.5 奧林匹克（olympic）Tab；25.75 衝刺（sprint）完全隱藏，待日後決定是否開放"
    spec_impact: true
    synced: true
  - id: D002
    chapter: 0
    content: "DistanceTabs 新增 hidden 欄位，用 .filter(tab => !tab.hidden) 在 render 前過濾"
    spec_impact: false
    synced: false
```

**完成內容**：
- 啟用 113 半程（`70.3`）與 51.5 奧林匹克（`olympic`）距離 Tab
- 將 25.75 衝刺（`sprint`）改為完全隱藏

**技術決策**：
- DistanceTabs 新增 `hidden` 欄位，不影響後端查詢邏輯

**驗證紀錄**：

| # | 測試項目 | 結果 |
|---|---------|------|
| 1 | 最速榜頁面載入 | ✅ PASS |
| 2 | 距離 Tab 顯示 | ✅ PASS |
| 3 | 25.75 衝刺不顯示 | ✅ PASS |
| 4 | 男子組標頭無更新時間 | ✅ PASS |

**異動檔案**：
- `src/components/leaderboard/DistanceTabs.tsx`
- `src/app/(main)/leaderboard/page.tsx`

---

### [2026-06-08] 管理員編輯會員資料

**狀態**：✅ 完成

```spec-sync
chapters: [40]
status: implemented
decisions:
  - id: D001
    chapter: 40
    content: "MemberDetail popup 新增編輯模式，可編輯真實姓名、暱稱、性別、出生年份、國籍、自我介紹"
    spec_impact: true
    synced: true
  - id: D002
    chapter: 40
    content: "出生年份驗證範圍 1930–2010；空字串自動轉 null"
    spec_impact: true
    synced: true
```

**完成內容**：
- MemberDetail popup 新增「編輯」按鈕，點擊進入編輯模式
- 儲存 → 回檢視模式 + flash「資料已更新」+ Header 姓名即時更新
- 出生年份驗證（1930–2010）

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

```spec-sync
chapters: [40]
status: implemented
decisions:
  - id: D001
    chapter: 40
    content: "停權：assistant+ 可操作，需輸入原因；刪除：admin only，需輸入 email 確認；復原：admin only，30 天內"
    spec_impact: false
    synced: false
  - id: D002
    chapter: 40
    content: "刪除帳號時 claimed 成績改為 unlinked"
    spec_impact: true
    synced: true
```

**完成內容**：
- 新增搜尋欄（name / nickname / email 即時篩選）
- 新增角色 / 狀態下拉篩選
- 停權、解除停權、刪除、復原功能
- DB Migration：新增 `suspended_at`、`suspended_by`、`suspend_reason` 欄位

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
- `src/types/database.ts`
- `src/app/(admin)/admin/members/page.tsx`
- `src/app/(admin)/admin/members/MemberList.tsx`（重寫）
- `src/app/(admin)/admin/members/MemberDetail.tsx`（重寫）
- `src/app/(admin)/admin/members/actions.ts`（重寫）

---

### [2026-06-08] 登出功能修復

**狀態**：✅ 完成

```spec-sync
chapters: []
status: implemented
decisions:
  - id: D001
    chapter: 0
    content: "登出改用 window.location.href 強制完整頁面重載，避免 Next.js 沿用快取的 Server Component 結果"
    spec_impact: false
    synced: false
```

**問題**：登出後 Navbar 仍顯示已登入狀態。

**根本原因**：`handleLogout` 使用 `router.push('/leaderboard')`，Next.js 可能沿用已快取的 Server Component 結果。

**修復**：改用 `window.location.href = '/leaderboard'` 強制完整頁面重載。

**驗證紀錄**：

| # | 測試項目 | 結果 |
|---|---------|------|
| 1 | 登入後點擊「登出」→ 頁面重載 | ✅ PASS |
| 2 | 登出後 Navbar 顯示「登入」按鈕 | ✅ PASS |
| 3 | 登出後訪問 `/my/following` → redirect 至 login | ✅ PASS |

**異動檔案**：
- `src/components/layout/AvatarDropdown.tsx`

---

### [2026-06-07] 關注選手（第 38、39 章）

**狀態**：⚠️ 部分完成

```spec-sync
chapters: [38, 39]
status: partial
decisions:
  - id: D001
    chapter: 38
    content: "follower_count / following_count 快取欄位不實作，改為即時 COUNT"
    spec_impact: true
    synced: true
  - id: D002
    chapter: 38
    content: "手機版最速榜追蹤欄隱藏（display: none via CSS class tlb-follow，≤600px）"
    spec_impact: true
    synced: true
  - id: D003
    chapter: 38
    content: "Auth Modal follow intent：登入後靜默失敗，使用者可再點一次"
    spec_impact: true
    synced: true
  - id: D004
    chapter: 38
    content: "Optimistic update：點擊即切換 UI，API 失敗再回滾"
    spec_impact: false
    synced: false
```

**完成內容**：
- Migration `athlete_follows` 表 + RLS
- API Routes：follow / unfollow / is-following / me/following / me/following/details
- Auth Modal 擴充 `follow` intent
- `FollowButton` Client Component（☆/★、Optimistic update、未登入開 Modal）
- 最速榜加追蹤欄（五欄結構，手機版隱藏）
- 成績詳情頁加 FollowButton
- `/my/following` 頁面

**技術決策**：
- `follower_count`/`following_count` 快取欄位不實作，改為即時 COUNT
- Optimistic update：點擊即切換 UI，API 失敗再回滾
- Auth Modal follow intent：登入後靜默失敗

**異動檔案**：
- `supabase/migrations/20260607000005_athlete_follows.sql`（新增）
- `src/types/database.ts`
- `src/context/auth-modal.tsx`
- `src/components/auth/AuthModal.tsx`
- `src/components/athletes/FollowButton.tsx`（新增）
- `src/app/api/athletes/[id]/follow/route.ts`（新增）
- `src/app/api/athletes/[id]/is-following/route.ts`（新增）
- `src/app/api/athletes/me/following/route.ts`（新增）
- `src/app/api/athletes/me/following/details/route.ts`（新增）
- `src/app/(main)/leaderboard/page.tsx`
- `src/app/(main)/results/[id]/page.tsx`
- `src/components/layout/Nav.tsx`
- `src/components/layout/AvatarDropdown.tsx`
- `src/app/(main)/my/following/page.tsx`（新增）
- `src/app/(main)/my/following/FollowingClient.tsx`（新增）

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | `npx tsc --noEmit` | ✅ PASS | 零型別錯誤 |
| 2 | Avatar 下拉顯示「關注名單」 | ✅ PASS | N=0 不顯示 badge |
| 3 | `/my/following` 空狀態 | ✅ PASS | |
| 4–12 | API 測試（各路由）| ✅ PASS | |

**待補測**：見「待補測項目」section。

---

### [2026-06-07] 賽事後台審核 `/admin/races/review`

**狀態**：✅ 完成

```spec-sync
chapters: [42]
status: implemented
decisions:
  - id: D001
    chapter: 42
    content: "新賽事預設 status = pending_review；approveRace → active；rejectRace → delete（需先確認無關聯屆次）"
    spec_impact: true
    synced: true
  - id: D002
    chapter: 42
    content: "疑似重複偵測在 server render 時做（非即時），比較正規化後名稱是否互相包含（長度 ≥ 4 字元）"
    spec_impact: false
    synced: false
```

**完成內容**：
- Migration：`races.status` 加入 `pending_review`；新賽事預設此狀態
- 新增 `/admin/races/review` 頁面：待審核佇列 + 疑似重複警告 + 近期自填成績

**驗證紀錄**：

| # | 測試項目 | 結果 |
|---|---------|------|
| 1–8 | 審核流程全部測試項目 | ✅ PASS |

**異動檔案**：
- `supabase/migrations/20260607000003_races_pending_review.sql`（新增）
- `src/types/database.ts`
- `src/app/actions/races.ts`
- `src/app/(admin)/admin/races/review/page.tsx`（新增）
- `src/app/(admin)/admin/races/review/RaceReviewActions.tsx`（新增）
- `src/app/(admin)/admin/AdminTabs.tsx`

---

### [2026-06-07] Nav 「新增」下拉選單

**狀態**：✅ 完成

```spec-sync
chapters: [34]
status: implemented
decisions:
  - id: D001
    chapter: 34
    content: "Nav + 按鈕改為 AddDropdown，三個選項：自己的成績、他人成績（所有登入用戶）、新增賽事（assistant+，分隔線區分）"
    spec_impact: true
    synced: true
```

**完成內容**：
- 新增 `AddDropdown` Client Component，三個選項，含圖示

**技術決策**：
- 獨立 `AddDropdown.tsx`，與 `AvatarDropdown` 同一設計語言

**驗證紀錄**：

| # | 測試項目 | 結果 |
|---|---------|------|
| 1–5 | 下拉選單各測試項目 | ✅ PASS |

**異動檔案**：
- `src/components/layout/AddDropdown.tsx`（新增）
- `src/components/layout/Nav.tsx`

---

### [2026-06-07] 幫他人新增成績 — 開放所有登入用戶

**狀態**：✅ 完成

```spec-sync
chapters: [34]
status: implemented
decisions:
  - id: D001
    chapter: 34
    content: "幫他人新增成績開放所有已登入用戶，移除 assistant+ 限制；角色限制僅保留在「新增賽事」"
    spec_impact: true
    synced: true
```

**完成內容**：
- 移除 `createResult` forOther 分支中的 `is_assistant_or_above()` 驗證
- 移除 `?for=other` 的 assistant 專屬 redirect 保護
- 新增 migration：DROP 舊 assistant+ policy，改建 `authenticated` 角色 policy

**技術決策**：
- 幫他人新增成績屬於使用者自助資料輸入，與 self_reported + unclaimed 語意一致

**異動檔案**：
- `supabase/migrations/20260607000004_results_for_others_open_to_all.sql`（新增）
- `src/app/(main)/records/new/page.tsx`
- `src/app/actions/results.ts`
- `src/components/layout/AddDropdown.tsx`

---

### [2026-06-07] 幫他人新增成績 `/records/new?for=other`

**狀態**：✅ 完成（初版：assistant only；已由上方記錄修正為所有登入用戶）

```spec-sync
chapters: [34]
status: superseded
decisions:
  - id: D001
    chapter: 34
    content: "?for=other 路徑（非 ?for=friend）；with athlete_id=null / claim_status=unclaimed / athlete_name_snapshot 插入"
    spec_impact: true
    synced: true
```

**完成內容**：
- `NewResultForm` 新增 `forOther` prop，顯示「成績歸屬人」區塊
- `createResult` 新增 `for_other` 分支，完成後 redirect 至 `/unclaimed`

**異動檔案**：
- `supabase/migrations/20260607000002_results_insert_for_others.sql`（已執行）
- `src/app/(main)/records/new/page.tsx`
- `src/components/results/NewResultForm.tsx`
- `src/app/actions/results.ts`

---

### [2026-06-07] 管理後台 — 會員名單 `/admin/members`

**狀態**：✅ 完成

```spec-sync
chapters: [40]
status: implemented
decisions:
  - id: D001
    chapter: 40
    content: "Popup 用 client-side state（無路由變更），保持 URL 乾淨"
    spec_impact: false
    synced: false
  - id: D002
    chapter: 40
    content: "is_assistant_or_above() RPC 在 Server Action 層驗證（middleware + action 雙重保護）"
    spec_impact: false
    synced: false
```

**完成內容**：
- 新增 `/admin/members` 頁面：會員列表 + MemberDetail popup + 角色切換

**異動檔案**：
- `src/app/(admin)/admin/members/page.tsx`（新增）
- `src/app/(admin)/admin/members/MemberList.tsx`（新增）
- `src/app/(admin)/admin/members/MemberDetail.tsx`（新增）
- `src/app/(admin)/admin/members/actions.ts`（新增）
- `src/app/(admin)/admin/AdminTabs.tsx`

---

### [2026-06-07] athletes 新增 name 欄位

**狀態**：✅ 完成

```spec-sync
chapters: [16, 22]
status: implemented
decisions:
  - id: D001
    chapter: 16
    content: "保留 nickname，新增 name（非重命名）；display_name = COALESCE(nickname, name, athlete_name_snapshot)"
    spec_impact: false
    synced: false
  - id: D002
    chapter: 16
    content: "進榜條件改為 a.name IS NOT NULL（取代原 nickname IS NOT NULL）"
    spec_impact: false
    synced: false
  - id: D003
    chapter: 16
    content: "現有會員遷移：migration 內 UPDATE athletes SET name = nickname WHERE nickname IS NOT NULL"
    spec_impact: false
    synced: false
```

**完成內容**：
- Migration：`athletes` 表加 `name` 欄位
- 重建 `leaderboard_entries` view：進榜條件改為 `a.name IS NOT NULL`
- `ProfileInlineForm` 新增「真實姓名」欄位，REQUIRED_FIELDS 改為 `name`

**技術決策**：
- 保留 `nickname`，新增 `name`：語意更清晰（真實姓名 vs 顯示暱稱）
- View 用 `DROP VIEW IF EXISTS` 再重建

**異動檔案**：
- `supabase/migrations/20260607000001_athletes_add_name.sql`
- `src/types/database.ts`、`src/types/index.ts`
- `src/app/actions/profile-inline.ts`、`src/app/actions/results.ts`
- `src/app/(main)/my/profile/page.tsx`
- `src/app/(main)/records/new/page.tsx`
- `src/app/(main)/unclaimed/page.tsx`
- `src/app/(main)/results/[id]/page.tsx`
- `src/app/(main)/teams/[id]/page.tsx`
- `src/components/profile/ProfileInlineForm.tsx`、`src/components/profile/ProfileForm.tsx`
- `src/components/results/NewResultForm.tsx`

---

### [2026-06-05] Nav active state、Avatar 下拉選單、個人資料 Inline 編輯（Ch.30–32）

**狀態**：✅ 完成

```spec-sync
chapters: [30, 31, 32]
status: implemented
decisions:
  - id: D001
    chapter: 31
    content: "/my/results redirect → /records；/profile → /my/profile"
    spec_impact: true
    synced: true
  - id: D002
    chapter: 30
    content: "AvatarDropdown 含「我的紀錄 / 個人資料 / 管理後台 / 登出」"
    spec_impact: false
    synced: false
```

**完成內容**：
- Nav 主連結更新：最速榜 / 未認領 / 賽事；active state 底線（橘色）
- `PageContextStrip`：Nav 下方頁面標題條帶
- `AvatarDropdown`：取代舊 Avatar
- `/my/profile`：獨立頁面，`InlineField` 元件，含進榜進度條

**異動檔案**：
- `src/app/(main)/my/profile/page.tsx`、`src/app/(main)/my/results/page.tsx`
- `src/app/actions/profile-inline.ts`
- `src/components/layout/AvatarDropdown.tsx`、`src/components/layout/Nav.tsx`
- `src/components/profile/InlineField.tsx`、`src/components/profile/ProfileInlineForm.tsx`

---

### [2026-06-05] 品牌標誌、Auth Modal、登入頁主視覺

**狀態**：✅ 完成

```spec-sync
chapters: [28, 29]
status: implemented
decisions:
  - id: D001
    chapter: 28
    content: "Auth Modal intent 支援 login / new_result / claim / follow / race_wishlist / race_attended"
    spec_impact: false
    synced: false
```

**完成內容**：
- `TrilogLogo` SVG 元件
- `AuthModal`：React Context + Modal，intent 支援 login / new_result / claim
- `LeaderboardPreview`：登入前排行榜模糊預覽

**異動檔案**：
- `src/components/ui/TrilogLogo.tsx`（新增）
- `src/components/auth/AuthModal.tsx`（新增）
- `src/context/auth-modal.tsx`（新增）
- `src/app/layout.tsx`

---

### [2026-06-04] 首次成績引導 + 解除關聯（Spec 21.3 / 21.4）

**狀態**：✅ 完成

```spec-sync
chapters: [21]
status: implemented
decisions:
  - id: D001
    chapter: 21
    content: "首次成績後 profile 不完整（缺 gender / birth_year / nationality）時顯示補填提示"
    spec_impact: false
    synced: false
  - id: D002
    chapter: 21
    content: "解除關聯：official + claimed 成績顯示 UnlinkButton，需二次確認"
    spec_impact: false
    synced: false
```

**完成內容**：
- 首次成績引導：profile 不完整時顯示補填提示
- 解除關聯：`unlinkResult` Server Action + `UnlinkButton` component

**異動檔案**：
- `src/app/(main)/records/new/page.tsx`、`src/app/(main)/records/page.tsx`
- `src/app/actions/results.ts`
- `src/components/results/UnlinkButton.tsx`（新增）

---

### [2026-06-04] 認領 / 標記 / 未認領 / 官方成績管理 + 最速榜 / 排行榜升級

**狀態**：✅ 完成

```spec-sync
chapters: [14, 15]
status: implemented
decisions:
  - id: D001
    chapter: 15
    content: "姓名模糊比對（正規化）用於認領比對"
    spec_impact: false
    synced: false
  - id: D002
    chapter: 14
    content: "最速榜升級：DistanceTabs（226/113/51.5/Sprint）、Sub 分界線、badge 顯示（未認領/認領中）"
    spec_impact: false
    synced: false
```

**完成內容**：
- 未認領頁 `/unclaimed`：TagButton + ClaimButton + 姓名模糊比對
- 成績詳情頁、官方成績輸入、最速榜升級、排行榜升級

**異動檔案**：（見原始 entry）

---

### [2026-06-05] 賽事資料庫頁面

**狀態**：✅ 完成

```spec-sync
chapters: [25]
status: implemented
decisions:
  - id: D001
    chapter: 25
    content: "以 race.series 欄位做系列分組；slug 作為 URL 識別碼，SEO 友善"
    spec_impact: false
    synced: false
  - id: D002
    chapter: 25
    content: "IRONMAN_TAIWAN 與 IRONMAN_70_3 合併顯示為同一 IRONMAN 群組；台灣場地優先排列"
    spec_impact: false
    synced: false
```

**完成內容**：
- 實作 `/races` 頁面（賽事列表，含系列分組）
- 執行 DB 資料清理（race_series_cleanup.sql）

**異動檔案**：
- `app/(main)/races/page.tsx`
- `supabase/migrations/races_extended_columns.sql`
- `supabase/migrations/race_series_cleanup.sql`

---

### [2026-06-04] 接力功能實作 + 認領邏輯修訂

**狀態**：✅ 完成

```spec-sync
chapters: [20]
status: implemented
decisions:
  - id: D001
    chapter: 20
    content: "T1/T2 存 TEAM 層級，不歸屬個別成員"
    spec_impact: false
    synced: false
  - id: D002
    chapter: 20
    content: "成員 split_seconds 只計純運動時間，不含換區"
    spec_impact: false
    synced: false
  - id: D003
    chapter: 20
    content: "claim_status 狀態轉換僅透過 RPC 函式，不直接 UPDATE"
    spec_impact: false
    synced: false
```

**完成內容**：
- TEAM / TEAM_MEMBER 資料表建立
- `unlink_result()` DB Function
- `createResult` server action 完整實作

**異動檔案**：
- `supabase/migrations/006_relay.sql`
- `supabase/migrations/relay_result_insert_policy.sql`
- `components/claims/UnlinkButton.tsx`
- `app/actions/results.ts`
- `supabase/functions/unlink_result.sql`

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
| 刪除帳號（email 確認流程）| 會員名單 `/admin/members` | 需第二個 admin 帳號 | 2026-06-08 |
| 復原帳號（30 天內判斷）| 會員名單 `/admin/members` | 同上 | 2026-06-08 |
| Leaderboard FollowButton 顯示 | 關注選手 | 需有其他用戶的 claimed 成績出現在榜上 | 2026-06-07 |
| Auth Modal follow intent | 關注選手 | 需登出狀態 + 有可點擊的 FollowButton | 2026-06-07 |

---

### 已知技術債

| 問題 | 位置 | 說明 |
|------|------|------|
| `middleware.ts` deprecation warning | `src/middleware.ts` | 等 @supabase/ssr 官方更新，詳見 ADR-003 |
| ~~`nickname` 欄位應改為 `name`~~ | `athletes` 表 | ✅ 已解決（v2.2，2026-06-07）|
