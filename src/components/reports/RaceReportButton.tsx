'use client'

import { useState } from 'react'
import { ReportModal } from './ReportModal'

export function RaceReportButton({ raceId }: { raceId: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-ink-4 hover:text-ink transition underline underline-offset-2"
      >
        回報賽事資料錯誤
      </button>
      <ReportModal
        open={open}
        onClose={() => setOpen(false)}
        defaultCategory="other"
        contextData={{ race_id: raceId }}
      />
    </>
  )
}
