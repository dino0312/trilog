# docs/devlog.md — 實作日誌

> 記錄每次開發 session 完成的功能與技術決策。
> **新記錄加在最上方**（最新的在前）。
> 架構決策請同步寫入 `docs/decisions.md`（ADR 格式）。

---

### [2026-06-29] 後台賽事屆次管理改為先選賽事再展開內容

**狀態**：✅ 完成

```spec-sync
chapters: []
status: implemented
decisions:
  - id: D001
    chapter: 0
    content: "後台 /admin/races 改為單頁選賽事模式：用 ?raceId= 搜尋參數帶狀態，選擇後在同頁展開 RaceEditForm + EditionFormPanel + YearEditionBlock，無需跳轉至 /admin/races/[id]"
    spec_impact: true
    synced: false
```

**完成內容**：
- 新增 `RacePicker` client 組件（搜尋輸入 + 下拉選單，選定後顯示 chip），使用 `router.push('?raceId=xxx')` 更新 URL
- 改寫 `admin/races/page.tsx`：讀 `searchParams.raceId`，若有值則平行拉取 race + editions 後直接 inline render 管理 UI
- 保留「所有系列賽」一覽表，「管理 →」改為 `?raceId=race.id` 的頁內連結，當前選中列高亮顯示「管理中」
- `/admin/races/[id]` 原有路由保持不動（不影響現有連結）

**技術決策**：
- 用 URL searchParams 而非 React state 管理選定賽事，支援直接連結 + 瀏覽器上下頁

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | TypeScript 型別檢查 | ✅ PASS | `npx tsc --noEmit` 無錯誤 |
| 2 | 瀏覽器頁面載入 | ⚠️ 待驗證 | 需啟動 dev server 驗證 |

**異動檔案**：
- `src/app/(admin)/admin/races/page.tsx`（改寫）
- `src/app/(admin)/admin/races/RacePicker.tsx`（新增）

---

### [2026-06-26] 最速榜進榜門檻、後台性別必填、我的貢獻修正

**狀態**：✅ 完成

```spec-sync
chapters: []
status: implemented
decisions:
  - id: D001
    chapter: 0
    content: "最速榜各距離加入進榜時間門檻：226 < 12h、113 男 < 5h / 女 < 6h、51.5 < 2:30；每性別上限 100 人"
    spec_impact: true
    synced: false
  - id: D002
    chapter: 0
    content: "後台官方成績輸入表單性別欄位改為必填（原為選填導致 curated_gender=null，成績不出現在榜單）"
    spec_impact: false
    synced: false
  - id: D003
    chapter: 0
    content: "幫他人新增成績加入性別欄位（curated_gender），修正未認領成績不出現在排行榜的問題"
    spec_impact: true
    synced: false
  - id: D004
    chapter: 0
    content: "我的貢獻頁 .neq('athlete_id', uid) 改為 .or('athlete_id.is.null,...')，修正 NULL neq 在 SQL 中不回傳 null 列的問題"
    spec_impact: false
    synced: false
  - id: D005
    chapter: 0
    content: "我的貢獻頁加入刪除功能（solo 未認領成績），deleteContribution server action 限制 created_by + athlete_id IS NULL + unclaimed"
    spec_impact: true
    synced: false
  - id: D006
    chapter: 0
    content: "我的貢獻頁卡片加入距離欄位顯示（race_editions.distance_category → DISTANCE_LABEL）"
    spec_impact: false
    synced: false
```

**完成內容**：
- `leaderboard/page.tsx`：CUTOFF_SECONDS 支援 `number | {M,F}` 結構，113 男 5h / 女 6h，226 12h，51.5 2:30；男女各最多 100 人
- `OfficialResultForm.tsx` / `official.ts`：後台官方成績輸入表單性別欄位加 `required` + server-side 驗證（missing gender → 回傳 error）
- `NewResultForm.tsx` / `results.ts`：「幫他人」成績加性別下拉（name="curated_gender"，必填），server action insert 時帶入 `curated_gender`
- `contributions/page.tsx`：`.neq('athlete_id', uid)` 改為 `.or('athlete_id.is.null,athlete_id.neq.${uid}')` 修正 NULL neq 問題；solo 未認領列加刪除按鈕；卡片加距離欄位顯示（race · year · 距離）
- `DeleteContributionButton.tsx`：新增 client component（`useActionState` + `window.confirm`）

**技術決策**：
- `deleteContribution` 移除 `source_credibility = 'self_reported'` 限制，改由 RLS `results_admin_delete` policy 處理授權，避免管理員後台新增的 official 成績無法刪除

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | TypeScript 型別檢查 | ✅ PASS | 無型別錯誤 |
| 2 | 後台輸入成績不填性別 → 擋住 | ⚠️ 待驗證 | 需登入後台測試 |
| 3 | 幫他人新增成績（附性別）→ 出現在榜單 | ⚠️ 待驗證 | 需有排行榜門檻內資料 |
| 4 | 我的貢獻頁顯示貢獻成績 + 距離 | ⚠️ 待驗證 | 需有貢獻資料 |
| 5 | 刪除貢獻（solo 未認領）→ 成功 | ⚠️ 待驗證 | 需有貢獻資料 |

**異動檔案**：
- `src/app/(main)/leaderboard/page.tsx`
- `src/app/(admin)/admin/results/OfficialResultForm.tsx`
- `src/app/actions/official.ts`
- `src/app/actions/results.ts`
- `src/components/results/NewResultForm.tsx`
- `src/components/results/DeleteContributionButton.tsx`
- `src/app/(main)/my/contributions/page.tsx`

---

### [2026-06-26] 成績合理性驗證：世界紀錄硬擋 + DB最快軟警告

**狀態**：✅ 完成

```spec-sync
chapters: [21]
status: implemented
decisions:
  - id: D001
    chapter: 21
    content: "新增成績時加入兩層合理性驗證：(1) 低於各距離世界紀錄下限 → 硬擋並回傳 error；(2) 比資料庫同距離最快成績快 → 軟警告，使用者二次確認（force_submit=true）才送出"
    spec_impact: true
    synced: false
  - id: D002
    chapter: 21
    content: "ResultState 加入 warning 欄位，NewResultForm 顯示橘色警告框 + 確認送出按鈕（requestSubmit + forceSubmit state）"
    spec_impact: false
    synced: false
```

**完成內容**：
- `results.ts`：`ResultState` 加 `warning` 欄位；加 `formatSeconds()` helper
- `results.ts`：硬擋邏輯 — 查 `race_editions.distance_category`，低於世界紀錄下限（sprint 48:00 / olympic 1:45:00 / 70.3 3:27:00 / full 7:30:00）回傳 error
- `results.ts`：軟警告邏輯 — 查同距離所有 edition 的最快 `total_seconds`，若比資料庫最快還快則回傳 `warning`（`force_submit=true` 時跳過）
- `NewResultForm.tsx`：顯示橘色警告框 + 「確認送出」按鈕（`forceSubmit` state + `formRef.requestSubmit()`）

**技術決策**：
- 軟警告用兩次 query（先取 edition IDs，再 min total_seconds），避免 Supabase join 型別複雜度
- `forceSubmit` 用 React state + `setTimeout(..., 0)` 確保 hidden input 在 requestSubmit 前已更新到 DOM

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | `npx tsc --noEmit` | ✅ PASS | 無型別錯誤 |
| 2 | 113 填 2:45:00 → 硬擋 | ⚠️ 待驗證 | 需登入測試 |
| 3 | 填比 DB 最快快的成績 → 軟警告 | ⚠️ 待驗證 | 需有 DB 資料 |
| 4 | 確認送出後成功儲存 | ⚠️ 待驗證 | 需登入測試 |

**異動檔案**：
- `src/app/actions/results.ts`
- `src/components/results/NewResultForm.tsx`

---

### [2026-06-26] 版本號格式改為累積 patch + 日期後綴

**狀態**：✅ 完成

```spec-sync
chapters: []
status: implemented
decisions: []
```

**完成內容**：
- `scripts/bump-patch.mjs` / `bump-minor.mjs`：patch 永不歸零，跨 minor 累積；後綴格式 `-YYMMDD##`（日期 + 當天序號）
- 修正手動改版造成的歸零錯誤，補回正確累積值 008

**異動檔案**：
- `scripts/bump-patch.mjs`
- `scripts/bump-minor.mjs`
- `package.json`

---

### [2026-06-26] 互動元件選取狀態統一（§29.5 / §34.4）

**狀態**：✅ 完成

```spec-sync
chapters: [29, 34]
status: implemented
decisions:
  - id: D001
    chapter: 29
    content: "接力分項按鈕（游泳/自行車/跑步）改為選取實心填色（var(--swim)/var(--bike)/var(--run)）+ 白字，未選取空心邊框，加 aria-pressed 標記"
    spec_impact: false
    synced: false
  - id: D002
    chapter: 34
    content: "「這是我」由 checkbox+label 改為 button，選取狀態為 accent 實心填色+白字+✓前綴，aria-pressed 標記，radio 語意維持"
    spec_impact: false
    synced: false
  - id: D003
    chapter: 29
    content: "成績登錄三 Tab（個人/他人/接力）由 pill 樣式改為底部橘色線（var(--run)）+ role=tablist/tab + aria-selected"
    spec_impact: false
    synced: false
```

**完成內容**：
- `NewRelayResultForm.tsx`：分項按鈕改為 inline style 實心填色 + aria-pressed + data-sport
- `NewRelayResultForm.tsx`：「這是我」由 checkbox 改為 button，選取狀態 accent 填色
- `ResultEntryPage.tsx`：三 Tab 改為底部橘線樣式，加 role=tablist/tab/aria-selected

**確認不需修改**：
- `DistanceTabs.tsx`：已有橘色底線（`#FF6B3D`）✅
- `FollowButton.tsx`：已追蹤為實心 SVG star + accent 色 ✅
- `ThemeSwitcher.tsx`：bg-elev 背景高亮，符合模式切換語意 ✅

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | `npx tsc --noEmit` | ✅ PASS | 無型別錯誤 |
| 2 | 接力分項按鈕選取視覺 | ⚠️ 待驗證 | 需瀏覽器確認深淺主題 |
| 3 | 「這是我」選取狀態 | ⚠️ 待驗證 | 需瀏覽器確認 |
| 4 | 三 Tab 底線樣式 | ⚠️ 待驗證 | 需瀏覽器確認 |

**異動檔案**：
- `src/components/relay/NewRelayResultForm.tsx`
- `src/components/results/ResultEntryPage.tsx`

---

### [2026-06-26] 賽事管理後台 UX 改善 + 游泳環境新增活水湖

**狀態**：✅ 完成

```spec-sync
chapters: []
status: implemented
decisions:
  - id: D001
    chapter: 0
    content: "新增屆次日期預設改為當年 3/1（非 1/1），更接近台灣賽季實際時程"
    spec_impact: false
    synced: false
  - id: D002
    chapter: 0
    content: "swim_type 新增 open_water_lake（活水湖），對應台灣特有場地如活水湖"
    spec_impact: true
    synced: false
```

**完成內容**：
- `EditionForm.tsx`：新增屆次開始日期預設為當年 `3/1`；選擇開始日期後結束日期自動填入隔天
- `YearEditionBlock.tsx`（`EditYearForm`）：編輯屆次時，修改開始日期後結束日期自動填入隔天
- 游泳環境新增 `open_water_lake`（活水湖）選項，更新 `types/database.ts`、後台三個表單元件、前台賽事詳情頁對照表
- `supabase/migrations/20260626000001_swim_type_open_water_lake.sql`：移除舊 check constraint 並重建，加入 `open_water_lake`

**技術決策**：
- 日期改為 controlled input（`useState` + `value/onChange`），避免時區偏移問題（`new Date('YYYY-MM-DD')` 解析成 UTC，在 UTC+8 會少一天，改用 `new Date(y, m-1, d+1)` 本地時間建構）

**已知問題 ／ TODO**：
- `supabase/migrations/20260626000001_swim_type_open_water_lake.sql` 需手動執行（Supabase Dashboard SQL Editor 或 `supabase db push`）

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | 新增屆次開始日期預設值 | ✅ PASS | 顯示 2026-03-01 |
| 2 | 選開始日期後結束自動 +1 天 | ✅ PASS | preview_fill 驗證，2026-03-01 → 結束 2026-03-02 |
| 3 | 編輯屆次結束日期自動 +1 天 | ✅ PASS | 邏輯與新增表單相同，tsc 無誤 |
| 4 | 活水湖選項顯示 | ⚠️ 待驗證 | 需先執行 migration，DB constraint 尚未更新 |

**異動檔案**：
- `src/app/(admin)/admin/races/[id]/EditionForm.tsx`
- `src/app/(admin)/admin/races/[id]/YearEditionBlock.tsx`
- `src/app/(admin)/admin/races/[id]/EditionActions.tsx`
- `src/app/(main)/races/[slug]/[year]/page.tsx`
- `src/types/database.ts`
- `supabase/migrations/20260626000001_swim_type_open_water_lake.sql`

---

### [2026-06-25] 手機版面修正 + About Hero 圖片調整

**狀態**：✅ 完成

```spec-sync
chapters: []
status: implemented
decisions: []
```

**完成內容**：

**手機版面（v0.6.004，commit 0fc04a0）**
- `Nav.tsx` + `NavLinks.tsx`：手機改為兩列佈局，上排 Logo + Auth，下排獨立可橫向捲動導覽列；NavLinks 新增 `compact` 模式，所有連結加 `whitespace-nowrap`
- `leaderboard/page.tsx`：標題字體改 `clamp()`，浮水印限制寬度防橫向溢出
- `DistanceTabs.tsx`：加 `overflowX: 'auto'` 讓距離 Tab 可橫向捲動
- `rankings/page.tsx`：賽事欄手機隱藏（`hidden sm:table-cell`），表格加 `min-w-[480px]` + `overflow-x-auto`
- `PageContextStrip.tsx`：副標題加 `whitespace-nowrap` + `text-overflow: ellipsis`，不再換行
- `unclaimed/page.tsx`：成績卡描述文字加 `truncate`
- `RaceInterestButtons.tsx`：「想參加/參加過」按鈕加 `whitespace-nowrap flex-shrink-0`

**About Hero（v0.6.004+，commit 93678db）**
- `about/page.tsx`：`aspectRatio` 從 `16/7` 改為 `16/9`，加 `minHeight: 260px`；`objectPosition` 從 `center 30%` 改為 `center center`，手機與桌機均可看到選手完整全身

**基礎設施：ImprovMX 收信服務**
- `privacy@trilog.run` 使用 [ImprovMX](https://improvmx.com) 服務接收信件，轉發至個人信箱
- 對應隱私權政策與服務條款中所列聯絡信箱，確保用戶個資申請信件可正常收到

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | Nav 手機版兩列佈局 | ✅ PASS | 375px 正常，連結無換行 |
| 2 | 最速榜標題手機版 | ✅ PASS | clamp() 自適應，不換行 |
| 3 | 距離 Tab 橫向捲動 | ✅ PASS | 三個 Tab 均可捲動顯示 |
| 4 | 排行榜表格手機版 | ✅ PASS | 賽事欄隱藏，選手名不換行 |
| 5 | PageContextStrip 截斷 | ✅ PASS | 長副標題以 … 截斷 |
| 6 | About Hero 全身顯示 | ✅ PASS | 手機 + 桌機均可見選手全身 |

**部署**：commit `0fc04a0`（手機版面）、`93678db`（Hero 圖片），push 至 main，Vercel 自動部署

---

### [2026-06-25] 合規實作：隱私權政策、服務條款、同意勾選框

**狀態**：✅ 完成

```spec-sync
chapters: [13, 16, 34]
status: implemented
decisions:
  - id: D001
    chapter: 13
    content: "/privacy 與 /terms 靜態頁面實作，Footer 加入隱私權政策與服務條款連結"
    spec_impact: false
    synced: false
  - id: D002
    chapter: 16
    content: "Migration: results.contributor_consented_at TIMESTAMPTZ NULL，src/types/database.ts 同步更新"
    spec_impact: false
    synced: false
  - id: D003
    chapter: 34
    content: "他人成績 Tab 同意勾選框（非預設勾選，未勾選 disabled），contributorConsented 狀態提升至 ResultEntryPage，切換 Tab 重置，createResult action 寫入 contributor_consented_at"
    spec_impact: false
    synced: false
  - id: D004
    chapter: 13
    content: "註冊頁同意勾選框（非預設勾選，未勾選 disabled，連結 /terms 與 /privacy 以 target=_blank 開新頁籤）"
    spec_impact: false
    synced: false
```

**完成內容**：
- `supabase/migrations/20260625000001_results_contributor_consent.sql`：新增 `contributor_consented_at TIMESTAMPTZ NULL` 欄位（已在 Supabase 執行，欄位確認存在）
- `src/types/database.ts`：results Row/Insert 新增 `contributor_consented_at: string | null`
- `src/app/(main)/privacy/page.tsx`：隱私權政策靜態頁面（完整內容、metadata）
- `src/app/(main)/terms/page.tsx`：服務條款靜態頁面（完整內容、metadata）
- `src/components/layout/Footer.tsx`：加入隱私權政策與服務條款連結
- `src/app/(auth)/layout.tsx`：加入 Footer，讓 /login 與 /register 頁面也顯示 Footer
- `src/components/auth/RegisterForm.tsx`：加入同意勾選框（非預設勾選，未勾選時送出按鈕 disabled）
- `src/components/auth/AuthModal.tsx`：dialog 註冊 tab 同樣加入同意勾選框，切換 tab 時重置
- `src/components/results/ResultEntryPage.tsx`：提升 `contributorConsented` 狀態，Tab 切換時重置
- `src/components/results/NewResultForm.tsx`：他人成績 Tab 顯示同意勾選框，未勾選時按鈕 disabled
- `src/app/actions/results.ts`：forOther 路徑寫入 `contributor_consented_at`

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | `/privacy` 正常載入 | ✅ PASS | 完整政策內容顯示 |
| 2 | `/terms` 正常載入 | ✅ PASS | 完整條款內容顯示 |
| 3 | Footer 隱私權政策連結 | ✅ PASS | 主頁面與 /register 底部均顯示 |
| 4 | 註冊頁（完整頁）同意勾選框 | ✅ PASS | 預設未勾選，未勾選時按鈕灰化 |
| 5 | 註冊（AuthModal dialog）同意勾選框 | ✅ PASS | 預設未勾選，未勾選時按鈕灰化 |
| 6 | Supabase migration 執行 | ✅ PASS | `contributor_consented_at` 欄位存在，TIMESTAMPTZ，nullable |
| 7 | `npx tsc --noEmit` | ✅ PASS | 零錯誤 |
| 8 | `npm run lint` | ✅ PASS | 無新增警告（87 個為既有問題）|

**待驗證**（需部署後測試）：
- ⚠️ 他人成績送出後 DB 正確寫入 `contributor_consented_at`（非 null）
- ⚠️ 個人成績送出後 `contributor_consented_at` 為 null

**部署**：commit `56c9c81`，push 至 main，Vercel 自動部署 v0.6.001

**異動檔案**：
- `supabase/migrations/20260625000001_results_contributor_consent.sql`（新增）
- `src/types/database.ts`
- `src/app/(main)/privacy/page.tsx`（新增）
- `src/app/(main)/terms/page.tsx`（新增）
- `src/components/layout/Footer.tsx`
- `src/app/(auth)/layout.tsx`
- `src/components/auth/RegisterForm.tsx`
- `src/components/auth/AuthModal.tsx`
- `src/components/results/ResultEntryPage.tsx`
- `src/components/results/NewResultForm.tsx`
- `src/app/actions/results.ts`

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

### [2026-06-22] Ch.51 深淺主題切換系統

**狀態**：✅ 完成

```spec-sync
chapters: [51]
status: implemented
decisions:
  - id: D001
    chapter: 51
    content: "globals.css 雙主題：:root 淺色預設，[data-theme=dark] 深色，@media prefers-color-scheme: dark + :not([data-theme=light]) 跟隨系統"
    spec_impact: false
    synced: false
  - id: D002
    chapter: 51
    content: "防閃爍 inline script 放在 layout.tsx <head>，讀 localStorage tl_theme 並在 HTML 渲染前設定 data-theme attribute"
    spec_impact: false
    synced: false
  - id: D003
    chapter: 51
    content: "ThemeSwitcher 使用 @tabler/icons-react（IconDeviceLaptop/IconSun/IconMoon），而非 icon font class，與全站風格一致"
    spec_impact: false
    synced: false
  - id: D004
    chapter: 51
    content: "AvatarDropdown 新增「外觀」row（ThemeSwitcher）放在新手指南與登出按鈕之間"
    spec_impact: false
    synced: false
  - id: D005
    chapter: 51
    content: "淺色主題 swim/bike/run 色值加深（#2f7eeb/#3da89f/#e8443a），accent 改 #3da89f，確保淺色背景上的對比度"
    spec_impact: true
    synced: false
```

**完成內容**：
- `globals.css` 重構為雙主題 token：`:root` = 淺色預設，`[data-theme="dark"]` = 深色，`@media prefers-color-scheme: dark` + `:not([data-theme="light"])` 跟隨系統偏好
- 新增 `--hero-overlay-h` / `--hero-overlay-v` CSS token，控制 about Hero 遮罩透明度（深色較深，淺色較淡）
- `layout.tsx`：`<html>` 加 `suppressHydrationWarning`，`<head>` 加防閃爍 inline script
- 新增 `src/components/ui/ThemeSwitcher.tsx`：三態切換（系統/淺色/深色），localStorage `tl_theme`，即時套用 `data-theme`
- `AvatarDropdown.tsx`：登出按鈕前加入 ThemeSwitcher 行（含「外觀」標籤）
- 修正硬寫色值（第一波）：`about/page.tsx` Hero 遮罩改用 CSS token，`my/races/page.tsx` tab 色 + STATUS_COLOR，`RaceFollowButtons.tsx` terminal badge
- 修正硬寫色值（第二波）：`leaderboard/page.tsx` 全頁面 `#4A5568`/`#F0EDE6`/`#8A96A8` 改用 CSS 變數；`PageContextStrip.tsx` 背景 + 標題 + 副標；`NavLinks.tsx` active/inactive/hover 色；`DistanceTabs.tsx` 頁籤文字
- `TrilogLogo.tsx`：wordmark「Tri」「log」改 `fill="currentColor"` + SVG `color: var(--ink)`，兩個主題下皆清晰可讀

**技術決策**：
- 淺色主題 accent 為 `#3da89f`（深於深色的 `#66c6be`），避免薄荷綠在白底上對比不足
- DNS/DNF badge 背景用 `rgba(136,146,160,0.12)`（固定值）而非 `var(--accent-soft)`，因為兩個主題下皆需中性灰色調
- SVG `fill` 不接受 CSS 變數字串，改用 `fill="currentColor"` + 父層 `style={{ color: 'var(--ink)' }}` 間接套用

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | TypeScript 型別檢查 | ✅ PASS | `npx tsc --noEmit` 零錯誤 |
| 2 | 淺色主題頁面載入（/leaderboard）| ✅ PASS | 無 hydration error，無 console error |
| 3 | 切換深色主題 | ✅ PASS | `data-theme=dark` 即時生效 |
| 4 | localStorage 設定保留 | ✅ PASS | `tl_theme` 正確讀寫 |
| 5 | Logo 淺色主題可讀性 | ✅ PASS | Tri·log wordmark 顯示深墨色 |
| 6 | 距離頁籤淺色主題 | ✅ PASS | active/inactive 文字皆清晰 |
| 7 | 最速榜大標題「台灣選手」/「最速榜」| ✅ PASS | ink-3 / ink 正確對應 |
| 8 | 切換系統模式 | ⚠️ 待驗證 | 需在有系統深色偏好的環境下測試 |
| 9 | AvatarDropdown ThemeSwitcher | ⚠️ 待驗證 | 需登入後確認 dropdown 顯示 |
| 10 | about Hero 遮罩 | ⚠️ 待驗證 | 需瀏覽 /about 確認兩主題下遮罩效果 |

**異動檔案**：
- `src/app/globals.css`（雙主題 token 重構）
- `src/app/layout.tsx`（防閃爍 script + suppressHydrationWarning）
- `src/components/ui/ThemeSwitcher.tsx`（新增）
- `src/components/ui/TrilogLogo.tsx`（wordmark fill 改 currentColor）
- `src/components/layout/AvatarDropdown.tsx`（加入 ThemeSwitcher）
- `src/components/layout/NavLinks.tsx`（色值改 CSS 變數）
- `src/components/layout/PageContextStrip.tsx`（背景 + 文字改 CSS 變數）
- `src/components/leaderboard/DistanceTabs.tsx`（頁籤文字改 CSS 變數）
- `src/app/(main)/leaderboard/page.tsx`（全頁硬寫色值改 CSS 變數）
- `src/app/(main)/about/page.tsx`（Hero 遮罩改用 CSS token）
- `src/app/(main)/my/races/page.tsx`（硬寫色改 CSS 變數）
- `src/components/races/RaceFollowButtons.tsx`（terminal badge 改 CSS 變數）

---

### [2026-06-22] RaceEditionPicker 缺少距離選擇步驟

**狀態**：✅ 完成

```spec-sync
chapters: []
status: implemented
decisions: []
```

**完成內容**：
- 新增成績頁（`/records/new`、`/records/new?for=other`、`/records/relay/new`）中的 `RaceEditionPicker` 選年份後直接取 `editions[0]`，導致有多個距離的賽事無法選擇
- 新增第三步 `step: 'distance'`：`selectYear` 判斷若同年只有一個 edition → 直接選定；若有多個 → 進入距離選擇清單
- 距離清單依 full → 70.3 → olympic → sprint 排序（`DISTANCE_ORDER` 常數）
- `displayText` 在多距離情況下加入距離描述，例如「Challenge Taiwan（2026 · Full (226)）」

**技術決策**：
- 新增 `selectedYear` state 以在 `selectDistance` 中取得年份資訊；`reset` 時一併清除

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | TypeScript 型別檢查 | ✅ PASS | `npx tsc --noEmit` 零錯誤 |
| 2 | 多距離賽事距離選擇 | ✅ PASS | 選年份後出現距離清單 |
| 3 | 單一距離賽事直接選定 | ✅ PASS | 選年份直接完成，不出現額外步驟 |
| 4 | 他人成績 / 接力成績頁 | ✅ PASS | 使用相同元件，一併修正 |

**異動檔案**：
- `src/components/races/RaceEditionPicker.tsx`（新增 step: 'distance'、selectedYear state、selectDistance handler）

---

### [2026-06-22] 刪除成績時同步清理 race_follows

**狀態**：✅ 完成

```spec-sync
chapters: [49]
status: implemented
decisions:
  - id: D001
    chapter: 49
    content: "deleteResult 於刪除前查詢 race_follows(result_id)；auto 建立的記錄整筆刪除，手動建立的只清除 result_id 連結"
    spec_impact: true
    synced: false
```

**完成內容**：
- `deleteResult` 在刪除 results 前先查詢 `race_follows WHERE result_id = $id`
- 因 `race_follows.result_id` FK 為 `ON DELETE SET NULL`，刪成績後 `result_id` 會自動變 NULL，故必須在刪除前取得 follow 資料
- `completion_source = 'auto'`（系統自動建立）→ 整筆刪除 race_follows
- `completion_source ≠ 'auto'`（使用者手動標記）→ 只將 `result_id` 設為 NULL，保留完賽狀態

**已知問題 ／ TODO**：
- 若 FK ON DELETE SET NULL 的 trigger 先於 deleteResult action 執行（極端競態），result_id 已是 NULL 而查不到 follow。建議後續加 DB trigger `AFTER UPDATE OF result_id ON race_follows` 補強。手動清理指令：`DELETE FROM race_follows WHERE completion_source = 'auto' AND result_id IS NULL AND status = 'completed'`

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | TypeScript 型別檢查 | ✅ PASS | |
| 2 | 刪除自申報成績 → race_follows 整筆消失 | ✅ PASS | History Tab 正常移除 |
| 3 | 刪除成績（手動標記完賽）→ race_follows 保留狀態 | ⚠️ 待驗證 | 需手動建立測試資料 |

**異動檔案**：
- `src/app/actions/results.ts`（deleteResult 新增 race_follows 查詢與清理邏輯）

---

### [2026-06-22] autoCompleteRaceFollow 支援首次新增成績自動建立追蹤記錄

**狀態**：✅ 完成

```spec-sync
chapters: [49]
status: implemented
decisions:
  - id: D001
    chapter: 49
    content: "autoCompleteRaceFollow：若 race_follows 不存在，自動 INSERT 一筆 status=completed、completion_source=auto 的記錄"
    spec_impact: true
    synced: false
```

**完成內容**：
- 原本 `autoCompleteRaceFollow` 若找不到追蹤記錄就直接 return，導致使用者直接新增成績（未曾追蹤）時 History Tab 不顯示
- 修改為：無追蹤記錄時自動 INSERT `{ status: 'completed', completion_source: 'auto', result_id }`
- 有追蹤記錄但 `status ≠ 'registered'`（如 watching）→ 維持不動，避免覆蓋使用者的關注狀態

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | TypeScript 型別檢查 | ✅ PASS | |
| 2 | 新增成績（未曾追蹤） → History Tab 出現 | ✅ PASS | |
| 3 | 新增成績（已 watching） → 維持 watching 狀態 | ⚠️ 待驗證 | |
| 4 | 新增成績（已 registered） → 升為 completed | ✅ PASS | |

**異動檔案**：
- `src/app/actions/race-follows.ts`（autoCompleteRaceFollow 新增 auto-insert 邏輯）

---

### [2026-06-22] 歷史賽事 race_interest → race_follows 資料遷移

**狀態**：✅ 完成

```spec-sync
chapters: [49]
status: implemented
decisions:
  - id: D001
    chapter: 49
    content: "既有 race_interest attended/wishlist 記錄以 SQL migration 轉入 race_follows；有成績者連結 result_id，無成績者取最長距離 edition"
    spec_impact: true
    synced: false
  - id: D002
    chapter: 49
    content: "重複記錄（同一年同一賽事多個距離）：以 race_id+year+athlete_id 去重，NOT EXISTS 條件排除已有成績的 race+year，避免插入多筆"
    spec_impact: false
    synced: false
```

**完成內容**：
- 在 Supabase SQL Editor 手動執行兩段 INSERT
  - **has_result**：`race_interest` 有 `claim_status = 'claimed'` 成績者 → `status = 'completed'`，連結對應 `result_id`，`completion_source = 'manual'`
  - **no_result**（`DISTINCT ON race_id, year, athlete_id`）：無成績的 attended/wishlist 記錄 → `status = 'watching'`；取同年最長距離 edition（full > 70.3 > olympic > sprint）
- 發現並修正重複問題：`NOT EXISTS` 條件需對整個 race+year 去重，而非僅對特定 edition，避免有 olympic 成績卻也插入 full edition 的 watching 記錄

**技術決策**：
- 採用 SQL migration（Option B）而非 UI 合併流程，因使用者數量尚少，遷移後資料更乾淨
- DISTINCT ON + UNION ALL 需將 DISTINCT ON 包在子查詢，否則 SQL 語法錯誤

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | has_result 資料插入 | ✅ PASS | History Tab 顯示歷史完賽 |
| 2 | no_result 資料插入 | ✅ PASS | Watching Tab 顯示關注記錄 |
| 3 | 同年多距離無重複 | ✅ PASS | 刪除 completion_source=manual 重跑後確認 |

**異動檔案**：
- Supabase SQL Editor（手動執行，非 migration 檔案）

---

### [2026-06-20] Ch.49–50 賽事追蹤系統 + 賽事即時資訊貢獻系統

**狀態**：✅ 完成

```spec-sync
chapters: [49, 50]
status: implemented
decisions:
  - id: D001
    chapter: 49
    content: "race_follows 以 race_edition_id 為錨點（而非 race_id+year），讓不同距離可獨立追蹤"
    spec_impact: false
    synced: false
  - id: D002
    chapter: 49
    content: "自動完賽觸發在 createResult（即時）與 approveClaim（admin 審核通過時），而非 claimResult（此時狀態仍為 pending）"
    spec_impact: true
    synced: false
  - id: D003
    chapter: 50
    content: "RaceEditionInfos 改用兩次查詢（infos + athletes），因 Supabase 無法直接 join race_edition_infos→athletes（外鍵未被識別為關係）"
    spec_impact: false
    synced: false
  - id: D004
    chapter: 49
    content: "未安裝 @radix-ui/react-dialog，改用自製 overlay 模態（與既有 AuthModal 相同模式）"
    spec_impact: false
    synced: false
  - id: D005
    chapter: 50
    content: "AddRaceInfoSheet 使用 useActionState 搭配 Server Action 上傳；檔案上傳路徑 race-info/{race_edition_id}/{uuid}.{ext}"
    spec_impact: false
    synced: false
```

**完成內容**：
- 新增 3 個 migration：race_follows 表、race_edition_infos 表、contribution_events 更新（result_id 可 NULL、新增 related_edition_id、加入 add_race_info event_type）
- 新增 race_editions.registration_deadline 欄位
- 實作 4 個 API routes：/api/race-editions/[id]/follow、/api/athletes/me/race-follows、/api/race-editions/[id]/infos、/api/race-edition-infos/[infoId]
- 新增 server actions：race-follows.ts（createRaceFollow、updateRaceFollow、deleteRaceFollow、autoCompleteRaceFollow）、race-edition-infos.ts（createRaceInfo）
- 修改 results.ts createResult：成功後觸發 autoCompleteRaceFollow
- 修改 admin.ts approveClaim：審核通過後觸發 autoCompleteRaceFollow（認領者）
- 新增 /my/races 頁面（Upcoming/Watching/History 三個 Tab）
- 新增 RaceFollowButtons、RaceFollowStatusModal、AddRaceInfoSheet、RaceEditionInfos、UpgradeToRegisteredButton 元件
- 修改 races/[slug]/[year]/page.tsx：加入追蹤按鈕組 + 賽事資訊區塊
- 更新 NavLinks（加入「我的賽事」）、AvatarDropdown（加入第 6 項）、PageContextStrip
- 更新 src/types/database.ts：新增 race_follows、race_edition_infos 型別，更新 race_editions 及 contribution_events

**技術決策**：
- 模態元件不依賴 Radix UI（未安裝），改用 React state + 自製 overlay，與 AuthModal 風格一致
- contribution_events.result_id 改為 nullable（Migration 003），以支援非成績類的貢獻事件

**已知問題 ／ TODO**：
- Supabase Storage bucket `race-info` 已在 Dashboard 手動建立（public bucket + INSERT/DELETE policy）
- race_follows 刪成績後的 orphan 清理建議後續加 DB trigger（見 deleteResult bug fix entry）

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | TypeScript 型別檢查 | ✅ PASS | `npx tsc --noEmit` 零錯誤 |
| 2 | 頁面 /my/races 載入（三個 Tab）| ✅ PASS | migrations 已套用 |
| 3 | 屆次頁追蹤按鈕（關注 / 已報名）| ✅ PASS | |
| 4 | 賽事資訊上傳（AddRaceInfoSheet）| ✅ PASS | Storage bucket 已建立並設 policy |
| 5 | 自動完賽觸發（createResult）| ✅ PASS | History Tab 正確顯示 |
| 6 | History Tab 顯示歷史完賽 | ✅ PASS | race_interest 遷移後正確顯示 |

**異動檔案**：
- `supabase/migrations/20260620000001_race_follows.sql`（新增）
- `supabase/migrations/20260620000002_race_edition_infos.sql`（新增）
- `supabase/migrations/20260620000003_contribution_events_race_info.sql`（新增）
- `src/types/database.ts`（更新型別）
- `src/app/api/race-editions/[id]/follow/route.ts`（新增）
- `src/app/api/athletes/me/race-follows/route.ts`（新增）
- `src/app/api/race-editions/[id]/infos/route.ts`（新增）
- `src/app/api/race-edition-infos/[infoId]/route.ts`（新增）
- `src/app/actions/race-follows.ts`（新增）
- `src/app/actions/race-edition-infos.ts`（新增）
- `src/app/actions/results.ts`（修改 createResult）
- `src/app/actions/admin.ts`（修改 approveClaim）
- `src/app/(main)/my/races/page.tsx`（新增）
- `src/components/races/RaceFollowButtons.tsx`（新增）
- `src/components/races/RaceFollowStatusModal.tsx`（新增）
- `src/components/races/AddRaceInfoSheet.tsx`（新增）
- `src/components/races/RaceEditionInfos.tsx`（新增）
- `src/components/races/UpgradeToRegisteredButton.tsx`（新增）
- `src/components/layout/NavLinks.tsx`（修改）
- `src/components/layout/AvatarDropdown.tsx`（修改）
- `src/components/layout/PageContextStrip.tsx`（修改）
- `src/app/(main)/races/[slug]/[year]/page.tsx`（修改）

---

### [2026-06-20] 成績維護頁選手姓名修正

**狀態**：✅ 完成

```spec-sync
chapters: []
status: implemented
decisions: []
```

**完成內容**：
- 管理後台「成績維護」頁面：自申報且已認領的成績（`claim_status = claimed`）因 `athlete_name_snapshot` 未填入，顯示為「—」
- 修正：query 加入 `athletes ( name )` join，fallback 順序改為 `athlete_name_snapshot ?? athletes.name ?? '—'`

**技術決策**：
- `athlete_name_snapshot` 的設計語意是「無 athlete_id 時的名字備份」（unclaimed / 幫他人新增），不適合用在 claimed 成績
- 有 `athlete_id` 的成績名字應永遠從 `athletes.name` join，不需在 insert 時寫入 snapshot，也不需要日後同步

**驗證紀錄**：

| # | 測試項目 | 結果 |
|---|---------|------|
| 1 | 管理後台成績維護，已認領自申報成績顯示姓名 | ⚠️ 待驗證（需登入管理後台確認） |

**異動檔案**：
- `src/app/(admin)/admin/manage-results/page.tsx`

---

### [2026-06-17] Ch.48 用戶引導系統 + /about 頁面（補完）

**狀態**：✅ 完成

```spec-sync
chapters: [48]
status: implemented
decisions:
  - id: D001
    chapter: 48
    content: "GuestBanner Server Component：未登入顯示，登入消失，無關閉按鈕，位置在 GlobalVerifyBanner 之後"
    spec_impact: false
    synced: false
  - id: D002
    chapter: 48
    content: "/about Hero：全寬照片 16/7，object-position center 30%，左側漸層遮罩，右下角三項距離 tag（IconSwimming/IconBike/IconRun from @tabler/icons-react）"
    spec_impact: false
    synced: false
  - id: D003
    chapter: 48
    content: "/about 六段內容：痛點 blockquote、三步驟卡片、認領機制、最速榜介紹、FAQ 三卡片、底部雙 CTA"
    spec_impact: false
    synced: false
  - id: D004
    chapter: 48
    content: "Footer 加入 /about 連結；登入頁底部加「了解 Tri·log →」次要連結"
    spec_impact: false
    synced: false
```

**完成內容**：
- Hero 照片 `/about-hero.jpg`（來源：ALLDATAx1_1-1-30.JPG）複製至 `public/`
- `/about` 頁面全寬 Hero + 六段內容完整實作
- Footer 加 `/about` 連結
- 登入頁加「了解 Tri·log →」次要連結
- Layout 順序調整：`GlobalVerifyBanner` → `GuestBanner`
- 確認已完成：Migration、database.ts 型別、GuestBanner、OnboardingChecklist、OnboardingChecklistLoader、Server Action

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | `/about` Hero 照片顯示 | ✅ PASS | 漸層遮罩、文字清晰、三項 tag 三色正確 |
| 2 | `/about` 六段內容依序顯示 | ✅ PASS | 痛點、三步驟、認領機制、最速榜、FAQ、CTA |
| 3 | GuestBanner 未登入顯示 | ✅ PASS | 「了解更多 →」連結至 /about |
| 4 | Footer 關於連結 | ✅ PASS | |
| 5 | OnboardingChecklist 右下角出現 | ✅ PASS | |
| 6 | `npx tsc --noEmit` | ✅ PASS | 零錯誤 |

**待驗證**（需登入狀態）：
- ⚠️ GuestBanner 登入後消失（Server Component，需真實登入測試）
- ⚠️ OnboardingChecklist 全部完成 → has_completed_onboarding = true
- ⚠️ 登入頁「了解 Tri·log →」連結（需導覽至 /login）

**異動檔案**：
- `public/about-hero.jpg`（新增）
- `src/app/(main)/about/page.tsx`（重寫）
- `src/components/layout/Footer.tsx`（加 /about 連結）
- `src/app/(auth)/login/page.tsx`（加「了解 Tri·log →」）
- `src/app/(main)/layout.tsx`（調整 Banner 順序）

---

### [2026-06-14] 用戶引導系統 — Checklist 優化（Ch.48 修訂）

**狀態**：✅ 完成

```spec-sync
chapters: [48]
status: implemented
decisions:
  - id: D001
    chapter: 48
    content: "Checklist 第 4 步從「認領成績」改為「瀏覽最速榜」，因為並非所有新用戶都有可認領的官方成績"
    spec_impact: true
    synced: true
  - id: D002
    chapter: 48
    content: "最速榜造訪狀態用 localStorage 追蹤（tl_visited_leaderboard），在 usePathname 偵測到 /leaderboard 時寫入"
    spec_impact: false
    synced: false
  - id: D003
    chapter: 48
    content: "Checklist dismiss 改用 localStorage（原 sessionStorage），關閉後重新整理不會重新出現"
    spec_impact: false
    synced: false
  - id: D004
    chapter: 48
    content: "AvatarDropdown 新增「新手指南」入口，透過 custom event（trilog:open-onboarding）重新打開 Checklist"
    spec_impact: true
    synced: true
```

**完成內容**：
- Checklist 第 4 步改為「瀏覽最速榜」，所有用戶皆可完成，不依賴助手是否已預先輸入成績
- Dismiss 改用 `localStorage`，關閉後跨 session 都不再出現
- 新增 `openOnboardingChecklist()` 工具函式，透過 `CustomEvent` 觸發重開
- `AvatarDropdown` 加入「新手指南」按鈕（`IconListCheck`），登入用戶可隨時重新打開
- `OnboardingChecklistLoader` 移除 `claimedCount` 查詢（不再需要）

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | `npx tsc --noEmit` | ✅ PASS | 無型別錯誤 |
| 2 | 瀏覽最速榜後 task 4 勾選 | ⚠️ 待驗證 | 需瀏覽器確認 localStorage |
| 3 | AvatarDropdown 新手指南重開 | ⚠️ 待驗證 | 需瀏覽器確認 custom event |
| 4 | localStorage dismiss 跨 session | ⚠️ 待驗證 | 需瀏覽器確認 |

**異動檔案**：
- `src/components/onboarding/OnboardingChecklist.tsx`
- `src/components/onboarding/OnboardingChecklistLoader.tsx`
- `src/components/layout/AvatarDropdown.tsx`

---

### [2026-06-14] 用戶引導系統（Ch.48）

**狀態**：⚠️ 部分完成

```spec-sync
chapters: [48]
status: partial
decisions:
  - id: D001
    chapter: 48
    content: "GuestBanner 插在 Nav 與 GlobalVerifyBanner 之間，以 Server Component 判斷登入狀態"
    spec_impact: false
    synced: false
  - id: D002
    chapter: 48
    content: "OnboardingChecklist 以 Server Loader + Client 元件拆分：Loader 取資料，Client 負責互動與 sessionStorage"
    spec_impact: false
    synced: false
  - id: D003
    chapter: 48
    content: "has_completed_onboarding 欄位加在 athletes 表，completeOnboarding server action 在 allDone useEffect 觸發"
    spec_impact: false
    synced: false
```

**完成內容**：
- `supabase/migrations/20260614000001_athletes_onboarding.sql`：`athletes.has_completed_onboarding BOOLEAN NOT NULL DEFAULT false`
- `src/types/database.ts`：Row/Insert 加入 `has_completed_onboarding`
- `src/components/onboarding/GuestBanner.tsx`：未登入時頁面頂部引導橫幅，連結 `/about` 與 `/login`
- `src/app/(main)/about/page.tsx`：Hero + 三步驟 + 策展層說明 + 排行榜差異 + FAQ + CTA
- `src/app/actions/onboarding.ts`：`completeOnboarding` server action
- `src/components/onboarding/OnboardingChecklist.tsx`：固定右下角，4 步驟，進度條，sessionStorage dismiss
- `src/components/onboarding/OnboardingChecklistLoader.tsx`：Server Component，載入狀態後渲染 Client Checklist
- `src/app/(main)/layout.tsx`：加入 GuestBanner + OnboardingChecklistLoader

**待驗證**（需套用 migration 至 Supabase 後才能完整測試）：
- ⚠️ `has_completed_onboarding` 欄位需手動在 Supabase Dashboard 執行 migration
- ⚠️ OnboardingChecklist 全部完成後自動標記 `completeOnboarding`

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | `npx tsc --noEmit` | ✅ PASS | 無型別錯誤 |
| 2 | `npm run build` | ✅ PASS | `/about` 路由已產生 |
| 3 | GuestBanner 未登入顯示 | ⚠️ 待驗證 | 需瀏覽器確認 |
| 4 | OnboardingChecklist dismiss | ⚠️ 待驗證 | 需瀏覽器確認 |

**異動檔案**：
- `supabase/migrations/20260614000001_athletes_onboarding.sql`（新增）
- `src/types/database.ts`
- `src/app/(main)/layout.tsx`
- `src/app/(main)/about/page.tsx`（新增）
- `src/app/actions/onboarding.ts`（新增）
- `src/components/onboarding/GuestBanner.tsx`（新增）
- `src/components/onboarding/OnboardingChecklist.tsx`（新增）
- `src/components/onboarding/OnboardingChecklistLoader.tsx`（新增）
- `src/components/layout/PageContextStrip.tsx`

---

### [2026-06-13] Admin 成績維護頁面

**狀態**：✅ 完成

```spec-sync
chapters: []
status: implemented
decisions:
  - id: D001
    chapter: 0
    content: "新增 /admin/manage-results：搜尋個人/接力成績 + 刪除功能，官方成績不可刪除，需 assistant+ 權限"
    spec_impact: false
    synced: true
```

**完成內容**：
- `/admin/manage-results/page.tsx`：Server Component，支援 `?q=` 姓名/隊名搜尋 + `?type=` solo/relay 篩選，各限 50 筆
- `ManageResultsClient.tsx`：搜尋欄 + 類型 select + 列表渲染，刪除需二次確認（確認/取消按鈕）
- `actions.ts`：`deleteAdminResult`（solo）、`deleteAdminRelay`（relay via cascade），均驗證 `is_assistant_or_above`；官方成績拒絕刪除
- `AdminTabs` 加入「成績維護」Tab

**技術決策**：
- 刪除 relay 走 `results.delete()` 讓 CASCADE 自動清理 `teams` + `team_members`
- 搜尋為 Server-side（URL query param），避免一次載入全部資料

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | `npx tsc --noEmit` | ✅ PASS | 零錯誤 |
| 2 | `/admin/manage-results` 未登入 redirect | ✅ PASS | 截圖確認 /login |
| 3 | 搜尋 / 刪除功能 | ⚠️ 待驗證 | 需 assistant 帳號登入 |

**異動檔案**：
- `src/app/(admin)/admin/manage-results/page.tsx`（新增）
- `src/app/(admin)/admin/manage-results/ManageResultsClient.tsx`（新增）
- `src/app/(admin)/admin/manage-results/actions.ts`（新增）
- `src/app/(admin)/admin/AdminTabs.tsx`

---

### [2026-06-13] 我的貢獻頁面（Ch.47、§30.2）

**狀態**：✅ 完成

```spec-sync
chapters: [30, 47]
status: implemented
decisions:
  - id: D001
    chapter: 47
    content: "實作 /my/contributions 頁面：統計卡三欄（貢獻積分/待認領/已認領）+ 個人/接力成績列表 + 編輯入口"
    spec_impact: false
    synced: true
  - id: D002
    chapter: 47
    content: "GET /api/athletes/me/contributions：solo/relay 合併回傳，relay claim_status 三態（unclaimed/claimed/partial）；relay 以兩段查詢解決 results→teams 型別系統無關聯問題"
    spec_impact: false
    synced: true
  - id: D003
    chapter: 30
    content: "AvatarDropdown 新增「我的貢獻」（IconHeartHandshake），Nav 層多查 unclaimed_count，待認領 > 0 顯示橘色數字 badge"
    spec_impact: false
    synced: true
```

**完成內容**：
- `GET /api/athletes/me/contributions`：solo + relay 合併，relay 三態 claim_status（unclaimed / claimed / partial）
- `/my/contributions/page.tsx`：Server Component，統計卡 + 成績列表 + 空狀態
- `PageContextStrip`：新增 `/my/contributions` 條目
- `AvatarDropdown`：新增「我的貢獻」選項（IconHeartHandshake），`contributionBadge > 0` 顯示橘色 badge（最大 99+）
- `Nav.tsx`：新增 unclaimed_count 查詢，傳入 `contributionBadge` prop

**技術決策**：
- Supabase 型別系統 `results → teams` 無關聯（`Relationships: []`），改為兩段查詢：先取 relay result IDs，再查 teams `IN (ids)`
- 個人成績「編輯」連結至 `/records`（行內編輯），因 `/results/:id/edit` 獨立頁尚未建立

**已知問題 ／ TODO**：
- `any` 型別轉換沿用既有模式（Supabase nested select 型別推斷缺失），eslint 已標記但為全專案一致問題
- 個人成績編輯入口目前指向 `/records`，日後補 `/results/:id/edit` 後可更新

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | `npx tsc --noEmit` | ✅ PASS | 零錯誤 |
| 2 | Nav 含 contributionBadge prop | ✅ PASS | 靜態分析確認 |
| 3 | `/my/contributions` 頁面載入 | ⚠️ 待驗證 | 需登入帳號 |
| 4 | 統計卡三欄數字正確 | ⚠️ 待驗證 | 需有貢獻成績的帳號 |
| 5 | Avatar 選單「我的貢獻」+ badge | ⚠️ 待驗證 | 需登入後點擊 avatar |

**異動檔案**：
- `src/app/api/athletes/me/contributions/route.ts`（新增）
- `src/app/(main)/my/contributions/page.tsx`（新增）
- `src/components/layout/PageContextStrip.tsx`
- `src/components/layout/AvatarDropdown.tsx`
- `src/components/layout/Nav.tsx`

---

### [2026-06-13] 統一成績新增頁面（§34.1–§34.8、§25.5、§45.1–§45.3、§20.11）

**狀態**：✅ 完成

```spec-sync
chapters: [20, 25, 34, 45]
status: implemented
decisions:
  - id: D001
    chapter: 34
    content: "ResultEntryPage 三 Tab 完整實作：Tab label 改為「個人成績/他人成績/接力成績」，移除 other Tab 重複說明框（NewResultForm 自帶）"
    spec_impact: false
    synced: true
  - id: D002
    chapter: 34
    content: "接力「這是我」勾選機制：radio 語意實作（勾選新的自動取消其他人），未勾選任何人亦合法"
    spec_impact: false
    synced: true
  - id: D003
    chapter: 20
    content: "AddDropdown 簡化為兩選項：「新增成績」(→/records/new) + 「新增賽事」(assistant+ only)，移除獨立的「他人成績」入口"
    spec_impact: true
    synced: true
  - id: D004
    chapter: 45
    content: "接力編輯頁加入實際編輯功能：隊名、未認領成員姓名、各成員分項時間；已認領成員姓名顯示為 readonly"
    spec_impact: false
    synced: true
```

**完成內容**：
- `AddDropdown.tsx`：移除「他人成績」選項，「自己的成績」改為「新增成績」→ `/records/new`
- `ResultEntryPage.tsx`：Tab label「幫他人新增」→「他人成績」；移除 other Tab 的重複說明框
- `NewRelayResultForm.tsx`：`updateMember` 加入 radio 語意，勾選 `is_me=true` 時自動清除其他成員的勾選
- `RelayEditForm.tsx`（新增）：隊名 + 各成員姓名（未認領可編輯，已認領 readonly）+ 分項時間
- `relay/[teamId]/edit/page.tsx`：兩段查詢（teams 和 team_members 分開），傳入 RelayEditForm
- `src/app/actions/results.ts`：新增 `updateRelayResult` server action

**技術決策**：
- Supabase 型別系統 `teams` table 的 `Relationships: []`，無法在單一 query 中 join `team_members`，改為兩段並行查詢（`Promise.all`）

**已知問題 ／ TODO**：
- relay edit page 的 `any` 型別轉換沿用原檔案既有模式，未修正（eslint @typescript-eslint/no-explicit-any）

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | `npx tsc --noEmit` | ✅ PASS | 零錯誤 |
| 2 | AddDropdown DOM（snapshot） | ✅ PASS | 未登入 NavAuthButtons 正常；AddDropdown 邏輯修改已確認（靜態分析）|
| 3 | RelayEditForm TypeScript 編譯 | ✅ PASS | 零錯誤 |
| 4 | `/records/new` 三 Tab | ⚠️ 待驗證 | 需登入帳號確認 Tab 文字正確 |
| 5 | 接力「這是我」radio 語意 | ⚠️ 待驗證 | 需登入帳號手動測試 |
| 6 | 接力編輯儲存功能 | ⚠️ 待驗證 | 需有接力成績的登入帳號 |

**異動檔案**：
- `src/components/layout/AddDropdown.tsx`
- `src/components/results/ResultEntryPage.tsx`
- `src/components/relay/NewRelayResultForm.tsx`
- `src/app/(main)/records/relay/[teamId]/edit/page.tsx`
- `src/app/(main)/records/relay/[teamId]/edit/RelayEditForm.tsx`（新增）
- `src/app/actions/results.ts`（新增 updateRelayResult）

---

### [2026-06-13] Avatar 下拉選單重構（§30.2）

**狀態**：✅ 完成

```spec-sync
chapters: [30]
status: implemented
decisions:
  - id: D001
    chapter: 30
    content: "Avatar 下拉選單重構：調整順序、加入 Tabler Icons（MIT），icon size=16 stroke=1.5，hover 時 icon 變 accent 色"
    spec_impact: false
    synced: true
```

**完成內容**：
- 安裝 `@tabler/icons-react@^3.44.0`
- 選單順序調整為：個人資料 → 我的公開頁 → 我的成績 → 關注名單 → （分隔線）→ 管理後台（assistant+）→ （分隔線）→ 登出
- 每個選項左側加對應 icon：`IconUserEdit / IconUser / IconTrophy / IconHeart / IconSettings / IconLogout`，size=16 stroke=1.5
- `.dropdown-icon` CSS class + `.dropdown-item:hover .dropdown-icon` 規則寫入 `globals.css`，hover 時 icon 由 `var(--ink-3)` 變 `var(--accent)`
- 分隔線改為 `0.5px solid rgba(136,146,160,0.2)`，取代舊的 `border-t border-border`

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | `npx tsc --noEmit` | ✅ PASS | 零錯誤 |
| 2 | 選單六個選項依序顯示 | ✅ PASS | DOM 驗證：個人資料/我的公開頁/我的成績/關注名單/管理後台/登出 |
| 3 | 每個選項有 icon | ✅ PASS | 全部 `hasIcon: true` |
| 4 | 管理後台顯示（assistant 帳號）| ✅ PASS | 確認出現 |
| 5 | hover icon 變薄荷綠 | ⚠️ 待驗證 | CSS 已設定，preview 解析度限制無法截圖確認 |

**異動檔案**：
- `src/components/layout/AvatarDropdown.tsx`
- `src/app/globals.css`
- `package.json`（新增 `@tabler/icons-react`）

---

### [2026-06-13] 「記錄」統一改為「成績」

**狀態**：✅ 完成

```spec-sync
chapters: [20]
status: implemented
decisions:
  - id: D001
    chapter: 20
    content: "所有 UI 文字中「我的紀錄」改為「我的成績」、「新增記錄」改為「新增成績」，URL 路徑 /records 不動"
    spec_impact: true
    synced: true
```

**完成內容**：
- `NavLinks.tsx`：`我的紀錄` → `我的成績`
- `AvatarDropdown.tsx`：`我的紀錄` → `我的成績`
- `PageContextStrip.tsx`：`我的紀錄`（/records、/my/results）→ `我的成績`；`新增記錄` → `新增成績`
- `/records/page.tsx`：metadata title `我的紀錄` → `我的成績`
- `/records/relay/[teamId]/edit/page.tsx`：`返回我的紀錄` → `返回我的成績`
- `athletes/[id]/page.tsx`：section header `成績紀錄` → `成績`

**異動檔案**：
- `src/components/layout/NavLinks.tsx`
- `src/components/layout/AvatarDropdown.tsx`
- `src/components/layout/PageContextStrip.tsx`
- `src/app/(main)/records/page.tsx`
- `src/app/(main)/records/relay/[teamId]/edit/page.tsx`
- `src/app/(main)/athletes/[id]/page.tsx`

---

### [2026-06-13] Nav 連結補齊與頁面主標清理

**狀態**：✅ 完成

```spec-sync
chapters: [20]
status: implemented
decisions:
  - id: D001
    chapter: 20
    content: "Nav 加入「我的紀錄」(/records) 和「關注名單」(/my/following) 連結，僅登入後顯示"
    spec_impact: true
    synced: true
  - id: D002
    chapter: 20
    content: "PageContextStrip 補 /my/following 條目；除最速榜外，有 PageContextStrip 的頁面移除 content 區的 <h1> 重複主標"
    spec_impact: true
    synced: true
  - id: D003
    chapter: 20
    content: "/records 頁移除「+ 新增成績」與「+ 接力成績」按鈕，以及空狀態的「新增第一筆成績」連結"
    spec_impact: true
    synced: true
```

**完成內容**：
- `NavLinks.tsx`：新增 `isLoggedIn` prop，登入後顯示「我的紀錄」`/records` 和「關注名單」`/my/following`
- `Nav.tsx`：傳 `isLoggedIn={!!user}` 給 `<NavLinks />`
- `PageContextStrip.tsx`：補齊 `/my/following`（title: '關注名單', sub: '你關注的選手 · 查看最佳成績'）
- `/records/page.tsx`：移除 h1 標題列（含「+ 新增成績」「+ 接力成績」按鈕）、空狀態「新增第一筆成績」link；改以計數 `{totalCount} 筆成績` 替代
- `/unclaimed/page.tsx`：移除 h1 主標，僅保留 PageContextStrip 的標題
- `/rankings/page.tsx`：移除 h1「排行榜」，改以 `{distance} · {count} 筆成績` 小字
- `/relay/page.tsx`：移除 h1 主標
- `/my/following/page.tsx`：移除 h1，有資料時顯示 `{count} 位` 小字

**技術決策**：
- `NavLinks` 從 Server Component 改為接受 `isLoggedIn` prop 的 Client Component，Auth 狀態由 `Nav.tsx`（Server Component）向下傳遞，避免 Client Component 直接呼叫 Supabase

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | `/records` 頁面載入 | ✅ PASS | PageContextStrip 顯示「我的紀錄」，無 h1 重複 |
| 2 | `/unclaimed` 頁面載入 | ✅ PASS | PageContextStrip 顯示「未認領成績」，無 h1 重複 |
| 3 | `/my/following` 頁面載入 | ✅ PASS | PageContextStrip 顯示「關注名單」，無 h1 重複 |
| 4 | Nav 登入後顯示「我的紀錄」「關注名單」| ✅ PASS | 已確認兩個連結出現在 Nav |

**異動檔案**：
- `src/components/layout/NavLinks.tsx`
- `src/components/layout/Nav.tsx`
- `src/components/layout/PageContextStrip.tsx`
- `src/app/(main)/records/page.tsx`
- `src/app/(main)/unclaimed/page.tsx`
- `src/app/(main)/rankings/page.tsx`
- `src/app/(main)/relay/page.tsx`
- `src/app/(main)/my/following/page.tsx`

---

### [2026-06-13] 貢獻積分系統（spec §46）

**狀態**：✅ 完成

```spec-sync
chapters: [46]
status: implemented
decisions:
  - id: D001
    chapter: 46
    content: "撤銷積分用 DELETE contribution_events，trigger 自動扣回，不需獨立 revoke API"
    spec_impact: false
    synced: true
  - id: D002
    chapter: 46
    content: "other_claimed 由 results UPDATE trigger 觸發，不需修改 approve_claim function"
    spec_impact: false
    synced: true
  - id: D003
    chapter: 46
    content: "claimedByMeCount 於個人頁即時計算（SELECT COUNT），不做反正規化快取，避免多一個 trigger"
    spec_impact: false
    synced: true
```

**完成內容**：
- 新增 migration `20260613000002_contribution_events.sql`：
  - `athletes.contribution_score INT NOT NULL DEFAULT 0`
  - `contribution_events` 資料表（id / athlete_id / event_type / result_id / points / revoke_reason / created_at）
  - RLS：公開讀取，admin 才能 DELETE
  - `sync_contribution_score` trigger：INSERT 加分、DELETE 扣回（最低 0）
  - `handle_result_contribution` trigger：results INSERT → `add_self`(+1) 或 `add_other`(+3)，官方成績跳過
  - `handle_claim_contribution` trigger：results claim_status → 'claimed' → `other_claimed`(+2)，官方 / 自填者認領自己跳過
  - Index `idx_contribution_events_athlete`
- 更新 `src/types/database.ts`：
  - `athletes.Row` 加 `contribution_score: number`
  - 新增 `contribution_events` 完整型別
- 更新 `src/app/(main)/athletes/[id]/page.tsx`：
  - `athletes` 查詢新增 `contribution_score`
  - 新增 `claimedByMeCount` 查詢
  - Hero 區塊顯示貢獻值與「已幫 N 筆成績找到主人」（§46.6 顯示條件）
- 更新 `docs/database.md`：2.5 節、migration 清單、觸發積分 trigger 說明

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | `npx tsc --noEmit` | ✅ PASS | 零錯誤 |
| 2 | DB 直查 athletes.contribution_score | ✅ PASS | 欄位存在，default 0 正確 |
| 3 | `/athletes/[自己]` Hero 顯示貢獻值 | ✅ PASS | isSelf 路徑：「貢獻值 0 分　已幫 0 筆成績找到主人」正確顯示 |
| 4 | `/athletes/[他人]`（score=0）貢獻區塊隱藏 | ✅ PASS | 非自己且 0 分時區塊不渲染，符合 §46.6 |
| 5 | console errors | ✅ PASS | 兩頁均無 JS 錯誤 |

**待驗證**（trigger 路徑，需實際新增成績後核對 DB）：
- ⚠️ 新增自己成績後確認 `add_self` (+1) 事件插入、contribution_score 更新
- ⚠️ 幫他人新增成績後確認 `add_other` (+3) 事件插入
- ⚠️ approve_claim 後確認 `other_claimed` (+2) 事件產生

**異動檔案**：
- `supabase/migrations/20260613000002_contribution_events.sql`
- `src/types/database.ts`
- `src/app/(main)/athletes/[id]/page.tsx`
- `docs/database.md`

---

### [2026-06-13] results.created_by 欄位 + migration

**狀態**：✅ 完成

```spec-sync
chapters: []
status: implemented
decisions:
  - id: D001
    chapter: 0
    content: "results 表新增 created_by 欄位，記錄新增該筆成績的使用者（auth.uid()），方便未來稽核與 admin 追蹤"
    spec_impact: false
    synced: true
```

**完成內容**：
- 新增 migration `20260613000001_results_created_by.sql`：`results` 表加入 `created_by uuid REFERENCES athletes(id) ON DELETE SET NULL`
- 更新 `src/types/database.ts`：`Row` 加 `created_by: string | null`，`Insert` 加 `created_by?: string | null`
- 更新 `src/app/actions/results.ts`：三個 `results.insert()`（自己的 solo、幫他人 solo、relay）均帶入 `created_by: user.id`
- 更新 `src/app/actions/official.ts`：官方成績 insert 帶入 `created_by: user.id`
- 更新 `docs/database.md`：欄位說明表 + migration 清單

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | `npx tsc --noEmit` | ✅ PASS | 零錯誤 |

**待驗證**（需 Supabase migration 執行後才能在 UI 測試）：
- ⚠️ 新增成績後確認 `created_by` 有寫入

**異動檔案**：
- `supabase/migrations/20260613000001_results_created_by.sql`
- `src/types/database.ts`
- `src/app/actions/results.ts`
- `src/app/actions/official.ts`
- `docs/database.md`

---

### [2026-06-13] 規格調整：三 Tab 統一入口 + Nav 主連結 + 頁面清理

**狀態**：✅ 完成

```spec-sync
chapters: [20, 34]
status: implemented
decisions:
  - id: D-UI-01
    chapter: 20
    content: "ResultEntryPage 加入第三個 Tab「幫他人新增」，?for=other 與 ?tab=other 皆導向此 Tab，不再有獨立版面"
    spec_impact: true
    synced: true
  - id: D-UI-02
    chapter: 34
    content: "NavLinks 登入後顯示「我的紀錄」與「關注名單」主連結，Nav.tsx 傳入 isLoggedIn prop"
    spec_impact: true
    synced: true
  - id: D-UI-03
    chapter: 20
    content: "/records 頁移除頁面內新增按鈕與空狀態連結，入口統一由 Nav +新增 下拉負責"
    spec_impact: false
    synced: true
```

**完成內容**：
- `ResultEntryPage`：Tab 由兩個擴充為三個（個人成績 / 幫他人新增 / 接力成績）；`?for=other` 向後相容，導向 `other` Tab
- `/records/new/page.tsx`：移除 `forOther` 獨立版面，統一走 `ResultEntryPage`；`defaultTab` 支援 `solo | other | relay`
- `/records/page.tsx`：移除頁頭新增按鈕（`+ 新增成績` / `+ 接力成績`）與空狀態「新增第一筆成績」連結
- `NavLinks.tsx`：新增 `isLoggedIn` prop；登入後在主選單顯示「我的紀錄」(`/records`) 與「關注名單」(`/my/following`)
- `Nav.tsx`：傳入 `isLoggedIn={!!user}` 給 NavLinks

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | TypeScript 型別檢查 | ✅ PASS | 無錯誤 |
| 2 | `/records/new` 三 Tab 顯示 | ✅ PASS | 截圖確認 |
| 3 | Nav 顯示「我的紀錄」「關注名單」| ✅ PASS | 截圖確認（登入狀態）|
| 4 | `/records` 無新增按鈕 | ✅ PASS | 截圖確認 |
| 5 | `?for=other` 向後相容 | ⚠️ 待驗證 | 需瀏覽器點擊確認 Tab 預選正確 |

**異動檔案**：
- `src/components/results/ResultEntryPage.tsx`（修改）
- `src/app/(main)/records/new/page.tsx`（修改）
- `src/app/(main)/records/page.tsx`（修改）
- `src/components/layout/NavLinks.tsx`（修改）
- `src/components/layout/Nav.tsx`（修改）

---

### [2026-06-12] §20.11 統一成績新增入口（ResultEntryPage）

**狀態**：✅ 完成

```spec-sync
chapters: [20]
status: implemented
decisions:
  - id: D-ENTRY-01
    chapter: 20
    content: "§20.11 新增成績入口統一為 /records/new，個人／接力以 Tab 切換；/records/relay/new 設 308 permanentRedirect 至 /records/new?tab=relay"
    spec_impact: false
    synced: true
  - id: D-ENTRY-02
    chapter: 20
    content: "Tab 切換採雙表單同時 mount + CSS hidden 方案，確保切換 Tab 不重置 RaceEditionPicker 等已填欄位"
    spec_impact: false
    synced: true
```

**完成內容**：
- `ResultEntryPage` Client Component（`src/components/results/ResultEntryPage.tsx`）
  - 個人成績 / 接力成績 Tab，預設可由 `defaultTab` prop 控制
  - 兩個表單同時 mount，inactive tab 以 `hidden` class 隱藏，切換不重置 state
- `/records/new/page.tsx` 改用 `ResultEntryPage`，支援 `?tab=relay` query param 預選接力 Tab
- `?for=other` 幫他人新增模式保留獨立版面（無 Tab，非統一入口）
- `/records/relay/new/page.tsx` 改為 `permanentRedirect('/records/new?tab=relay')`（308）

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | TypeScript 型別檢查 | ✅ PASS | 無錯誤 |
| 2 | `/records/new` 個人成績 Tab 渲染 | ✅ PASS | 表單正常顯示 |
| 3 | 點擊接力成績 Tab | ✅ PASS | 切換後接力表單完整顯示 |
| 4 | `/records/relay/new` 308 redirect | ✅ PASS | 已登入時導向 `/records/new?tab=relay` |

**異動檔案**：
- `src/components/results/ResultEntryPage.tsx`（新增）
- `src/app/(main)/records/new/page.tsx`（修改）
- `src/app/(main)/records/relay/new/page.tsx`（改為 permanentRedirect）

---

### [2026-06-12] 賽事清單台灣優先排序

**狀態**：✅ 完成

```spec-sync
chapters: [25]
status: implemented
decisions:
  - id: D-RACESORT-01
    chapter: 25
    content: "RaceEditionPicker 下拉清單改為台灣優先排序：已知品牌（Challenge Taiwan / IRONMAN / 普悠瑪 / Force / 玩賽樂園）→ 其他台灣地區賽事 → 國外賽事"
    spec_impact: true
    synced: true
  - id: D-RACESORT-02
    chapter: 25
    content: "台灣場次判斷目前用 heuristic（名稱含中文、含 Taiwan、city 含台灣城市）；暫不加 country 欄位，等賽事資料量增加後補"
    spec_impact: false
    synced: true
```

**完成內容**：
- `RaceEditionPicker` 加入 `isTaiwanRace()` + `raceRank()` + `sortRaces()` 三個 helper
- 排序優先順序：
  1. Challenge Taiwan（名稱 ILIKE `challenge taiwan`）
  2. IRONMAN 台灣場（IRONMAN + isTaiwanRace）
  3. 普悠瑪
  4. Force 系列（台灣場）
  5. 玩賽樂園
  6. 其他台灣地區賽事（含中文字、或 city 含台灣城市）
  7. 國外賽事
- `isTaiwanRace` 判斷邏輯：名稱含中文字 `/[一-鿿]/`、名稱含 "Taiwan"（不分大小寫）、或 `city` 欄位含台灣城市關鍵字
- 排序在 mount 時執行一次（`setAllRaces(sortRaces(data))`），client-side，不影響 API

**已知問題 ／ TODO**：
- heuristic 判斷對「純英文名稱 + 未填 city」的台灣賽事會誤判為國外。長期解法：`races` 表加 `country` 欄位（ISO 3166-1 alpha-3），暫緩。

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | TypeScript 型別檢查 | ✅ PASS | 無錯誤 |
| 2 | IRONMAN 非台灣場排至國外 | ⚠️ 待驗證 | 需有非台灣 IRONMAN 資料才能確認 |

**異動檔案**：
- `src/components/races/RaceEditionPicker.tsx`（新增 `isTaiwanRace` / `raceRank` / `sortRaces`）

---

### [2026-06-12] RaceEditionPicker 元件 + 相關 API

**狀態**：✅ 完成

```spec-sync
chapters: [25]
status: implemented
decisions:
  - id: D-PICKER-01
    chapter: 25
    content: "§25.5 RaceEditionPicker 實作為獨立 Client Component，取代兩個表單的 select。新增 GET /api/races/search?q= 與 GET /api/races/:id/editions 兩支 API"
    spec_impact: false
    synced: true
```

**完成內容**：
- `GET /api/races/search?q=` — ILIKE 搜尋 races 表，最多 8 筆
- `GET /api/races/:id/editions` — 回傳依年份分組的 editions（含距離 tags）
- `RaceEditionPicker` Client Component（`src/components/races/RaceEditionPicker.tsx`）
  - Step 1：搜尋框，debounce 300ms，下拉最多 8 筆
  - Step 2：年份清單，最新加「最新」badge，右側顯示距離 tags
  - 已選狀態：chip 顯示「賽事名稱（YYYY）」，附「更改 / ✕」
- `NewResultForm.tsx`、`NewRelayResultForm.tsx` 改用 RaceEditionPicker
- 移除兩個表單中的舊 select + 距離選擇邏輯（呼叫 `/api/races` 的 useEffect 已移除）
- 賽事清單依台灣優先順序排列：Challenge Taiwan → IRONMAN（台灣場）→ 普悠瑪 → Force → 玩賽樂園 → 其他台灣 → 國外

**已知問題 ／ TODO**：
- 台灣／國外判斷目前以名稱（含中文字、含 "Taiwan"）及 `city` 欄位做 heuristic。長期應在 `races` 表加 `country` 欄位（ISO 代碼）讓排序有明確依據。**暫緩，等賽事資料量增加後一併處理。**

**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | TypeScript 型別檢查 | ✅ PASS | 無錯誤 |
| 2 | Dev server 啟動 | ✅ PASS | 無 console 錯誤 |
| 3 | /records/new 搜尋互動 | ⚠️ 待驗證 | 需登入帳號手動測試 |

**異動檔案**：
- `src/app/api/races/search/route.ts`（新增）
- `src/app/api/races/[id]/editions/route.ts`（新增）
- `src/components/races/RaceEditionPicker.tsx`（新增）
- `src/components/results/NewResultForm.tsx`（修改）
- `src/components/relay/NewRelayResultForm.tsx`（修改）

---

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
    synced: true
  - id: D-VERIFY-02
    chapter: 28
    content: "Ch.28 新增 open:email_sent 狀態對應 AuthModal 的 emailSent 流程；ModalEmailSent 元件提供已驗證→登入快速路徑"
    spec_impact: true
    synced: true
  - id: D-VERIFY-03
    chapter: 8
    content: "GlobalVerifyBanner：server component 檢查 email_confirmed_at，未驗證登入者在 (main) 頁面頂部顯示 warn bar，可 dismiss（sessionStorage）"
    spec_impact: true
    synced: true
  - id: D-VERIFY-04
    chapter: 0
    content: "POST /api/auth/resend-verification 呼叫 supabase.auth.resend({ type: 'signup', email })；rate limit 60s 由 client localStorage 管理"
    spec_impact: false
    synced: true
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
- ✅ Supabase Dashboard「Confirm email」已確認開啟（2026-06-12）
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
    synced: true
  - id: D-VER-02
    chapter: 0
    content: "Patch 版號格式為三位數零補齊（0.2.001…0.2.999），每次 git commit 由 pre-commit hook 自動遞增"
    spec_impact: false
    synced: true
  - id: D-VER-03
    chapter: 0
    content: "Minor / major 版號由開發者手動執行 npm run version:minor / version:major 控制，不自動觸發"
    spec_impact: false
    synced: true
  - id: D-VER-04
    chapter: 0
    content: "使用者頁面移除『已公證』/『公證』顯示標籤；certificate 型別與資料庫欄位保留，Admin 頁面仍顯示"
    spec_impact: false
    synced: true
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
    synced: true
  - id: D045-02
    chapter: 45
    content: "§45.2 results 加 bib_number TEXT 欄位，新增表單可填，成績詳頁顯示 #號碼"
    spec_impact: false
    synced: true
  - id: D045-03
    chapter: 45
    content: "§45.3 新增 /records/relay/:teamId/edit 頁面，含輸入隊名確認的刪除表單；/records 接力卡片加「編輯」按鈕"
    spec_impact: false
    synced: true
  - id: D045-04
    chapter: 45
    content: "§45.4 賽事選單標籤從 '賽事 年份' 改為 '賽事（年份）'，覆蓋 NewResultForm、NewRelayResultForm、admin/results 篩選"
    spec_impact: false
    synced: true
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
    synced: true
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
    synced: true
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
    synced: true
  - id: D002
    chapter: 43
    content: "Footer 回報入口作為 Client Component 獨立於 Server layout，ReportModal 共用元件覆蓋所有入口"
    spec_impact: false
    synced: true
  - id: D003
    chapter: 43
    content: "Admin /admin/reports 以 Server Component 一次撈全部，前端 client-side 篩選狀態 / 類別，避免多次 API 請求"
    spec_impact: false
    synced: true
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
    synced: true
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
    synced: true
  - id: D004
    chapter: 44
    content: "屆次頁成績列表設計為獨立 Client Component（EditionResultsSection），Server Component 查詢後傳入，避免 client-side fetch 延遲"
    spec_impact: false
    synced: true
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
    synced: true
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
    synced: true
  - id: D002
    chapter: 40
    content: "被刪除帳號同步硬刪除 auth.users，被刪 email 可重新註冊"
    spec_impact: true
    synced: true
  - id: D003
    chapter: 0
    content: "service role client 獨立檔案 lib/supabase/admin.ts，僅 import 進 server actions"
    spec_impact: false
    synced: true
  - id: D004
    chapter: 0
    content: "國家代碼統一 ISO 3166-1 alpha-3（TWN／DEU…），系列內排序國碼改為三碼"
    spec_impact: false
    synced: true
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
    synced: true
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
    synced: true
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
    synced: true
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
    synced: true
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
    synced: true
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
    synced: true
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
    synced: true
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
    synced: true
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
    synced: true
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
    synced: true
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
    synced: true
  - id: D002
    chapter: 40
    content: "is_assistant_or_above() RPC 在 Server Action 層驗證（middleware + action 雙重保護）"
    spec_impact: false
    synced: true
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
    synced: true
  - id: D002
    chapter: 16
    content: "進榜條件改為 a.name IS NOT NULL（取代原 nickname IS NOT NULL）"
    spec_impact: false
    synced: true
  - id: D003
    chapter: 16
    content: "現有會員遷移：migration 內 UPDATE athletes SET name = nickname WHERE nickname IS NOT NULL"
    spec_impact: false
    synced: true
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
    synced: true
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
    synced: true
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
    synced: true
  - id: D002
    chapter: 21
    content: "解除關聯：official + claimed 成績顯示 UnlinkButton，需二次確認"
    spec_impact: false
    synced: true
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
    synced: true
  - id: D002
    chapter: 14
    content: "最速榜升級：DistanceTabs（226/113/51.5/Sprint）、Sub 分界線、badge 顯示（未認領/認領中）"
    spec_impact: false
    synced: true
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
    synced: true
  - id: D002
    chapter: 25
    content: "IRONMAN_TAIWAN 與 IRONMAN_70_3 合併顯示為同一 IRONMAN 群組；台灣場地優先排列"
    spec_impact: false
    synced: true
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
    synced: true
  - id: D002
    chapter: 20
    content: "成員 split_seconds 只計純運動時間，不含換區"
    spec_impact: false
    synced: true
  - id: D003
    chapter: 20
    content: "claim_status 狀態轉換僅透過 RPC 函式，不直接 UPDATE"
    spec_impact: false
    synced: true
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
