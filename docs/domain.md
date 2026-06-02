# docs/domain.md — 領域模型與業務規則

> 這份文件說明 Tri·log 的「為什麼」：產品邏輯、核心概念、業務規則。  
> 讀完後，你應該能回答：「一筆成績是怎麼從無到上排行榜的？」

---

## 1. 產品定位

Tri·log 做一件事：**讓選手的每一場鐵人三項成績被完整保存，並在跨賽事排行榜上找到自己的位置**。

它不是：
- 訓練計畫工具（不做 intervals.icu 做的事）
- 社群動態平台（不做 Strava 做的事）
- 官方賽事系統（不重複官方已有的同場次排名）

排行榜的邏輯：「同一距離，誰的歷史最佳成績最快？」——跨賽事、跨年度、以完賽時間為唯一排序依據。

---

## 2. 核心實體

### 2.1 選手（Athlete）

選手是平台的核心用戶，對應一個 Supabase Auth 帳號。

**身份資訊的重要性**：
- `nickname`（顯示名稱）是進入排行榜的必要條件，不填就不上榜
- `gender` + `birth_year` 決定年齡組（如 M30-34），不填則只進總榜、不進分組榜
- `nationality` 決定地區篩選，不填則只在全球榜出現
- 未成年標記（`is_minor`）讓新成績預設私人，保護隱私

**角色系統**三層：
- `athlete`：一般選手，只能管理自己的成績
- `assistant`（認證助手）：可新增賽事資料、審核公證申請、建立策展層成績
- `admin`：全部權限

角色由 admin 手動升級，選手不能自行提升。

### 2.2 賽事（Race）與屆次（Race Edition）

**設計意圖**：「Ironman Taiwan」是一個品牌，每年辦一屆。品牌（Race）和每屆（RaceEdition）是兩個獨立概念。

- `Race`：品牌實體，URL slug 唯一（`ironman-taiwan`），跨年度不變
- `RaceEdition`：特定年份，有 `year + race_date`，包含天氣資料和路線細節

同一賽事的不同年份用 `UNIQUE(race_id, year)` 約束，一年只能有一個屆次。

**天氣資料的作用**：讓跨賽事成績有脈絡可解讀。同距離但不同年天氣條件，可以解釋為什麼某年成績普遍較慢。

### 2.3 成績（Result）

成績記錄是平台最核心的資料，分兩個維度理解：

**維度一：來源可信度（source_credibility）**

這個欄位取代了舊版的兩個欄位（`source_type` + `verification_status`），表達「這筆成績有多可信」：

```
official      → 最高可信度，助手從官方賽事成績建立
certificate   → 高可信度，選手上傳完賽證書並通過人工審核
self_reported → 低可信度，選手自填，無附加驗證
```

可信度是**單向往上**的，不能降級。官方成績永遠是官方成績，即使選手認領並上傳公證後也不改變其來源性質。

**維度二：認領狀態（claim_status）**

表達「這筆成績與哪個帳號的關聯狀態」：

```
unclaimed → 策展層建立，無帳號關聯
pending   → 選手已申請認領，待審核
claimed   → 認領完成，與帳號關聯
unlinked  → 選手解除關聯，成績回公共狀態
```

這兩個維度是完全獨立的：一筆 `official + claimed` 的成績，表示「助手建立的官方成績，且已被選手認領到帳號」。

---

## 3. 兩層資料架構：策展層 vs 社群層

這是 Tri·log 最核心的設計創新，解決了冷啟動問題。

### 策展層（Curated Layer）

- **誰建立**：助手（assistant 角色）
- **來源**：官方賽事成績單、官網公告
- **特徵**：`source_credibility = 'official'`，`athlete_id = NULL`（未認領）
- **永久保留**：即使對應選手刪帳，策展層成績也作為公共資料保留

**策展層的冷啟動效果**：平台上線第一天，助手預先建立台灣主要賽事的歷年成績。訪客一進來就看到有意義的排行榜，不是空榜。

### 社群層（Community Layer）

- **誰建立**：選手本人
- **來源**：自行輸入
- **特徵**：`source_credibility = 'self_reported'`，`athlete_id = 本人 UUID`
- **刪帳後**：1 個月緩衝後永久清除

### 兩層在排行榜的呈現

- 兩層成績合併在同一排行榜
- `official` 和 `certificate` 成績優先排列，標示「已公證」徽章
- `self_reported` 成績排列在最後，標示「自填」標示
- 未認領的策展層成績顯示「未認領」提示，鼓勵選手來認領

---

## 4. 認領機制（Claim Flow）

認領是讓策展層成績與真實帳號產生關聯的流程。

### 觸發情境

1. 選手在排行榜看到自己的名字但沒有帳號頭像（未認領）
2. 社群朋友標記了一筆成績通知選手（`claim_tags` 機制）
3. 選手自行搜尋名字，找到未認領的成績

### 認領流程

```
選手找到成績 → 點「認領此成績」
→（未登入時先導向登入/註冊）
→ 上傳完賽證書
→ claim_status: unclaimed → pending
→ 助手審核：比對證書與成績
→ 審核通過：claim_status: pending → claimed，source_credibility 若為 self_reported 升級為 certificate
→ 審核拒絕：claim_status: pending → unclaimed，athlete_id 清空
```

### 解除關聯（Unlinked）

若選手後悔認領（例如接力賽被助手建檔，本人不希望公開），可申請解除：
- `claim_status: claimed → unlinked`
- `athlete_id` 設回 null
- 策展層成績仍保留於公共資料（姓名快照不刪除）
- 個人帳號頁面不再顯示此成績

**設計意圖**：維護策展層的完整性，同時尊重個人隱私。

### 知情人標記（Claim Tags）

社群裡有人認識某位未認領選手，可以標記「我已通知本人」：
- 一人只能對同一成績標記一次
- 上限 5 人標記後鎖定
- 平台自動產生分享文字，讓知情人可以透過 LINE/WhatsApp 通知本人
- 標記數反映「有多少人在關注這筆成績」，熱門未認領成績可在首頁特別呈現

---

## 5. 排行榜邏輯

### 進榜條件（同時滿足）

1. `is_public = true`（選手設為公開）
2. `claim_status IN ('unclaimed', 'claimed')`（不包含 pending、unlinked）
3. 有顯示名稱：未認領成績用 `athlete_name_snapshot`；已認領成績的選手必須填 `nickname`
4. `result_type = 'solo'`（solo 榜，relay 榜另計）

### 兩種顯示模式

- **Leaderboard 模式**（預設）：每位選手只取歷史最佳成績，名單最精簡
- **Records 模式**：顯示全部符合條件的成績，可進一步篩選

### 篩選維度

- 距離：Sprint / Olympic / 70.3 / Full（四個獨立排行）
- 性別：男子組 / 女子組 / 全部
- 年齡組：以 5 年為一組，依出生年份自動計算（如 M30-34）
- 地區：全球 / 台灣 / 各國（依 nationality）
- 賽事：查看特定賽事的最佳成績

### 年齡組計算規則

年齡組以**每年 1 月 1 日**更新（current year - birth_year），5 年一組：
- 18-24, 25-29, 30-34, 35-39, 40-44...
- 未填 birth_year 的成績只進總榜，不進分組榜

---

## 6. 接力（Relay）

### 為什麼接力需要獨立設計

Solo 和 Relay 在資料語意上本質不同：
- Solo 的 T1/T2 換區是**個人時間**，反映選手表現
- Relay 的 T1/T2 換區是**隊伍交接成本**，無法歸屬特定成員

強制統一會使資料語意不清，因此接力設計為獨立的資料結構。

### 資料結構

```
Result (result_type=relay, total_seconds)
  └── Team (team_name, t1_seconds, t2_seconds)
        ├── TeamMember (athlete_id, disciplines=['swim'], split_seconds)
        ├── TeamMember (athlete_id, disciplines=['bike'], split_seconds)
        └── TeamMember (athlete_id, disciplines=['run'], split_seconds)
```

- `disciplines` 可以是一個人負責多項（如 `['swim','bike']`）
- `split_seconds` 只計算純運動時間，不含換區
- `Team.total_seconds = Σ(split_seconds) + t1 + t2`

### 認領機制

- 成員獨立認領，互不影響
- 任一成員認領即可使隊伍成績出現在排行榜
- 若成員不同意公開，可申請自己的分項成績解除關聯

### 接力排行榜

- 接力榜與 solo 榜完全分開，不混合
- 按性別分組（male / female / mixed）
- 初期不做年齡組分組

---

## 7. 隱私模型

### 選手層級

- `deleted_at`：軟刪除，1 個月緩衝後永久清除
- 刪帳時：所有 `claimed` 成績自動轉為 `unlinked`，社群層成績 1 個月後刪除

### 成績層級

- `is_public = false`：私人成績，只有本人可見，不進排行榜
- 選手可以隨時切換公開/私人
- 未成年（`is_minor = true`）的選手，新成績預設 `is_public = false`

### 策展層的特殊性

策展層成績（`source_credibility = 'official'`）是公共資料：
- 不因帳號刪除而消失
- 不受 `is_public` 控制（unclaimed 成績永遠顯示在排行榜，這是設計意圖）
- 選手只能透過 `unlinked` 解除帳號關聯，無法讓策展層成績消失

---

## 8. 業務規則速查

### 必然成立的不變式（Invariants）

| 規則 | 說明 |
|------|------|
| `official` 不可降級 | DB trigger 強制 |
| relay 成績的 swim/t1/bike/t2/run 必須為 null | DB CHECK constraint 強制 |
| 同一選手對同一成績只能標記一次 | DB UNIQUE constraint 強制 |
| 同一賽事同一年只有一個屆次 | DB UNIQUE(race_id, year) 強制 |
| 進排行榜必須有顯示名稱 | View 層過濾 |
| 標記上限 5 人 | DB trigger 強制 |

### 條件業務規則

| 情境 | 規則 |
|------|------|
| 選手刪帳 | claimed 成績 → unlinked；self_reported 成績 1 個月後刪除 |
| 認領通過 | `claim_status: pending → claimed`；若原為 self_reported 則升為 certificate |
| 認領拒絕 | `claim_status: pending → unclaimed`；`athlete_id` 清空 |
| 成員解除接力關聯 | 不影響其他成員；若全員解除，隊伍仍保留於策展層 |
| is_minor = true | 新成績預設 `is_public = false` |

---

## 9. 角色能力矩陣

| 操作 | 未登入 | athlete | assistant | admin |
|------|--------|---------|-----------|-------|
| 看排行榜 | ✅ | ✅ | ✅ | ✅ |
| 看成績詳情（公開） | ✅ | ✅ | ✅ | ✅ |
| 看自己的私人成績 | ❌ | ✅ | ✅ | ✅ |
| 新增自己的成績 | ❌ | ✅ | ✅ | ✅ |
| 刪除自己的成績 | ❌ | ✅（self_reported only）| ✅ | ✅ |
| 認領成績 | ❌ | ✅ | ✅ | ✅ |
| 標記未認領 | ❌ | ✅ | ✅ | ✅ |
| 審核認領申請 | ❌ | ❌ | ✅ | ✅ |
| 新增賽事 / 屆次 | ❌ | ❌ | ✅ | ✅ |
| 批次匯入策展層 | ❌ | ❌ | ✅ | ✅ |
| 升降選手角色 | ❌ | ❌ | ❌ | ✅ |
| 刪除任何資料 | ❌ | ❌ | ❌ | ✅ |
