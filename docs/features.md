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
| 新增賽事 | `/races/new` | 限 assistant+（分隔線區隔）|

**未登入**：點擊前兩個選項均觸發 Auth Modal（intent `new_result` / `new_result_for_other`），登入後導向對應路徑。

### 1.4 Avatar 下拉選單（第 30 章）

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

**新增屆次**：勾選距離 → 每個距離各建立一筆 `race_editions`；刪除時有成績則阻擋。

### 2.5 賽事後台審核（`/admin/races/review`，第 35 章）

**事後審查（Post-Moderation）**：新賽事立即公開，同步進入待審佇列。

| Tab | 說明 |
|-----|------|
| 待審 | `review_status = pending_review` 的賽事 |
| 已核准 | 歷史核准記錄 |
| 已拒絕 | 歷史拒絕記錄 |
| 舉報 | `report_count` 達閾值的賽事 |

**Inline 動作**：

| 動作 | 行為 |
|------|------|
| 核准 | `review_status → approved` |
| 編輯後核准 | Inline 編輯，修正後核准 |
| 拒絕 | 填寫原因，可選通知提交者 |
| 保留（舉報 tab）| 忽略舉報，`report_count` 重設 |
| 下架（舉報 tab）| 移除公開顯示 |

**觸發邏輯**：
- 首次提交用戶 → `review_status = pending_review`，通知助手
- 已通過首次審核的用戶 → `review_status = approved`（直接），進背景隊列抽查
- 被舉報達 3 次 → `review_status = pending_review`（重審），通知助手

### 2.6 會員名單（`/admin/members`，第 40 章）

**搜尋**：name / nickname / Email 即時篩選 + 角色下拉 + 狀態下拉（全部 / 正常 / 已停權 / 已刪除）。已刪除帳號預設隱藏。

**列表欄位**：姓名 + Email / 角色 badge / 狀態（已停權顯示橘色）/ 成績筆數 / 註冊日期 / ⋯ 操作選單

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

### 3.1 最速榜（`/leaderboard`）

每位選手只取歷史最佳成績（best-per-athlete 去重），依完賽時間排序。

**URL 參數**：`?distance=full`（預設）/ `70.3` / `olympic` / `sprint`
**進榜條件**：`is_public = true` + `claim_status IN ('unclaimed', 'claimed')` + `name IS NOT NULL` + `result_type = 'solo'`
**去重邏輯**：有帳號的選手以 `athlete_id` 去重；未認領的以 `display_name` 去重；各取最小 `total_seconds`
**顯示名稱優先順序**：`COALESCE(nickname, name, athlete_name_snapshot)`

**視覺規則**：
- 距離頁籤（226 預設；其他距離 disabled，待資料累積後開啟）
- Sub 分界線：依距離各有門檻
- 未認領成績顯示「未認領」標籤
- 更新日期取資料中最新的 `race_date`，非硬碼

### 3.2 排行榜（`/rankings`）

同一選手可有多筆成績（不去重），可篩選特定賽事、年份。

**URL 參數**：`?distance=full`（必填，無此參數自動 redirect）
**距離選擇**：226 / 113 / 51.5 / Sprint，無「所有距離」選項
**其他篩選**：賽事（下拉）、性別（下拉）

### 3.3 未認領（`/unclaimed`）

瀏覽策展層中尚未被認領的官方成績。

**排序**：標記人數降冪 → 完賽時間升冪
**搜尋**：姓名模糊搜尋 + 賽事 + 距離篩選

**兩個操作入口**：
1. **認領**（ClaimButton）：`claim_result()` RPC → `claim_status = pending` → 等待助手審核
2. **標記通知**（TagButton）：新增 `claim_tags` 記錄 → 產生分享文字 → Web Share API

**ClaimButton 顯示條件**：`athlete_name_snapshot` 與登入者 `athletes.name` 正規化相符（`trim().toLowerCase().replace(/\s+/g, '')`）。未設定 `name` 的用戶看不到任何認領按鈕。

**TagButton 渲染順序**：
1. 分享面板（`showShare && shareText`）
2. 已標記（`hasTagged`）— 顯示「✓ 已通知 ＋ 撤銷」
3. 未登入 → 達上限 → 一般按鈕

### 3.4 成績詳情（`/results/[id]`）

顯示完賽時間、5 項分項時間、成績來源標籤、認領狀態、整體名次。
未認領成績顯示認領入口 + 標記入口 + 知情人留言列表。

### 3.5 賽事資料庫（`/races`，第 33 章）

賽事列表，依系列分組（IRONMAN 系列、Challenge 系列、普悠瑪、其他），台灣場地優先排序。

**賽事互動（第 36 章，待實作）**：

| 按鈕 | interest_type | 說明 |
|------|--------------|------|
| 想參加 | `wishlist` | 表達報名意願 |
| 參加過 | `attended` | 聲明曾參加，觸發成績登錄提示 |

- 未登入點擊：Auth Modal，intent `race_wishlist` / `race_attended`
- 「參加過」按下後若無成績記錄，顯示 toast 提示

---

## 4. 登入用戶功能

### 4.1 我的成績（`/records`）

列出本人所有成績，含 `pending` 狀態（顯示「待審核」）。

**自填成績**（`source_credibility = 'self_reported'`）：可編輯 / 刪除

**官方成績**（`source_credibility = 'official'` + `claim_status = 'claimed'`）：顯示「解除關聯」，呼叫 `unlink_result()` RPC。

**接力成績區塊**（頁面下半部）：顯示個人負責分項 + 分項時間 + 隊伍完賽總時間。右上角「+ 接力成績」導向 `/records/relay/new`。

### 4.2 新增成績（`/records/new`）

**我的成績模式**（預設）：
- `athlete_id` 綁定登入者，`claim_status = 'claimed'`，`source_credibility = 'self_reported'`

**幫他人新增模式**（`?for=other`，所有已登入用戶）：
- `athlete_id = null`，`athlete_name_snapshot` 必填，`claim_status = 'unclaimed'`，`is_public = true`（固定）

**公開/私人規則**：公開成績需 `name` + `gender` + `birth_year` + `nationality` 全填（`nickname` 不強制）。

**21.3 首次成績登錄引導**：Profile 不完整且勾選公開時，表單底部出現補填區塊；私人成績不觸發。

### 4.3 個人資料（`/profile`，第 31 章）

Inline 編輯：點擊欄位直接切換為可編輯狀態，Enter 儲存，Escape 取消。

| 欄位 | 進榜必填 | 說明 |
|------|---------|------|
| 頭像 | 否 | |
| 姓名（name）| 是 | 真實姓名，認領比對與進榜依據 |
| 暱稱（nickname）| 否 | 選填，填寫後排行榜優先顯示 |
| 性別 | 是 | |
| 出生年份 | 是 | |
| 國籍 | 是 | |
| 自我介紹 | 否 | |
| Email | 唯讀 | |

**進度提示**：頁面頂部顯示「還差 N 個欄位即可進入排行榜」。

**帳號刪除**：輸入 Email 確認 → 1 個月緩衝後永久刪除；策展層成績解除關聯為 `unlinked` 狀態。

### 4.4 Wish List（`/my/wishlist`，第 36 章，待實作）

顯示選手所有「想參加」的賽事，按日期排序。

---

## 5. 認證流程

### 5.1 Auth Modal（主要登入入口）

Modal 覆蓋當前頁面，不跳頁，保留頁面狀態。

**Intent 跳轉邏輯**：

| intent | 登入成功後行為 |
|--------|-------------|
| `login`（預設）| Modal 關閉，留在當前頁 |
| `new_result` | 導向 `/records/new` |
| `new_result_for_other` | 導向 `/records/new?for=other` |
| `claim` | 導向 `/results/:resultId/claim` |
| `race_wishlist` | 完成 wishlist 標記，回賽事頁 |
| `race_attended` | 完成 attended 標記，顯示成績登錄提示 |

### 5.2 登入頁（`/login`）

全螢幕置中，供外部連結（如 Email 通知）直接進入。

### 5.3 Route Redirect 規則

| 原路徑 | Redirect 至 |
|--------|------------|
| `/my/profile` | `/profile` |
| `/my/results` | `/records` |

---

## 6. 接力功能（第 20 章）

### 6.1 接力榜（`/relay`）

獨立排行榜，篩選：距離、組別（男子/女子/混合）、賽事。

### 6.2 隊伍頁（`/teams/[id]`）

顯示：隊名、完賽時間、T1/T2、成員列表（分項、個人時間、認領狀態）。

**認領按鈕顯示條件**（全部滿足）：
1. 使用者已登入
2. 成員 `claim_status = 'unclaimed'` 且 `athlete_id IS NULL`
3. 成員的 `athlete_name_snapshot` 與登入者 `athletes.name` 正規化相符
4. 登入者尚未認領此隊伍中的任一成員

### 6.3 新增接力成績（`/records/relay/new`）

選擇賽事 → 填入總時間 / 組別 / 隊名 → 設定成員（最多 3 位）→ 勾選「這是我」自動認領 → 提交

### 6.4 業務規則

- relay Result 的 `athlete_id` 始終為 null，成員由 `team_members` 管理
- T1/T2 存 TEAM 層級，不歸屬個別成員
- 成員認領：`claim_status → pending`；result 的 `claim_status → pending`

---

## 7. 資料模型核心規則

### 7.1 認領狀態流程

```
unclaimed → pending（申請認領）→ claimed（審核通過）
claimed → unlinked（解除關聯）→ unclaimed
```

帳號刪除時：`claimed` 成績自動變 `unlinked`；`self_reported` 成績 1 個月後刪除；`certificate` / `official` 保留資料，移除帳號關聯。

### 7.2 source_credibility 分層

| 值 | 說明 | 標章 |
|----|------|------|
| `official` | 策展層助手建立 | 官方策展標章 |
| `certificate` | 選手上傳證書並審核通過 | 已公證標章 |
| `self_reported` | 選手自填 | 自填標示 |

### 7.3 ATHLETE 核心欄位

| 欄位 | 型別 | 說明 |
|------|------|------|
| `name` | string nullable | 真實姓名，進榜必填，認領比對依據 |
| `nickname` | string nullable | 顯示暱稱，選填；排行榜顯示優先於 name |
| `role` | string | `athlete` / `assistant` / `admin` |
| `deleted_at` | timestamp nullable | 軟刪除，1 個月後永久清除 |

**顯示名稱優先順序**：`COALESCE(nickname, name, athlete_name_snapshot)`

### 7.4 RACE 審核欄位

| 欄位 | 值 | 說明 |
|------|-----|------|
| `status` | `pending_review` / `active` / `inactive` / `cancelled` | 賽事公開狀態 |
| `review_status` | `pending_review` / `approved` / `rejected` | 後台審核狀態 |
| `report_count` | int | 達 3 次自動轉 `pending_review` 重審 |

---

## 8. 待開發功能（Phase 2，第 37 章）

### 8.1 貢獻遊戲化

- 貢獻指標：新增成績數、被認領數、認領率、新增賽事數
- 徽章系統：初心推手、推坑達人、社群柱石、資料守護者、賽事記錄者、鐵人傳教士

### 8.2 選手追蹤

- 單向 Follow 機制
- 個人動態頁 `/my/feed`：被追蹤者的新成績、認領、PB 更新

### 8.3 朋友視角排行榜

- 最速榜新增切換開關（登入後可見）
- 只顯示追蹤的選手 + 自己，排名重新計算
- 追蹤人數不足 3 人時顯示引導提示

---

## 10. 追蹤功能（第 38 章）

### 10.1 FollowButton 元件

星星圖示（☆/★）表示追蹤狀態，為獨立 Client Component。

| 狀態 | 圖示 | 說明 |
|------|------|------|
| 未追蹤 | ☆（空心）| 點擊後追蹤 |
| 已追蹤 | ★（實心）| accent 色（#66c6be），點擊後確認取消 |
| 未登入 | ☆（空心）| 點擊觸發 Auth Modal，intent: `follow` |

**取消追蹤**需經確認提示（「取消追蹤 [姓名]？」），避免誤操作。

**不顯示條件**：`athlete_id IS NULL`（未認領成績）或 `athlete_id === 登入者`（自己的成績）。

### 10.2 觸發位置

| 位置 | 顯示條件 | 尺寸 |
|------|---------|------|
| 最速榜 `/leaderboard` 每列右側（`.tlb-follow` 欄）| 已認領且非本人 | `size="sm"`（16px）|
| 成績詳情頁 `/results/:id` 選手姓名旁 | 已認領且非本人 | `size="md"`（20px）|

**最速榜列結構更新**（`.tlb-row` 改為五欄）：名次 36px / 姓名 1fr / 時間 110px / 賽事 1fr / 追蹤 32px

手機版（≤600px）追蹤欄（`.tlb-follow`）隱藏。

### 10.3 Auth Modal intent 補充

| intent | payload | 登入後行為 |
|--------|---------|-----------|
| `follow` | `{ athleteId: string }` | 自動呼叫 `POST /api/athletes/:id/follow` → 成功則星星變實心；失敗靜默處理（用戶可再點一次）|

### 10.4 資料庫

**ATHLETE_FOLLOW 表**：

| 欄位 | 說明 |
|------|------|
| follower_id | uuid FK，追蹤者 |
| following_id | uuid FK，被追蹤者 |
| created_at | timestamp |
| UNIQUE | (follower_id, following_id) |
| CHECK | follower_id ≠ following_id |

**注意**：`follower_count`/`following_count` 不實作快取，改為即時 COUNT 查詢。

### 10.5 API 端點

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/api/athletes/:id/follow` | 追蹤；自我追蹤 400；已追蹤 409 |
| DELETE | `/api/athletes/:id/follow` | 取消追蹤；未追蹤 404 |
| GET | `/api/athletes/:id/is-following` | 查詢是否已追蹤，回傳 `{ following: boolean }` |
| GET | `/api/athletes/me/following` | 自己追蹤的選手 id 列表（供最速榜批次查詢用）|

### 10.6 未來規劃（保留記錄）

- 選手公開頁 `/athletes/:id` 的 FollowButton（依賴選手公開頁功能）
- 幫他人新增成績後的追蹤引導提示（對方認領後通知新增者）
- 個人動態頁 `/my/feed`（第 37.3 章，獨立規格待補）
- 朋友視角排行榜（第 37.4 章，依賴追蹤功能上線後實作）

---

## 11. 關注名單（第 39 章）

### 11.1 入口

Avatar 下拉選單新增「關注名單 (N)」，N 為追蹤人數；N=0 時不顯示 badge。

### 11.2 頁面（`/my/following`）

| 項目 | 說明 |
|------|------|
| 存取 | 已登入；未登入導向 `/login` |
| 排序 | 最近追蹤的在前（`athlete_follows.created_at` 降序）|
| 頁首 | 「你關注了 N 位選手」+ 搜尋框（client-side，即時篩選）|

### 11.3 選手卡片

每位追蹤的選手一張卡片，欄位結構：

| 區塊 | 內容 |
|------|------|
| 身份（200px）| Avatar + `COALESCE(nickname, name)` + 國籍 |
| 成績（1fr）| 226 / 113 / 51.5 / Sprint 各距離最佳時間（DM Mono）；無成績顯示「—」；成績旁顯示小字賽事名稱 |
| 操作（40px）| ★ FollowButton，點擊取消追蹤（需確認提示）|

**成績顯示條件**：`is_public = true` + `claim_status IN ('unclaimed', 'claimed')`，每距離取最快一筆。

### 11.4 空狀態

| 元素 | 說明 |
|------|------|
| 標題 | 「你還沒有關注任何選手」|
| 說明 | 「在最速榜上點擊選手旁的 ☆，開始關注他們的成績動態」|
| CTA | 「前往最速榜」→ `/leaderboard` |

### 11.5 API

| 方法 / 路徑 | 說明 |
|------------|------|
| GET `/api/athletes/me/following/details` | 關注名單完整資料：選手基本資訊 + 各距離最佳成績陣列，按 `created_at` 降序 |
| DELETE `/api/athletes/:id/follow` | 取消追蹤（與第 38 章相同端點）|

**回傳格式**（單筆）：`{ athlete_id, name, nickname, nationality, avatar_url, followed_at, bests: { full, "70.3", olympic, sprint } }`，各距離 `null` 表示無成績。

### 11.6 Page Context Strip

| 路徑 | 標題 | 副標 |
|------|------|------|
| /my/following | 關注名單 | 你關注的選手 · 查看他們的最佳成績 |

---
## 9. 設計系統

### 9.1 色彩

```css
--bg-deep:    #060D18;
--bg-surface: #0D1526;
--bg-card:    #111E35;
--accent:     #66c6be;   /* mint green，主品牌強調色 */
--run:        #FF6B3D;   /* 橘色，跑步 / 次要強調色 */
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

### 9.2 字體

| 用途 | 字體 | 字重 |
|------|------|------|
| 品牌標題 | Syne | 800 |
| 時間數字 | DM Mono | 400 / 500 |
| 中文內容 | Noto Sans TC | 300 / 400 / 500 |

### 9.3 Logo（第 29、29-A 章）

| prop | 選項 | 說明 |
|------|------|------|
| `size` | `sm` / `md` / `lg` | 130px / 195px / 260px 寬 |
| `context` | `nav` / `login` / `static` | 動畫速度 3s / 1.8s / 無動畫 |
| `markOnly` | boolean | 僅顯示三角形符號 |

底邊（跑步橘色）三個波峰持續向左流動，clipPath 限制在三角形內。`prefers-reduced-motion` 停用動畫。

---

*對應規格書版本：v2.9（2026-06-08）*
*完整規格：trilog_spec_v40.docx（Claude.ai project）*
