# docs/features.md — 功能規格

> 說明每個功能「是什麼、誰能用、入口在哪、行為規則」。
> 這份文件由 **Claude.ai** 在規格確認後同步輸出，Claude Code 不需要自行更新。
> 實作細節（元件路徑、migration 檔名、測試記錄）請見 `devlog.md`。

---

## 1. 導覽列（Nav）

### 1.1 連結清單

| 連結 | 路徑 / 行為 | 顯示條件 |
|------|------------|---------|
| 最速榜 | `/leaderboard` | 永遠顯示 |
| 排行榜 | `/rankings` | 永遠顯示 |
| 接力榜 | `/relay` | 永遠顯示 |
| 未認領 | `/unclaimed` | 永遠顯示 |
| 管理（下拉） | 見 1.2 | 已登入且角色 ≥ assistant |
| 我的紀錄 | `/records` | 已登入 |
| ＋ 新增 | 下拉選單（見 1.3）| 永遠顯示 |
| Avatar | 下拉選單（見 1.4）| 已登入 |
| 登入 | Auth Modal（不跳頁）| 未登入 |

> **未登入 Nav 行為**：「登入」與「新增」均觸發 Auth Modal，不導向 `/login`。`/login` 保留供外部連結直接進入。

### 1.2 管理下拉選單

**顯示條件**：已登入且角色 ≥ assistant

| 選項 | 路徑 |
|------|------|
| 審核中心 | `/admin` |
| 賽事管理 | `/admin/races` |

### 1.3「＋ 新增」下拉選單（第 34 章）

| 選項 | 路徑 | 顯示條件 |
|------|------|---------|
| 自己的成績 | `/records/new` | 所有已登入用戶 |
| 他人成績 | `/records/new?for=other` | 所有已登入用戶 |
| 新增賽事 | `/races/new`（助手後台直接建立）| 限 assistant+（分隔線區隔）|

一般用戶申請新賽事的入口：成績表單搜尋無結果 → 「申請新增賽事」；或 `/races` 頁面底部 CTA。

**未登入**：點擊前兩個選項均觸發 Auth Modal（intent `new_result` / `new_result_for_other`），登入後導向對應路徑。

### 1.4 Avatar 下拉選單（第 30、44 章）

**顯示條件**：已登入

**Avatar 顯示規則**：

| 狀態 | 顯示 |
|------|------|
| 已上傳頭像 | 圓形頭像縮圖 |
| 未上傳頭像（有 name）| 姓名第一個字 |
| 未上傳頭像（無 name 且無 nickname）| 人形 icon |

**選單項目**：

| 選項 | 路徑 | 顯示條件 |
|------|------|---------|
| 姓名 / Email（標頭，不可點擊）| — | 永遠 |
| 我的紀錄 | `/records` | 永遠 |
| 關注名單 (N) | `/my/following` | 永遠；N 為追蹤人數，0 時不顯示 badge |
| 個人資料 | `/profile` | 永遠 |
| 我的公開頁 | `/athletes/:id`（登入者自己的 id）| 永遠 |
| 管理後台 | `/admin` | assistant+ |
| 登出 | — | 永遠 |

### 1.5 Nav Active State（第 32 章）

**機制**：當前路徑對應連結顯示 active 狀態（底線 + 白色文字）。

**Page Context Strip**：Nav 正下方的深色條帶，顯示當前頁面標題與副標。

| 路徑 | 標題 | 副標 |
|------|------|------|
| /leaderboard | 最速榜 | 台灣選手 · 個人最佳 · 跨賽事 |
| /rankings | 排行榜 | 依距離篩選 · 完整成績記錄 |
| /unclaimed | 未認領成績 | 搜尋你的名字，認領屬於你的成績 |
| /races | 賽事資料庫 | 台灣鐵人三項賽事 · 路線 · 天氣 · 歷史成績 |
| /records | 我的紀錄 | 個人成績歷史 |
| /profile | 個人資料 | 帳號設定與公開資訊 |
| /admin | 管理後台 | 賽事資料 · 公證審核 |

---

## 2. 管理區（Admin）

**存取條件**：已登入且角色 ≥ assistant，否則 redirect → `/login`
**Layout**：獨立於 `(main)` route group，自有 layout

### 2.1 頁面內導航（AdminTabs）

| Tab | 路徑 |
|-----|------|
| 審核中心 | `/admin` |
| 問題回報 | `/admin/reports` |
| 賽事管理 | `/admin/races` |
| 官方成績 | `/admin/results` |
| 賽事審核 | `/admin/races/review` |
| 會員名單 | `/admin/members` |

### 2.2 審核中心（`/admin`）

- 列出所有 `claim_status = 'pending'` 的認領申請
- 審核通過：`claim_status → claimed`
- 審核拒絕：`claim_status → unclaimed`，`athlete_id` 清空
- 強制重設：已認領成績強制回到 `unclaimed`（誤認領處理）

### 2.3 官方成績管理（`/admin/results`）

**操作流程**：選擇賽事屆次（賽事 → 年份 → 距離）→ 填入姓名、性別、時間 → 送出

**業務規則**：
- 新增成績：`source_credibility = 'official'`，`claim_status = 'unclaimed'`，`athlete_id = null`
- 刪除僅允許 `claim_status = 'unclaimed'` 的成績（RLS 保護）

### 2.4 賽事管理（`/admin/races`）

| 路徑 | 功能 |
|------|------|
| `/admin/races` | 賽事列表 + 新增賽事 Panel |
| `/admin/races/[id]` | 賽事詳情 + 屆次列表 + 新增屆次 Panel + 編輯賽事 |

**距離標示**（全站統一）：

| DB 值 | 顯示標示 | 標準距離（游泳 m / 騎車 km / 跑步 km）|
|-------|---------|--------------------------------------|
| `full` | 226 | 3800 / 180 / 42.2 |
| `70.3` | 113 | 1900 / 90 / 21.1 |
| `olympic` | 51.5 | 1500 / 40 / 10 |
| `sprint` | Sprint | 750 / 20 / 5 |

**屆次概念**：屆次 = 年份，一個屆次可含多個距離。DB 中每個 `race_id + year + distance_category` 是一筆 `race_editions` 記錄。

### 2.5 賽事後台審核（`/admin/races/review`，第 35 章）

| Tab | 說明 |
|-----|------|
| 賽事申請 | 用戶申請的新 RACE（slug 留空，審核時必填）|
| 屆次審核 | 用戶新增的 RACE_EDITION（確認日期距離）|
| 待審 | 舊有邏輯保留（舉報等）|
| 舉報 | `report_count` 達閾值的賽事 |
| 已核准 | 歷史核准記錄 |
| 已拒絕 | 歷史拒絕記錄 |

**賽事申請審核關鍵步驟**：助手必須填入 slug（系統提供建議，可修改）並通過唯一性驗證後才能核准。核准後 `RACE.slug` 寫入，詳情頁 `/races/:slug` 上線。

**觸發邏輯**：
- 首次提交用戶 → `review_status = pending_review`，通知助手
- 已通過首次審核的用戶 → `review_status = approved`（直接），進背景隊列抽查
- 被舉報達 3 次 → `review_status = pending_review`（重審），通知助手

### 2.6 會員名單（`/admin/members`，第 40 章）

**搜尋**：name / nickname / Email 即時篩選 + 角色下拉 + 狀態下拉（全部 / 正常 / 已停權 / 已刪除）。已刪除帳號預設隱藏。

**詳情 Popup**：檢視模式 + 編輯模式切換

| 可編輯欄位 | 備注 |
|-----------|------|
| name / nickname / Email | Email 修改需輸入確認文字 |
| gender / birth_year / nationality / bio | |
| 角色（選手 ↔ 助手）| 不能降低自己；不能指派 admin（限 admin 操作）|

**操作按鈕**（依帳號狀態顯示）：

| 帳號狀態 | 可用操作 | 所需角色 |
|---------|---------|---------|
| 正常 | 停權 / 刪除 | 停權：assistant+；刪除：admin only |
| 已停權 | 解除停權 / 刪除 | 同上 |
| 已刪除 | 復原（30 天內）| admin only |

**停權效果**：無法登入；成績從排行榜隱藏；資料保留；可解除復原。

**強制刪除**：`claimed` 成績變 `unlinked`；`self_reported` 1 個月後清除；需輸入「確認刪除 [Email]」確認文字。

**ATHLETE 新增欄位**：`suspended_at` / `suspended_by` / `suspend_reason`

---

## 3. 公開頁面

### 3.1 最速榜（`/leaderboard`，第 23 章）

每位選手只取歷史最佳成績（best-per-athlete 去重），依完賽時間排序。

**頁面層**：「台灣選手」小標 + 「最速榜」大標題（無副標，留呼吸空間）。

**卡片層**：距離大字標題（如「226 全距離」）+ 副標說明「個人最佳 · 跨賽事 · 僅供參考」（只出現一次）。

**URL 參數**：`?distance=full`（預設）/ `70.3` / `olympic` / `sprint`
**進榜條件**：`is_public = true` + `claim_status IN ('unclaimed', 'claimed')` + `name IS NOT NULL` + `result_type = 'solo'`
**去重邏輯**：有帳號的選手以 `athlete_id` 去重；未認領的以 `display_name` 去重；各取最小 `total_seconds`
**顯示名稱優先順序**：`COALESCE(nickname, name, athlete_name_snapshot)`

**`.tlb-row` 五欄**：名次 36px / 姓名 1fr / 時間 110px / 賽事 1fr / 追蹤 32px
- 姓名欄：已認領成績可點擊 → `/athletes/:id`
- 追蹤欄：FollowButton `size="sm"`；手機版（≤600px）隱藏

### 3.2 排行榜（`/rankings`）

**URL 參數**：`?distance=full`（必填，無此參數自動 redirect）
**距離選擇**：226 / 113 / 51.5 / Sprint，無「所有距離」選項

### 3.3 未認領（`/unclaimed`）

**排序**：標記人數降冪 → 完賽時間升冪

**兩個操作入口**：
1. **認領**（ClaimButton）：`claim_result()` RPC → `claim_status = pending`；顯示條件：`athletes.name` 與 `athlete_name_snapshot` 正規化相符（`trim().toLowerCase().replace(/\s+/g, '')`）
2. **標記通知**（TagButton）：新增 `claim_tags` 記錄 → Web Share API

### 3.4 成績詳情（`/results/[id]`）

- 已認領成績：選手姓名可點擊 → `/athletes/:id`
- 未認領成績：顯示 `athlete_name_snapshot`，不提供連結
- FollowButton `size="md"`（已認領且非本人）
- Footer 小連結：「回報成績錯誤」→ 問題回報 Modal（類別預帶 `result_error`）

### 3.5 賽事資料庫（`/races`，第 33 章）

**顯示規則**：

| RACE.status | RACE.slug | 顯示方式 |
|------------|----------|---------|
| `active` | 有值 | 正常列出，名稱可點擊 → 詳情頁 |
| `pending_review` | null | 列出，顯示「審核中」badge，名稱不可點擊 |
| `rejected` / `inactive` | 任意 | 不顯示 |

頁面底部「找不到你的賽事？→ 申請新增」CTA（已登入才顯示）。

### 3.6 賽事頁（`/races/:slug`，第 41 章）

| 區塊 | 內容 |
|------|------|
| Hero | 中文名稱、英文名稱、系列 badge、地點、主辦、報名按鈕（有 `registration_url` 才顯示）|
| 屆次列表 | 依年份降序；每列：年份、日期、距離 badges、成績筆數、Wish List 計數；整列可點擊 |

### 3.7 屆次頁（`/races/:slug/:year`，第 41 章）

**五個區塊**：

**① 屆次 Hero**：賽事名稱 + 年份 + 日期 + 距離 + 地點；麵包屑導覽

**② 天氣卡片**（有 `weather_data` 才顯示，未來屆次不顯示）：溫度 / 體感 / 天氣狀況 / 風速 / 濕度 / 水溫

天氣自動抓取：Open-Meteo Historical API（免費），新增過去屆次時自動觸發。

**③ Wish List 互動**：

| 屆次狀態 | 顯示按鈕 |
|---------|---------|
| 未來屆次 | 想參加 + 參加過 |
| 過去屆次 | 只顯示「參加過」|
| 距今 30 天內 | 兩個都顯示 |

- 未登入：Auth Modal，intent `race_wishlist` / `race_attended`
- 「參加過」且無成績：toast「記得登錄你的成績！」附登錄連結

**④ 成績列表**：
- 欄位：名次 / 姓名（已認領可點擊 → `/athletes/:id`）/ 完賽時間 / 性別 / ClaimButton / TagButton / FollowButton
- 搜尋框（client-side 即時篩選）
- 多距離：頁籤切換，預設最長距離

**⑤ 歷屆對比**：成績筆數、最速紀錄（男/女）、天氣概況；3 屆以上顯示折線圖（recharts）

---

## 4. 登入用戶功能

### 4.1 我的成績（`/records`）

列出本人所有成績，含 `pending` 狀態（顯示「待審核」）。

**自填成績**（`source_credibility = 'self_reported'`）：可編輯 / 刪除

**官方成績**（`source_credibility = 'official'` + `claim_status = 'claimed'`）：顯示「解除關聯」，呼叫 `unlink_result()` RPC。

### 4.2 新增成績（`/records/new`）

**我的成績模式**（預設）：`athlete_id` 綁定登入者，`claim_status = 'claimed'`

**幫他人新增模式**（`?for=other`，所有已登入用戶）：`athlete_id = null`，`claim_status = 'unclaimed'`，`is_public = true`（固定）

**公開/私人規則**：公開成績需 `name` + `gender` + `birth_year` + `nationality` 全填。

**賽事選擇流程（搜尋優先，第 42-A 章）**：
1. 輸入關鍵字搜尋（debounce 300ms），回傳 active + pending_review 的賽事
2. 找到 RACE → 選屆次；找不到年份 → 「新增本屆次」
3. 找不到 RACE → 顯示相關系列推測（關鍵字比對 series）
4. 有相關系列 → 選用現有 RACE 新增屆次；或在此系列下新建 RACE
5. 完全無匹配 → 問題回報（類別預帶「新增賽事」）

### 4.3 個人資料（`/profile`，第 31 章）

Inline 編輯，Enter 儲存，Escape 取消。

| 欄位 | 進榜必填 | 說明 |
|------|---------|------|
| 頭像 | 否 | |
| 姓名（name）| 是 | 真實姓名，認領比對與進榜依據 |
| 暱稱（nickname）| 否 | 選填，填寫後排行榜優先顯示 |
| 性別 | 是 | |
| 出生年份 | 是 | |
| 國籍 | 是 | |
| 自我介紹 | 否 | |
| 允許被搜尋 | — | 開關，預設開；關閉後不出現在全站選手搜尋結果 |
| Email | 唯讀 | |

### 4.4 Wish List（`/my/wishlist`，第 36 章，待實作）

顯示選手所有「想參加」的賽事，按日期排序。

---

## 5. 認證流程

### 5.1 Auth Modal intent 清單

| intent | payload | 登入後行為 |
|--------|---------|-----------|
| `login`（預設）| — | 留在當前頁 |
| `new_result` | — | 導向 `/records/new` |
| `new_result_for_other` | — | 導向 `/records/new?for=other` |
| `claim` | `{ resultId }` | 導向 `/results/:resultId/claim` |
| `follow` | `{ athleteId }` | POST follow → 星星變實心；失敗靜默 |
| `race_wishlist` | `{ editionId }` | 完成 wishlist 標記，回賽事頁 |
| `race_attended` | `{ editionId }` | 完成 attended 標記，顯示成績登錄提示 |

### 5.2 Route Redirect 規則

| 原路徑 | Redirect 至 |
|--------|------------|
| `/my/profile` | `/profile` |
| `/my/results` | `/records` |

---

## 6. 接力功能（第 20 章）

### 6.1 接力榜（`/relay`）

獨立排行榜，篩選：距離、組別（男子/女子/混合）、賽事。

### 6.2 隊伍頁（`/teams/[id]`）

**認領按鈕顯示條件**（全部滿足）：
1. 已登入
2. 成員 `claim_status = 'unclaimed'` 且 `athlete_id IS NULL`
3. 成員的 `athlete_name_snapshot` 與登入者 `athletes.name` 正規化相符
4. 登入者尚未認領此隊伍中的任一成員

### 6.3 新增接力成績（`/records/relay/new`）

選擇賽事 → 填入總時間 / 組別 / 隊名 → 設定成員（最多 3 位）→ 勾選「這是我」自動認領 → 提交

---

## 7. 資料模型核心規則

### 7.1 ATHLETE 核心欄位

| 欄位 | 型別 | 說明 |
|------|------|------|
| `name` | string nullable | 真實姓名，進榜必填，認領比對依據 |
| `nickname` | string nullable | 顯示暱稱，選填；排行榜顯示優先於 name |
| `is_searchable` | boolean | 預設 true；false 時不出現全站選手搜尋；未成年強制 false |
| `suspended_at` | timestamp nullable | 停權時間；null = 正常 |
| `suspended_by` | uuid FK nullable | 執行停權的助手帳號 |
| `suspend_reason` | text nullable | 停權原因 |
| `role` | string | `athlete` / `assistant` / `admin` |
| `deleted_at` | timestamp nullable | 軟刪除，1 個月後永久清除 |

**顯示名稱優先順序**：`COALESCE(nickname, name, athlete_name_snapshot)`

### 7.2 認領狀態流程

```
unclaimed → pending（申請認領）→ claimed（審核通過）
claimed → unlinked（解除關聯）→ unclaimed
```

### 7.3 source_credibility 分層

| 值 | 說明 |
|----|------|
| `official` | 策展層助手建立 |
| `certificate` | 選手上傳證書並審核通過 |
| `self_reported` | 選手自填 |

### 7.4 RACE 審核欄位

| 欄位 | 值 | 說明 |
|------|-----|------|
| `slug` | string nullable | pending_review 期間為 null；核准後永久固定 |
| `status` | `pending_review` / `active` / `inactive` / `cancelled` | |
| `review_status` | `pending_review` / `approved` / `rejected` | |
| `report_count` | int | 達 3 次自動轉 `pending_review` 重審 |

### 7.5 RACE_EDITION 審核欄位

| 欄位 | 說明 |
|------|------|
| `submitted_by` | 提交者 UUID；null = 助手直接建立 |
| `review_status` | `pending_review` / `approved` / `rejected` |
| `reviewed_by` / `reviewed_at` | 審核者與時間 |

---

## 8. 追蹤功能（第 38 章）

### 8.1 FollowButton 元件

| 狀態 | 圖示 | 說明 |
|------|------|------|
| 未追蹤 | ☆（空心）| 點擊後追蹤 |
| 已追蹤 | ★（實心）| accent 色（#66c6be），點擊後確認取消 |
| 未登入 | ☆（空心）| 點擊觸發 Auth Modal，intent: `follow` |

**不顯示條件**：`athlete_id IS NULL` 或 `athlete_id === 登入者`

**觸發位置**：

| 位置 | 尺寸 |
|------|------|
| 最速榜每列右側（`.tlb-follow`，手機版隱藏）| `size="sm"` 16px |
| 成績詳情頁 `/results/:id` 選手姓名旁 | `size="md"` 20px |
| 屆次頁 `/races/:slug/:year` 成績列表 | `size="sm"` |
| 選手公開頁 `/athletes/:id` Hero 區塊 | `size="lg"` 24px |

### 8.2 ATHLETE_FOLLOW 資料庫

- `UNIQUE(follower_id, following_id)`
- `CHECK follower_id ≠ following_id`
- RLS：INSERT / DELETE 只允許 `follower_id = auth.uid()`
- `follower_count` / `following_count`：即時 COUNT，不快取

### 8.3 API 端點

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/api/athletes/:id/follow` | 追蹤；自我追蹤 400；已追蹤 409 |
| DELETE | `/api/athletes/:id/follow` | 取消追蹤；未追蹤 404 |
| GET | `/api/athletes/:id/is-following` | 回傳 `{ following: boolean }` |
| GET | `/api/athletes/me/following` | 追蹤的選手 id 陣列（最速榜批次查詢用）|
| GET | `/api/athletes/search?q=` | 全站選手搜尋；is_searchable=true；limit 8；回傳含 is_following |

---

## 9. 關注名單（第 39 章）

### 9.1 入口

Avatar 下拉選單「關注名單 (N)」；N=0 時不顯示 badge。

### 9.2 頁面（`/my/following`）

頁面分四個區塊，兩個搜尋框各有獨立語意：

| 區塊 | 說明 |
|------|------|
| ① 選手搜尋區 | 搜尋框 A：全站搜尋（GET /api/athletes/search），顯示結果卡片含 FollowButton |
| ② 清單頁首 | 「你關注了 N 位選手」+ 篩選框 B（篩選已追蹤清單，client-side 即時）|
| ③ 選手卡片列表 | 每位追蹤的選手一張卡片 |
| 空狀態（N=0）| 引導文字 + 搜尋框 A 仍顯示 + 「前往最速榜」CTA |

### 9.3 選手卡片

| 區塊 | 內容 |
|------|------|
| 身份 | Avatar + `COALESCE(nickname, name)` + 國籍；名稱可點擊 → `/athletes/:id` |
| 成績 | 226 / 113 / 51.5 / Sprint 各距離最佳時間；無成績顯示「—」|
| 操作 | ★ FollowButton（取消追蹤需確認提示）|

### 9.4 API

| 路徑 | 說明 |
|------|------|
| `GET /api/athletes/me/following/details` | 完整關注名單（含 bests）|
| `GET /api/athletes/search?q=` | 全站搜尋（搜尋框 A 用）|
| `DELETE /api/athletes/:id/follow` | 取消追蹤 |

---

## 10. 選手公開頁（第 44 章）

### 10.1 基本資訊

| 項目 | 說明 |
|------|------|
| 路徑 | `/athletes/:id` |
| 存取 | 公開；未登入可瀏覽；停權 / 已刪除帳號顯示「此帳號已停用」|
| SEO | Server Component，`generateMetadata()` |

### 10.2 進入入口

選手姓名在以下位置可點擊（已認領成績才有連結）：
- 最速榜 `.tlb-name`
- 成績詳情頁 `/results/:id`
- 屆次頁 `/races/:slug/:year` 成績列表
- 關注名單 `/my/following` 卡片

### 10.3 頁面結構

**① Hero 區塊**：

| 元素 | 說明 |
|------|------|
| Avatar | 64px 圓形；無頭像顯示姓名第一字 |
| 顯示名稱 | `COALESCE(nickname, name)` |
| 真實姓名 | 有 nickname 時補充「本名：{name}」小字 |
| 國籍 | 有填才顯示 |
| 自我介紹 | 有填才顯示 |
| FollowButton | `size="lg"`；自己的頁面不顯示 |
| 追蹤人數 | 「N 人追蹤」；不顯示追蹤中人數（私人資訊）|

**② 成績摘要**：四距離最佳時間小卡片並排；無成績顯示「—」

**③ 成績明細**：

| 欄位 | 說明 |
|------|------|
| 賽事年份 / 名稱 | 名稱可點擊 → `/races/:slug/:year` |
| 距離 badge | |
| 完賽時間 | DM Mono |
| 認領狀態 | unclaimed 加 badge |
| source_credibility | badge |

- 只顯示 `is_public = true` 的成績
- 本人觀看：額外顯示私人成績（加「私人」badge）+ 「管理我的成績」連結

**④ 接力成績**：有才顯示，無則隱藏

### 10.4 隱私控制

`ATHLETE.is_searchable`（boolean，預設 true）：
- false → 不出現在 `/api/athletes/search` 搜尋結果
- 不影響個人頁 URL 的直接瀏覽
- 未成年（`is_minor = true`）強制 false，且 `/profile` 不顯示開關

### 10.5 API

`GET /api/athletes/:id` 回傳：`{ id, name, nickname, nationality, bio, avatar_url, created_at, follower_count, is_following, bests, results, relay_results }`

---

## 11. 賽事提交規格（第 42 章）

### 11.1 兩條路徑

| 動作 | 前提 | 審核 | Slug |
|------|------|------|------|
| **屆次新增** | 賽事已存在 | 樂觀公開，事後審核 | 不涉及 |
| **申請新賽事** | 平台上完全沒有 | 必須審核 | 助手審核時指定 |

### 11.2 賽事搜尋決策樹（第 42-A 章）

1. 搜尋關鍵字 → 找到 RACE → 選屆次或新增屆次
2. 找不到 RACE → 系列比對（ironman / challenge / 普悠瑪 / force / 全國錦標）
3. 有相關系列 → 選現有 RACE 新增屆次；或填完整表單新建 RACE
4. 完全無匹配 → 問題回報（`add_race`）

### 11.3 slug 管理

- 申請期間 `RACE.slug = null`，列表顯示「審核中」badge
- 助手核准時必填 slug，即時唯一性驗證（`GET /api/admin/races/slug-check?slug=`）
- 核准後永久固定

---

## 12. 問題回報系統（第 43 章）

### 12.1 入口

| 入口 | 預帶類別 |
|------|---------|
| Footer「回報問題」（全站常駐）| 空白 |
| 賽事搜尋無結果 | `add_race` + 搜尋關鍵字 |
| 成績詳情頁「回報成績錯誤」| `result_error` + result_id |
| 賽事詳情頁「回報賽事資料錯誤」| `other` + race_id |

未登入也可使用（匿名回報）。

### 12.2 表單與資料模型

| 欄位 | 說明 |
|------|------|
| `category` | `add_race` / `result_error` / `other`（必填）|
| `message` | 自由文字，上限 500 字（必填）|
| `submitter_email` | 選填；助手回覆用 |
| `context_url` / `context_data` | 自動帶入頁面 URL 與情境資料 |
| `status` | `unread` / `read` / `resolved` / `dismissed` |

### 12.3 後台（`/admin/reports`）

- 預設顯示 `unread`；篩選：狀態 × 類別
- 未讀計數顯示 Tab badge（紅點）
- 動作：標記已讀 / 已解決（可附備注）/ 忽略
- API：`POST /api/reports`（無需登入）、`GET/PUT /api/admin/reports`（assistant+）

---

## 13. 待開發功能（Phase 2，第 37 章）

### 13.1 貢獻遊戲化

徽章系統：初心推手、推坑達人、社群柱石、資料守護者、賽事記錄者、鐵人傳教士。

### 13.2 個人動態頁（`/my/feed`）

被追蹤者的新成績、認領、PB 更新；依賴追蹤功能上線後實作。

### 13.3 朋友視角排行榜

最速榜新增切換開關，只顯示追蹤的選手 + 自己，排名重新計算。

---

## 14. 設計系統

### 14.1 色彩

```css
--bg-deep:    #060D18;
--bg-surface: #0D1526;
--bg-card:    #111E35;
--accent:     #66c6be;
--run:        #FF6B3D;
--swim:       #22C9C9;
--bike:       #A8E063;
--gold:       #F5C842;
--silver:     #A0A0A0;
--bronze:     #CD9660;
--female:     #D4537E;
--text-1:     #F0EDE6;
--text-2:     #8A96A8;
--text-3:     #4A5568;
```

### 14.2 字體

| 用途 | 字體 | 字重 |
|------|------|------|
| 品牌標題 | Syne | 800 |
| 時間數字 | DM Mono | 400 / 500 |
| 中文內容 | Noto Sans TC | 300 / 400 / 500 |

### 14.3 Logo（第 29 章）

| prop | 選項 |
|------|------|
| `size` | `sm` / `md` / `lg`（130 / 195 / 260px）|
| `context` | `nav` / `login` / `static`（動畫速度 3s / 1.8s / 無）|
| `markOnly` | boolean |

---

*對應規格書版本：v3.6（2026-06-08）*
*完整規格：trilog_spec_v46.docx（Claude.ai project）*
