import Link from 'next/link';
import { CAR_TYPES_16, GROUPS } from '@/lib/car-types-16';
import { CarIllustration } from '@/components/CarIllustration';

export default function TypesPage() {
  return (
    <main className="min-h-screen bg-[#030712]">

      {/* ═══════════════════ ヒーローセクション ═══════════════════ */}
      <div className="relative overflow-hidden px-4 pt-16 pb-14 text-center">
        {/* オーロラ背景 */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-5%]  w-[520px] h-[520px] bg-blue-600/[0.18]   rounded-full blur-[110px] animate-aurora-1" />
          <div className="absolute top-[-5%]  right-[-5%] w-[450px] h-[450px] bg-violet-600/[0.14] rounded-full blur-[110px] animate-aurora-2" />
          <div className="absolute bottom-0   left-[30%]  w-[300px] h-[300px] bg-fuchsia-600/[0.09] rounded-full blur-[100px] animate-aurora-3" />
        </div>
        {/* グリッドオーバーレイ */}
        <div className="absolute inset-0 bg-grid pointer-events-none" />

        <div className="relative z-10">
          <Link href="/diagnosis" className="inline-block text-[11px] text-white/28 hover:text-white/55 mb-7 transition-colors">
            ← 診断に戻る
          </Link>

          {/* タイトル */}
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-3 leading-tight">
            <span className="text-gradient">16</span>の中古車タイプ
          </h1>
          <p className="text-white/38 text-sm max-w-xs mx-auto mb-7 leading-relaxed">
            4つの軸の組み合わせで、あなたのカーライフを<br className="hidden sm:inline" />16タイプに分類。自分のタイプを診断しよう。
          </p>

          {/* CTAボタン */}
          <Link
            href="/diagnosis"
            className="inline-block px-7 py-3 rounded-full btn-primary-glow text-white text-sm font-bold transition-all"
          >
            診断スタート →
          </Link>
        </div>
      </div>

      {/* ═══════════════════ 4軸の説明 ═══════════════════ */}
      <div className="max-w-2xl mx-auto px-4 mb-14 -mt-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { axis: 'F / S', label: 'ファミリー vs ソロ',   color: 'text-blue-400',   bg: 'bg-blue-500/15   border-blue-500/25'   },
            { axis: 'U / O', label: '街乗り vs アウトドア', color: 'text-green-400',  bg: 'bg-green-500/12  border-green-500/22'  },
            { axis: 'E / P', label: 'エコ vs プレミアム',   color: 'text-amber-400',  bg: 'bg-amber-500/12  border-amber-500/22'  },
            { axis: 'C / W', label: 'コンパクト vs ワイド', color: 'text-purple-400', bg: 'bg-purple-500/12 border-purple-500/22' },
          ].map(a => (
            <div key={a.axis} className={`rounded-2xl px-3 py-3 text-center border backdrop-blur-sm ${a.bg}`}>
              <span className={`text-sm font-black tracking-widest ${a.color}`}>{a.axis}</span>
              <p className="text-[10px] text-white/38 mt-1">{a.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════ タイプグリッド ═══════════════════ */}
      <div className="max-w-5xl mx-auto px-4 pb-20 space-y-14">
        {GROUPS.map(group => (
          <section key={group.label}>
            {/* グループヘッダー */}
            <div className="flex items-center gap-2.5 mb-5 px-4 py-2.5 glass-dark rounded-2xl w-fit">
              <span className="text-lg">{group.emoji}</span>
              <span className="font-bold text-sm text-white/60 tracking-wide">{group.label}</span>
            </div>

            {/* 4タイプカードグリッド */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {group.codes.map((code) => {
                const t = CAR_TYPES_16[code];
                return (
                  <div
                    key={code}
                    className="rounded-3xl overflow-hidden flex flex-col border border-white/[0.07] hover:border-white/15 hover:scale-[1.025] hover:shadow-2xl transition-all duration-300 bg-[#0c1020]"
                    style={{boxShadow: '0 4px 24px rgba(0,0,0,0.4)'}}
                  >
                    {/* グラデーション上段 + イラスト */}
                    <div className={`relative bg-gradient-to-br ${t.gradient} px-4 pt-5 pb-3 flex flex-col items-center overflow-hidden`}>
                      {/* シャインオーバーレイ */}
                      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.16)_0%,transparent_55%)] pointer-events-none" />
                      <span className="relative text-[10px] font-black text-white/45 tracking-[0.25em] mb-2">{code}</span>
                      <div className="relative w-full max-w-[155px]">
                        <CarIllustration body={t.body} primaryColor={t.illustColor} />
                      </div>
                    </div>

                    {/* 情報下段 */}
                    <div className="px-3.5 py-3.5 flex flex-col flex-1 bg-[#0d1424]">
                      <p className="text-[11.5px] font-bold text-white/88 leading-snug mb-1">{t.name}</p>
                      <p className="text-[10px] text-white/38 leading-snug mb-3 flex-1">{t.tagline}</p>

                      {/* 車種リンク */}
                      <div className="space-y-1 border-t border-white/[0.07] pt-2.5">
                        {t.models.map(m => (
                          <a
                            key={m.name}
                            href={m.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-[10px] text-blue-400/80 hover:text-blue-300 hover:underline truncate transition-colors"
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

      {/* ═══════════════════ フッター CTA ═══════════════════ */}
      <div className="text-center pb-16">
        <p className="text-white/25 text-xs mb-4">あなたはどのタイプ？</p>
        <Link
          href="/diagnosis"
          className="inline-block px-10 py-4 rounded-2xl btn-primary-glow text-white font-bold text-lg transition-all"
        >
          自分のタイプを診断する →
        </Link>
      </div>
    </main>
  );
}
