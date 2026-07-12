import Link from 'next/link';
import { PERSONALITY_TYPES } from '@/lib/driving-personality';

const GROUPS = [
  {
    label: 'アクティブ × グループ系',
    desc: '行動的でみんなと一緒に動くタイプ。車はみんなを乗せて、どこへでも行く。',
    color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200',
    codes: ['AGCW', 'AGCL', 'AGKW', 'AGKL'] as const,
  },
  {
    label: 'アクティブ × ソロ系',
    desc: '行動的だけど自分のペース。自分だけの世界を車で広げていく。',
    color: 'text-violet-700', bg: 'bg-violet-50 border-violet-200',
    codes: ['ASCW', 'ASCL', 'ASKW', 'ASKL'] as const,
  },
  {
    label: 'まったり × グループ系',
    desc: '穏やかにみんなとの時間を楽しむタイプ。車は快適な移動空間。',
    color: 'text-pink-700', bg: 'bg-pink-50 border-pink-200',
    codes: ['NGCW', 'NGCL', 'NGKW', 'NGKL'] as const,
  },
  {
    label: 'まったり × ソロ系',
    desc: '自分の世界観とペースを大切に。車は自分だけの特別な空間。',
    color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200',
    codes: ['NSCW', 'NSCL', 'NSKW', 'NSKL'] as const,
  },
];

export default function PersonalityTypesPage() {
  return (
    <main className="min-h-screen bg-[#f8f9ff]">

      {/* ヒーロー */}
      <div className="relative overflow-hidden px-4 pt-14 pb-12 text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-15%] left-[-10%]  w-[500px] h-[500px] bg-violet-300/[0.22] rounded-full blur-[120px]" />
          <div className="absolute top-[-10%] right-[-10%] w-[430px] h-[430px] bg-pink-300/[0.18]   rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-lg mx-auto">
          <Link href="/personality" className="inline-block text-[11px] text-slate-400 hover:text-slate-600 mb-6 transition-colors">
            ← 診断に戻る
          </Link>

          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-3 leading-tight">
            <span className="bg-gradient-to-r from-violet-500 via-pink-500 to-blue-500 bg-clip-text text-transparent">16</span>の運転タイプ
          </h1>
          <p className="text-slate-400 text-sm max-w-xs mx-auto mb-7 leading-relaxed">
            4つの軸の組み合わせで、あなたのドライブスタイルを16タイプに分類。
          </p>

          {/* 4軸の説明 */}
          <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto mb-7">
            {[
              { label: 'A / N', desc: 'アクティブ vs まったり', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
              { label: 'G / S', desc: 'グループ vs ソロ',       color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200' },
              { label: 'C / K', desc: 'クール vs かわいい',     color: 'text-slate-600',  bg: 'bg-slate-50  border-slate-200'  },
              { label: 'W / L', desc: '大きめ vs コンパクト',   color: 'text-teal-600',   bg: 'bg-teal-50   border-teal-200'   },
            ].map(ax => (
              <div key={ax.label} className={`rounded-2xl px-3 py-2.5 text-center border ${ax.bg}`}>
                <span className={`text-sm font-black tracking-widest ${ax.color}`}>{ax.label}</span>
                <p className="text-[10px] text-slate-500 mt-0.5">{ax.desc}</p>
              </div>
            ))}
          </div>

          <Link
            href="/personality"
            className="inline-block px-8 py-3.5 rounded-full font-bold text-white text-sm"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #db2777, #2563eb)',
              boxShadow: '0 0 30px rgba(124,58,237,0.35)',
            }}
          >
            診断スタート →
          </Link>
        </div>
      </div>

      {/* タイプグループ */}
      <div className="max-w-2xl mx-auto px-4 pb-20 space-y-12">
        {GROUPS.map(group => (
          <section key={group.label}>
            {/* グループヘッダー */}
            <div className={`rounded-2xl px-4 py-3 border mb-4 ${group.bg}`}>
              <p className={`font-black text-sm ${group.color}`}>{group.label}</p>
              <p className="text-slate-500 text-[11px] mt-0.5">{group.desc}</p>
            </div>

            {/* 4タイプグリッド */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {group.codes.map(code => {
                const t = PERSONALITY_TYPES[code];
                return (
                  <Link
                    key={code}
                    href={`/personality/type/${code}`}
                    className="group rounded-3xl overflow-hidden border border-white/80 hover:border-slate-200 hover:scale-[1.03] hover:shadow-xl transition-all duration-300 bg-white shadow-sm"
                  >
                    {/* グラデーション上部 */}
                    <div className={`bg-gradient-to-br ${t.gradient} p-4 text-center relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.15)_0%,transparent_55%)] pointer-events-none" />
                      <span className="relative text-[9px] font-black text-white/40 tracking-[0.3em] block mb-1">{code}</span>
                      <span className="relative text-3xl">{t.emoji}</span>
                    </div>

                    {/* 情報下部 */}
                    <div className="p-3">
                      <p className="font-bold text-slate-800 text-[12px] leading-tight mb-1">{t.name}</p>
                      <p className="text-[10px] text-slate-400 leading-snug mb-2.5">{t.tagline}</p>
                      {/* キーワードタグ 2つだけ */}
                      <div className="flex flex-wrap gap-1">
                        {t.traits.slice(0, 2).map(trait => (
                          <span
                            key={trait}
                            className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                            style={{ backgroundColor: `${t.accentColor}18`, color: t.accentColor }}
                          >
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* フッターCTA */}
      <div className="text-center pb-16">
        <p className="text-slate-400 text-xs mb-4">あなたはどのタイプ？</p>
        <Link
          href="/personality"
          className="inline-block px-10 py-4 rounded-2xl font-bold text-white text-lg"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #db2777, #2563eb)',
            boxShadow: '0 0 40px rgba(124,58,237,0.4)',
          }}
        >
          8問で診断する →
        </Link>
      </div>
    </main>
  );
}
