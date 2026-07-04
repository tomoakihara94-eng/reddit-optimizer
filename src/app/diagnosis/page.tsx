'use client';

import { useState } from 'react';
import Link from 'next/link';
import { QUESTIONS, CAR_TYPES_16, calcType16 } from '@/lib/car-types-16';

type Step = 'intro' | number | 'result';

const axisLabel: Record<string, string> = {
  fs: 'ライフスタイル', uo: '使い方', ep: 'こだわり', cw: '車格',
};

// 背景オーロラ + グリッド
function BgLayer({ typeCode }: { typeCode?: string }) {
  const t = typeCode ? CAR_TYPES_16[typeCode] : null;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {t ? (
        <div className={`absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-[140px] opacity-25 bg-gradient-to-br ${t.gradient}`} />
      ) : (
        <>
          <div className="absolute top-[-5%] left-[-10%]  w-[550px] h-[550px] bg-blue-300/[0.30]   rounded-full blur-[120px] animate-aurora-1" />
          <div className="absolute bottom-[-5%] right-[-10%] w-[480px] h-[480px] bg-violet-300/[0.22] rounded-full blur-[120px] animate-aurora-2" />
          <div className="absolute top-[55%] left-[38%]  w-[340px] h-[340px] bg-fuchsia-300/[0.15] rounded-full blur-[110px] animate-aurora-3" />
        </>
      )}
      <div className="absolute inset-0 bg-grid-light" />
    </div>
  );
}

export default function DiagnosisPage() {
  const [step, setStep]       = useState<Step>('intro');
  const [answers, setAnswers] = useState<number[]>([]);

  const qIndex   = typeof step === 'number' ? step : -1;
  const currentQ = qIndex >= 0 ? QUESTIONS[qIndex] : null;
  const typeCode = step === 'result' ? calcType16(answers) : null;
  const carType  = typeCode ? CAR_TYPES_16[typeCode] : null;

  function select(val: number) {
    const next = [...answers, val];
    setAnswers(next);
    const nextIdx = (step as number) + 1;
    setStep(nextIdx >= QUESTIONS.length ? 'result' : nextIdx);
  }
  function back() {
    if (typeof step !== 'number' || step === 0) return;
    setAnswers(answers.slice(0, -1));
    setStep((step as number) - 1);
  }
  function restart() { setStep('intro'); setAnswers([]); }

  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

  // ═══════════════════════════════════════════
  //  イントロ
  // ═══════════════════════════════════════════
  if (step === 'intro') {
    return (
      <main className="relative min-h-screen bg-[#f4f7ff] overflow-hidden flex flex-col items-center justify-center p-5">
        <BgLayer />
        <div className="relative z-10 max-w-sm w-full text-center">

          {/* バッジ */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-light text-slate-500 text-[11px] tracking-wider mb-7 animate-fade-up">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse inline-block" />
            カーライフ診断 · 16タイプ
          </div>

          {/* タイトル */}
          <h1 className="text-[2.6rem] font-black text-slate-900 leading-[1.15] mb-3 animate-fade-up" style={{animationDelay:'0.08s'}}>
            あなたの<br />
            <span className="text-gradient">中古車タイプ</span><br />
            を診断する
          </h1>

          <p className="text-slate-400 text-sm mb-9 animate-fade-up" style={{animationDelay:'0.16s'}}>
            12問 · 約2分 · 16タイプから最適な車を提案
          </p>

          {/* タイプグリッドプレビュー */}
          <div className="grid grid-cols-4 gap-1.5 mb-9 animate-fade-up" style={{animationDelay:'0.24s'}}>
            {Object.values(CAR_TYPES_16).map((t) => (
              <div
                key={t.code}
                className={`bg-gradient-to-br ${t.gradient} rounded-xl p-2.5 text-xl text-center shadow-md`}
              >
                {t.emoji}
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={() => setStep(0)}
            className="w-full py-4 rounded-2xl font-bold text-white text-lg btn-primary-glow mb-4 animate-fade-up"
            style={{animationDelay:'0.32s'}}
          >
            診断スタート →
          </button>

          <div className="animate-fade-up" style={{animationDelay:'0.40s'}}>
            <Link href="/diagnosis/types" className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors">
              16タイプ一覧を見る
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ═══════════════════════════════════════════
  //  質問
  // ═══════════════════════════════════════════
  if (typeof step === 'number' && currentQ) {
    const progress = ((step + 1) / QUESTIONS.length) * 100;
    return (
      <main className="relative min-h-screen bg-[#f4f7ff] overflow-hidden flex flex-col items-center justify-center p-5">
        <BgLayer />
        <div className="relative z-10 max-w-sm w-full">

          {/* プログレス */}
          <div className="mb-7">
            <div className="flex justify-between text-[11px] mb-2">
              <span className="text-indigo-600 font-semibold tracking-wide">{axisLabel[currentQ.axis]}</span>
              <span className="text-slate-400">{step + 1} / {QUESTIONS.length}</span>
            </div>
            <div className="h-[3px] bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 transition-all duration-700 ease-out"
                style={{width: `${progress}%`}}
              />
            </div>
          </div>

          {/* 質問カード */}
          <div className="glass-light rounded-3xl p-6 mb-4 animate-scale-in">
            <div className="text-center mb-6">
              <span className="text-[10px] text-slate-400 tracking-[0.3em] font-medium">Q {step + 1}</span>
              <h2 className="text-[1.25rem] font-bold text-slate-900 mt-2.5 leading-snug">{currentQ.question}</h2>
            </div>

            <div className="space-y-2">
              {currentQ.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => select(i)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 active:scale-[0.97] text-left transition-all duration-200 group bg-white/60"
                >
                  <span className="text-xl shrink-0">{opt.emoji}</span>
                  <span className="text-sm text-slate-600 group-hover:text-indigo-700 transition-colors leading-snug">
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {step > 0 && (
            <button onClick={back} className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors">
              ← 前の質問に戻る
            </button>
          )}
        </div>
      </main>
    );
  }

  // ═══════════════════════════════════════════
  //  結果
  // ═══════════════════════════════════════════
  if (step === 'result' && carType && typeCode) {
    const shareText = `私の中古車タイプは「${carType.emoji} ${carType.name}」でした！\n${carType.tagline}\nあなたはどのタイプ？ #中古車タイプ診断 #カーライフ診断`;

    return (
      <main className="relative min-h-screen bg-[#f4f7ff] overflow-hidden flex flex-col items-center justify-center p-5">
        <BgLayer typeCode={typeCode} />
        <div className="relative z-10 max-w-sm w-full">

          {/* タイプコードバッジ */}
          <div className="text-center mb-4 animate-fade-up">
            <span className="inline-block px-4 py-1.5 glass-light rounded-full text-[10px] font-bold text-slate-500 tracking-[0.3em]">
              TYPE · {typeCode}
            </span>
          </div>

          {/* メイン結果カード */}
          <div className={`relative bg-gradient-to-br ${carType.gradient} rounded-3xl p-6 text-white mb-4 shadow-xl overflow-hidden animate-scale-in`}>
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18)_0%,transparent_55%)] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-black/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative">
              <p className="text-[11px] text-white/65 mb-2 tracking-widest uppercase">あなたは…</p>
              <div className="text-5xl mb-3 animate-float inline-block">{carType.emoji}</div>
              <h2 className="text-2xl font-black mb-2 leading-snug">{carType.name}</h2>
              <p className="text-sm text-white/85 leading-relaxed">{carType.tagline}</p>
            </div>
          </div>

          {/* 説明 */}
          <div className="glass-light rounded-3xl p-5 mb-3 animate-fade-up" style={{animationDelay:'0.08s'}}>
            <h3 className="text-sm font-bold text-slate-700 mb-2">このタイプの特徴</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{carType.description}</p>
          </div>

          {/* 在庫リンク */}
          <div className="glass-light rounded-3xl p-5 mb-3 animate-fade-up" style={{animationDelay:'0.14s'}}>
            <h3 className="text-sm font-bold text-slate-700 mb-0.5">おすすめ在庫を見る</h3>
            <p className="text-[10px] text-slate-400 mb-3">あなたのタイプにぴったりの車</p>
            <div className="space-y-2">
              {carType.models.map((rec, i) => (
                <a
                  key={i}
                  href={rec.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/60 transition-all group bg-white/50"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">{rec.name}</p>
                    <p className="text-[10px] text-slate-400">{rec.maker}</p>
                  </div>
                  <span className="text-slate-300 group-hover:text-indigo-400 transition-colors text-lg">›</span>
                </a>
              ))}
            </div>
          </div>

          {/* シェア */}
          <div className="glass-light rounded-3xl p-4 mb-3 animate-fade-up" style={{animationDelay:'0.20s'}}>
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
          <div className="space-y-2 animate-fade-up" style={{animationDelay:'0.26s'}}>
            <Link
              href="/diagnosis/types"
              className="block w-full py-3 glass-light border border-slate-200 hover:border-indigo-300 text-slate-600 hover:text-indigo-700 font-medium rounded-2xl text-sm text-center transition-all"
            >
              16タイプ一覧を見る
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
