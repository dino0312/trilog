'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { secondsToTime } from '@/lib/utils/time'
import { DisciplineIcon } from '@/components/ui/DisciplineIcon'

type Entry = {
  result_id:         string
  total_seconds:     number
  source_credibility: string
  claim_status:      string
  team_id:           string
  team_name:         string | null
  gender_category:   string
  t1_seconds:        number | null
  t2_seconds:        number | null
  edition_year:      number
  race_date:         string
  distance_category: string
  race_name:         string
  race_slug:         string
}

type Member = {
  id:                    string
  team_id:               string
  athlete_id:            string | null
  athlete_name_snapshot: string
  disciplines:           string[]
  split_seconds:         number | null
  claim_status:          string
  sort_order:            number
  athletes:              { id: string; name: string | null; nickname: string | null } | null
}

const GENDER_LABEL: Record<string, string> = { male: '男子組', female: '女子組', mixed: '混合組' }
const DISC_COLOR:   Record<string, string> = { swim: 'text-swim', bike: 'text-bike', run: 'text-run' }


type Props = {
  distance:       string
  genderCategory: string
  raceId:         string
}

export function RelayLeaderboard({ distance, genderCategory, raceId }: Props) {
  const [entries, setEntries]     = useState<Entry[]>([])
  const [members, setMembers]     = useState<Record<string, Member[]>>({})
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ distance })
    if (genderCategory) params.set('gender_category', genderCategory)
    if (raceId)         params.set('race_id', raceId)

    fetch(`/api/leaderboard/relay?${params}`)
      .then(r => r.json())
      .then(data => {
        setEntries(data.entries ?? [])
        setMembers(data.members ?? {})
      })
      .finally(() => setLoading(false))
  }, [distance, genderCategory, raceId])

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-bg-card p-12 text-center">
        <p className="text-ink-3 text-sm">載入中…</p>
      </div>
    )
  }

  if (!entries.length) {
    return (
      <div className="rounded-xl border border-border bg-bg-card p-12 text-center">
        <p className="text-ink-3">目前沒有符合條件的接力成績</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-bg-card overflow-hidden">
      <table className="w-full text-base">
        <thead>
          <tr className="border-b border-border text-ink-3 text-base">
            <th className="px-4 py-3 text-left w-12">#</th>
            <th className="px-4 py-3 text-left">隊伍 / 成員</th>
            <th className="px-4 py-3 text-left hidden sm:table-cell">賽事</th>
            <th className="px-4 py-3 text-center hidden sm:table-cell">組別</th>
            <th className="px-4 py-3 text-right font-mono">完賽</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => {
            const teamMembers = members[entry.team_id] ?? []
            const isUnclaimed = entry.claim_status === 'unclaimed'

            // 每位成員主要負責的顏色：取第一個分項的顏色
            return (
              <tr key={entry.result_id} className="border-b border-border/50 hover:bg-bg-elev/30 transition">
                <td className="px-4 py-4 text-ink-3 text-base">{i + 1}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <Link href={`/teams/${entry.team_id}`} className="hover:text-accent transition">
                      <span className="font-semibold text-lg text-ink">
                        {entry.team_name ?? '未命名隊伍'}
                      </span>
                    </Link>
                    {isUnclaimed && (
                      <span className="text-xs px-1.5 py-0.5 rounded border border-border text-ink-4">未認領</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 mt-2">
                    {teamMembers.map(m => {
                      const primaryDisc = m.disciplines[0] ?? ''
                      const nameColor   = DISC_COLOR[primaryDisc] ?? 'text-ink-3'
                      return (
                        <span key={m.id} className="flex items-center gap-1.5">
                          <span className="flex items-center gap-0.5">
                            {m.disciplines.map(d => (
                            <DisciplineIcon key={d} discipline={d as 'swim' | 'bike' | 'run'} />
                          ))}
                          </span>
                          <span className={`text-base font-semibold ${nameColor}`}>
                            {m.athletes?.nickname ?? m.athletes?.name ?? m.athlete_name_snapshot}
                          </span>
                          {m.split_seconds && (
                            <span className="font-mono text-sm font-bold text-white">{secondsToTime(m.split_seconds)}</span>
                          )}
                        </span>
                      )
                    })}
                  </div>
                </td>
                <td className="px-4 py-4 text-ink-3 text-sm hidden sm:table-cell">
                  {entry.race_name} {entry.edition_year}
                </td>
                <td className="px-4 py-4 text-center hidden sm:table-cell">
                  <span className="text-sm text-ink-4">{GENDER_LABEL[entry.gender_category] ?? entry.gender_category}</span>
                </td>
                <td className="px-4 py-4 text-right font-mono text-xl font-bold text-white">
                  {secondsToTime(entry.total_seconds)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
