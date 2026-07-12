import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { PERSONALITY_TYPES } from '@/lib/driving-personality';
import { CarIllustration } from '@/components/CarIllustration';

export function generateStaticParams() {
  return Object.keys(PERSONALITY_TYPES).map(code => ({ code }));
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const t = PERSONALITY_TYPES[code];
  if (!t) return {};
  return {
    title: `${t.emoji} ${t.name} (${code}) | 運転タイプ診断`,
    description: t.personality,
  };
}

export default async function TypePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const t = PERSONALITY_TYPES[code.toUpperCase()];
  if (!t) notFound();

  const allTypes = Object.values(PERSONALITY_TYPES);

  return (
    <main className="min-h-screen bg-[#f8f9ff]">

      {/* ══ ヒーロー ══════════════════════════════════════════════════ */}
      <div className={`relative bg-gradient-to-br ${t.gradient} overflow-hidden`}>
        {/* 光沢オーバーレイ */}
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.14)_0%,transparent_50%)] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-black/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 w-56 h-56 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-xl mx-auto px-5 pt-10 pb-14 text-center">
          <Link href="/personality/types" className="inline-flex items-center gap-1 text-white/50 text-[11px] hover:text-white/80 transition-colors mb-8">
            ← 16タイプ一覧
          </Link>

          <div className="inline-block text-[10px] font-black text-white/40 tracking-[0.4em] mb-4 border border-white/15 rounded-full px-3 py-1">
            TYPE · {code}
          </div>

          {/* キャラクターイラスト */}
          <div className="relative mx-auto w-52 h-64 mb-2">
            <Image
              src={`/characters/${code.toUpperCase()}.png`}
              alt={t.name}
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>

          <h1 className="text-4xl font-black text-white mb-3 tracking-tight">{t.name}</h1>
          <p className="text-white/70 text-base max-w-xs mx-auto leading-relaxed mb-8">{t.tagline}</p>

          {/* キーワードタグ */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {t.traits.map(trait => (
              <span
                key={trait}
                className="px-3 py-1 rounded-full text-[11px] font-bold text-white/80 border border-white/20 bg-white/10 backdrop-blur-sm"
              >
                {trait}
              </span>
            ))}
          </div>

          <Link
            href="/personality"
            className="inline-block px-8 py-3 rounded-full text-sm font-bold bg-white/15 hover:bg-white/25 text-white border border-white/25 transition-all backdrop-blur-sm"
          >
            自分のタイプを診断する →
          </Link>
        </div>
      </div>

      {/* ══ コンテンツ ══════════════════════════════════════════════ */}
      <div className="max-w-xl mx-auto px-4 pb-20 space-y-4 -mt-3">

        {/* このタイプについて */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase mb-4">このタイプについて</h2>
          <p className="text-slate-700 text-[15px] leading-relaxed mb-5">{t.personality}</p>

          <div className="rounded-2xl p-4" style={{ background: `${t.accentColor}12` }}>
            <p className="text-[10px] font-black tracking-[0.25em] mb-1.5" style={{ color: t.accentColor }}>運転スタイル</p>
            <p className="text-slate-600 text-sm leading-relaxed">{t.drivingStyle}</p>
          </div>
        </div>

        {/* こんな車が似合う */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase mb-5">こんな車が似合う</h2>

          <div className="space-y-8">
            {t.cars.map((car, i) => (
              <div key={i}>
                {/* 車イラスト */}
                <div
                  className="rounded-2xl px-6 pt-6 pb-3 mb-4 relative overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${t.accentColor}18, ${t.accentColor}06)` }}
                >
                  <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 75% 50%, ${t.accentColor}30, transparent 65%)` }} />
                  <div className="absolute top-3 left-4 text-[10px] font-black tracking-widest" style={{ color: `${t.accentColor}80` }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <CarIllustration
                    body={car.body}
                    primaryColor={car.illustColor}
                    passengers={car.passengers}
                    className="relative z-10 max-w-[240px] mx-auto"
                  />
                </div>

                {/* 車情報 */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="text-lg font-black text-slate-800 leading-tight">{car.name}</h3>
                    <p className="text-[11px] text-slate-400 font-medium">{car.maker}</p>
                  </div>
                  <a
                    href={car.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 px-4 py-2 rounded-xl text-[11px] font-bold text-white transition-all hover:opacity-85 whitespace-nowrap"
                    style={{ backgroundColor: t.accentColor }}
                  >
                    在庫を見る →
                  </a>
                </div>
                <p className="text-[13px] text-slate-500 leading-relaxed">{car.reason}</p>

                {i < t.cars.length - 1 && <div className="border-t border-slate-100 mt-8" />}
              </div>
            ))}
          </div>
        </div>

        {/* 相性のいいタイプ */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase mb-4">相性のいいタイプ</h2>
          <div className="grid grid-cols-2 gap-3">
            {t.compatibleWith.map(compat => {
              const ct = PERSONALITY_TYPES[compat];
              if (!ct) return null;
              return (
                <Link
                  key={compat}
                  href={`/personality/type/${compat}`}
                  className={`bg-gradient-to-br ${ct.gradient} rounded-2xl p-4 text-center hover:scale-[1.03] transition-transform`}
                >
                  <div className="text-3xl mb-2">{ct.emoji}</div>
                  <p className="text-[10px] font-black text-white/60 tracking-widest mb-0.5">{compat}</p>
                  <p className="text-sm font-bold text-white">{ct.name}</p>
                  <p className="text-[10px] text-white/60 mt-1 leading-tight">{ct.tagline}</p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 全16タイプ一覧（コンパクト） */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase mb-4">すべてのタイプ</h2>
          <div className="grid grid-cols-4 gap-2">
            {allTypes.map(at => (
              <Link
                key={at.code}
                href={`/personality/type/${at.code}`}
                className={`bg-gradient-to-br ${at.gradient} rounded-xl p-2.5 text-center hover:scale-[1.05] transition-transform ${at.code === code ? 'ring-2 ring-white shadow-lg scale-[1.05]' : 'opacity-70 hover:opacity-100'}`}
              >
                <div className="text-lg mb-0.5">{at.emoji}</div>
                <p className="text-[8px] font-black text-white/70">{at.code}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className={`bg-gradient-to-br ${t.gradient} rounded-3xl p-6 text-center relative overflow-hidden`}>
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12)_0%,transparent_55%)] pointer-events-none" />
          <div className="relative">
            <p className="text-white/60 text-[11px] mb-2">あなたはどのタイプ？</p>
            <p className="text-white font-bold text-lg mb-4">8問で診断できる</p>
            <Link
              href="/personality"
              className="inline-block px-8 py-3.5 rounded-2xl font-bold text-sm bg-white transition-all hover:scale-105 hover:shadow-xl"
              style={{ color: t.accentColor }}
            >
              無料で診断する →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
