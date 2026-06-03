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
      leaderboard/   公開排行榜
      records/       我的成績（需登入）
        new/         新增成績
      profile/       個人資料（需登入）
    (auth)/          認證 Route Group，全螢幕置中 Layout
      login/
      register/
    api/             Route Handlers（待建立）
    globals.css      設計 token + Tailwind v4 主題橋接
    layout.tsx       根 Layout
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
  types/
    database.ts      Supabase DB 型別（手動維護）
    index.ts         應用層業務型別

supabase/
  migrations/        9 個 SQL migration，按序號執行

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
| `NEXT_PUBLIC_SUPABASE_URL` | 三個 client | ✅ 可以（NEXT_PUBLIC_） |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 三個 client | ✅ 可以（RLS 保護資料） |
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
Free 方案閒置 7 天自動暫停。已在 `vercel.json` 設定 Cron Job，每週一自動 ping `/api/health` 保持活躍，無需額外設定。

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

## 11. 文件維護義務

**每次觸及以下路徑時，必須同步更新對應文件：**

| 觸碰的檔案 | 必須更新 |
|-----------|---------|
| `supabase/migrations/*.sql` | `docs/database.md`、`docs/decisions.md`（若有新決策） |
| `src/app/api/**` | `docs/api.md` |
| `src/types/database.ts` | `docs/database.md`（型別欄位）、`docs/api.md`（回傳格式） |
| 新增/修改 Route Group 或 middleware | `docs/architecture.md`、`CLAUDE.md` |
| `package.json` 新增依賴 | `docs/decisions.md`（若有新決策）、`CLAUDE.md`（第 3 節） |

文件與程式碼不一致時，**永遠優先更新文件**。

`.claude/settings.json` 的 `PostToolUse` hook 會在觸碰架構檔案後自動提醒更新文件。
