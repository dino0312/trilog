'use client'

import { useState, useActionState, useRef, useEffect } from 'react'
import { IconX, IconPlus } from '@tabler/icons-react'
import { createRaceInfo } from '@/app/actions/race-edition-infos'

interface Props {
  raceEditionId: string
  onSuccess?: () => void
}

const INFO_TYPES = [
  { value: 'route_map',     label: '路線圖' },
  { value: 'aid_station',   label: '補給站資訊' },
  { value: 'external_link', label: '外部連結' },
  { value: 'note',          label: '備注' },
] as const

type InfoType = typeof INFO_TYPES[number]['value']

export function AddRaceInfoSheet({ raceEditionId, onSuccess }: Props) {
  const [open, setOpen] = useState(false)
  const [infoType, setInfoType] = useState<InfoType | ''>('')
  const [state, formAction, pending] = useActionState(createRaceInfo, { error: null })
  const formRef = useRef<HTMLFormElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') handleClose() }
    if (open) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  // 成功提交後關閉
  useEffect(() => {
    if (!pending && !state.error && open) {
      // state.error === null means potential success after submit
    }
  }, [pending, state.error, open])

  function handleClose() {
    setOpen(false)
    setInfoType('')
    formRef.current?.reset()
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current) handleClose()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-sm text-ink-3 transition hover:bg-bg-elev hover:text-ink"
      >
        <IconPlus size={15} />
        新增資訊
      </button>

      {open && (
        <div
          ref={overlayRef}
          onClick={handleOverlayClick}
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 sm:items-center p-4"
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-border bg-bg-card p-6 shadow-2xl"
            style={{ animation: 'dropdown-in 150ms ease-out' }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-base font-semibold text-ink">新增賽事資訊</p>
              <button onClick={handleClose} className="text-ink-4 hover:text-ink transition">
                <IconX size={18} />
              </button>
            </div>

            <form
              ref={formRef}
              action={async (fd) => {
                await formAction(fd)
                if (!state.error) { handleClose(); onSuccess?.() }
              }}
            >
              <input type="hidden" name="race_edition_id" value={raceEditionId} />

              {state.error && (
                <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{state.error}</p>
              )}

              <div className="space-y-4">
                <div>
                  <p className="mb-1.5 text-xs font-medium text-ink-3">資訊類型</p>
                  <div className="grid grid-cols-2 gap-2">
                    {INFO_TYPES.map(t => (
                      <label
                        key={t.value}
                        className={`flex cursor-pointer items-center justify-center rounded-xl border px-3 py-2 text-sm transition ${infoType === t.value ? 'border-accent bg-accent/10 text-accent' : 'border-border text-ink-3 hover:bg-bg-elev'}`}
                      >
                        <input
                          type="radio"
                          name="info_type"
                          value={t.value}
                          checked={infoType === t.value}
                          onChange={() => setInfoType(t.value)}
                          className="sr-only"
                        />
                        {t.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-3">標題 *</label>
                  <input
                    name="title"
                    required
                    maxLength={100}
                    placeholder="簡短描述這筆資訊"
                    className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:ring-1 focus:ring-accent/50"
                  />
                </div>

                {infoType === 'route_map' && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-ink-3">上傳檔案（圖片或 PDF，最大 10MB）</label>
                    <input
                      name="file"
                      type="file"
                      accept="image/*,.pdf"
                      className="w-full text-sm text-ink-3 file:mr-3 file:rounded-lg file:border-0 file:bg-bg-elev file:px-3 file:py-1.5 file:text-xs file:text-ink file:cursor-pointer"
                    />
                  </div>
                )}

                {infoType === 'aid_station' && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-ink-3">補給站資訊</label>
                    <textarea
                      name="content"
                      rows={5}
                      placeholder="例如：T1出口左轉後約 2km 設有補給站，供應香蕉、能量膠…"
                      className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:ring-1 focus:ring-accent/50 resize-none"
                    />
                  </div>
                )}

                {infoType === 'external_link' && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-ink-3">連結網址</label>
                    <input
                      name="content"
                      type="url"
                      placeholder="https://..."
                      className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:ring-1 focus:ring-accent/50"
                    />
                  </div>
                )}

                {infoType === 'note' && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-ink-3">備注內容（最多 1000 字）</label>
                    <textarea
                      name="content"
                      rows={5}
                      maxLength={1000}
                      placeholder="分享你對這場賽事的補充資訊…"
                      className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:ring-1 focus:ring-accent/50 resize-none"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!infoType || pending}
                  className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-bg transition hover:opacity-90 disabled:opacity-40"
                >
                  {pending ? '送出中…' : '送出'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
