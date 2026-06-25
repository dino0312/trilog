import Link from 'next/link'
import {
  IconSwimming, IconBike, IconRun,
  IconSearch, IconFlag, IconTrophy,
} from '@tabler/icons-react'

export const metadata = { title: '關於 Tri·log' }

export default function AboutPage() {
  return (
    <main>

      {/* Hero */}
      <section style={{ position: 'relative', width: '100%', aspectRatio: '16/9', minHeight: '260px', overflow: 'hidden' }}>
        <img
          src="/about-hero.jpg"
          alt="選手衝過 Challenge Taiwan 終點線，雙手高舉"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center center', display: 'block' }}
        />
        {/* 左深→右淡漸層遮罩 */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, var(--hero-overlay-h) 0%, rgba(11,15,20,0.45) 45%, rgba(11,15,20,0.12) 100%)' }} />
        {/* 底部遮罩 */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--hero-overlay-v) 0%, transparent 50%)' }} />
        {/* 左側文字 */}
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '55%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2rem 2.5rem' }}>
          <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.14em', color: 'rgba(102,198,190,0.9)', margin: '0 0 0.875rem', textTransform: 'uppercase' }}>
            關於 Tri·log
          </p>
          <h1 style={{ fontSize: '24px', fontWeight: 500, lineHeight: 1.4, color: '#ffffff', margin: '0 0 1rem' }}>
            每一場鐵人賽，<br />你都拚盡了全力。<br />那些成績，應該有個家。
          </h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, margin: '0 0 1.5rem', maxWidth: '320px' }}>
            台灣鐵人三項選手的跨賽事成績記錄平台，讓每一場成績都被好好保存下來。
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link href="/unclaimed" style={{ fontSize: '13px', padding: '7px 18px', borderRadius: '8px', background: 'rgba(102,198,190,0.15)', border: '0.5px solid rgba(102,198,190,0.5)', color: 'rgba(102,198,190,1)', textDecoration: 'none' }}>
              查看未認領成績 →
            </Link>
            <Link href="/login" style={{ fontSize: '13px', padding: '7px 18px', borderRadius: '8px', color: 'rgba(255,255,255,0.7)', border: '0.5px solid rgba(255,255,255,0.25)', textDecoration: 'none' }}>
              登入 / 註冊
            </Link>
          </div>
        </div>
        {/* 右下角三項距離 tag */}
        <div style={{ position: 'absolute', bottom: '1rem', right: '1.25rem', display: 'flex', gap: '8px' }}>
          {[
            { Icon: IconSwimming, color: '#4ea1ff', label: '3.8 km' },
            { Icon: IconBike,     color: '#66c6be', label: '180 km' },
            { Icon: IconRun,      color: '#ff685e', label: '42.2 km' },
          ].map(({ Icon, color, label }) => (
            <div key={label} style={{ background: 'var(--hero-overlay-h)', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icon size={14} color={color} aria-hidden="true" />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 1. 痛點 */}
      <section style={{ padding: '2.5rem 2rem' }}>
        <p style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.12em', color: 'var(--ink-3)', margin: '0 0 1.25rem', textTransform: 'uppercase' }}>痛點</p>
        <blockquote style={{ borderLeft: '2px solid var(--border)', margin: 0, padding: '0.5rem 0 0.5rem 1.25rem' }}>
          <p style={{ fontSize: '17px', lineHeight: 1.75, color: 'var(--ink)', margin: 0 }}>
            完賽之後，照片發了、獎牌掛了，<br />
            但那個時間——你游了多久、騎了多快、最後衝線的感覺——<br />
            幾年後，還記得嗎？
          </p>
        </blockquote>
        <p style={{ fontSize: '15px', color: 'var(--ink-3)', lineHeight: 1.7, margin: '1.5rem 0 0' }}>
          Tri·log 想做一件簡單的事：讓你的每一場成績，都被好好保存下來。不只是這一場，是你從第一場到現在的完整歷程。
        </p>
      </section>

      <hr style={{ border: 'none', borderTop: '0.5px solid var(--border)', margin: '0 2rem' }} />

      {/* 2. 三步驟 */}
      <section style={{ padding: '2.5rem 2rem' }}>
        <p style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.12em', color: 'var(--ink-3)', margin: '0 0 1.5rem', textTransform: 'uppercase' }}>三步驟開始</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          {[
            { Icon: IconSearch, color: 'var(--accent)', step: '01', title: '找到成績', desc: '搜尋賽事，找到你的名字' },
            { Icon: IconFlag,   color: 'var(--accent)', step: '02', title: '認領它',   desc: '一鍵認領，成績與帳號綁定' },
            { Icon: IconTrophy, color: 'var(--accent)', step: '03', title: '出現在榜上', desc: '自動計入排行榜與個人統計' },
          ].map(({ Icon, color, step, title, desc }) => (
            <div key={step} style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
              <Icon size={24} color={color} style={{ marginBottom: '0.75rem' }} />
              <p style={{ fontSize: '11px', color: 'var(--ink-3)', margin: '0 0 0.25rem', fontWeight: 500 }}>步驟 {step}</p>
              <p style={{ fontSize: '15px', color: 'var(--ink)', margin: '0 0 0.5rem', fontWeight: 500 }}>{title}</p>
              <p style={{ fontSize: '13px', color: 'var(--ink-3)', lineHeight: 1.6, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '0.5px solid var(--border)', margin: '0 2rem' }} />

      {/* 3. 認領機制 */}
      <section style={{ padding: '2.5rem 2rem' }}>
        <p style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.12em', color: 'var(--ink-3)', margin: '0 0 1rem', textTransform: 'uppercase' }}>認領機制</p>
        <p style={{ fontSize: '15px', color: 'var(--ink)', lineHeight: 1.75, margin: '0 0 0.75rem' }}>
          Tri·log 的助手會預先輸入官方賽事成績，讓平台第一天就有完整資料。你只需要找到你的成績，點「認領」，就正式與帳號綁定。
        </p>
        <p style={{ fontSize: '15px', color: 'var(--ink-3)', lineHeight: 1.75, margin: '0 0 1.25rem' }}>
          找不到？你也可以自行新增成績，上傳完賽證書後升級驗證狀態。
        </p>
        <Link href="/unclaimed" style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none' }}>
          查看未認領成績 →
        </Link>
      </section>

      <hr style={{ border: 'none', borderTop: '0.5px solid var(--border)', margin: '0 2rem' }} />

      {/* 4. 最速榜 */}
      <section style={{ padding: '2.5rem 2rem' }}>
        <p style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.12em', color: 'var(--ink-3)', margin: '0 0 1rem', textTransform: 'uppercase' }}>最速榜</p>
        <p style={{ fontSize: '17px', color: 'var(--ink)', lineHeight: 1.6, margin: '0 0 0.75rem', fontWeight: 500 }}>
          你在台灣全距離鐵人圈排第幾？
        </p>
        <p style={{ fontSize: '15px', color: 'var(--ink-3)', lineHeight: 1.75, margin: '0 0 1.25rem' }}>
          最速榜取每位選手在同一距離的最佳成績，讓你一眼看出自己的位置。從 51.5 到 226，找到屬於你的排名。
        </p>
        <Link href="/leaderboard" style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none' }}>
          前往最速榜 →
        </Link>
      </section>

      <hr style={{ border: 'none', borderTop: '0.5px solid var(--border)', margin: '0 2rem' }} />

      {/* 5. FAQ */}
      <section style={{ padding: '2.5rem 2rem' }}>
        <p style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.12em', color: 'var(--ink-3)', margin: '0 0 1.5rem', textTransform: 'uppercase' }}>常見問題</p>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {[
            {
              q: '我的成績不在上面怎麼辦？',
              a: '你可以自行新增成績，或回報給我們，助手會盡快補充官方資料。',
            },
            {
              q: '認領是什麼意思？',
              a: '助手預先建立官方成績後，成績尚未與任何帳號綁定。「認領」就是把那筆成績正式連結到你的帳號。',
            },
            {
              q: '成績會被修改嗎？',
              a: '官方成績認領後不可修改，以確保資料可信度。自申報成績可隨時編輯，上傳完賽證書後可升級驗證狀態。',
            },
          ].map(({ q, a }) => (
            <div key={q} style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink)', margin: '0 0 0.5rem' }}>{q}</p>
              <p style={{ fontSize: '13px', color: 'var(--ink-3)', lineHeight: 1.65, margin: 0 }}>{a}</p>
            </div>
          ))}
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '0.5px solid var(--border)', margin: '0 2rem' }} />

      {/* 6. 底部 CTA */}
      <section style={{ padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center' }}>
        <p style={{ fontSize: '17px', color: 'var(--ink)', fontWeight: 500, margin: 0 }}>準備好了嗎？</p>
        <p style={{ fontSize: '14px', color: 'var(--ink-3)', margin: 0 }}>找到你的成績，讓每一次完賽都被記住。</p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/unclaimed" style={{ fontSize: '13px', padding: '8px 20px', borderRadius: '8px', background: 'var(--accent)', color: 'var(--bg)', textDecoration: 'none', fontWeight: 500 }}>
            查看未認領成績
          </Link>
          <Link href="/login" style={{ fontSize: '13px', padding: '8px 20px', borderRadius: '8px', border: '0.5px solid var(--border)', color: 'var(--ink-3)', textDecoration: 'none' }}>
            登入 / 註冊
          </Link>
        </div>
      </section>

    </main>
  )
}
