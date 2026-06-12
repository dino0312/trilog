'use client'

import { useEffect, useRef, useState } from 'react'
import type { Member } from './MemberList'
import {
  updateMemberRole,
  updateMemberProfile,
  suspendMember,
  unsuspendMember,
  deleteMember,
  restoreMember,
} from './actions'

const GENDER_LABEL: Record<string, string> = { M: '男', F: '女' }
const NATIONALITY_OPTIONS = [
  { value: 'TWN', label: '🇹🇼 台灣' },
  { value: 'JPN', label: '🇯🇵 日本' },
  { value: 'KOR', label: '🇰🇷 韓國' },
  { value: 'CHN', label: '🇨🇳 中國' },
  { value: 'HKG', label: '🇭🇰 香港' },
  { value: 'SGP', label: '🇸🇬 新加坡' },
  { value: 'MYS', label: '🇲🇾 馬來西亞' },
  { value: 'USA', label: '🇺🇸 美國' },
  { value: 'GBR', label: '🇬🇧 英國' },
  { value: 'AUS', label: '🇦🇺 澳洲' },
  { value: 'DEU', label: '🇩🇪 德國' },
  { value: 'FRA', label: '🇫🇷 法國' },
]
const NATIONALITY_LABEL = Object.fromEntries(NATIONALITY_OPTIONS.map(o => [o.value, o.label]))

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-4 py-2 border-b border-border last:border-0">
      <span className="w-24 shrink-0 text-xs text-ink-4 pt-0.5">{label}</span>
      <span className="text-sm text-ink">{value ?? <span className="text-ink-4 italic">未填寫</span>}</span>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 mb-3">
      <label className="text-xs text-ink-4">{label}</label>
      {children}
    </div>
  )
}

const INPUT_CLS = 'w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent/50'

type Mode = 'view' | 'edit' | 'suspend' | 'delete'

interface Props {
  member:   Member
  onClose:  () => void
  onUpdate: (id: string, patch: Partial<Member>) => void
}

export function MemberDetail({ member, onClose, onUpdate }: Props) {
  const overlayRef      = useRef<HTMLDivElement>(null)
  const [role, setRole] = useState(member.role)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [success, setSuccess]       = useState<string | null>(null)
  const [mode, setMode]             = useState<Mode>('view')
  const [suspendReason, setSuspendReason] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState('')

  // 編輯表單狀態
  const [editName, setEditName]           = useState(member.name ?? '')
  const [editNickname, setEditNickname]   = useState(member.nickname ?? '')
  const [editGender, setEditGender]       = useState(member.gender ?? '')
  const [editBirthYear, setEditBirthYear] = useState(member.birth_year ? String(member.birth_year) : '')
  const [editNationality, setEditNationality] = useState(member.nationality ?? '')
  const [editBio, setEditBio]             = useState(member.bio ?? '')

  const isSuspended = !!member.suspended_at
  const isDeleted   = !!member.deleted_at

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { mode !== 'view' ? setMode('view') : onClose() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, mode])

  function flash(msg: string) {
    setSuccess(msg)
    setTimeout(() => setSuccess(null), 3000)
  }

  function enterEdit() {
    // 進編輯模式時重設表單為最新值
    setEditName(member.name ?? '')
    setEditNickname(member.nickname ?? '')
    setEditGender(member.gender ?? '')
    setEditBirthYear(member.birth_year ? String(member.birth_year) : '')
    setEditNationality(member.nationality ?? '')
    setEditBio(member.bio ?? '')
    setError(null)
    setMode('edit')
  }

  async function handleSaveProfile() {
    setSaving(true); setError(null)
    const by = editBirthYear.trim()
    const byNum = by ? parseInt(by, 10) : null
    if (by && (isNaN(byNum!) || byNum! < 1930 || byNum! > 2010)) {
      setSaving(false); setError('出生年份需在 1930–2010 之間'); return
    }
    const { error: err } = await updateMemberProfile(member.id, {
      name:        editName.trim() || null,
      nickname:    editNickname.trim() || null,
      gender:      editGender || null,
      birth_year:  byNum,
      nationality: editNationality || null,
      bio:         editBio.trim() || null,
    })
    setSaving(false)
    if (err) { setError(err); return }
    onUpdate(member.id, {
      name:        editName.trim() || null,
      nickname:    editNickname.trim() || null,
      gender:      editGender || null,
      birth_year:  byNum,
      nationality: editNationality || null,
      bio:         editBio.trim() || null,
    })
    setMode('view')
    flash('資料已更新')
  }

  async function handleRoleChange(newRole: string) {
    if (newRole === role) return
    setSaving(true); setError(null)
    const { error: err } = await updateMemberRole(member.id, newRole)
    setSaving(false)
    if (err) { setError(err); return }
    setRole(newRole)
    onUpdate(member.id, { role: newRole })
    flash('角色已更新')
  }

  async function handleSuspend() {
    setSaving(true); setError(null)
    const { error: err } = await suspendMember(member.id, suspendReason)
    setSaving(false)
    if (err) { setError(err); return }
    const now = new Date().toISOString()
    onUpdate(member.id, { suspended_at: now, suspend_reason: suspendReason || null })
    setMode('view')
    flash('已停權')
  }

  async function handleUnsuspend() {
    setSaving(true); setError(null)
    const { error: err } = await unsuspendMember(member.id)
    setSaving(false)
    if (err) { setError(err); return }
    onUpdate(member.id, { suspended_at: null, suspended_by: null, suspend_reason: null })
    flash('已解除停權')
  }

  async function handleDelete() {
    setSaving(true); setError(null)
    const { error: err } = await deleteMember(member.id, deleteConfirm)
    setSaving(false)
    if (err) { setError(err); return }
    onUpdate(member.id, { deleted_at: new Date().toISOString() })
    setMode('view')
    flash('已刪除帳號')
  }

  async function handleRestore() {
    setSaving(true); setError(null)
    const { error: err } = await restoreMember(member.id)
    setSaving(false)
    if (err) { setError(err); return }
    onUpdate(member.id, { deleted_at: null })
    flash('帳號已復原')
  }

  const displayName = member.nickname ?? member.name

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === overlayRef.current) { mode !== 'view' ? setMode('view') : onClose() } }}
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-bg-card shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div>
            <p className="font-semibold text-ink flex items-center gap-2">
              {displayName ?? <span className="italic text-ink-4">未填姓名</span>}
              {isDeleted && <span className="text-xs text-ink-4 bg-bg-elev px-1.5 py-0.5 rounded">已刪除</span>}
              {!isDeleted && isSuspended && <span className="text-xs text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded">已停權</span>}
            </p>
            <p className="text-xs text-ink-4 mt-0.5">{member.email}</p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {mode === 'view' && !isDeleted && (
              <button
                onClick={enterEdit}
                className="text-xs text-ink-4 hover:text-ink border border-border rounded-lg px-2.5 py-1 transition hover:border-border-strong"
              >
                編輯
              </button>
            )}
            <button onClick={onClose} className="text-ink-4 hover:text-ink transition" aria-label="關閉">✕</button>
          </div>
        </div>

        {/* Success / Error */}
        {success && <div className="px-5 py-2 bg-accent/10 text-accent text-xs">{success}</div>}
        {error   && <div className="px-5 py-2 bg-run/10 text-run text-xs">{error}</div>}

        {/* ── 檢視模式 ── */}
        {mode === 'view' && (
          <div className="px-5 py-3 max-h-72 overflow-y-auto">
            <Row label="真實姓名" value={member.name} />
            <Row label="暱稱"     value={member.nickname} />
            <Row label="性別"     value={member.gender ? GENDER_LABEL[member.gender] : null} />
            <Row label="出生年份" value={member.birth_year} />
            <Row label="國籍"     value={member.nationality ? (NATIONALITY_LABEL[member.nationality] ?? member.nationality) : null} />
            <Row label="自我介紹" value={member.bio} />
            <Row label="成績筆數" value={member.result_count || '0'} />
            <Row label="註冊時間" value={formatDate(member.created_at)} />
            {isSuspended && (
              <Row label="停權時間" value={<span className="text-orange-400">{formatDate(member.suspended_at!)}</span>} />
            )}
            {member.suspend_reason && (
              <Row label="停權原因" value={<span className="text-orange-400">{member.suspend_reason}</span>} />
            )}
            {isDeleted && (
              <Row label="刪除時間" value={<span className="text-ink-4">{formatDate(member.deleted_at!)}</span>} />
            )}
          </div>
        )}

        {/* ── 編輯模式 ── */}
        {mode === 'edit' && (
          <div className="px-5 py-4 max-h-96 overflow-y-auto">
            <Field label="真實姓名">
              <input className={INPUT_CLS} value={editName} onChange={e => setEditName(e.target.value)} placeholder="未填寫" />
            </Field>
            <Field label="暱稱（選填）">
              <input className={INPUT_CLS} value={editNickname} onChange={e => setEditNickname(e.target.value)} placeholder="未填寫" />
            </Field>
            <Field label="性別">
              <select className={INPUT_CLS} value={editGender} onChange={e => setEditGender(e.target.value)}>
                <option value="">未填寫</option>
                <option value="M">男</option>
                <option value="F">女</option>
              </select>
            </Field>
            <Field label="出生年份">
              <input className={INPUT_CLS} type="number" min={1930} max={2010} value={editBirthYear} onChange={e => setEditBirthYear(e.target.value)} placeholder="例：1990" />
            </Field>
            <Field label="國籍">
              <select className={INPUT_CLS} value={editNationality} onChange={e => setEditNationality(e.target.value)}>
                <option value="">未填寫</option>
                {NATIONALITY_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
            <Field label="自我介紹">
              <textarea className={INPUT_CLS} rows={3} value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="未填寫" />
            </Field>
          </div>
        )}

        {/* ── 角色操作（view 且未刪除）── */}
        {mode === 'view' && !isDeleted && (
          <div className="px-5 py-4 border-t border-border">
            <p className="text-xs text-ink-4 mb-2">角色</p>
            <div className="flex gap-2">
              {(['athlete', 'assistant'] as const).map(r => (
                <button
                  key={r}
                  disabled={saving}
                  onClick={() => handleRoleChange(r)}
                  className={[
                    'px-4 py-1.5 rounded-lg text-sm font-medium border transition',
                    role === r
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border text-ink-3 hover:border-border-strong hover:text-ink',
                    saving ? 'opacity-50 cursor-not-allowed' : '',
                  ].join(' ')}
                >
                  {r === 'athlete' ? '選手' : '助手'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── 停權面板 ── */}
        {mode === 'suspend' && (
          <div className="px-5 py-4 border-t border-border bg-orange-400/5">
            <p className="text-sm font-medium text-orange-400 mb-2">停權原因（選填）</p>
            <input
              type="text"
              placeholder="例：違反使用條款"
              value={suspendReason}
              onChange={e => setSuspendReason(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-orange-400/50 mb-3"
            />
            <div className="flex gap-2">
              <button onClick={handleSuspend} disabled={saving}
                className="flex-1 py-2 rounded-lg bg-orange-400 text-bg text-sm font-medium hover:bg-orange-300 transition disabled:opacity-50">
                {saving ? '處理中…' : '確認停權'}
              </button>
              <button onClick={() => { setMode('view'); setError(null) }} disabled={saving}
                className="px-4 py-2 rounded-lg border border-border text-ink-3 text-sm hover:text-ink transition disabled:opacity-40">
                取消
              </button>
            </div>
          </div>
        )}

        {/* ── 刪除確認面板 ── */}
        {mode === 'delete' && (
          <div className="px-5 py-4 border-t border-border bg-run/5">
            <p className="text-sm font-medium text-run mb-1">確認刪除</p>
            <p className="text-xs text-ink-4 mb-2">請輸入 <span className="font-mono text-ink">{member.email}</span> 確認</p>
            <input
              type="text"
              placeholder={member.email}
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-run/50 mb-3"
            />
            <div className="flex gap-2">
              <button onClick={handleDelete} disabled={saving || deleteConfirm !== member.email}
                className="flex-1 py-2 rounded-lg bg-run text-white text-sm font-medium hover:bg-run/80 transition disabled:opacity-40">
                {saving ? '刪除中…' : '確認刪除'}
              </button>
              <button onClick={() => { setMode('view'); setDeleteConfirm(''); setError(null) }} disabled={saving}
                className="px-4 py-2 rounded-lg border border-border text-ink-3 text-sm hover:text-ink transition disabled:opacity-40">
                取消
              </button>
            </div>
          </div>
        )}

        {/* ── 底部操作按鈕 ── */}
        <div className="px-5 py-3 border-t border-border flex gap-2 flex-wrap">
          {mode === 'edit' ? (
            <>
              <button onClick={handleSaveProfile} disabled={saving}
                className="flex-1 py-2 rounded-lg bg-accent text-bg text-sm font-medium hover:bg-accent/80 transition disabled:opacity-50">
                {saving ? '儲存中…' : '儲存'}
              </button>
              <button onClick={() => { setMode('view'); setError(null) }}
                className="px-4 py-2 rounded-lg border border-border text-ink-3 text-sm hover:text-ink transition">
                取消
              </button>
            </>
          ) : isDeleted ? (
            <button onClick={handleRestore} disabled={saving}
              className="px-4 py-1.5 rounded-lg border border-accent/40 text-accent text-sm hover:bg-accent/10 transition disabled:opacity-50">
              復原帳號
            </button>
          ) : mode === 'view' ? (
            <>
              {isSuspended ? (
                <button onClick={handleUnsuspend} disabled={saving}
                  className="px-4 py-1.5 rounded-lg border border-orange-400/40 text-orange-400 text-sm hover:bg-orange-400/10 transition disabled:opacity-50">
                  解除停權
                </button>
              ) : (
                <button onClick={() => { setMode('suspend'); setError(null) }}
                  className="px-4 py-1.5 rounded-lg border border-orange-400/40 text-orange-400 text-sm hover:bg-orange-400/10 transition">
                  停權
                </button>
              )}
              <button onClick={() => { setMode('delete'); setError(null) }}
                className="px-4 py-1.5 rounded-lg border border-run/40 text-run text-sm hover:bg-run/10 transition">
                刪除帳號
              </button>
            </>
          ) : null}
        </div>

      </div>
    </div>
  )
}
