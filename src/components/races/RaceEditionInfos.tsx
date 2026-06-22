import { createClient } from '@/lib/supabase/server'
import { AddRaceInfoSheet } from './AddRaceInfoSheet'

interface Props {
  raceEditionId: string
  isLoggedIn: boolean
}

const INFO_TYPE_LABEL: Record<string, string> = {
  route_map:     '路線圖',
  aid_station:   '補給站資訊',
  external_link: '外部連結',
  note:          '備注',
}

export async function RaceEditionInfos({ raceEditionId, isLoggedIn }: Props) {
  const supabase = await createClient()
  const { data: infosRaw } = await supabase
    .from('race_edition_infos')
    .select('id, info_type, title, content, file_url, file_type, created_at, athlete_id')
    .eq('race_edition_id', raceEditionId)
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  // 批次取貢獻者名稱
  const athleteIds = [...new Set((infosRaw ?? []).map(i => i.athlete_id))]
  const { data: athleteRows } = athleteIds.length > 0
    ? await supabase.from('athletes').select('id, name, nickname, avatar_url').in('id', athleteIds)
    : { data: [] }
  const athleteMap = Object.fromEntries((athleteRows ?? []).map(a => [a.id, a]))

  const infos = (infosRaw ?? []).map(i => ({
    ...i,
    athletes: athleteMap[i.athlete_id] ?? null,
  }))

  const groups: Record<string, typeof infos> = {}
  for (const info of infos ?? []) {
    if (!groups[info.info_type]) groups[info.info_type] = []
    groups[info.info_type]!.push(info)
  }

  const hasContent = (infos?.length ?? 0) > 0

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">賽事資訊</h2>
        {isLoggedIn && <AddRaceInfoSheet raceEditionId={raceEditionId} />}
      </div>

      {!hasContent ? (
        <p className="rounded-xl border border-border bg-bg-card px-4 py-6 text-center text-sm text-ink-4">
          尚無社群貢獻的賽事資訊。{isLoggedIn ? '成為第一個貢獻者！' : '登入後即可新增。'}
        </p>
      ) : (
        <div className="space-y-6">
          {(['route_map', 'aid_station', 'external_link', 'note'] as const).map(type => {
            const items = groups[type]
            if (!items?.length) return null
            return (
              <div key={type}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-4">
                  {INFO_TYPE_LABEL[type]}
                </h3>
                <div className="space-y-2">
                  {items.map(info => (
                    <InfoCard key={info.id} info={info} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

type InfoRow = {
  id: string
  info_type: string
  title: string
  content: string | null
  file_url: string | null
  file_type: string | null
  created_at: string
  athletes: { id: string; name: string | null; nickname: string | null; avatar_url: string | null } | null
}

function InfoCard({ info }: { info: InfoRow }) {
  const athlete = info.athletes
  const displayName = athlete?.nickname ?? athlete?.name ?? '匿名選手'
  const date = new Date(info.created_at).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })

  return (
    <div className="rounded-xl border border-border bg-bg-card p-4">
      <p className="mb-2 text-sm font-medium text-ink">{info.title}</p>

      {info.info_type === 'route_map' && info.file_url && (
        info.file_type === 'image'
          ? <img src={info.file_url} alt={info.title} className="mb-2 max-h-64 w-full rounded-lg object-contain" />
          : (
            <a
              href={info.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-2 inline-flex items-center gap-1.5 rounded-lg bg-bg-elev px-3 py-1.5 text-xs text-accent hover:underline"
            >
              📄 下載 PDF
            </a>
          )
      )}

      {info.info_type === 'aid_station' && info.content && (
        <p className="whitespace-pre-line text-sm text-ink-3">{info.content}</p>
      )}

      {info.info_type === 'external_link' && info.content && (
        <a
          href={info.content}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
        >
          🔗 {info.content.replace(/^https?:\/\//, '').slice(0, 50)}
        </a>
      )}

      {info.info_type === 'note' && info.content && (
        <p className="text-sm text-ink-3">{info.content}</p>
      )}

      <p className="mt-2 text-xs text-ink-4">
        {displayName} · {date}
      </p>
    </div>
  )
}
