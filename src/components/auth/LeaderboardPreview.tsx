/**
 * 靜態最速榜預覽元件 — 登入頁左側主視覺
 * 資料來自 trilog_fastest_board.html 參考實作
 */

const MALE_ROWS = [
  { rank: 1,  name: '張團畯', time: '8:18:20', race: '2024 普悠瑪',          cls: 'male-first' },
  { rank: 2,  name: '蕭昱',   time: '8:32:08', race: '2023 普悠瑪',          cls: 'male-sub10' },
  { rank: 3,  name: '謝昇諺', time: '8:42:47', race: '2023 普悠瑪',          cls: 'male-sub10' },
  { rank: 4,  name: '許仁茂', time: '8:59:16', race: '2022 普悠瑪',          cls: 'male-sub10', divider: true },
  { rank: 5,  name: '吳承泰', time: '9:00:31', race: '2024 Challenge Taiwan', cls: '' },
  { rank: 6,  name: '楊博智', time: '9:05:41', race: '2025 普悠瑪',          cls: '' },
  { rank: 7,  name: '李瑋',   time: '9:06:01', race: '2024 Challenge Taiwan', cls: '' },
  { rank: 8,  name: '薛順仁', time: '9:08:22', race: '2026 Challenge Taiwan', cls: '' },
]

const FEMALE_ROWS = [
  { rank: 1,  name: '程薇智', time: '9:16:51', race: '2023 普悠瑪',          cls: 'female-first' },
  { rank: 2,  name: '江妍儀', time: '9:48:22', race: '2024 Challenge Taiwan', cls: 'female-sub10' },
  { rank: 3,  name: '黃郁婷', time: '9:55:14', race: '2025 普悠瑪',          cls: 'female-sub10', divider: true },
  { rank: 4,  name: '林宜嫻', time: '10:12:33', race: '2024 Challenge Taiwan', cls: '' },
  { rank: 5,  name: '陳雅如', time: '10:28:45', race: '2023 普悠瑪',          cls: '' },
]

function rankColor(r: number) {
  if (r === 1) return '#F5C842'
  if (r === 2) return '#A0A0A0'
  if (r === 3) return '#CD9660'
  return '#4A5568'
}

function timeColor(cls: string) {
  if (cls === 'male-first')   return '#F5C842'
  if (cls === 'male-sub10')   return '#FF6B3D'
  if (cls === 'female-first') return '#E870A0'
  if (cls === 'female-sub10') return '#D4537E'
  return '#F0EDE6'
}

export function LeaderboardPreview() {
  return (
    <div style={{
      background: '#060D18',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16,
      overflow: 'hidden',
      width: '100%',
      fontFamily: "'Noto Sans TC', sans-serif",
    }}>
      {/* Hero */}
      <div style={{ padding: '1.5rem 1.5rem 0', position: 'relative', overflow: 'hidden' }}>
        {/* 浮水印 */}
        <span style={{
          position: 'absolute', right: -4, top: -14,
          fontFamily: "'Syne', sans-serif", fontWeight: 800,
          fontSize: 110, color: 'rgba(255,255,255,0.03)',
          lineHeight: 1, letterSpacing: -5, userSelect: 'none',
        }}>226</span>

        {/* 膠囊標籤 */}
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontFamily: "'DM Mono', monospace", fontSize: 10,
          color: '#FF6B3D', letterSpacing: '0.14em',
          border: '1px solid rgba(255,107,61,0.3)',
          padding: '3px 10px', borderRadius: 100,
          marginBottom: 10,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF6B3D', display: 'inline-block' }}/>
          最速榜
        </span>

        {/* 標題 */}
        <div style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 800,
          fontSize: 24, color: '#F0EDE6',
          letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 3,
        }}>
          台灣鐵人 <span style={{ color: '#FF6B3D' }}>226</span>
        </div>
        <div style={{
          fontFamily: "'DM Mono', monospace", fontSize: 11,
          color: '#4A5568', letterSpacing: '0.04em', marginBottom: '1.2rem',
        }}>
          各選手個人最佳成績 · 跨賽事排列
        </div>

        {/* 距離頁籤 */}
        <div style={{
          display: 'flex',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          margin: '0 -1.5rem',
        }}>
          {['226 全距離', '113', '51.5', '25.75'].map((t, i) => (
            <div key={t} style={{
              padding: '8px 16px', fontSize: 11,
              color: i === 0 ? '#F0EDE6' : '#4A5568',
              borderBottom: i === 0 ? '2px solid #FF6B3D' : '2px solid transparent',
              opacity: i > 0 ? 0.4 : 1,
              fontFamily: "'Noto Sans TC', sans-serif",
              whiteSpace: 'nowrap',
            }}>{t}</div>
          ))}
        </div>
      </div>

      {/* 男子組 */}
      <div style={{ padding: '10px 16px 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontFamily: "'DM Mono', monospace", fontSize: 10,
          color: '#22C9C9', borderLeft: '2px solid #22C9C9',
          paddingLeft: 7, letterSpacing: '0.12em',
        }}>MALE</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#4A5568', marginLeft: 'auto' }}>35 筆</span>
      </div>

      {MALE_ROWS.map((row, i) => (
        <div key={i}>
          {row.divider && <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '2px 0' }}/>}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '30px 1fr 90px 1fr',
            alignItems: 'center',
            padding: '7px 16px',
            borderTop: '1px solid rgba(255,255,255,0.04)',
          }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: rankColor(row.rank), fontWeight: 500 }}>{row.rank}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#F0EDE6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: timeColor(row.cls), textAlign: 'right', letterSpacing: '0.02em' }}>{row.time}</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#4A5568', textAlign: 'right', paddingLeft: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.race}</span>
          </div>
        </div>
      ))}

      {/* 性別間隔 */}
      <div style={{ height: 6, background: '#060D18' }}/>

      {/* 女子組 */}
      <div style={{ padding: '10px 16px 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontFamily: "'DM Mono', monospace", fontSize: 10,
          color: '#D4537E', borderLeft: '2px solid #D4537E',
          paddingLeft: 7, letterSpacing: '0.12em',
        }}>FEMALE</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#4A5568', marginLeft: 'auto' }}>18 筆</span>
      </div>

      {FEMALE_ROWS.map((row, i) => (
        <div key={i}>
          {row.divider && <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '2px 0' }}/>}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '30px 1fr 90px 1fr',
            alignItems: 'center',
            padding: '7px 16px',
            borderTop: '1px solid rgba(255,255,255,0.04)',
          }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: rankColor(row.rank), fontWeight: 500 }}>{row.rank}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#F0EDE6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: timeColor(row.cls), textAlign: 'right', letterSpacing: '0.02em' }}>{row.time}</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#4A5568', textAlign: 'right', paddingLeft: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.race}</span>
          </div>
        </div>
      ))}

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '10px 16px',
        borderTop: '1px solid rgba(255,255,255,0.07)',
      }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#4A5568' }}>
          僅供參考 · 非官方認證
        </span>
        <span style={{
          marginLeft: 'auto', fontFamily: "'DM Mono', monospace", fontSize: 10,
          color: '#FF6B3D', border: '1px solid rgba(255,107,61,0.25)',
          padding: '3px 10px', borderRadius: 100,
        }}>
          登錄我的成績 →
        </span>
      </div>
    </div>
  )
}
