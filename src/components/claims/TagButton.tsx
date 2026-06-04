'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { addTag, removeTag, type TagState } from '@/app/actions/tags'

const initial: TagState = { error: null, success: false }

type Props = {
  resultId: string
  tagCount: number
  hasTagged: boolean   // 目前登入者是否已標記
  isLoggedIn: boolean
  claimStatus: string  // unclaimed / unlinked
}

export function TagButton({ resultId, tagCount, hasTagged, isLoggedIn, claimStatus }: Props) {
  const [addState, addAction, addPending] = useActionState(addTag, initial)
  const [removeState, removeAction, removePending] = useActionState(removeTag, initial)
  const [showShare, setShowShare] = useState(false)
  const [message, setMessage] = useState('')
  const [showMessageInput, setShowMessageInput] = useState(false)
  const submitted = useRef(false)

  // 標記成功後顯示分享
  useEffect(() => {
    if (submitted.current && !addPending && addState.success && addState.shareText) {
      setShowShare(true)
    }
    if (addPending) submitted.current = true
  }, [addPending, addState.success, addState.shareText])

  const canTag = claimStatus === 'unclaimed' || claimStatus === 'unlinked'
  const locked = tagCount >= 5

  if (!canTag) return null

  // 已標記 → 顯示已標記狀態 + 撤銷
  if (hasTagged) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-good font-medium">✓ 已通知</span>
          <form action={removeAction}>
            <input type="hidden" name="result_id" value={resultId} />
            <button
              type="submit"
              disabled={removePending}
              className="text-xs text-ink-4 hover:text-ink-3 transition underline"
            >
              撤銷
            </button>
          </form>
        </div>
        {removeState.error && <p className="text-xs text-red">{removeState.error}</p>}
      </div>
    )
  }

  // 分享彈出
  if (showShare && addState.shareText) {
    return (
      <div className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-bg-elev text-sm">
        <p className="text-xs text-ink-3">已標記！傳給本人：</p>
        <p className="text-xs text-ink break-all leading-relaxed">{addState.shareText}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={async () => {
              if (navigator.share) {
                await navigator.share({ text: addState.shareText })
              } else {
                await navigator.clipboard.writeText(addState.shareText!)
                alert('已複製到剪貼簿')
              }
            }}
            className="flex-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-ink hover:brightness-110 transition"
          >
            分享通知
          </button>
          <button
            type="button"
            onClick={() => setShowShare(false)}
            className="text-xs text-ink-4 hover:text-ink-3 transition px-2"
          >
            關閉
          </button>
        </div>
      </div>
    )
  }

  // 未登入
  if (!isLoggedIn) {
    return (
      <a href="/login" className="text-xs text-ink-4 hover:text-accent transition">
        登入後可標記通知
      </a>
    )
  }

  // 已達上限
  if (locked) {
    return (
      <span className="text-xs text-ink-4">
        {tagCount} 人已通知（已達上限）
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <form action={addAction} className="flex flex-col gap-2">
        <input type="hidden" name="result_id" value={resultId} />
        {showMessageInput && (
          <input
            name="message"
            value={message}
            onChange={e => setMessage(e.target.value)}
            maxLength={100}
            placeholder="留言（選填，100字內）"
            className="rounded-lg border border-border-strong bg-bg-elev px-3 py-1.5 text-xs text-ink placeholder:text-ink-4 outline-none focus:border-accent"
          />
        )}
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={addPending}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-ink-3 hover:border-accent hover:text-accent transition disabled:opacity-50"
          >
            {addPending ? '處理中…' : `我認識這位選手（${tagCount}/5）`}
          </button>
          {!showMessageInput && (
            <button
              type="button"
              onClick={() => setShowMessageInput(true)}
              className="text-xs text-ink-4 hover:text-ink-3 transition"
            >
              + 留言
            </button>
          )}
        </div>
      </form>
      {addState.error && <p className="text-xs text-red">{addState.error}</p>}
    </div>
  )
}
