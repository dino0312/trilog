import Link from 'next/link'
import { IconTrophy, IconUser, IconUsers, IconChevronRight, IconSearch, IconPlus, IconShieldCheck } from '@tabler/icons-react'

export const metadata = { title: '關於 Tri·log' }

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 space-y-16">

      {/* Hero */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-ink">Tri·log</h1>
        <p className="text-xl text-ink-3 leading-relaxed">
          鐵人三項選手的跨賽事成績記錄平台
        </p>
        <p className="text-ink-3 max-w-lg mx-auto leading-relaxed">
          不論是鐵人 51.5、70.3 還是 226 全程，Tri·log 讓你在同一個地方看見所有成績，
          與其他選手比較，追蹤個人進步曲線。
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            href="/register"
            className="px-5 py-2.5 rounded-lg bg-accent text-bg font-semibold hover:bg-accent/90 transition"
          >
            免費註冊
          </Link>
          <Link
            href="/leaderboard"
            className="px-5 py-2.5 rounded-lg border border-border text-ink hover:bg-bg-card transition"
          >
            瀏覽排行榜
          </Link>
        </div>
      </section>

      {/* 3-step flow */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-ink text-center">三步驟開始</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: <IconUser size={28} stroke={1.5} />, step: '1', title: '建立帳號', desc: '填寫基本資料，設定你的公開個人頁' },
            { icon: <IconSearch size={28} stroke={1.5} />, step: '2', title: '找到你的成績', desc: '搜尋賽事，認領助手已預先建立的官方成績' },
            { icon: <IconTrophy size={28} stroke={1.5} />, step: '3', title: '上榜！', desc: '成績驗證後自動計入排行榜與個人統計' },
          ].map(({ icon, step, title, desc }) => (
            <div key={step} className="bg-bg-card rounded-xl p-5 border border-border space-y-3">
              <div className="text-accent">{icon}</div>
              <div>
                <span className="text-xs text-ink-3 font-medium">步驟 {step}</span>
                <h3 className="text-base font-semibold text-ink mt-0.5">{title}</h3>
              </div>
              <p className="text-sm text-ink-3 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 策展層說明 */}
      <section className="bg-bg-card rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-2">
          <IconShieldCheck size={22} stroke={1.5} className="text-accent" />
          <h2 className="text-lg font-semibold text-ink">策展層：成績從第一天就在這裡</h2>
        </div>
        <p className="text-ink-3 text-sm leading-relaxed">
          Tri·log 的核心特色是「策展層」。我們的助手會預先輸入賽事官方成績，
          讓平台上線的第一天就有完整的成績資料庫。你只需要搜尋你的名字，
          點一下「認領」，成績就正式與你的帳號綁定。
        </p>
        <p className="text-ink-3 text-sm leading-relaxed">
          沒找到自己的成績？你也可以自行新增，或幫隊友記錄成績。
          自行新增的成績標示為「自申報」，上傳完賽證書後可升級驗證狀態。
        </p>
      </section>

      {/* 排行榜差異說明 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-ink text-center">排行榜怎麼計算？</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              icon: <IconTrophy size={20} stroke={1.5} />,
              title: '最速榜（Leaderboard）',
              desc: '每位選手在同一距離級別的「最佳單次成績」。同一選手只會出現一次，凸顯巔峰表現。',
            },
            {
              icon: <IconUsers size={20} stroke={1.5} />,
              title: '排行榜（Rankings）',
              desc: '特定賽事或系列賽的所有成績排名。一位選手可能出現多次，忠實呈現每場比賽的競爭狀況。',
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-bg-card rounded-xl border border-border p-5 space-y-2">
              <div className="flex items-center gap-2 text-accent">{icon}<span className="text-sm font-semibold text-ink">{title}</span></div>
              <p className="text-sm text-ink-3 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-ink text-center">常見問題</h2>
        <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
          {[
            { q: '免費嗎？', a: 'Tri·log 目前完全免費。' },
            { q: '只有台灣賽事嗎？', a: '目前以台灣賽事為主，未來會逐步擴充海外賽事資料。' },
            { q: '我的成績被認領後還能修改嗎？', a: '官方成績認領後不可修改，以確保資料可信度。自申報成績可隨時編輯。' },
            { q: '接力賽怎麼記錄？', a: '接力成績以「隊伍」為單位建立，每位成員可分別認領自己的棒次成績。' },
          ].map(({ q, a }) => (
            <div key={q} className="px-5 py-4 flex gap-3">
              <IconChevronRight size={16} className="text-accent mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-ink">{q}</p>
                <p className="text-sm text-ink-3 mt-1">{a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center space-y-3">
        <p className="text-ink-3">準備好了嗎？</p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-bg font-semibold hover:bg-accent/90 transition"
        >
          <IconPlus size={18} />
          建立帳號，開始記錄
        </Link>
      </section>

    </main>
  )
}
