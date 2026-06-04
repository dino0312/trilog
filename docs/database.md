# docs/database.md — 資料庫設計參考

> 說明 PostgreSQL schema 的設計意圖、欄位語意、約束條件、RLS 政策與效能索引。  
> 修改 schema 前必須讀這份文件，新增資料表後必須更新這份文件。

---

## 1. 整體設計原則

**時間以秒儲存**：所有時間欄位（成績時間、分項時間）均以 `integer`（秒）儲存。UI 負責呼叫 `secondsToTime()` 格式化顯示。這讓 `ORDER BY total_seconds` 效率最佳，且算術運算（差值、加總驗證）直接用整數。

**時間戳用 timestamptz**：所有 `created_at`、`updated_at`、`deleted_at` 等均為 `timestamptz`（帶時區），而非 `timestamp`。Supabase Auth 使用 UTC，混用會造成計算錯誤。

**CHECK constraints 而非 ENUM**：值域限制用 `CHECK (col IN ('a','b','c'))` 實作，不用 PostgreSQL ENUM type。理由：新增值域時只需一行 migration，不需 ALTER TYPE（可能鎖表）。

**RLS 全面啟用**：所有 8 張資料表都啟用 Row Level Security。Supabase 的 anon key 是公開的，RLS 是最後一道防線。

**SECURITY DEFINER 函式**：角色判斷函式（`is_assistant_or_above()`、`is_admin()` 等）用 `SECURITY DEFINER` 執行，以函式擁有者身份繞過 RLS，解決 RLS policy 遞迴查詢問題。這些函式必須設定 `SET search_path = public`，防止 search path injection。

---

## 2. 資料表詳解

### 2.1 athletes（選手帳號）

**設計意圖**：儲存選手的 Profile 資料，與 Supabase Auth 一對一對應。`id` 等同於 `auth.users.id`，不是平台自定義的主鍵。

**重要欄位語意**：

| 欄位 | 型別 | 語意與限制 |
|------|------|-----------|
| `id` | uuid PK | 等同 `auth.users.id`，新用戶由 trigger 自動建立 |
| `email` | text | 從 auth.users 同步，不直接修改 |
| `nickname` | text nullable | 排行榜顯示名稱。`null` = 匿名，不上榜。不允許空字串（CHECK）|
| `gender` | text nullable | 'M' or 'F'，排行榜分組依據 |
| `birth_year` | int nullable | 1900–2100，自動計算年齡組 |
| `nationality` | text nullable | ISO 3166-1 alpha-3（如 'TWN'），地區篩選用 |
| `is_minor` | boolean | 依 birth_year 計算，驅動新成績的隱私預設 |
| `role` | text | 'athlete' / 'assistant' / 'admin'（CHECK）|
| `deleted_at` | timestamptz nullable | 軟刪除，非 null = 已申請刪帳，1 個月後排程清除 |

**觸發器**：
- `athletes_set_updated_at`：BEFORE UPDATE，自動更新 `updated_at`
- `handle_new_user`：AFTER INSERT on auth.users，自動建立對應 athlete 列（SECURITY DEFINER）

**RLS 摘要**：
- 任何人可讀取 `deleted_at IS NULL` 的選手資料
- 本人可讀取自己的完整資料（含軟刪除緩衝期）
- 本人可更新自己的 Profile，但不可修改 `role`
- Admin 可更新任何選手
- 無直接 INSERT（trigger 處理）/ 無直接 DELETE（只做軟刪除）

---

### 2.2 races（賽事品牌）

**設計意圖**：代表一個跨年度的賽事品牌（如「Ironman Taiwan」），是 URL 路由的基礎。

**重要欄位**：

| 欄位 | 型別 | 語意 |
|------|------|------|
| `slug` | text UNIQUE | URL 識別碼（如 'ironman-taiwan'），一旦公開不可改 |
| `lat` / `lng` | numeric | GPS 座標，供 Open-Meteo 天氣 API 查詢 |
| `status` | text | 'active' / 'inactive' / 'cancelled'（CHECK）|

**約束**：`slug` 唯一，全小寫英數連字號格式（應用層驗證）。

**RLS 摘要**：公開讀取；assistant+ 可新增；assistant/editor/admin 可更新；admin 可刪除。

---

### 2.3 race_editions（賽事屆次）

**設計意圖**：同一賽事的特定年份版本，包含天氣、路線、環境細節。

**重要欄位**：

| 欄位 | 型別 | 語意 |
|------|------|------|
| `race_date` | date | 開始日期 |
| `race_date_end` | date \| null | 結束日期（多日賽事用，單日賽事為 null）|
| `distance_category` | text | `'sprint'`（Sprint）/ `'olympic'`（51.5）/ `'70.3'`（113）/ `'full'`（226）（CHECK）|
| `swim_distance_m` | int \| null | 游泳距離（公尺），預設：Sprint 750 / 51.5 1500 / 113 1900 / 226 3800 |
| `bike_distance_km` | numeric \| null | 騎車距離（公里），預設：Sprint 20 / 51.5 40 / 113 90 / 226 180 |
| `run_distance_km` | numeric \| null | 跑步距離（公里），預設：Sprint 5 / 51.5 10 / 113 21.1 / 226 42.2 |
| `weather_data` | jsonb | `{temp_c, humidity_pct, wind_speed_ms, wind_direction, precipitation_mm}` |
| `weather_source` | text | 'open-meteo' / 'visual-crossing' / 'manual'（CHECK）|

**約束**：`UNIQUE(race_id, year, distance_category)` — 同一賽事同年同距離只有一個屆次。同年不同距離允許各自建立。

**UI 概念**：屆次以「年份」為操作單位（一個年份可含多個距離）。新增屆次時可一次勾選多個距離，各自帶入或自訂 km 值。編輯與刪除也以年份為單位，刪除時若有關聯成績則阻擋。

**RLS 摘要**：與 races 相同策略。

---

### 2.4 results（成績記錄）⭐ 核心資料表

**設計意圖**：平台最核心的資料表，每一列代表「一個選手在一個賽事屆次的完賽成績」。包含兩個獨立的狀態維度：可信度（source_credibility）和認領狀態（claim_status）。

**Solo vs Relay 分叉設計**：

| 情境 | result_type | 分項時間位置 |
|------|-------------|------------|
| 個人成績 | 'solo' | 在 results 本表（swim/t1/bike/t2/run_seconds）|
| 接力成績 | 'relay' | 分項在 team_members.split_seconds；換區在 teams.t1/t2_seconds |

relay 成績的分項欄位由 CHECK constraint 強制為 null：`relay_splits_must_be_null`。

**重要欄位**：

| 欄位 | 型別 | 語意 |
|------|------|------|
| `athlete_id` | uuid nullable | null = 未認領（策展層）或接力 |
| `athlete_name_snapshot` | text nullable | 策展層建立時的姓名，認領後永不清除 |
| `source_credibility` | text | 'official' / 'certificate' / 'self_reported'（單向升級，不可降） |
| `claim_status` | text | 'unclaimed' / 'pending' / 'claimed' / 'unlinked' |
| `total_seconds` | int | 完賽總時間（秒），排行榜排序主鍵 |
| `claim_tag_count` | int | 反正規化快取，由 trigger 自動維護，排行榜直讀不 JOIN |
| `is_public` | boolean | false = 私人，不上排行榜 |

**觸發器**：
- `results_set_updated_at`：BEFORE UPDATE，更新 `updated_at`
- `results_validate_credibility`：BEFORE UPDATE OF source_credibility，防止降級（詳見狀態機）

**RLS 摘要**：
- 讀取：`is_public = true` OR `claim_status IN ('unclaimed','unlinked')` OR `athlete_id = auth.uid()`
- INSERT（solo）：已登入 + `result_type='solo'` + self_reported + `athlete_id = auth.uid()`
- INSERT（relay）：已登入 + `result_type='relay'` + self_reported + `athlete_id IS NULL`（migration 20260604000005）
- 本人 UPDATE：自己的非 official 成績
- Assistant UPDATE：公證/認領狀態更新
- 本人 DELETE：自己的 self_reported 成績
- Admin DELETE：任何成績

---

### 2.5 claim_tags（知情人標記）

**設計意圖**：讓認識未認領選手的用戶標記「我已通知本人」，製造社群連結。

**重要欄位**：

| 欄位 | 語意 |
|------|------|
| `result_id` | 被標記的成績（必須是 unclaimed 或 unlinked）|
| `tagged_by` | 標記人帳號 |
| `message` | 知情人留言，最多 100 字元 |

**約束**：
- `UNIQUE(result_id, tagged_by)`：同一人不能重複標記
- 上限 5 人：由 trigger `handle_claim_tag_insert` 在 BEFORE INSERT 時檢查
- 只能標記 unclaimed/unlinked 成績：同一 trigger 驗證

**觸發器**：
- `claim_tags_on_insert`（BEFORE INSERT）：驗證狀態 + 上限，更新 `results.claim_tag_count + 1`
- `claim_tags_on_delete`（AFTER DELETE）：更新 `results.claim_tag_count - 1`（最低為 0）

兩個 trigger 都使用 `FOR UPDATE` 鎖定 results 列，避免 race condition。

---

### 2.6 teams（接力隊伍）

**設計意圖**：與 `results (result_type=relay)` 一對一關聯，儲存隊伍層級的換區時間。

| 欄位 | 語意 |
|------|------|
| `result_id` | UNIQUE FK，對應接力 Result |
| `gender_category` | 'male' / 'female' / 'mixed' |
| `t1_seconds` / `t2_seconds` | 換區時間，無法歸屬個別成員 |

**觸發器**：`teams_validate_result_type`（BEFORE INSERT）— 確保 result_id 指向 result_type='relay' 的成績。

---

### 2.7 team_members（接力成員）

**設計意圖**：每個成員獨立認領，可負責一個或多個分項。

| 欄位 | 語意 |
|------|------|
| `disciplines` | text[]，如 `{swim}` 或 `{bike,run}` |
| `split_seconds` | 負責分項的純運動時間合計（不含換區）|
| `claim_status` | 獨立認領狀態，不影響其他成員 |
| `sort_order` | 顯示順序（swim=0, bike=1, run=2）|

---

### 2.8 race_editors（賽事編輯權限）

**設計意圖**：細粒度授權，讓特定選手可以編輯特定賽事的資料（不需要全站 assistant 角色）。

| 欄位 | 語意 |
|------|------|
| `role` | 'editor'（一般編輯）/ 'organizer'（賽事方代表）|
| `granted_by` | 誰授予此權限 |

**約束**：`UNIQUE(race_id, athlete_id)` — 一個人對一個賽事只有一筆授權記錄。

---

## 3. 狀態機

### 3.1 source_credibility（來源可信度）

方向：單向升級，不可降級。

```
self_reported ──── 上傳證書並審核通過 ────→ certificate
                                              ↑
official ──────────────────────────────────  一旦建立，永遠是 official
```

規則：
- `official` 不可改為任何其他值（trigger 強制）
- `certificate` 不可改回 `self_reported`（trigger 強制）
- 認領通過：若原為 `self_reported` → 升級為 `certificate`；若原為 `official` → 維持 `official`

### 3.2 claim_status（認領狀態）

```
         提交認領
unclaimed ──────────→ pending
    ↑                   │
    │ 審核拒絕           │ 審核通過
    └──────────────────┘
                        ↓
                     claimed ──── 選手申請解除 ────→ unlinked
                                                         │
                                                         └── 其他選手重新認領 ──→ pending
```

所有狀態轉換透過 RPC 函式執行（`claim_result`、`approve_claim`、`unlink_result`），不應直接 UPDATE。

---

## 4. 資料庫函式（RPC）

這些函式以 SECURITY DEFINER 執行，封裝業務邏輯，確保狀態轉換的原子性。

### 4.1 `claim_result(p_result_id, p_certificate_url?)`

**誰呼叫**：已登入的選手  
**做什麼**：將成績與帳號關聯，`claim_status` 改為 pending  
**使用 FOR UPDATE**：鎖定成績列，防止並發競爭

### 4.2 `approve_claim(p_result_id, p_approve)`

**誰呼叫**：assistant 或 admin  
**做什麼**：
- 核准（true）：`pending → claimed`，若 `self_reported` 則升級為 `certificate`
- 拒絕（false）：`pending → unclaimed`，`athlete_id` 清空

### 4.3 `unlink_result(p_result_id)`

**誰呼叫**：本人或 admin  
**做什麼**：`claimed → unlinked`，`athlete_id` 設 null，`athlete_name_snapshot` 和 `certificate_url` 保留

### 4.4 `generate_claim_share_text(p_result_id)`

**誰呼叫**：標記後自動呼叫  
**做什麼**：組合「我在 Tri·log 看到你在 XX 賽事的成績 HH:MM:SS 還沒被認領」的分享文字和連結

---

## 5. Views（檢視）

### 5.1 leaderboard_entries

**用途**：排行榜主要查詢來源，業務層再加 `RANK() OVER (ORDER BY total_seconds)` 分組排名。

**過濾條件**（已嵌入 view 定義）：
- `is_public = true`
- `claim_status IN ('unclaimed', 'claimed')`
- 有顯示名稱（unclaimed 用 snapshot，claimed 用 nickname）
- `result_type = 'solo'`（接力有獨立 view）

**資料組合**：results + race_editions + races + athletes LEFT JOIN

**年齡組計算**：在 view 中實時計算，格式為 `'M30-34'`（gender + birth_year 五年組）

### 5.2 relay_leaderboard_entries

**用途**：接力排行榜，JOIN teams 表取得隊伍資料

### 5.3 athlete_public_profiles

**用途**：選手公開頁面，`nickname IS NOT NULL` 過濾匿名用戶，包含公開成績數統計

---

## 6. 索引策略

| 索引名稱 | 目標欄位 | 用途 |
|---------|---------|------|
| `idx_results_leaderboard` | `(race_edition_id, total_seconds)` WHERE 公開+已認領+官方 | 排行榜核心查詢（最常用）|
| `idx_results_leaderboard_all` | `(race_edition_id, total_seconds)` WHERE 公開+已認領 | 含 self_reported 的完整排行榜 |
| `idx_results_athlete` | `(athlete_id, created_at DESC)` | 個人成績頁 |
| `idx_results_unclaimed` | `(source_credibility, claim_status, claim_tag_count DESC)` | 未認領清單，依熱度排序 |
| `idx_results_name_snapshot` | GIN on `to_tsvector(athlete_name_snapshot)` | 姓名搜尋（認領前找自己）|
| `idx_race_editions_race_year` | `(race_id, year DESC)` | 賽事屆次列表 |
| `idx_race_editions_distance` | `(distance_category, race_date DESC)` | 距離篩選 |
| `idx_athletes_nickname` | `(nickname)` WHERE 非刪除 | 排行榜 JOIN 篩選 |

所有排行榜查詢都應命中 `idx_results_leaderboard` 或 `idx_results_leaderboard_all`，避免全表掃描。

---

## 7. Helper 函式（角色判斷）

這些函式在 RLS policy 中使用，必須以 SECURITY DEFINER 執行才能繞過 RLS 的遞迴問題。

| 函式 | 回傳 | 語意 |
|------|------|------|
| `get_my_role()` | text | 目前登入者的角色 |
| `is_assistant_or_above()` | boolean | 是否為 assistant 或 admin |
| `is_admin()` | boolean | 是否為 admin |
| `is_race_editor(race_id)` | boolean | 是否有該賽事的編輯權（含 assistant+）|

---

## 8. Migration 順序與依賴

必須按照編號順序執行：

| 編號 | 檔案 | 建立的物件 | 依賴 |
|------|------|-----------|------|
| 001 | helpers.sql | Helper 函式 | 無 |
| 002 | athletes.sql | athletes 表、handle_new_user trigger | 001 |
| 003 | races.sql | races、race_editions 表 | 002（created_by FK）|
| 004 | results.sql | results 表 | 002、003 |
| 005 | claim_tags.sql | claim_tags 表 | 002、004 |
| 006 | relay.sql | teams、team_members 表 | 002、004 |
| 007 | race_editors.sql | race_editors 表 | 002、003 |
| 008 | indexes.sql | 所有索引 | 002–007 |
| 009 | views_and_functions.sql | Views + RPC 函式 | 008 |

**新增 migration 時的命名規則**：`YYYYMMDDHHMMSS_description.sql`，確保時間戳唯一。

---

## 9. 安全規則

### 不可繞過的強制規則

1. **所有新資料表必須 ENABLE ROW LEVEL SECURITY**——否則對 anon key 完全開放
2. **所有 RLS policy 的 SECURITY DEFINER 函式必須有 `SET search_path = public`**
3. **SUPABASE_SERVICE_ROLE_KEY 絕對不能出現在前端代碼**

### 批次操作注意事項

直接繞過 trigger 操作 `claim_tags` 表（如 admin 批次刪除）後，`results.claim_tag_count` 快取會失準。需執行：

```sql
-- 重新計算指定成績的 claim_tag_count
UPDATE results r
SET claim_tag_count = (SELECT COUNT(*) FROM claim_tags WHERE result_id = r.id)
WHERE id = '...';
```
