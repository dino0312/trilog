# CLAUDE.md — Tri·log AI Agent 操作手冊

> 這份文件是新 Claude Session 的第一份讀物。
> 目標：讀完後可以立刻接手任何開發任務，不需要問背景問題。

---

## 1. 產品一句話

Tri·log 是鐵人三項選手的**跨賽事成績記錄與排行榜平台**。
核心差異：內建「策展層」——助手預先建立官方成績，讓平台上線第一天就有完整內容，選手再逐步「認領」屬於自己的成績。

---

## 2. 知識庫導覽

| 想了解 | 讀這份文件 |
|--------|-----------|
| 產品邏輯、業務規則、資料概念 | `docs/domain.md` |
| 資料庫 schema、RLS、trigger | `docs/database.md` |
| API 端點設計、請求格式 | `docs/api.md` |
| 技術選型理由、架構決策 | `docs/decisions.md` |
| 系統架構圖、資料流 | `docs/architecture.md` |
| UI 功能規格、頁面行為 | `docs/features.md` |
| 實作進度、已知問題、技術決策 | `docs/devlog.md` |
| 產品規格書（完整版，含決策背景）| `trilog_spec.json`（Claude.ai project 同步輸出）|

---

## 3. 技術堆疊速查

| 層次 | 技術 | 重要版本備注 |
|------|------|------------|
| 框架 | Next.js App Router | **v16.2.7 — 有 breaking changes，見第 5 節** |
| 語言 | TypeScript strict | v5 |
| 樣式 | Tailwind CSS v4 + CSS Custom Properties | `@theme inline` 語法，非 v3 config |
| DB / Auth | Supabase (PostgreSQL) | Row Level Security 全面啟用 |
| 部署 | Vercel | 自動 CI/CD |
| 天氣 API | Open-Meteo | 免費，無需金鑰 |
| Email | Resend | Phase 2 功能，尚未整合 |

---

## 4. 專案目錄結構

```
src/
  app/
    (main)/          主應用 Route Group，有 Nav Layout
      leaderboard/   最速榜（best-per-athlete，?distance=full 預設）
      rankings/      排行榜（distance 必選，?distance=full 預設）
      relay/         接力榜
      unclaimed/     未認領成績（標記 + 認領）
      races/         賽事資料庫
      results/[id]/  成績詳情頁
      records/       我的成績（需登入）
        new/         新增成績（含 ?for=other 幫他人新增）
        relay/new/   新增接力成績
      my/
        profile/     個人資料（Inline 編輯）
        wishlist/    Wish List（待實作）
        feed/        追蹤動態（Phase 2）
      teams/[id]/    隊伍頁
    (admin)/         管理區 Route Group（role ≥ assistant）
      admin/         審核中心
        races/       賽事管理
          review/    賽事後台審核（待實作）
        results/     官方成績輸入工具
    (auth)/          認證 Route Group，全螢幕置中 Layout
      login/
      register/
    api/             Route Handlers
    globals.css      設計 token + Tailwind v4 主題橋接
    layout.tsx       根 Layout（含 AuthModal）
    page.tsx         / → redirect /leaderboard
  lib/
    supabase/
      client.ts      瀏覽器端（'use client' 元件用）
      server.ts      Server Component / Route Handler 用
      middleware.ts  Edge Middleware 用
    utils/
      cn.ts          clsx + tailwind-merge
      time.ts        秒數 ↔ HH:MM:SS 轉換
  middleware.ts      路由守衛入口（⚠️ deprecated，見第 5 節）
  context/
    auth-modal.tsx   Auth Modal 全域狀態（React Context + useAuthModal hook）
  types/
    database.ts      Supabase DB 型別（手動維護）
    index.ts         應用層業務型別

supabase/
  migrations/        SQL migration，按序號執行

docs/               知識庫文件（本目錄）
.claude/
  settings.json      PostToolUse hook（架構變更時自動更新文件）
```

---

## 5. ⚠️ Next.js 16 重要差異

**這是 Next.js 16，不是你訓練資料裡的 Next.js 13/14。**

寫任何 Next.js 程式碼前，先查：
```
node_modules/next/dist/docs/01-app/
```

### 最重要的 Breaking Change：Middleware → Proxy

Next.js 16 將 `middleware.ts` 更名為 `proxy.ts`。
現狀：本專案仍用 `middleware.ts`（build 時有 deprecation warning）。
遷移時機：等 `@supabase/ssr` 官方更新文件後再遷移。詳見 `docs/decisions.md` ADR-003。

**在遷移前，不要把 `middleware.ts` 改成 `proxy.ts`。**

---

## 6. Supabase Client 使用規則

三個 client 對應三個 Next.js 執行環境，不可混用：

| 你在哪裡 | 用哪個 import |
|---------|-------------|
| `'use client'` 元件 | `@/lib/supabase/client` |
| Server Component 或 Route Handler | `@/lib/supabase/server` |
| `middleware.ts` / `proxy.ts` | `@/lib/supabase/middleware` |

**絕對禁止**：在 `createServerClient()` 和 `supabase.auth.getUser()` 之間放任何程式碼。
理由：這會破壞 token 自動刷新，導致用戶莫名被登出。

---

## 7. 環境變數

| 變數 | 哪裡用 | 可以暴露在前端？ |
|------|--------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | 三個 client | ✅ 可以（NEXT_PUBLIC_）|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 三個 client | ✅ 可以（RLS 保護資料）|
| `SUPABASE_SERVICE_ROLE_KEY` | 僅 server-side 管理操作 | ❌ **絕對不行** |

複製 `.env.local.example` 為 `.env.local` 並填入值。

---

## 8. 資料庫工作規則

### 必須遵守

- **時間戳**：一律 `timestamptz`，不用 `timestamp`
- **時間值**：一律整數秒儲存，UI 用 `secondsToTime()` 格式化
- **值域限制**：用 `CHECK constraint`，不用 PostgreSQL ENUM
- **所有新表**：必須 `ENABLE ROW LEVEL SECURITY` + 建立對應 policy
- **SECURITY DEFINER 函式**：必須加 `SET search_path = public`

### 禁止

- 直接用 `INSERT INTO athletes` 新增選手（由 `handle_new_user` trigger 處理）
- 直接 `DELETE FROM athletes`（只做軟刪除 `SET deleted_at = now()`）
- 降低 `source_credibility`（`official` 不可降級，trigger 強制執行）
- 刪除策展層成績（`source_credibility = 'official'`，永久保留）

---

## 9. 設計 Token 系統

設計使用 Variation C（Modern Sport Tech）深色主題，定義在 `globals.css`：

| 用途 | CSS 變數 | Tailwind class |
|------|---------|---------------|
| 頁面背景 | `--bg` (#0b0f14) | `bg-bg` |
| 卡片背景 | `--bg-card` (#161b22) | `bg-bg-card` |
| 主色強調 | `--accent` (#66c6be 薄荷綠) | `text-accent` / `bg-accent` |
| 主文字 | `--ink` (白) | `text-ink` |
| 次要文字 | `--ink-3` (#8892a0) | `text-ink-3` |
| 游泳顏色 | `--swim` (#4ea1ff 藍) | `text-swim` |
| 自行車顏色 | `--bike` (#66c6be 綠) | `text-bike` |
| 跑步顏色 | `--run` (#ff685e 紅) | `text-run` |

新增 token 時，`globals.css` 的 `:root {}` 和 `@theme inline {}` 必須同時更新。

---

## 10. 部署與維運

### Vercel 部署
Push 到 `main` branch 後 Vercel 自動部署。環境變數在 Vercel Dashboard 設定（不在 `.env.local`）。

### Supabase Free 方案注意事項
Free 方案閒置 7 天自動暫停。已在 `vercel.json` 設定 Cron Job，每週一自動 ping `/api/health` 保持活躍。

升級條件：MAU > 500 或 DB > 450 MB 時考慮升 Supabase Pro（$25/月）。詳見 `docs/decisions.md` ADR-019。

---

## 11. 常用指令

```bash
npm run dev          開發伺服器
npm run build        生產建置（確認無 TypeScript error）
npx tsc --noEmit     純 TypeScript 型別檢查
npm run lint         ESLint
```

---

## 12. 文件維護義務

**每次觸及以下路徑時，必須同步更新對應文件：**

| 觸碰的檔案 | 必須更新 |
|-----------|---------|
| `supabase/migrations/*.sql` | `docs/database.md`、`docs/decisions.md`（若有新決策）|
| `src/app/api/**` | `docs/api.md` |
| `src/types/database.ts` | `docs/database.md`（型別欄位）、`docs/api.md`（回傳格式）|
| 新增/修改 Route Group 或 middleware | `docs/architecture.md`、`CLAUDE.md` |
| `package.json` 新增依賴 | `docs/decisions.md`（若有新決策）、`CLAUDE.md`（第 3 節）|
| UI 流程、Nav、頁面行為有變動 | `docs/devlog.md`（spec-sync 區塊，見第 14 節）|
| Admin 功能新增或修改 | `docs/devlog.md`（spec-sync 區塊）|
| 角色權限規則變動 | `docs/domain.md`（第 9 節角色矩陣）+ `docs/devlog.md`（spec-sync 區塊）|

> ⚠️ **`docs/features.md` 與 `trilog_spec.json` 由 Claude.ai 維護，Claude Code 不需要自行更新。**
> UI 流程、Nav、頁面行為有變動時，將決策記錄在 `docs/devlog.md` 的 `spec-sync` 區塊即可，
> Claude.ai 規格討論確認後會同步輸出新版規格書。

文件與程式碼不一致時，**永遠優先更新文件**。

`.claude/settings.json` 的 `PostToolUse` hook 會在觸碰架構檔案後自動提醒更新文件。

---

## 13. 測試驗證標準作業流程（SOP）

每次完成功能實作後，**依序執行以下步驟**，全部通過後才視為完成並寫入 devlog。

### Step 1 — 靜態檢查（必做）

```bash
npx tsc --noEmit   # 型別錯誤 → 修正後才繼續
npm run lint       # Lint 警告 → 評估是否修正
```

- TypeScript 錯誤必須全部清零，不允許帶著錯誤進 devlog
- Lint 警告若為既有問題可暫緩，但必須在 devlog TODO 欄位標記

### Step 2 — 瀏覽器驗證（必做）

```bash
npm run dev   # 啟動開發伺服器（localhost:3000）
```

依功能性質，至少驗證以下項目並記錄結果：

| 驗證項目 | 說明 |
|---------|------|
| 頁面正常載入 | 不得有 500 / hydration error |
| 主要功能路徑 | 逐一測試核心 user story（成功路徑）|
| 邊界條件 | 空資料、未登入、權限不足等情境 |
| 表單送出 | 成功與錯誤回饋是否正確顯示 |
| RLS 保護 | 非授權角色不得存取 |

### Step 3 — 記錄驗證結果

在 devlog 的功能記錄中加入 **驗證紀錄** 區塊：

```markdown
**驗證紀錄**：

| # | 測試項目 | 結果 | 說明 |
|---|---------|------|------|
| 1 | 頁面載入 `/admin/members` | ✅ PASS | |
| 2 | 點擊列開啟 popup | ✅ PASS | |
| 3 | 未登入直接訪問 | ✅ PASS | redirect 至 /login |
| 4 | 角色切換（選手 → 助手）| ✅ PASS | 即時更新，無需重整 |

**待驗證**（對應待實作或環境限制）：
- ⚠️ 項目描述
```

- ✅ PASS：通過
- ❌ FAIL：未通過，需修正後重新驗證，不可帶著 FAIL 進 devlog 狀態「完成」
- ⚠️ 待驗證：功能尚未實作，或需特定條件（如真實 Supabase 資料）才能測試

### Step 4 — 更新 devlog 狀態

| 情況 | devlog 狀態標記 |
|------|--------------|
| 所有驗證 PASS | ✅ 完成 |
| 有待驗證項目，其餘 PASS | ⚠️ 部分完成 |
| 有 FAIL 未修正 | 🔧 進行中（不寫完成）|

---

## 14. 實作日誌與 spec-sync 協議

每次完成功能後，在 `docs/devlog.md` **最上方**新增一筆記錄。記錄格式如下，其中 `spec-sync` 區塊為必填：

````markdown
### [YYYY-MM-DD] 功能標題

**狀態**：✅ 完成 ／ 🔧 進行中 ／ ⚠️ 部分完成

```spec-sync
chapters: [38, 39]
status: implemented
decisions:
  - id: D001
    chapter: 38
    content: "決策摘要，一句話"
    spec_impact: true
    synced: false
```

**完成內容**：
- 具體做了什麼

**技術決策**：
- 選擇方案與理由（新架構決策同步寫入 decisions.md ADR）

**已知問題 ／ TODO**：
- 留給下一個 session 的注意事項

**驗證紀錄**：（見第 13 節 SOP）

**異動檔案**：
- 主要新增或修改的路徑
````

### spec-sync 欄位規則

| 欄位 | 規則 |
|------|------|
| `chapters` | 涉及的規格章節編號陣列；無對應章節填 `[]` |
| `status` | `implemented` / `partial` / `superseded` |
| `decisions[].id` | 同一 entry 內的流水號，格式 `D001` |
| `decisions[].chapter` | 對應規格章節號；純實作細節填 `0` |
| `decisions[].content` | 決策摘要，一句話，需足夠具體讓 Claude.ai 能定位到規格的哪一處 |
| `decisions[].spec_impact` | `true` = 規格書需補充或修正；`false` = 純實作細節，規格不需動 |
| `decisions[].synced` | **Claude Code 永遠寫 `false`**；由 Claude.ai 同步後改為 `true` |

**判斷 spec_impact 的原則**：
- 規格書沒寫到、但實作中做了決定 → `true`
- 規格書描述與實作不符 → `true`
- 純框架/DB 層的實作技巧，不影響功能行為 → `false`

**沒有規格影響的 entry**（如 bug fix、視覺微調）也必須寫 spec-sync 區塊，`decisions` 填 `[]` 即可：

```spec-sync
chapters: []
status: implemented
decisions: []
```

### 新 session 開始時，先讀：

```
1. docs/devlog.md    → 目前進度與已知問題（重點掃描 spec-sync 的 synced: false 項目）
2. trilog_spec.json  → 目標功能的完整規格（Claude.ai 維護）
3. docs/database.md  → schema 與 RLS
4. docs/api.md       → 端點設計
```

**待實作優先序：**

見 `trilog_spec.json` 各章節的 `impl_status` 欄位與 `docs/devlog.md` 最新狀態。
