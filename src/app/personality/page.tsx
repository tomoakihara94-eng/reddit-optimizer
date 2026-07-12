'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CarIllustration } from '@/components/CarIllustration';
import { P_QUESTIONS, PERSONALITY_TYPES, calcPersonality } from '@/lib/driving-personality';

type Step = 'intro' | number | 'result';

export default function PersonalityPage() {
  const [step, setStep]       = useState<Step>('intro');
  const [answers, setAnswers] = useState<number[]>([]);

  const qIdx    = typeof step === 'number' ? step : -1;
  const currentQ = qIdx >= 0 ? P_QUESTIONS[qIdx] : null;
  const typeCode = step === 'result' ? calcPersonality(answers) : null;
  const pType   = typeCode ? PERSONALITY_TYPES[typeCode] : null;

  function choose(val: number) {
    const next = [...answers, val];
    setAnswers(next);
    const nextIdx = (step as number) + 1;
    setStep(nextIdx >= P_QUESTIONS.length ? 'result' : nextIdx);
  }
  function back() {
    if (typeof step !== 'number' || step === 0) return;
    setAnswers(answers.slice(0, -1));
    setStep((step as number) - 1);
  }
  function restart() { setStep('intro'); setAnswers([]); }

  const progress = typeof step === 'number'
    ? Math.round(((step + 1) / P_QUESTIONS.length) * 100)
    : 0;

  // ═══════════════════ イントロ ═══════════════════
  if (step === 'intro') {
    return (
      <main className="relative min-h-screen bg-[#0a0a0f] overflow-hidden flex flex-col items-center justify-center p-5">
        {/* 背景 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-15%] w-[600px] h-[600px] bg-violet-600/[0.12] rounded-full blur-[150px]" />
          <div className="absolute bottom-[-5%] right-[-10%] w-[500px] h-[500px] bg-blue-600/[0.10] rounded-full blur-[140px]" />
          <div className="absolute top-[45%] left-[35%] w-[300px] h-[300px] bg-pink-500/[0.08] rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-sm w-full text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/50 text-[11px] tracking-wider mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse inline-block" />
            運転タイプ診断 · 16タイプ
          </div>

          <h1 className="text-[2.8rem] font-black text-white leading-[1.1] mb-4">
            あなたに<br />
            <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              似合う車
            </span>
            は？
          </h1>

          <p className="text-white/40 text-sm mb-3 leading-relaxed">
            車種なんて知らなくて大丈夫。<br />
            あなたの性格から、ぴったりの一台を見つけよう。
          </p>
          <p className="text-white/25 text-[11px] mb-10">8問 · 約1分 · 16タイプ</p>

          {/* タイププレビュー */}
          <div className="grid grid-cols-4 gap-1.5 mb-10">
            {Object.values(PERSONALITY_TYPES).map(t => (
              <div
                key={t.code}
                className={`bg-gradient-to-br ${t.gradient} rounded-xl p-2.5 text-lg text-center opacity-70 hover:opacity-100 transition-opacity`}
              >
                {t.emoji}
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep(0)}
            className="w-full py-4 rounded-2xl font-bold text-white text-lg mb-4"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #db2777, #2563eb)',
              backgroundSize: '200% 200%',
              boxShadow: '0 0 40px rgba(124,58,237,0.4), 0 4px 20px rgba(219,39,119,0.25)',
            }}
          >
            診断スタート →
          </button>

          <div className="flex justify-center gap-4 text-[11px]">
            <Link href="/personality/types" className="text-white/25 hover:text-white/50 transition-colors">
              16タイプ一覧 →
            </Link>
            <span className="text-white/15">|</span>
            <Link href="/diagnosis" className="text-white/25 hover:text-white/50 transition-colors">
              12問の詳細診断 →
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ═══════════════════ 質問 ═══════════════════
  if (typeof step === 'number' && currentQ) {
    // 7段階スケール設定
    // 0,1,2 = 左極(violet)  3 = 中立(slate)  4,5,6 = 右極(pink)
    const SCALE = [
      { size: 26, color: '#7c3aed' },
      { size: 22, color: '#8b5cf6' },
      { size: 18, color: '#a78bfa' },
      { size: 14, color: '#64748b' },
      { size: 18, color: '#f472b6' },
      { size: 22, color: '#db2777' },
      { size: 26, color: '#be123c' },
    ];

    return (
      <main className="relative min-h-screen bg-[#0a0a0f] overflow-hidden flex flex-col items-center justify-center p-5">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-600/[0.08] rounded-full blur-[130px]" />
          <div className="absolute bottom-0 right-[-10%] w-[400px] h-[400px] bg-pink-600/[0.07] rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-sm w-full">
          {/* プログレス */}
          <div className="mb-8">
            <div className="flex justify-between text-[11px] mb-2.5">
              <span className="text-violet-400 font-semibold tracking-wide">Q {step + 1}</span>
              <span className="text-white/30">{step + 1} / {P_QUESTIONS.length}</span>
            </div>
            <div className="h-[2px] bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #7c3aed, #db2777)' }}
              />
            </div>
          </div>

          {/* 質問カード */}
          <div className="border border-white/8 bg-white/[0.03] rounded-3xl p-6 mb-4 backdrop-blur-sm">
            {/* 質問文 */}
            <h2 className="text-[1.1rem] font-bold text-white leading-snug text-center mb-8">
              {currentQ.question}
            </h2>

            {/* 両端ラベル */}
            <div className="flex justify-between items-start mb-4 px-1">
              <div className="flex flex-col items-center gap-1 w-[72px]">
                <span className="text-xl">{currentQ.options[0].emoji}</span>
                <span className="text-[10px] text-white/50 text-center leading-tight font-medium">
                  {currentQ.options[0].shortLabel}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 w-[72px]">
                <span className="text-xl">{currentQ.options[1].emoji}</span>
                <span className="text-[10px] text-white/50 text-center leading-tight font-medium">
                  {currentQ.options[1].shortLabel}
                </span>
              </div>
            </div>

            {/* 7段階スケール */}
            <div className="flex items-center justify-between px-2 mb-5">
              {SCALE.map((s, val) => (
                <button
                  key={val}
                  onClick={() => choose(val)}
                  className="rounded-full border-2 transition-all duration-150 hover:scale-125 active:scale-95 hover:opacity-100 opacity-70"
                  style={{
                    width:  s.size + 'px',
                    height: s.size + 'px',
                    borderColor: s.color,
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = s.color; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
                />
              ))}
            </div>

            {/* ラベルテキスト */}
            <div className="flex justify-between text-[10px] text-white/25 px-1">
              <span>{currentQ.options[0].label}</span>
              <span className="text-right">{currentQ.options[1].label}</span>
            </div>
          </div>

          {step > 0 && (
            <button onClick={back} className="text-[11px] text-white/25 hover:text-white/50 transition-colors">
              ← 前の質問に戻る
            </button>
          )}
        </div>
      </main>
    );
  }

  // ═══════════════════ 結果 ═══════════════════
  if (step === 'result' && pType && typeCode) {
    const shareText = `私の運転タイプは「${pType.emoji} ${pType.name}」でした！\n${pType.tagline}\nあなたはどのタイプ？ #運転タイプ診断 #どんな車が似合う`;
    const pageUrl   = typeof window !== 'undefined' ? window.location.href : '';

    return (
      <main className="min-h-screen bg-[#f8f9ff]">

        {/* ── ヘッダーグラデーション ── */}
        <div className={`relative bg-gradient-to-br ${pType.gradient} px-5 pt-14 pb-16 text-center overflow-hidden`}>
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12)_0%,transparent_55%)] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-black/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <span className="inline-block text-[10px] font-black text-white/50 tracking-[0.35em] mb-3">TYPE · {typeCode}</span>
            {/* キャラクターイラスト */}
            <div className="relative mx-auto w-44 h-52 mb-3">
              <Image
                src={`/characters/${typeCode}.png`}
                alt={pType.name}
                fill
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
            <h1 className="text-3xl font-black text-white mb-2">{pType.name}</h1>
            <p className="text-sm text-white/75 max-w-xs mx-auto">{pType.tagline}</p>
          </div>
        </div>

        <div className="max-w-sm mx-auto px-4 pb-20 -mt-4 space-y-4">

          {/* 性格説明 */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-3">このタイプの特徴</h2>
            <p className="text-sm text-slate-700 leading-relaxed mb-3">{pType.personality}</p>
            <div className="border-t border-slate-100 pt-3">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider">運転スタイル</span>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">{pType.drivingStyle}</p>
            </div>
          </div>

          {/* 車の紹介 */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4">こんな車が似合う</h2>
            <div className="space-y-5">
              {pType.cars.map((car, i) => (
                <div key={i} className="group">
                  {/* 車イラスト */}
                  <div
                    className="rounded-2xl p-4 pb-2 mb-3 overflow-hidden relative"
                    style={{ background: `linear-gradient(135deg, ${pType.accentColor}18, ${pType.accentColor}08)` }}
                  >
                    <div className="absolute inset-0 opacity-20"
                      style={{ background: `radial-gradient(circle at 70% 50%, ${pType.accentColor}40, transparent 70%)` }}
                    />
                    <CarIllustration
                      body={car.body}
                      primaryColor={car.illustColor}
                      passengers={car.passengers}
                      className="relative z-10 max-w-[220px] mx-auto"
                    />
                  </div>

                  {/* 車情報 */}
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <p className="font-bold text-slate-800 text-base leading-tight">{car.name}</p>
                      <p className="text-[11px] text-slate-400">{car.maker}</p>
                    </div>
                    <a
                      href={car.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 mt-0.5 px-3 py-1.5 rounded-xl text-[10px] font-bold text-white transition-all"
                      style={{ backgroundColor: pType.accentColor }}
                    >
                      在庫を見る →
                    </a>
                  </div>
                  <p className="text-[12px] text-slate-500 leading-relaxed">{car.reason}</p>

                  {i < pType.cars.length - 1 && (
                    <div className="border-t border-slate-100 mt-5" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 相性のいいタイプ */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-3">相性のいいタイプ</h2>
            <div className="grid grid-cols-2 gap-2">
              {pType.compatibleWith.map(code => {
                const t = PERSONALITY_TYPES[code];
                if (!t) return null;
                return (
                  <div
                    key={code}
                    className={`bg-gradient-to-br ${t.gradient} rounded-2xl p-3 text-center`}
                  >
                    <div className="text-2xl mb-1">{t.emoji}</div>
                    <p className="text-[10px] font-bold text-white/80 tracking-wide">{code}</p>
                    <p className="text-[11px] text-white font-bold mt-0.5">{t.name}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* シェア */}
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
            <p className="text-[10px] text-slate-400 text-center mb-3">結果をシェアする</p>
            <div className="flex gap-2">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-900 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all"
              >
                <span className="font-serif">𝕏</span><span>でシェア</span>
              </a>
              <a
                href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(shareText)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#06C755] hover:bg-[#05b34c] text-white text-xs font-bold rounded-xl transition-all"
              >
                LINE でシェア
              </a>
            </div>
          </div>

          {/* ナビゲーション */}
          <div className="space-y-2">
            <Link
              href={`/personality/type/${typeCode}`}
              className="block w-full py-3 bg-white border border-slate-200 hover:border-violet-300 text-slate-600 hover:text-violet-700 font-medium rounded-2xl text-sm text-center transition-all shadow-sm"
            >
              このタイプをもっと詳しく見る →
            </Link>
            <Link
              href="/personality/types"
              className="block w-full py-3 bg-white border border-slate-200 hover:border-violet-300 text-slate-600 hover:text-violet-700 font-medium rounded-2xl text-sm text-center transition-all shadow-sm"
            >
              16タイプ一覧を見る
            </Link>
            <Link
              href="/diagnosis"
              className="block w-full py-3 bg-white border border-slate-200 hover:border-violet-300 text-slate-600 hover:text-violet-700 font-medium rounded-2xl text-sm text-center transition-all shadow-sm"
            >
              もっと詳しい診断（12問）を試す →
            </Link>
            <button
              onClick={restart}
              className="w-full py-3 text-slate-400 hover:text-slate-600 text-sm transition-colors"
            >
              もう一度診断する
            </button>
          </div>
        </div>
      </main>
    );
  }

  return null;
}
