'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { updateResult, deleteResult, type ResultState } from '@/app/actions/results'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { secondsToTime } from '@/lib/utils/time'

type Props = {
  id: string
  totalSeconds: number
  swimSeconds: number | null
  t1Seconds: number | null
  bikeSeconds: number | null
  t2Seconds: number | null
  runSeconds: number | null
  isPublic: boolean
  notes: string | null
}

const initial: ResultState = { error: null }

function fmt(s: number | null) {
  return s ? secondsToTime(s) : ''
}

export function RecordActions(props: Props) {
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  const [editState, editAction, editPending] = useActionState(updateResult, initial)
  const [deleteState, deleteAction, deletePending] = useActionState(deleteResult, initial)

  const editSubmitted = useRef(false)
  const deleteSubmitted = useRef(false)

  // Close edit modal only after a successful submission
  useEffect(() => {
    if (editSubmitted.current && !editPending && editState.error === null) {
      editSubmitted.current = false
      setShowEdit(false)
    }
    if (editPending) editSubmitted.current = true
  }, [editPending, editState.error])

  // Close delete modal only after a successful submission
  useEffect(() => {
    if (deleteSubmitted.current && !deletePending && deleteState.error === null) {
      deleteSubmitted.current = false
      setShowDelete(false)
    }
    if (deletePending) deleteSubmitted.current = true
  }, [deletePending, deleteState.error])

  return (
    <>
      <div className="flex gap-2 mt-3 justify-end">
        <button
          onClick={() => setShowEdit(true)}
          className="text-xs text-ink-3 hover:text-accent transition px-2 py-1 rounded hover:bg-accent/10"
        >
          編輯
        </button>
        <button
          onClick={() => setShowDelete(true)}
          className="text-xs text-ink-3 hover:text-red transition px-2 py-1 rounded hover:bg-red/10"
        >
          刪除
        </button>
      </div>

      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowEdit(false)}>
          <div className="bg-bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-ink mb-5">編輯成績</h2>
            <form action={editAction} className="flex flex-col gap-4">
              <input type="hidden" name="id" value={props.id} />

              <div className="grid grid-cols-3 gap-3">
                <Input label="完賽時間" id="e-total" name="total" placeholder="HH:MM:SS" required className="font-mono" defaultValue={fmt(props.totalSeconds)} />
                <Input label="游泳" id="e-swim" name="swim" placeholder="HH:MM:SS" className="font-mono" defaultValue={fmt(props.swimSeconds)} />
                <Input label="T1" id="e-t1" name="t1" placeholder="MM:SS" className="font-mono" defaultValue={fmt(props.t1Seconds)} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input label="騎車" id="e-bike" name="bike" placeholder="HH:MM:SS" className="font-mono" defaultValue={fmt(props.bikeSeconds)} />
                <Input label="T2" id="e-t2" name="t2" placeholder="MM:SS" className="font-mono" defaultValue={fmt(props.t2Seconds)} />
                <Input label="跑步" id="e-run" name="run" placeholder="HH:MM:SS" className="font-mono" defaultValue={fmt(props.runSeconds)} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="e-notes" className="text-sm font-medium text-ink-2">備註（選填）</label>
                <textarea
                  id="e-notes" name="notes" rows={2}
                  className="w-full rounded-lg border border-border-strong bg-bg-elev px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-4 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none"
                  placeholder="天氣狀況、心得…"
                  defaultValue={props.notes ?? ''}
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="hidden" name="is_public" value="false" />
                <input type="checkbox" name="is_public" value="true" defaultChecked={props.isPublic} className="w-4 h-4 accent-accent" />
                <span className="text-sm text-ink-2">公開成績（納入排行榜）</span>
              </label>

              {editState.error && <p className="text-sm text-red">{editState.error}</p>}

              <div className="flex gap-3 mt-1">
                <Button type="submit" loading={editPending} className="flex-1">儲存</Button>
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  className="flex-1 rounded-lg border border-border text-sm font-semibold text-ink-3 py-2.5 hover:border-border-strong transition"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowDelete(false)}>
          <div className="bg-bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-ink mb-2">確認刪除</h2>
            <p className="text-sm text-ink-3 mb-6">這筆成績將永久刪除，無法復原。</p>
            <form action={deleteAction} className="flex gap-3">
              <input type="hidden" name="id" value={props.id} />
              {deleteState.error && <p className="text-sm text-red col-span-2">{deleteState.error}</p>}
              <Button type="submit" loading={deletePending} className="flex-1 !bg-red hover:!brightness-110">刪除</Button>
              <button
                type="button"
                onClick={() => setShowDelete(false)}
                className="flex-1 rounded-lg border border-border text-sm font-semibold text-ink-3 py-2.5 hover:border-border-strong transition"
              >
                取消
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
