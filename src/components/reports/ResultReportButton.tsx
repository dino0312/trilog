'use client'

import { useState } from 'react'
import { ReportModal } from './ReportModal'

export function ResultReportButton({ resultId }: { resultId: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-ink-4 hover:text-ink transition underline underline-offset-2"
      >
        回報成績錯誤
      </button>
      <ReportModal
        open={open}
        onClose={() => setOpen(false)}
        defaultCategory="result_error"
        contextData={{ result_id: resultId }}
      />
    </>
  )
}
