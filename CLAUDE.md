@AGENTS.md

# Tri·log — Claude Code 操作指南

## 文件維護規則（最高優先）

**每次架構變更後，必須更新以下文件：**

| 變更類型 | 必須更新 |
|---------|---------|
| 資料庫 schema（`supabase/migrations/`） | `docs/decisions.md`（ADR）、`docs/api.md`（資料模型） |
| API endpoint（`src/app/api/`） | `docs/api.md`、視情況更新 `docs/decisions.md` |
| 型別定義（`src/types/database.ts`） | `docs/api.md`（回傳格式）、`CLAUDE.md`（若影響操作規則） |
| 中介層（`src/middleware.ts` / `src/proxy.ts`） | `docs/decisions.md`（ADR-003）、`docs/architecture.md` |
| 框架設定（`next.config.ts`、`package.json`） | `docs/decisions.md`（新 ADR 或更新既有 ADR） |

**文件與程式碼不一致時，永遠優先更新文件。**

這條規則已同時設定為 `PostToolUse` hook（`.claude/settings.json`），架構變更後 Claude 會自動觸發文件更新。

---

## 專案概述

**Tri·log** — 鐵人三項成績記錄與跨賽事排行榜平台。  
Spec 版本：v11（`trilog_spec_v11.docx`）  
文件索引：`docs/architecture.md`（系統架構）、`docs/decisions.md`（ADR）、`docs/api.md`（API）

## 技術堆疊

| 層次 | 技術 | 版本 |
|------|------|------|
| 框架 | Next.js App Router | 16.2.7（⚠️ 有 breaking changes，詳見下方） |
| 語言 | TypeScript strict mode | 5.x |
| 樣式 | Tailwind CSS v4 + CSS Custom Properties | 4.x |
| 後端 / DB | Supabase (PostgreSQL + Auth + Storage) | — |
| 套件管理 | npm | — |

## ⚠️ Next.js 16 Breaking Changes

**這不是你熟悉的 Next.js。** 詳見 `AGENTS.md` 警告。

關鍵差異：
- `middleware.ts` 已 deprecated，正式名稱改為 `proxy.ts`（目前暫緩遷移，見 ADR-003）
- 在寫任何 Next.js 相關程式碼前，先讀 `node_modules/next/dist/docs/` 中的相關文件

## 目錄結構重點

```
src/
├── app/
│   ├── (main)/          # 主應用 Route Group（有 Nav）
│   ├── (auth)/          # 認證頁 Route Group（全螢幕置中）
│   └── api/             # Route Handlers
├── lib/supabase/
│   ├── client.ts        # 瀏覽器端（Client Components）
│   ├── server.ts        # Server Components / Route Handlers
│   └── middleware.ts    # Edge Middleware（proxy.ts 遷移前）
├── types/
│   ├── database.ts      # Supabase DB 型別（手動維護）
│   └── index.ts         # 應用層業務型別
└── middleware.ts        # Next.js Middleware 入口

supabase/migrations/     # 依序執行的 SQL migration
docs/                    # 架構文件（architecture.md、decisions.md、api.md）
```

## 開發規則

### Supabase Client 使用規則

| 情境 | 使用哪個 client |
|------|---------------|
| `'use client'` 元件 | `src/lib/supabase/client.ts` |
| Server Component / Route Handler | `src/lib/supabase/server.ts` |
| `middleware.ts` / `proxy.ts` | `src/lib/supabase/middleware.ts` |

**絕對不要在 `createServerClient` 和 `supabase.auth.getUser()` 之間插入任何程式碼。**

### 資料庫規則

- 時間欄位一律用 `timestamptz`，不用 `timestamp`
- 時間值一律以**整數秒**儲存，UI 負責格式化（`src/lib/utils/time.ts`）
- 不使用 PostgreSQL ENUM，一律用 `CHECK constraint`
- 所有新資料表必須啟用 RLS 並建立 policy
- `SECURITY DEFINER` 函式必須加 `SET search_path = public`

### 環境變數規則

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — 可以出現在前端
- `SUPABASE_SERVICE_ROLE_KEY` — **絕對不能出現在前端或 `NEXT_PUBLIC_` 變數**

### 不可違反的核心規則

完整清單見 `docs/decisions.md` 附錄「不可違反的全域規則總表」（17 條）。

## 常用指令

```bash
npm run dev      # 啟動開發伺服器
npm run build    # 生產環境建置
npm run lint     # ESLint 檢查
npx tsc --noEmit # TypeScript 型別檢查
```
