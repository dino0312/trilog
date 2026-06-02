# docs/api.md — API 設計參考

> 說明所有 API 端點的設計意圖、請求格式、業務規則與授權要求。  
> 頁面路由（`/leaderboard`、`/records` 等）不在本文件範疇。

---

## 1. 設計原則

**REST 慣例**：資源名稱用複數名詞，HTTP 動詞語意明確。

**URL 設計**：賽事用 `slug`（可讀），成績用 `uuid`（穩定），其他資源用 `uuid`。

```
/api/races/ironman-taiwan               ← slug，SEO 友善
/api/races/ironman-taiwan/editions/2024 ← slug + year
/api/results/550e8400-...               ← uuid
```

**授權三層**：
- `public`：無需登入，可用 anon key 直接查詢
- `authed`：需要有效 session（`supabase.auth.getUser()` 回傳 user）
- `assistant`：需要 `role IN ('assistant', 'admin')`（由 `is_assistant_or_above()` 判斷）

**分頁**：列表端點預設 50 筆，支援 `?limit=` 和 `?offset=` 或 `?cursor=`（後者效能較好）。

**回應格式**：統一 JSON，成功為 `{ data: ... }`，錯誤為 `{ error: { code, message } }`。

**時間格式**：所有成績時間以整數秒回傳（`total_seconds: 7282`），客戶端呼叫 `secondsToTime()` 顯示。

---

## 2. 認證 `/api/auth`

目前由 Supabase Auth 直接處理，Next.js 只需要提供 OAuth callback 路由。

| 路由 | 方法 | 說明 |
|------|------|------|
| `/api/auth/callback` | GET | OAuth callback，交換 code 換 session，redirect 回應用 |

Supabase Auth 處理的流程（不需要自己實作）：
- Email 登入：直接呼叫 `supabase.auth.signInWithPassword()`
- Google/Apple OAuth：呼叫 `supabase.auth.signInWithOAuth()`
- 登出：呼叫 `supabase.auth.signOut()`

---

## 3. 排行榜 `/api/leaderboard`

| 路由 | 方法 | 授權 | 說明 |
|------|------|------|------|
| `/api/leaderboard` | GET | public | 主排行榜，支援多維篩選 |
| `/api/leaderboard/records` | GET | public | 各距離歷史最速（策展層頂點）|
| `/api/leaderboard/unclaimed` | GET | public | 熱門未認領成績清單 |
| `/api/leaderboard/relay` | GET | public | 接力排行榜 |

### GET /api/leaderboard

**查詢參數**：

| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `distance` | string | ✅ | 'sprint' / 'olympic' / '70.3' / 'full' |
| `gender` | string | ❌ | 'M' / 'F'，不填則顯示全部 |
| `age_group` | string | ❌ | 如 'M30-34'，不填則顯示全部 |
| `nationality` | string | ❌ | ISO 3166-1 alpha-3，不填則全球 |
| `race_id` | uuid | ❌ | 限定特定賽事 |
| `mode` | string | ❌ | 'leaderboard'（預設，每人只取最佳）/ 'records'（全部）|
| `limit` | int | ❌ | 預設 50，最大 200 |
| `offset` | int | ❌ | 分頁偏移 |

**資料來源**：查詢 `leaderboard_entries` view，應用 `RANK() OVER (PARTITION BY distance_category ORDER BY total_seconds)` window function。

**回傳結構**：
```
{
  data: LeaderboardRow[]   // 含計算後的 rank、delta_seconds
  meta: {
    total: number          // 符合條件的總筆數
    distance: string
    gender: string | null
  }
}
```

**業務規則**：
- Leaderboard 模式下，同一選手多筆成績只取 `total_seconds` 最小的一筆
- `delta_seconds` = 本筆 `total_seconds` - 第一名 `total_seconds`（客戶端計算或 API 計算皆可）
- 未認領的策展層成績（`claim_status = 'unclaimed'`）正常顯示，但無頭像

---

## 4. 成績 `/api/results`

| 路由 | 方法 | 授權 | 說明 |
|------|------|------|------|
| `/api/results` | GET | public | 搜尋成績 |
| `/api/results` | POST | authed | 新增個人成績（social layer）|
| `/api/results/:id` | GET | public | 取得成績詳情 |
| `/api/results/:id` | PUT | authed | 修改自己的成績 |
| `/api/results/:id/certificate` | POST | authed | 上傳完賽證書 |
| `/api/results/:id/claim` | POST | authed | 認領未認領成績 |
| `/api/results/:id/unclaim` | POST | authed | 解除認領（unlink）|
| `/api/results/:id/tags` | GET | public | 取得標記列表 |
| `/api/results/:id/tags` | POST | authed | 新增知情人標記 |
| `/api/results/:id/tags/:tagId` | DELETE | authed | 撤銷自己的標記 |
| `/api/results/relay` | POST | authed | 新增接力成績 |

### POST /api/results（新增個人成績）

**業務規則**：
- `source_credibility` 強制設為 `self_reported`（不接受客戶端傳入）
- `result_type` 強制設為 `solo`（relay 有獨立端點）
- `athlete_id` 自動設為 `auth.uid()`（不接受客戶端傳入）
- 若選手 `is_minor = true`，強制 `is_public = false`

**請求 body**（`NewResultForm` 型別）：

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `race_edition_id` | uuid | ✅ | 所屬賽事屆次 |
| `total_seconds` | int | ✅ | 完賽總時間（秒）|
| `swim_seconds` | int | ❌ | 游泳分項（秒）|
| `t1_seconds` | int | ❌ | T1 換區（秒）|
| `bike_seconds` | int | ❌ | 自行車分項（秒）|
| `t2_seconds` | int | ❌ | T2 換區（秒）|
| `run_seconds` | int | ❌ | 跑步分項（秒）|
| `is_public` | boolean | ✅ | 是否公開 |
| `notes` | string | ❌ | 備註，最多 2000 字 |
| `bib_number` | string | ❌ | 號碼牌 |

**分項加總驗證**：若提供了全部 5 個分項，`swim + t1 + bike + t2 + run` 必須等於 `total`（誤差 ±1 秒容許，處理四捨五入）。

### POST /api/results/:id/claim（認領成績）

**業務規則**：
- 呼叫 DB function `claim_result(p_result_id, p_certificate_url?)`
- 只能認領 `claim_status IN ('unclaimed', 'unlinked')` 的成績
- 回傳成功後，`claim_status` 變為 `pending`，前端應提示「等待審核」

### POST /api/results/:id/tags（新增標記）

**業務規則**：
- 呼叫 DB trigger 驗證（上限 5 人、狀態檢查）
- 成功後呼叫 `generate_claim_share_text()` 組合分享文字回傳給前端
- 前端呼叫 Web Share API 讓用戶分享

**回傳額外欄位**：
```
{
  data: { tag: ClaimTag, shareText: string, shareUrl: string }
}
```

### POST /api/results/relay（新增接力成績）

**業務規則**：
- 在一個 transaction 中同時寫入 results + teams + team_members 三張表
- `result_type` 強制為 'relay'
- `results` 表的 swim/t1/bike/t2/run_seconds 強制為 null
- 每個 `team_member.split_seconds` 之和 + `teams.t1_seconds` + `teams.t2_seconds` 必須等於 `results.total_seconds`

---

## 5. 賽事 `/api/races`

| 路由 | 方法 | 授權 | 說明 |
|------|------|------|------|
| `/api/races` | GET | public | 列出賽事 |
| `/api/races` | POST | assistant | 新增賽事 |
| `/api/races/:slug` | GET | public | 取得賽事詳情（含屆次列表）|
| `/api/races/:slug` | PUT | assistant/editor | 更新賽事基本資料 |
| `/api/races/:slug/editions` | GET | public | 列出所有屆次 |
| `/api/races/:slug/editions` | POST | assistant | 新增屆次（自動觸發天氣查詢）|
| `/api/races/:slug/editions/:year` | GET | public | 取得特定屆次（含天氣、成績分佈）|
| `/api/races/:slug/editions/:year` | PUT | assistant/editor | 更新屆次資料 |
| `/api/races/:slug/editions/:year/results` | POST | assistant | 批次匯入策展層成績 |

### POST /api/races/:slug/editions（新增屆次）

**自動觸發天氣查詢**：新增屆次時，系統以賽事的 `lat` + `lng` + `race_date` 查詢 Open-Meteo Historical API，自動填入 `weather_data`。

```
https://archive-api.open-meteo.com/v1/archive
  ?latitude={lat}&longitude={lng}
  &start_date={race_date}&end_date={race_date}
  &daily=temperature_2m_max,precipitation_sum,windspeed_10m_max,winddirection_10m_dominant
```

若 API 失敗，屆次仍正常建立，`weather_data = null`，`weather_source = null`。

### POST /api/races/:slug/editions/:year/results（批次匯入策展層）

**業務規則**：
- `source_credibility` 強制為 `official`
- `claim_status` 強制為 `unclaimed`
- `athlete_id` 強制為 `null`
- 支援 CSV 或 JSON 格式
- 每批最多 500 筆，超過需分批

---

## 6. 選手 `/api/athletes`

| 路由 | 方法 | 授權 | 說明 |
|------|------|------|------|
| `/api/athletes/me` | GET | authed | 取得自己的完整資料（含私人成績）|
| `/api/athletes/me` | PUT | authed | 更新 Profile |
| `/api/athletes/me` | DELETE | authed | 申請刪除帳號（軟刪除）|
| `/api/athletes/:id` | GET | public | 取得他人公開 Profile |

### GET /api/athletes/:id（公開 Profile）

**資料來源**：`athlete_public_profiles` view

**回傳內容**：nickname、nationality、gender、birth_year、bio、avatar_url、public_result_count  
**不回傳**：email、role、is_minor、deleted_at

### DELETE /api/athletes/me（申請刪帳）

**業務規則**（依序執行，建議在 transaction 中）：
1. `athletes.deleted_at = now()`
2. 所有 `claimed` 成績 → `unlinked`（`athlete_id = null`）
3. 回傳確認訊息，告知 30 天後永久清除

**注意**：`self_reported` 成績不立刻刪除，由排程在 1 個月後清除。

---

## 7. 管理 `/api/admin`

| 路由 | 方法 | 授權 | 說明 |
|------|------|------|------|
| `/api/admin/claims` | GET | assistant | 列出待審核認領（claim_status=pending）|
| `/api/admin/claims/:id/approve` | POST | assistant | 核准認領 |
| `/api/admin/claims/:id/reject` | POST | assistant | 拒絕認領 |
| `/api/admin/athletes/:id/role` | PUT | admin | 修改選手角色 |

### POST /api/admin/claims/:id/approve

**業務規則**：呼叫 `approve_claim(id, true)`，由 DB function 處理狀態轉換。

---

## 8. 路由守衛規則

路由守衛在 `src/middleware.ts`（Edge Runtime）執行，在任何頁面/API 渲染前觸發。

| 路徑 | 未登入 | 已登入 |
|------|--------|--------|
| `/leaderboard` | ✅ 放行 | ✅ 放行 |
| `/records` | redirect → `/login?redirectTo=/records` | ✅ 放行 |
| `/profile` | redirect → `/login?redirectTo=/profile` | ✅ 放行 |
| `/login` | ✅ 放行 | redirect → `/leaderboard` |
| `/register` | ✅ 放行 | redirect → `/leaderboard` |
| `/api/*` | 由各端點自行判斷 | 由各端點自行判斷 |

API 端點本身不依賴 middleware 做授權，各端點自行呼叫 `supabase.auth.getUser()` 確認登入狀態，再由 RLS 決定資料存取。

---

## 9. 錯誤回傳規範

```
{
  "error": {
    "code": "RESULT_NOT_FOUND",        // 機器可讀的錯誤代碼
    "message": "找不到此成績",           // 人類可讀的訊息
    "details": {}                       // 可選，額外資訊
  }
}
```

**HTTP Status Code 對應**：

| 情境 | Status |
|------|--------|
| 成功 | 200 / 201 |
| 請求格式錯誤 | 400 |
| 未登入 | 401 |
| 無權限（已登入但無授權）| 403 |
| 資源不存在 | 404 |
| 業務規則衝突（如重複標記）| 409 |
| 服務器錯誤 | 500 |

---

## 10. 尚未實作的 API（Phase 2）

| 端點 | 說明 |
|------|------|
| `POST /api/results/:id/share` | 產生成績分享卡（圖片）|
| `POST /api/athletes/search` | 模糊搜尋選手名稱（Phase 2：Email 通知）|
| `GET /api/races/:slug/stats` | 賽事歷年成績分佈統計 |
| `POST /api/imports/gpx` | GPX 裝置檔案解析（Phase 3）|
