import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { useTenant } from '../hooks/use-tenant';

export function TermsPage() {
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
          <h1 className="text-2xl font-bold text-slate-800 mb-6">利用規約</h1>
          
          <div className="prose prose-slate max-w-none space-y-6 text-slate-600">
            <p className="text-sm text-slate-500">最終更新日: 2024年1月1日</p>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">第1条（適用）</h2>
              <p>
                本利用規約（以下「本規約」）は、{tenant?.name || 'SIN JAPAN'}（以下「当社」）が提供するサービス（以下「本サービス」）の利用条件を定めるものです。
                登録ユーザーの皆様には、本規約に従って本サービスをご利用いただきます。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">第2条（利用登録）</h2>
              <ol className="list-decimal list-inside space-y-2">
                <li>本サービスにおいては、登録希望者が本規約に同意の上、当社の定める方法によって利用登録を申請し、当社がこれを承認することによって、利用登録が完了するものとします。</li>
                <li>当社は、利用登録の申請者に以下の事由があると判断した場合、利用登録の申請を承認しないことがあり、その理由については一切の開示義務を負わないものとします。
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                    <li>利用登録の申請に際して虚偽の事項を届け出た場合</li>
                    <li>本規約に違反したことがある者からの申請である場合</li>
                    <li>その他、当社が利用登録を相当でないと判断した場合</li>
                  </ul>
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">第3条（ユーザーIDおよびパスワードの管理）</h2>
              <ol className="list-decimal list-inside space-y-2">
                <li>ユーザーは、自己の責任において、本サービスのユーザーIDおよびパスワードを適切に管理するものとします。</li>
                <li>ユーザーは、いかなる場合にも、ユーザーIDおよびパスワードを第三者に譲渡または貸与し、もしくは第三者と共用することはできません。</li>
                <li>ユーザーIDとパスワードの組み合わせが登録情報と一致してログインされた場合には、そのユーザーIDを登録しているユーザー自身による利用とみなします。</li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">第4条（禁止事項）</h2>
              <p>ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>法令または公序良俗に違反する行為</li>
                <li>犯罪行為に関連する行為</li>
                <li>本サービスの内容等、本サービスに含まれる著作権、商標権ほか知的財産権を侵害する行為</li>
                <li>当社、ほかのユーザー、またはその他第三者のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
                <li>本サービスによって得られた情報を商業的に利用する行為</li>
                <li>当社のサービスの運営を妨害するおそれのある行為</li>
                <li>不正アクセスをし、またはこれを試みる行為</li>
                <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
                <li>不正な目的を持って本サービスを利用する行為</li>
                <li>その他、当社が不適切と判断する行為</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">第5条（本サービスの提供の停止等）</h2>
              <p>
                当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
              </p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
                <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
                <li>コンピュータまたは通信回線等が事故により停止した場合</li>
                <li>その他、当社が本サービスの提供が困難と判断した場合</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">第6条（利用制限および登録抹消）</h2>
              <p>
                当社は、ユーザーが以下のいずれかに該当する場合には、事前の通知なく、ユーザーに対して、本サービスの全部もしくは一部の利用を制限し、またはユーザーとしての登録を抹消することができるものとします。
              </p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>本規約のいずれかの条項に違反した場合</li>
                <li>登録事項に虚偽の事実があることが判明した場合</li>
                <li>その他、当社が本サービスの利用を適当でないと判断した場合</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">第7条（免責事項）</h2>
              <ol className="list-decimal list-inside space-y-2">
                <li>当社の債務不履行責任は、当社の故意または重過失によらない場合には免責されるものとします。</li>
                <li>当社は、本サービスに関して、ユーザーと他のユーザーまたは第三者との間において生じた取引、連絡または紛争等について一切責任を負いません。</li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">第8条（サービス内容の変更等）</h2>
              <p>
                当社は、ユーザーへの事前の告知をもって、本サービスの内容を変更、追加または廃止することがあり、ユーザーはこれを承諾するものとします。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">第9条（利用規約の変更）</h2>
              <ol className="list-decimal list-inside space-y-2">
                <li>当社は以下の場合には、ユーザーの個別の同意を要せず、本規約を変更することができるものとします。
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                    <li>本規約の変更がユーザーの一般の利益に適合するとき</li>
                    <li>本規約の変更が本サービス利用契約の目的に反せず、かつ、変更の必要性、変更後の内容の相当性その他の変更に係る事情に照らして合理的なものであるとき</li>
                  </ul>
                </li>
                <li>当社はユーザーに対し、前項による本規約の変更にあたり、事前に、本規約を変更する旨および変更後の本規約の内容並びにその効力発生時期を通知します。</li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">第10条（準拠法・裁判管轄）</h2>
              <ol className="list-decimal list-inside space-y-2">
                <li>本規約の解釈にあたっては、日本法を準拠法とします。</li>
                <li>本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。</li>
              </ol>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
