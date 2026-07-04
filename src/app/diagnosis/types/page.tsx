import Link from 'next/link';
import { CAR_TYPES_16, GROUPS } from '@/lib/car-types-16';
import { CarIllustration } from '@/components/CarIllustration';

export default function TypesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      {/* ヘッダー */}
      <div className="text-center px-4 pt-12 pb-8">
        <Link href="/diagnosis" className="inline-block text-xs text-blue-500 hover:text-blue-700 mb-4 transition-colors">
          ← 診断に戻る
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">16の中古車タイプ</h1>
        <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
          4つの軸の組み合わせで、あなたのカーライフを16タイプに分類。<br />
          自分のタイプを診断して最適な車を見つけよう。
        </p>
        <Link
          href="/diagnosis"
          className="inline-block mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-full transition-colors shadow-sm"
        >
          診断スタート →
        </Link>
      </div>

      {/* 軸の説明 */}
      <div className="max-w-2xl mx-auto px-4 mb-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { axis: 'F / S', label: 'ファミリー vs ソロ',    color: 'bg-blue-100 text-blue-700'   },
            { axis: 'U / O', label: '街乗り vs アウトドア',  color: 'bg-green-100 text-green-700' },
            { axis: 'E / P', label: 'エコ vs プレミアム',    color: 'bg-amber-100 text-amber-700' },
            { axis: 'C / W', label: 'コンパクト vs ワイド',  color: 'bg-purple-100 text-purple-700' },
          ].map(a => (
            <div key={a.axis} className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold mb-1 ${a.color}`}>{a.axis}</span>
              <p className="text-xs text-gray-500">{a.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* グループ × タイプカード一覧 */}
      <div className="max-w-5xl mx-auto px-4 pb-16 space-y-14">
        {GROUPS.map(group => (
          <section key={group.label}>
            {/* グループヘッダー */}
            <div className={`flex items-center gap-2 mb-5 px-4 py-2.5 rounded-2xl border ${group.headerBg} ${group.border}`}>
              <span className="text-xl">{group.emoji}</span>
              <span className={`font-bold text-sm ${group.color}`}>{group.label}</span>
            </div>

            {/* 4タイプ カードグリッド */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {group.codes.map(code => {
                const t = CAR_TYPES_16[code];
                return (
                  <div
                    key={code}
                    className="rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 bg-white flex flex-col"
                  >
                    {/* 上段：グラデーション + イラスト */}
                    <div className={`bg-gradient-to-br ${t.gradient} px-4 pt-5 pb-3 flex flex-col items-center`}>
                      <span className="text-xs font-bold text-white/60 tracking-widest mb-2">{code}</span>
                      <div className="w-full max-w-[160px]">
                        <CarIllustration body={t.body} primaryColor={t.illustColor} />
                      </div>
                    </div>

                    {/* 下段：白ベースの情報エリア */}
                    <div className="px-3.5 py-3 flex flex-col flex-1">
                      <p className="text-[11px] font-bold text-gray-800 leading-snug mb-1">{t.name}</p>
                      <p className="text-[10px] text-gray-500 leading-snug mb-3 flex-1">{t.tagline}</p>

                      {/* おすすめ車種 */}
                      <div className="space-y-1 border-t border-gray-100 pt-2">
                        {t.models.map(m => (
                          <a
                            key={m.name}
                            href={m.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-[10px] text-blue-600 hover:text-blue-800 hover:underline truncate"
                          >
                            → {m.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* フッター CTA */}
      <div className="text-center pb-12">
        <Link
          href="/diagnosis"
          className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-lg transition-colors shadow-md"
        >
          自分のタイプを診断する →
        </Link>
      </div>
    </main>
  );
}
