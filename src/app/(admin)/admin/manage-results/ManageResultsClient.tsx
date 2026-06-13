'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useActionState, useState, useTransition } from 'react'
import { deleteAdminResult, deleteAdminRelay, type ActionState } from './actions'

type SoloItem = {
  id: string
  name: string
  total: string
  race: string
  distance: string
  claim_status: string
  source: string
  claimed: boolean
  created_at: string
}

type RelayItem = {
  id: string
  result_id: string
  name: string
  total: string
  race: string
  distance: string
  claim_status: string
  source: string
  member_names: string
  member_count: number
  created_at: string
}

type Props = {
  solo:        SoloItem[]
  relay:       RelayItem[]
  initialQ:    string
  initialType: string
}

const DIST: Record<string, string> = { sprint: 'Sprint', olympic: '51.5', '70.3': '113', full: '226' }

const STATUS_STYLE: Record<string, string> = {
  claimed:   'bg-good/10 text-good',
  unclaimed: 'bg-warn/10 text-warn',
  pending:   'bg-warn/10 text-warn',
}

export function ManageResultsClient({ solo, relay, initialQ, initialType }: Props) {
  const router   = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()

  const [q, setQ]       = useState(initialQ)
  const [type, setType] = useState(initialType)

  function search(newQ: string, newType: string) {
    const params = new URLSearchParams()
    if (newQ)   params.set('q', newQ)
    if (newType) params.set('type', newType)
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 搜尋列 */}
      <div className="flex gap-3 items-center">
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search(q, type)}
          placeholder="搜尋姓名 / 隊名…"
          className="flex-1 rounded-lg border border-border-strong bg-bg-elev px-3.5 py-2 text-sm text-ink placeholder:text-ink-4 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <select
          value={type}
          onChange={e => { setType(e.target.value); search(q, e.target.value) }}
          className="rounded-lg border border-border-strong bg-bg-elev px-3 py-2 text-sm text-ink outline-none focus:border-accent"
        >
          <option value="">全部</option>
          <option value="solo">個人成績</option>
          <option value="relay">接力成績</option>
        </select>
        <button
          onClick={() => search(q, type)}
          className="rounded-lg bg-accent/10 border border-accent/30 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/20 transition"
        >
          搜尋
        </button>
      </div>

      {/* 個人成績 */}
      {(!type || type === 'solo') && (
        <section>
          <h2 className="text-xs font-semibold text-ink-4 uppercase tracking-widest mb-2">
            個人成績 {solo.length > 0 && <span className="normal-case font-normal">（{solo.length} 筆）</span>}
          </h2>
          {solo.length === 0
            ? <p className="text-sm text-ink-4 py-4">—</p>
            : (
              <div className="flex flex-col gap-1.5">
                {solo.map(r => <SoloRow key={r.id} r={r} />)}
              </div>
            )
          }
        </section>
      )}

      {/* 接力成績 */}
      {(!type || type === 'relay') && (
        <section>
          <h2 className="text-xs font-semibold text-ink-4 uppercase tracking-widest mb-2">
            接力成績 {relay.length > 0 && <span className="normal-case font-normal">（{relay.length} 筆）</span>}
          </h2>
          {relay.length === 0
            ? <p className="text-sm text-ink-4 py-4">—</p>
            : (
              <div className="flex flex-col gap-1.5">
                {relay.map(r => <RelayRow key={r.id} r={r} />)}
              </div>
            )
          }
        </section>
      )}
    </div>
  )

  function SoloRow({ r }: { r: SoloItem }) {
    const [state, action, pending] = useActionState(deleteAdminResult, { error: null } as ActionState)
    const [confirm, setConfirm]    = useState(false)

    return (
      <div className="rounded-xl border border-border bg-bg-card px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ink truncate">{r.name}</p>
          <p className="text-xs text-ink-4 mt-0.5">
            {r.race} · {DIST[r.distance] ?? r.distance} · {r.source}
          </p>
        </div>
        <span className="font-mono text-sm text-accent tabular-nums shrink-0">{r.total}</span>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[r.claim_status] ?? 'bg-ink-4/10 text-ink-4'}`}>
          {r.claim_status}
        </span>
        {state.error && <span className="text-xs text-run shrink-0">{state.error}</span>}
        {!confirm ? (
          <button
            onClick={() => setConfirm(true)}
            className="shrink-0 text-xs text-ink-4 hover:text-run px-2 py-1 rounded hover:bg-run/10 transition"
          >
            刪除
          </button>
        ) : (
          <form action={action} className="flex items-center gap-1 shrink-0">
            <input type="hidden" name="id" value={r.id} />
            <button type="submit" disabled={pending}
              className="text-xs text-run px-2 py-1 rounded bg-run/10 hover:bg-run/20 transition font-medium">
              {pending ? '…' : '確認'}
            </button>
            <button type="button" onClick={() => setConfirm(false)}
              className="text-xs text-ink-4 px-2 py-1 rounded hover:bg-bg-elev transition">
              取消
            </button>
          </form>
        )}
      </div>
    )
  }

  function RelayRow({ r }: { r: RelayItem }) {
    const [state, action, pending] = useActionState(deleteAdminRelay, { error: null } as ActionState)
    const [confirm, setConfirm]    = useState(false)

    return (
      <div className="rounded-xl border border-border bg-bg-card px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ink truncate">
            {r.name}
            <span className="ml-2 text-xs text-ink-4 font-normal">接力 · {r.member_count} 人</span>
          </p>
          <p className="text-xs text-ink-4 mt-0.5">
            {r.race} · {DIST[r.distance] ?? r.distance}
          </p>
          {r.member_names && (
            <p className="text-xs text-ink-4 mt-0.5 truncate">{r.member_names}</p>
          )}
        </div>
        <span className="font-mono text-sm text-accent tabular-nums shrink-0">{r.total}</span>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[r.claim_status] ?? 'bg-ink-4/10 text-ink-4'}`}>
          {r.claim_status}
        </span>
        {state.error && <span className="text-xs text-run shrink-0">{state.error}</span>}
        {!confirm ? (
          <button
            onClick={() => setConfirm(true)}
            className="shrink-0 text-xs text-ink-4 hover:text-run px-2 py-1 rounded hover:bg-run/10 transition"
          >
            刪除
          </button>
        ) : (
          <form action={action} className="flex items-center gap-1 shrink-0">
            <input type="hidden" name="team_id" value={r.id} />
            <button type="submit" disabled={pending}
              className="text-xs text-run px-2 py-1 rounded bg-run/10 hover:bg-run/20 transition font-medium">
              {pending ? '…' : '確認'}
            </button>
            <button type="button" onClick={() => setConfirm(false)}
              className="text-xs text-ink-4 px-2 py-1 rounded hover:bg-bg-elev transition">
              取消
            </button>
          </form>
        )}
      </div>
    )
  }
}
