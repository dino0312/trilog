import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '隱私權政策 | Tri·log',
}

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 text-ink">
      <article className="prose prose-sm prose-invert max-w-none">
        <h1 className="text-2xl font-bold mb-2">Tri·log 隱私權政策</h1>
        <p className="text-ink-3 text-sm mb-8">最後更新日期：2026 年 6 月 25 日｜版本：1.2</p>

        <h2>一、前言</h2>
        <p>Tri·log（以下簡稱「本平台」）是由個人營運的鐵人三項選手成績記錄與排行榜服務，網址為 trilog.run。</p>
        <p>本平台非常重視您的隱私權。本政策說明我們如何蒐集、處理、利用及保護您的個人資料，以及您依據《個人資料保護法》享有的相關權利。</p>
        <p><strong>使用本平台即表示您已閱讀並同意本隱私權政策。</strong>若您不同意本政策任何內容，請停止使用本平台服務。</p>

        <h2>二、個人資料蒐集告知事項（個資法第 8 條）</h2>
        <p>依《個人資料保護法》第 8 條規定，本平台於蒐集您的個人資料前，特此告知下列事項：</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <tbody>
              <tr className="border-b border-border"><td className="py-2 pr-4 font-medium text-ink-2 whitespace-nowrap">蒐集機關（營運者）</td><td className="py-2">Tri·log，個人營運，聯絡信箱：privacy@trilog.run</td></tr>
              <tr className="border-b border-border"><td className="py-2 pr-4 font-medium text-ink-2 whitespace-nowrap">蒐集目的</td><td className="py-2">提供鐵人三項成績記錄、排行榜服務及運動歷史公益記錄（法定特定目的：135 資訊與資料庫管理業務；181 其他經營合於營業登記項目或組織章程所定之業務）</td></tr>
              <tr className="border-b border-border"><td className="py-2 pr-4 font-medium text-ink-2 whitespace-nowrap">個人資料類別</td><td className="py-2">C001 辨識個人者（姓名、Email）、C003 政府資料中之辨識者（國籍）、C011 個人描述（性別、出生年份）、C132 休閒活動及興趣（運動成績）</td></tr>
              <tr className="border-b border-border"><td className="py-2 pr-4 font-medium text-ink-2 whitespace-nowrap">個資利用期間</td><td className="py-2">帳號存續期間；成績記錄依第七章規定之期限保存</td></tr>
              <tr className="border-b border-border"><td className="py-2 pr-4 font-medium text-ink-2 whitespace-nowrap">個資利用地區</td><td className="py-2">中華民國境內，及本平台所使用之境外基礎設施服務商所在地（詳見第五章）</td></tr>
              <tr className="border-b border-border"><td className="py-2 pr-4 font-medium text-ink-2 whitespace-nowrap">個資利用對象</td><td className="py-2">本平台及第五章所列基礎設施服務商（僅限提供服務所需範圍）</td></tr>
              <tr className="border-b border-border"><td className="py-2 pr-4 font-medium text-ink-2 whitespace-nowrap">個資利用方式</td><td className="py-2">電子化處理、網站公開顯示（依第六章範圍）</td></tr>
              <tr className="border-b border-border"><td className="py-2 pr-4 font-medium text-ink-2 whitespace-nowrap">不提供之後果</td><td className="py-2">電子郵件地址及真實姓名為必填，不提供將無法完成帳號註冊及使用排行榜功能；其餘欄位為選填，不提供不影響基本服務使用</td></tr>
              <tr><td className="py-2 pr-4 font-medium text-ink-2 whitespace-nowrap">當事人權利</td><td className="py-2">您得依個資法第 3 條行使查詢、閱覽、製給複製本、補充更正、停止處理及刪除等權利，行使方式詳見第八章</td></tr>
            </tbody>
          </table>
        </div>

        <h2>三、蒐集的個人資料類型</h2>
        <h3>3.1 您主動提供的資料</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead><tr className="border-b border-border"><th className="py-2 pr-4 text-left">資料類型</th><th className="py-2 pr-4 text-left">說明</th><th className="py-2 text-left">是否必填</th></tr></thead>
            <tbody>
              <tr className="border-b border-border"><td className="py-2 pr-4">電子郵件地址</td><td className="py-2 pr-4">用於帳號驗證與登入</td><td className="py-2">必填</td></tr>
              <tr className="border-b border-border"><td className="py-2 pr-4">真實姓名</td><td className="py-2 pr-4">顯示於成績記錄與排行榜</td><td className="py-2">必填（進榜條件）</td></tr>
              <tr className="border-b border-border"><td className="py-2 pr-4">暱稱</td><td className="py-2 pr-4">顯示名稱（選填）</td><td className="py-2">選填</td></tr>
              <tr className="border-b border-border"><td className="py-2 pr-4">出生年份</td><td className="py-2 pr-4">用於未成年保護機制</td><td className="py-2">選填</td></tr>
              <tr className="border-b border-border"><td className="py-2 pr-4">性別</td><td className="py-2 pr-4">用於排行榜分組</td><td className="py-2">選填</td></tr>
              <tr className="border-b border-border"><td className="py-2 pr-4">國籍</td><td className="py-2 pr-4">用於選手資料顯示</td><td className="py-2">選填</td></tr>
              <tr className="border-b border-border"><td className="py-2 pr-4">自我介紹</td><td className="py-2 pr-4">顯示於個人頁面</td><td className="py-2">選填</td></tr>
              <tr className="border-b border-border"><td className="py-2 pr-4">大頭照</td><td className="py-2 pr-4">顯示於帳號頭像</td><td className="py-2">選填</td></tr>
              <tr><td className="py-2 pr-4">賽事成績資料</td><td className="py-2 pr-4">含賽事名稱、完賽時間、號碼布等</td><td className="py-2">依功能需求</td></tr>
            </tbody>
          </table>
        </div>

        <h3>3.2 系統自動蒐集的資料</h3>
        <p>當您使用本平台時，系統可能自動記錄：</p>
        <ul>
          <li>登入時間與 IP 位址（由 Supabase Auth 系統記錄，用於帳號安全）</li>
          <li>瀏覽器類型與作業系統（由伺服器日誌記錄）</li>
          <li>操作記錄（如新增成績、認領記錄等）</li>
        </ul>
        <p>本平台<strong>目前不使用</strong> Google Analytics 或任何第三方追蹤工具，亦<strong>不使用</strong> Cookie 追蹤您的跨網站行為。Supabase Auth 使用的 Session Token 僅用於維持您的登入狀態。</p>

        <h3>3.3 關於官方成績資料（策展層）</h3>
        <p>本平台由管理員或貢獻者根據賽事官方公開資料建立選手成績記錄（稱為「未認領成績」）。此類資料來源為賽事官方公開成績，屬於已合法公開之個人資料，本平台依個資法第 9 條第 2 項規定處理。選手可透過「認領」流程將官方成績與自己的帳號綁定，或選擇不認領。</p>

        <h3>3.4 由他人代為填寫的成績</h3>
        <p>已登入的用戶可為他人填寫成績（「他人成績」Tab）。為確保資料蒐集之合法性，填寫者在送出前須勾選同意聲明，確認已獲得當事人明確同意，並對所填寫資料的正確性負責。本平台將於伺服器端記錄該同意確認之時間戳記（<code>contributor_consented_at</code>），作為合法蒐集依據之存證。</p>

        <h2>四、蒐集目的與利用方式</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead><tr className="border-b border-border"><th className="py-2 pr-4 text-left">目的</th><th className="py-2 text-left">說明</th></tr></thead>
            <tbody>
              <tr className="border-b border-border"><td className="py-2 pr-4">帳號管理</td><td className="py-2">建立、驗證及維護您的帳號</td></tr>
              <tr className="border-b border-border"><td className="py-2 pr-4">服務提供</td><td className="py-2">提供成績記錄、排行榜、認領等核心功能</td></tr>
              <tr className="border-b border-border"><td className="py-2 pr-4">安全維護</td><td className="py-2">防止帳號被盜用、偵測異常行為</td></tr>
              <tr className="border-b border-border"><td className="py-2 pr-4">平台改善</td><td className="py-2">分析使用行為以改善服務（匿名統計，不識別個人）</td></tr>
              <tr><td className="py-2 pr-4">法律義務</td><td className="py-2">依法令規定配合主管機關要求</td></tr>
            </tbody>
          </table>
        </div>
        <p>我們<strong>不會</strong>將您的個人資料用於：商業行銷或廣告投放、出售或出租給第三方、建立用戶個人信用或財務評估。</p>

        <h2>五、資料揭露與第三方共享</h2>
        <h3>5.1 基礎設施服務商與跨境傳輸</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead><tr className="border-b border-border"><th className="py-2 pr-4 text-left">服務商</th><th className="py-2 pr-4 text-left">用途</th><th className="py-2 pr-4 text-left">資料儲存地點</th><th className="py-2 text-left">DPA / 保護依據</th></tr></thead>
            <tbody>
              <tr className="border-b border-border"><td className="py-2 pr-4">Supabase</td><td className="py-2 pr-4">資料庫、身份驗證、檔案儲存</td><td className="py-2 pr-4">美國（AWS）</td><td className="py-2">Supabase DPA，符合 GDPR SCC</td></tr>
              <tr className="border-b border-border"><td className="py-2 pr-4">Vercel</td><td className="py-2 pr-4">網站部署與伺服器運算</td><td className="py-2 pr-4">全球 CDN</td><td className="py-2">Vercel DPA，符合 GDPR SCC</td></tr>
              <tr><td className="py-2 pr-4">Resend</td><td className="py-2 pr-4">電子郵件寄送</td><td className="py-2 pr-4">美國</td><td className="py-2">Resend DPA，符合 GDPR SCC</td></tr>
            </tbody>
          </table>
        </div>
        <h3>5.2 法律要求</h3>
        <p>若依法律規定、法院命令或主管機關要求，我們可能必須揭露您的個人資料。</p>
        <h3>5.3 不會對外揭露的情形</h3>
        <p>除上述情形外，本平台不會在未經您同意的情況下，將您的個人資料提供給任何第三方。</p>

        <h2>六、公開顯示的資料</h2>
        <p><strong>預設公開：</strong>您的真實姓名（顯示於排行榜與成績頁）、成績資料（完賽時間、賽事名稱等）、貢獻值與已幫助認領的筆數。</p>
        <p><strong>預設不公開：</strong>電子郵件地址（僅用於帳號登入，不對外顯示）、出生年份（僅用於系統判斷，不顯示完整年份）。</p>
        <p><strong>未成年保護：</strong>出生年份顯示為未成年（18 歲以下）的帳號，系統會自動將 <code>is_searchable</code> 設為 <code>false</code>，該帳號不會出現在全站搜尋結果中。</p>

        <h2>七、資料保存期限</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead><tr className="border-b border-border"><th className="py-2 pr-4 text-left">資料類型</th><th className="py-2 pr-4 text-left">保存期限</th><th className="py-2 text-left">說明</th></tr></thead>
            <tbody>
              <tr className="border-b border-border"><td className="py-2 pr-4">帳號資料</td><td className="py-2 pr-4">帳號存續期間，刪除帳號後 30 天內清除</td><td className="py-2">—</td></tr>
              <tr className="border-b border-border"><td className="py-2 pr-4">成績記錄（已認領）</td><td className="py-2 pr-4">帳號刪除後解除關聯，成績記錄仍長期保存</td><td className="py-2">基於公益目的，依個資法第 11 條第 2 項但書</td></tr>
              <tr className="border-b border-border"><td className="py-2 pr-4">成績記錄（未認領）</td><td className="py-2 pr-4">長期保存</td><td className="py-2">屬賽事官方公開成績，依個資法第 9 條第 2 項</td></tr>
              <tr className="border-b border-border"><td className="py-2 pr-4">系統日誌</td><td className="py-2 pr-4">最長 90 天</td><td className="py-2">—</td></tr>
              <tr className="border-b border-border"><td className="py-2 pr-4">Email 驗證記錄</td><td className="py-2 pr-4">完成驗證後 30 天</td><td className="py-2">—</td></tr>
              <tr><td className="py-2 pr-4">代填同意時間戳記</td><td className="py-2 pr-4">與對應成績記錄同存續期間</td><td className="py-2">作為合法蒐集依據之存證</td></tr>
            </tbody>
          </table>
        </div>

        <h2>八、您的個資權利</h2>
        <p>依據《個人資料保護法》，您對自己的個人資料擁有以下權利：查詢或閱覽、製給複製本、補充或更正、停止蒐集處理或利用、刪除。</p>
        <p><strong>行使方式：</strong></p>
        <ul>
          <li><strong>網站內操作</strong>：帳號刪除可於設定頁面直接操作；個人資料更正可於 /profile 自行修改</li>
          <li><strong>電子郵件申請</strong>：寄信至 privacy@trilog.run</li>
          <li><strong>網站回報功能</strong>：透過網站右下角「回報問題」按鈕提交</li>
        </ul>
        <p>我們將於收到申請後 <strong>15 個工作天</strong>內回覆處理結果。</p>

        <h2>九、資料安全</h2>
        <p>本平台採取以下措施保護您的個人資料：所有資料傳輸採用 HTTPS 加密、資料庫層級啟用 Row Level Security（RLS）、密碼由 Supabase Auth 處理（本平台不儲存明文密碼）、服務金鑰僅在伺服器端使用。</p>

        <h3>9.1 資安事故應變與通報</h3>
        <p>若本平台發生個人資料外洩等資安事故，本平台將：（1）於查知事故後 72 小時內通報主管機關；（2）依事故影響範圍以電子郵件通知受影響用戶；（3）立即採取必要措施阻止損害擴大。</p>

        <h2>十、兒童與未成年人</h2>
        <p>本平台服務對象為一般大眾，包含未成年選手。若帳號持有人未滿 18 歲，建議在父母或監護人的同意與陪同下使用本平台。未成年帳號系統自動啟用隱私保護（不出現於全站搜尋）。若您是未成年人的父母或監護人，且希望刪除其帳號或資料，請透過 privacy@trilog.run 聯絡我們。</p>

        <h2>十一、本政策的修改</h2>
        <p>若有重大變更（包含蒐集目的改變、新增個資類別、第三方共享範圍擴大等），我們將在網站顯著位置提前公告，並以彈出視窗請您明確確認同意；若有您的 Email，提前寄送通知信。非重大之文字修正或格式調整，將於頁面更新後直接生效並更新版本紀錄。</p>

        <h2>十二、準據法與管轄</h2>
        <p>本隱私權政策依中華民國法律解釋及適用。因本政策所生之爭議，以臺灣臺北地方法院為第一審管轄法院。</p>

        <h2>十三、聯絡我們</h2>
        <p>若您對本隱私權政策有任何疑問，或希望行使您的個資權利，請透過以下方式聯絡：</p>
        <ul>
          <li><strong>電子郵件</strong>：privacy@trilog.run</li>
          <li><strong>網站回報</strong>：網站右下角「回報問題」按鈕</li>
        </ul>

        <hr className="border-border my-8" />
        <p className="text-ink-3 text-xs">本隱私權政策版本：1.2｜制定日期：2026 年 6 月 25 日｜營運者：Tri·log 個人營運</p>
      </article>
    </main>
  )
}
