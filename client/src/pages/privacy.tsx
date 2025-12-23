import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { useTenant } from '../hooks/use-tenant';

export function PrivacyPage() {
  const { tenant } = useTenant();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/30 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => setLocation('/register')}
          className="flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          登録ページへ戻る
        </button>

        <div className="glass-card rounded-2xl shadow-card p-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-6">プライバシーポリシー</h1>
          
          <div className="prose prose-slate max-w-none space-y-6 text-slate-600">
            <p className="text-sm text-slate-500">最終更新日: 2024年1月1日</p>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">1. はじめに</h2>
              <p>
                {tenant?.name || 'SIN JAPAN'}（以下「当社」）は、ユーザーの個人情報の保護を重要視しています。
                本プライバシーポリシーは、当社が提供するサービス（以下「本サービス」）における個人情報の取り扱いについて説明するものです。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">2. 収集する情報</h2>
              <p>当社は、本サービスの提供にあたり、以下の情報を収集することがあります。</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>氏名、メールアドレス、電話番号などの連絡先情報</li>
                <li>ユーザーID、パスワードなどのアカウント情報</li>
                <li>サービス利用履歴、アクセスログなどの利用情報</li>
                <li>端末情報、IPアドレス、ブラウザ情報などの技術情報</li>
                <li>その他、本サービスの利用に必要な情報</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">3. 情報の利用目的</h2>
              <p>当社は、収集した情報を以下の目的で利用します。</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>本サービスの提供、維持、改善</li>
                <li>ユーザーからのお問い合わせへの対応</li>
                <li>本サービスに関する重要な通知の送信</li>
                <li>新機能やサービスに関する情報提供</li>
                <li>不正利用の防止およびセキュリティの向上</li>
                <li>利用規約への違反対応</li>
                <li>統計データの作成および分析</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">4. 情報の共有</h2>
              <p>当社は、以下の場合を除き、ユーザーの個人情報を第三者に開示または提供しません。</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>ユーザーの同意がある場合</li>
                <li>法令に基づく開示請求があった場合</li>
                <li>人の生命、身体または財産の保護のために必要な場合</li>
                <li>公衆衛生の向上または児童の健全な育成の推進のために必要な場合</li>
                <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合</li>
                <li>業務委託先に必要な範囲で開示する場合（この場合、委託先に対し適切な管理を求めます）</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">5. 情報の保護</h2>
              <p>
                当社は、ユーザーの個人情報を保護するため、適切な技術的および組織的なセキュリティ対策を講じています。
                ただし、インターネット上での情報の送信は完全に安全とは言えないため、当社は情報の絶対的なセキュリティを保証するものではありません。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">6. Cookieの使用</h2>
              <p>
                当社は、本サービスの利便性向上のためにCookieを使用することがあります。
                Cookieは、ユーザーのブラウザに保存される小さなテキストファイルであり、ユーザーの設定やログイン状態を記録するために使用されます。
                ユーザーは、ブラウザの設定によりCookieの使用を拒否することができますが、その場合、本サービスの一部機能が利用できなくなる可能性があります。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">7. ユーザーの権利</h2>
              <p>ユーザーは、当社に対して以下の権利を行使することができます。</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>個人情報の開示、訂正、削除の請求</li>
                <li>個人情報の利用停止の請求</li>
                <li>個人情報の第三者提供の停止の請求</li>
              </ul>
              <p className="mt-2">
                これらの請求をする場合は、当社所定の方法によりお申し出ください。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">8. 子どもの個人情報</h2>
              <p>
                本サービスは、13歳未満の方を対象としていません。
                当社は、故意に13歳未満の方から個人情報を収集することはありません。
                13歳未満の方の個人情報が当社に提供されていることが判明した場合、当社は速やかにその情報を削除します。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">9. プライバシーポリシーの変更</h2>
              <p>
                当社は、必要に応じて本プライバシーポリシーを変更することがあります。
                重要な変更を行う場合は、本サービス上での通知やメールでお知らせします。
                変更後のプライバシーポリシーは、本ページに掲載した時点で効力を生じるものとします。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">10. お問い合わせ</h2>
              <p>
                本プライバシーポリシーに関するご質問やご意見がございましたら、当社までお問い合わせください。
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
