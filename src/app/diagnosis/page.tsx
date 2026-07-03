'use client';

import { useState } from 'react';
import Link from 'next/link';
import { QUESTIONS, CAR_TYPES_16, calcType16 } from '@/lib/car-types-16';

type Step = 'intro' | number | 'result';

export default function DiagnosisPage() {
  const [step, setStep]       = useState<Step>('intro');
  const [answers, setAnswers] = useState<number[]>([]);

  const qIndex   = typeof step === 'number' ? step : -1;
  const currentQ = qIndex >= 0 ? QUESTIONS[qIndex] : null;
  const typeCode = step === 'result' ? calcType16(answers) : null;
  const carType  = typeCode ? CAR_TYPES_16[typeCode] : null;

  function select(val: 0 | 1) {
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

  function restart() {
    setStep('intro');
    setAnswers([]);
  }

  const pageUrl   = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = carType
    ? `私の中古車タイプは「${carType.emoji} ${carType.name}」でした！\n${carType.tagline}\nあなたはどのタイプ？ #中古車タイプ診断 #カーライフ診断`
    : '';

  const axisLabel: Record<string, string> = {
    fs: 'ライフスタイル', uo: '使い方', ep: 'こだわり', cw: '車格',
  };

  // ── イントロ ──────────────────────────────────────────────────────────────
  if (step === 'intro') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-sm w-full text-center">
          <div className="text-6xl mb-4">🚗</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-snug">
            あなたの中古車タイプ診断<br />
            <span className="text-blue-600">16タイプ</span>
          </h1>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            12の質問に答えるだけで、<br />
            ライフスタイルにぴったりの車タイプがわかります
          </p>
          <div className="grid grid-cols-4 gap-1.5 mb-8">
            {['🚗','🚐','✨','👑','🌲','🏕️','🦁','🏔️','🌿','🚀','⚡','🌟','🗻','🌲','🦅','💎'].map((e, i) => (
              <div key={i} className="bg-white rounded-xl p-2.5 shadow-sm text-xl text-center">{e}</div>
            ))}
          </div>
          <button
            onClick={() => setStep(0)}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-2xl text-lg transition-colors shadow-md mb-3"
          >
            診断スタート →
          </button>
          <Link href="/diagnosis/types" className="block text-sm text-blue-500 hover:text-blue-700 transition-colors">
            16タイプ一覧を見る
          </Link>
          <p className="text-xs text-gray-400 mt-2">所要時間：約2分 / 全12問</p>
        </div>
      </main>
    );
  }

  // ── 質問 ──────────────────────────────────────────────────────────────────
  if (typeof step === 'number' && currentQ) {
    const progress = (step / QUESTIONS.length) * 100;
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-sm w-full">
          <div className="mb-5">
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span className="font-medium text-blue-500">{axisLabel[currentQ.axis]}</span>
              <span>{step + 1} / {QUESTIONS.length}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm p-6 mb-4">
            <h2 className="text-lg font-bold text-gray-900 mb-5">{currentQ.question}</h2>
            <div className="space-y-3">
              {currentQ.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => select(i as 0 | 1)}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-gray-100 hover:border-blue-400 hover:bg-blue-50 active:bg-blue-100 text-left transition-all group"
                >
                  <span className="text-2xl shrink-0">{opt.emoji}</span>
                  <span className="text-sm font-medium text-gray-800 group-hover:text-blue-700">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {step > 0 && (
            <button onClick={back} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              ← 前の質問に戻る
            </button>
          )}
        </div>
      </main>
    );
  }

  // ── 結果 ──────────────────────────────────────────────────────────────────
  if (step === 'result' && carType && typeCode) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-sm w-full">
          {/* タイプコード */}
          <div className="text-center mb-3">
            <span className="inline-block px-3 py-1 bg-white rounded-full text-xs font-bold text-gray-500 shadow-sm tracking-widest">
              TYPE: {typeCode}
            </span>
          </div>

          {/* 結果カード */}
          <div className={`bg-gradient-to-br ${carType.gradient} rounded-3xl p-6 text-white mb-4 shadow-lg`}>
            <p className="text-sm opacity-75 mb-2">あなたは…</p>
            <div className="text-5xl mb-3">{carType.emoji}</div>
            <h2 className="text-xl font-bold mb-1.5 leading-snug">{carType.name}</h2>
            <p className="text-sm opacity-90 leading-relaxed">{carType.tagline}</p>
          </div>

          {/* 説明 */}
          <div className="bg-white rounded-3xl shadow-sm p-6 mb-4">
            <h3 className="font-bold text-gray-800 mb-2">このタイプの特徴</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{carType.description}</p>
          </div>

          {/* 在庫リンク */}
          <div className="bg-white rounded-3xl shadow-sm p-6 mb-4">
            <h3 className="font-bold text-gray-800 mb-0.5">おすすめ在庫を見る</h3>
            <p className="text-xs text-gray-400 mb-3">あなたのタイプにぴったりの車はこちら</p>
            <div className="space-y-2">
              {carType.models.map((rec, i) => (
                <a
                  key={i}
                  href={rec.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-gray-100 hover:border-blue-300 hover:bg-blue-50 active:bg-blue-100 transition-all group"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-700">{rec.name}</p>
                    <p className="text-xs text-gray-400">{rec.maker}</p>
                  </div>
                  <span className="text-blue-400 text-lg">›</span>
                </a>
              ))}
            </div>
          </div>

          {/* シェア */}
          <div className="bg-white rounded-3xl shadow-sm p-5 mb-4">
            <p className="text-xs text-gray-500 text-center mb-3">結果をシェアする</p>
            <div className="flex gap-3">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-black hover:bg-gray-800 text-white text-sm font-bold rounded-2xl transition-colors"
              >
                <span className="font-serif">𝕏</span><span>でシェア</span>
              </a>
              <a
                href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(shareText)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-[#06C755] hover:bg-[#05b34c] text-white text-sm font-bold rounded-2xl transition-colors"
              >
                <span>LINE</span><span>でシェア</span>
              </a>
            </div>
          </div>

          {/* 全タイプを見る */}
          <Link
            href="/diagnosis/types"
            className="block w-full py-3 mb-3 bg-white border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-600 font-bold rounded-2xl text-sm text-center transition-colors"
          >
            16タイプ一覧を見る
          </Link>

          <button
            onClick={restart}
            className="w-full py-3 border-2 border-gray-200 hover:border-gray-300 text-gray-600 font-medium rounded-2xl text-sm transition-colors"
          >
            もう一度診断する
          </button>
        </div>
      </main>
    );
  }

  return null;
}
