'use client'

import { useState } from 'react'
import { MemberDetail } from './MemberDetail'

export type Member = {
  id: string
  email: string
  name: string | null
  nickname: string | null
  gender: string | null
  birth_year: number | null
  nationality: string | null
  bio: string | null
  avatar_url: string | null
  role: string
  is_minor: boolean
  created_at: string
  deleted_at: string | null
  suspended_at: string | null
  suspended_by: string | null
  suspend_reason: string | null
  result_count: number
}

const ROLE_LABEL: Record<string, string> = {
  athlete: '選手', assistant: '助手', admin: '管理員',
}
const ROLE_COLOR: Record<string, string> = {
  athlete:   'text-ink-3 bg-bg-elev',
  assistant: 'text-accent bg-accent/10',
  admin:     'text-run bg-run/10',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
}

type StatusFilter = 'active' | 'suspended' | 'deleted' | 'all'

export function MemberList({ members }: { members: Member[] }) {
  const [selected, setSelected]     = useState<Member | null>(null)
  const [query, setQuery]           = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')

  // 本地更新（避免重新 fetch）
  const [localMembers, setLocalMembers] = useState(members)

  function updateLocal(id: string, patch: Partial<Member>) {
    setLocalMembers(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, ...patch } : prev)
  }

  const filtered = localMembers.filter(m => {
    // 狀態篩選
    if (statusFilter === 'active')    { if (m.deleted_at || m.suspended_at) return false }
    if (statusFilter === 'suspended') { if (m.deleted_at || !m.suspended_at) return false }
    if (statusFilter === 'deleted')   { if (!m.deleted_at) return false }
    // 角色篩選
    if (roleFilter !== 'all' && m.role !== roleFilter) return false
    // 文字搜尋
    if (query) {
      const q = query.toLowerCase()
      const match =
        m.email.toLowerCase().includes(q) ||
        (m.name ?? '').toLowerCase().includes(q) ||
        (m.nickname ?? '').toLowerCase().includes(q)
      if (!match) return false
    }
    return true
  })

  return (
    <>
      {/* 搜尋 + 篩選列 */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="搜尋姓名 / Email…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="flex-1 min-w-48 rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:ring-1 focus:ring-accent/50"
        />
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent/50"
        >
          <option value="all">全部角色</option>
          <option value="athlete">選手</option>
          <option value="assistant">助手</option>
          <option value="admin">管理員</option>
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as StatusFilter)}
          className="rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent/50"
        >
          <option value="active">正常</option>
          <option value="suspended">已停權</option>
          <option value="deleted">已刪除</option>
          <option value="all">全部狀態</option>
        </select>
      </div>

      {/* 表格 */}
      <div className="rounded-xl border border-border bg-bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 font-medium text-ink-3">姓名 / Email</th>
              <th className="px-4 py-3 font-medium text-ink-3">角色</th>
              <th className="px-4 py-3 font-medium text-ink-3">狀態</th>
              <th className="px-4 py-3 font-medium text-ink-3 text-right">成績</th>
              <th className="px-4 py-3 font-medium text-ink-3 text-right">註冊日期</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m, i) => (
              <tr
                key={m.id}
                onClick={() => setSelected(m)}
                className={[
                  'cursor-pointer transition hover:bg-bg-elev',
                  i !== filtered.length - 1 ? 'border-b border-border' : '',
                  m.deleted_at ? 'opacity-50' : '',
                ].join(' ')}
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">
                    {m.nickname ?? m.name ?? <span className="text-ink-4 italic">未填姓名</span>}
                  </p>
                  <p className="text-xs text-ink-4">{m.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLOR[m.role] ?? 'text-ink-3'}`}>
                    {ROLE_LABEL[m.role] ?? m.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {m.deleted_at ? (
                    <span className="text-xs text-ink-4">已刪除</span>
                  ) : m.suspended_at ? (
                    <span className="text-xs text-orange-400 font-medium">已停權</span>
                  ) : (
                    <span className="text-xs text-ink-4">正常</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-mono text-ink-3">
                  {m.result_count || '—'}
                </td>
                <td className="px-4 py-3 text-right text-ink-4">
                  {formatDate(m.created_at)}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-4">
                  {query || roleFilter !== 'all' || statusFilter !== 'active'
                    ? '沒有符合條件的會員'
                    : '尚無會員資料'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-ink-4 text-right">顯示 {filtered.length} 筆</p>

      {selected && (
        <MemberDetail
          member={selected}
          onClose={() => setSelected(null)}
          onUpdate={updateLocal}
        />
      )}
    </>
  )
}
