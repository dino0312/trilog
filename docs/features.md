# docs/features.md — 功能規格

> 說明每個功能「是什麼、誰能用、入口在哪、行為規則」。  
> 這份文件與程式碼同步維護：每次新增或修改 UI 流程、Nav、權限、admin 功能時必須更新。

---

## 1. 導覽列（Nav）

**元件**：`src/components/layout/Nav.tsx`（Server Component）  
**出現位置**：`(main)` 與 `(admin)` 兩個 route group 的 layout 均包含 Nav

### 1.1 連結清單

| 連結 | 路徑 | 顯示條件 |
|------|------|---------|
| 最速榜 | `/leaderboard` | 永遠顯示 |
| 排行榜 | `/rankings` | 永遠顯示 |
| 未認領 | `/unclaimed` | 永遠顯示 |
| 管理（下拉） | 見 1.2 | 已登入且角色 ≥ assistant |
| 我的紀錄 | `/records` | 已登入 |
| + 新增 | `/records/new` | 已登入 |
| 首字母頭像 | `/profile` | 已登入 |
| 登入 | `/login` | 未登入 |
| 註冊 | `/register` | 未登入 |

### 1.2 管理下拉選單

**元件**：`src/components/layout/AdminDropdown.tsx`（Client Component）  
**顯示條件**：已登入且 `is_assistant_or_above()` RPC 回傳 true  
**行為**：點擊「管理」按鈕展開下拉，點擊選項後導航並關閉選單，點擊選單外側自動關閉

| 選項 | 路徑 |
|------|------|
| 審核中心 | `/admin` |
| 賽事管理 | `/admin/races` |

---

## 2. 管理區（Admin）

**Route Group**：`src/app/(admin)/`  
**存取條件**：已登入且角色 ≥ assistant，否則 redirect → `/login` 或 `/leaderboard`  
**Layout**：獨立於一般用戶的 `(main)` route group，自有 layout，未來調整 admin 版面不影響一般頁面

### 2.1 頁面內導航（AdminTabs）

**元件**：`src/app/(admin)/admin/AdminTabs.tsx`（Client Component）  
管理區內使用 Tab 切換，不透過 Nav 的下拉選單

| Tab | 路徑 | 精確比對 |
|-----|------|---------|
| 審核中心 | `/admin` | 是（`pathname === '/admin'`）|
| 賽事管理 | `/admin/races` | 否（`pathname.startsWith('/admin/races')`）|
| 官方成績 | `/admin/results` | 否（`pathname.startsWith('/admin/results')`）|

### 2.2 審核中心（`/admin`）

**功能**：
- 列出所有 `claim_status = 'pending'` 的認領申請
- 列出最近 50 筆已認領成績，可強制重設（`ResetButton`）

**操作**：
- 審核通過：呼叫 `approve_claim()` DB Function，`claim_status → claimed`
- 審核拒絕：`claim_status → unclaimed`，`athlete_id` 清空
- 強制重設：將已認領成績強制回到 `unclaimed` 狀態（誤認領處理）

### 2.3 官方成績管理（`/admin/results`）

**功能**：新增、瀏覽、刪除官方（策展層）成績

**操作流程**：
1. 選擇賽事屆次（依賽事 → 年份 → 距離三層選擇）
2. 填入選手姓名、性別、整體名次、完賽時間（必填）、各分項時間（選填）
3. 送出後立即更新列表，可連續新增同一屆次的多筆成績
4. 已認領（`claim_status ≠ 'unclaimed'`）的成績不顯示刪除按鈕

**業務規則**：
- 新增成績 `source_credibility = 'official'`，`claim_status = 'unclaimed'`，`athlete_id = null`
- 刪除僅允許 `claim_status = 'unclaimed'` 的成績（RLS 保護）
- 新增成功後自動刷新 `/leaderboard`、`/unclaimed`

---

### 2.4 賽事管理（`/admin/races`）

**子路由**：

| 路徑 | 功能 |
|------|------|
| `/admin/races` | 賽事列表 + 新增賽事 Panel |
| `/admin/races/[id]` | 賽事詳情 + 屆次列表 + 新增屆次 Panel + 編輯賽事 |

#### 距離標示

全站統一使用以下標示（對應 DB `distance_category` 欄位值）：

| DB 值 | 顯示標示 | 標準距離（游泳 m / 騎車 km / 跑步 km） |
|-------|---------|--------------------------------------|
| `full` | 226 | 3800 / 180 / 42.2 |
| `70.3` | 113 | 1900 / 90 / 21.1 |
| `olympic` | 51.5 | 1500 / 40 / 10 |
| `sprint` | Sprint | 750 / 20 / 5 |

#### 屆次概念

**屆次（Edition）= 年份**，一個屆次可包含多個距離組別（例如同一賽事同年舉辦 226 和 113）。DB 中每個 `race_id + year + distance_category` 組合是一筆 `race_editions` 記錄，UI 以年份為單位呈現和操作。

#### 新增屆次

1. 選擇開始日期（必填）、結束日期（選填，多日賽事）
2. 勾選本屆提供的距離組別（可多選）
3. 勾選後展開每個距離的游泳/騎車/跑步 km 欄位（預設帶入標準距離，可調整）
4. 填寫游泳環境、完賽人數、備註（選填）
5. 送出後每個勾選距離各建立一筆 `race_editions` 記錄

#### 屆次列表

- 依年份分組顯示，最新年份排最上
- 每個年份卡片顯示該年所有距離及其 km 資料
- 年份標頭右側有「編輯」和「刪除」按鈕（hover 顯示）

#### 編輯屆次（年份層級）

點擊「編輯」展開整個年份的表單：
- 可修改日期、游泳環境、人數、備註
- 可調整各距離 km
- 可新增距離（勾選新距離 → 建立新記錄）
- 可移除距離（取消勾選 → 刪除該距離記錄，有成績時阻擋）

#### 刪除屆次（年份層級）

- 一次刪除該年份所有距離記錄
- 任何距離底下有成績時，顯示筆數並阻擋刪除

#### 新增成績時的賽事選擇（使用者端）

兩步驟選擇（`/records/new`）：
1. 先選「賽事 + 年份」（例：太魯閣 2024）
2. 若該年有多個距離，出現距離按鈕供選擇；只有一個距離時自動選取

---

## 3. 公開頁面

### 3.1 最速榜（`/leaderboard`）

每位選手只取歷史最佳成績（best-per-athlete 去重），依完賽時間排序。

**URL 參數**：`?distance=full`（預設）/ `70.3` / `olympic` / `sprint`  
**進榜條件**：`is_public = true` + `claim_status IN ('unclaimed', 'claimed')` + 有顯示名稱 + `result_type = 'solo'`  
**去重邏輯**：有帳號的選手以 `athlete_id` 去重，未認領的以 `display_name` 去重，各取最小 `total_seconds`

**視覺設計**：
- 距離頁籤（226 啟用，其他三個 disabled 待資料累積後開啟）
- Sub 分界線：226 男子 Sub10 / 女子 Sub10，各距離另有對應門檻
- 未認領成績顯示「未認領」標籤，名字以灰色呈現
- 底部「登錄我的成績 →」連結

**更新日期**：自動取資料中最新的 `race_date`，非硬碼

### 3.2 排行榜（`/rankings`）

**與最速榜的差異**：同一選手可有多筆成績（不去重），可篩選特定賽事、年份

**URL 參數**：`?distance=full`（必填，預設）  
**進入規則**：無 `distance` 參數時自動 redirect 至 `?distance=full`  
**距離選擇**：按鈕頁籤（226 / 113 / 51.5 / Sprint），無「所有距離」選項  
**其他篩選**：賽事（下拉）、性別（下拉），需按「篩選」按鈕送出

### 3.3 未認領（`/unclaimed`）

瀏覽策展層中尚未被認領的官方成績。

**排序**：標記人數降冪 → 完賽時間升冪  
**搜尋**：姓名模糊搜尋 + 賽事 + 距離篩選

**兩個操作入口**：
1. **認領**（ClaimButton）：「這是我的成績」→ 呼叫 `claim_result()` RPC → `claim_status = pending` → 等待助手審核
2. **標記通知**（TagButton）：「我認識這位選手」→ 新增 `claim_tags` 記錄 → 產生分享文字 → 呼叫 Web Share API

**TagButton 行為**：
- 未登入：顯示「登入後可標記」
- 已標記：顯示「✓ 已通知」+ 撤銷連結
- 達 5 人上限：顯示「已達上限」
- 成功標記後：顯示分享文字卡片，可呼叫 Web Share API 或複製

### 3.4 成績詳情（`/results/[id]`）

單筆成績的完整資料頁，可從 `/unclaimed` 的姓名連結、分享連結進入。

**顯示內容**：完賽時間、5 項分項時間、成績來源標籤（官方成績 / 已公證 / 自填）、認領狀態、整體名次  
**互動**：未認領成績顯示認領入口 + 標記入口 + 知情人留言列表

---

## 4. 登入用戶功能

### 4.1 我的紀錄（`/records`）

列出本人所有成績，含 `pending` 狀態（顯示「待審核」）。

**自填成績操作**（RecordActions，僅 `source_credibility = 'self_reported'`）：
- 點「編輯」→ modal 預填現有數值，送出呼叫 `updateResult` Server Action
- 點「刪除」→ 確認 modal，確認後呼叫 `deleteResult` Server Action

**官方成績操作**（21.4，`source_credibility = 'official' + claim_status = 'claimed'`）：
- 顯示「解除關聯」按鈕（UnlinkButton），需二次確認
- 確認後呼叫 `unlink_result()` RPC → `athlete_id = null`，`claim_status = 'unlinked'`
- 解除後成績回到公共狀態，`athlete_name_snapshot` 保留作為公共紀錄

**認領狀態顯示**：
- `claim_status = 'pending'` → 顯示「⏳ 待審核」
- `claim_status = 'claimed'` + 非自填 → 顯示「✓ 已認領」

### 4.2 新增成績（`/records/new`）

選手自填成績表單。動態載入賽事選單（`GET /api/races`）。成功後 redirect → `/records`。

**21.3 首次成績登錄引導**（Profile 補充流程）：

| 條件 | 行為 |
|------|------|
| Profile 完整（nickname + gender + birth_year + nationality 均已填）| 正常表單，無額外步驟 |
| Profile 不完整 + 勾選「公開成績」 | 表單底部出現藍色「完成個人資料以進入排行榜」區塊，只顯示尚未填寫的欄位 |
| Profile 不完整 + 取消勾選「公開成績」 | 區塊即時隱藏，私人成績直接儲存無需補填 |

- 僅顯示缺少的欄位（nickname / gender / birth_year / nationality），已填的不重複詢問
- 送出時 `createResult` server action 先更新 athletes 表，再驗證完整性，不完整則阻擋
- 此引導僅在 profile 不完整時觸發；Profile 頁面補完後，之後新增成績不再出現

### 4.3 個人資料（`/profile`）

編輯 `nickname`、`gender`、`birth_year`、`nationality`、`bio`。  
未填 `nickname` 的選手不進入排行榜（成績可私人保存）。

---

## 5. 認證流程

### 5.1 登入（`/login`）

Email + password 登入。支援 `redirectTo` query param，登入成功後導向原目標頁。已登入者由 middleware 擋回 `/leaderboard`。

### 5.2 註冊（`/register`）

建立帳號後自動觸發 `handle_new_user` trigger，在 `athletes` 表建立對應記錄。已登入者由 middleware 擋回 `/leaderboard`。

---

## 6. Route Group 架構

| Route Group | Layout 內容 | 包含的路由 |
|-------------|------------|----------|
| `(main)` | Nav + 全頁背景 | leaderboard, rankings, unclaimed, records, results/[id], profile |
| `(admin)` | Nav + 全頁背景（獨立） | /admin, /admin/races, /admin/races/[id], /admin/results |
| `(auth)` | 全螢幕置中 | login, register |

`(admin)` 與 `(main)` 刻意獨立，未來各自調整 layout 不互相影響。
