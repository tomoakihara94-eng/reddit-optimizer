'use client';

import { useState } from 'react';

// ── 質問定義 ──────────────────────────────────────────────────────────────────
const QUESTIONS = [
  {
    id: 'family',
    question: 'あなたの家族構成は？',
    subtitle: 'いつも一緒に乗る人のことを思い浮かべてください',
    options: [
      { value: 'solo',       label: '一人・または夫婦のみ',     emoji: '👤' },
      { value: 'young_kids', label: '小さな子どもがいる',       emoji: '👶' },
      { value: 'older_kids', label: '中高生以上の子どもがいる', emoji: '🧑' },
      { value: 'elderly',    label: '親・祖父母も同乗する',     emoji: '👴' },
    ],
  },
  {
    id: 'people',
    question: '最大何人で乗ることがありますか？',
    subtitle: '年に数回でもフルで乗る機会がある人数で答えてください',
    options: [
      { value: 'small',  label: '1〜2人',  emoji: '🙋' },
      { value: 'medium', label: '3〜4人',  emoji: '👨‍👩‍👧' },
      { value: 'large',  label: '5人以上', emoji: '👨‍👩‍👧‍👦' },
    ],
  },
  {
    id: 'weekend',
    question: '週末は主にどう使いますか？',
    subtitle: '一番多いシーンを選んでください',
    options: [
      { value: 'urban',   label: '買い物・外食・お出かけ',             emoji: '🛒' },
      { value: 'outdoor', label: 'キャンプ・釣り・スキーなどアウトドア', emoji: '🏕️' },
      { value: 'travel',  label: '遠出のドライブ・旅行',               emoji: '🗾' },
      { value: 'local',   label: '近場でのんびり',                     emoji: '🏠' },
    ],
  },
  {
    id: 'parking',
    question: '駐車場の広さは？',
    subtitle: '自宅や普段使う駐車場のことで考えてください',
    options: [
      { value: 'tight',  label: '狭め（軽〜コンパクト向け）', emoji: '🅿️' },
      { value: 'normal', label: '普通（普通車が入る）',         emoji: '🚗' },
      { value: 'wide',   label: '広い（大型車でも余裕）',       emoji: '🏟️' },
    ],
  },
  {
    id: 'budget',
    question: '月々の予算感は？',
    subtitle: 'ローン返済・ガソリン・保険などを合わせておおよそで',
    options: [
      { value: 'low',  label: 'できるだけ安く（〜3万円）',     emoji: '💴' },
      { value: 'mid',  label: '3〜6万円くらい',                 emoji: '💰' },
      { value: 'high', label: '6万円以上・いい車に乗りたい',   emoji: '💎' },
    ],
  },
  {
    id: 'priority',
    question: '一番大事なことは何ですか？',
    subtitle: '一つだけ選ぶとしたら',
    options: [
      { value: 'eco',     label: '燃費・維持費の安さ',       emoji: '🌿' },
      { value: 'safety',  label: '安全性・信頼性',             emoji: '🛡️' },
      { value: 'design',  label: 'デザイン・スタイル',         emoji: '✨' },
      { value: 'utility', label: '広さ・積載量・使い勝手',   emoji: '📦' },
    ],
  },
] as const;

// ── 車タイプ定義 ──────────────────────────────────────────────────────────────
const CAR_TYPES = {
  'family-minivan': {
    name: 'ファミリーミニバン型',
    emoji: '🚐',
    tagline: '家族の笑顔を乗せて走る、みんなのヒーロー',
    description: 'スライドドアの便利さ、広い車内、チャイルドシートの設置しやすさ——家族全員が快適に乗れることを最優先できるミニバンが最もマッチします。',
    models: ['ヴォクシー / ノア', 'セレナ', 'ステップワゴン', 'フリード'],
    gradient: 'from-blue-500 to-blue-700',
    badge: 'bg-blue-100 text-blue-700',
  },
  'premium-minivan': {
    name: 'プレミアムミニバン型',
    emoji: '👑',
    tagline: '広さも高級感も、どちらも諦めない',
    description: '大人数でも窮屈を感じない上質な空間を求めるあなたに。ラグジュアリーな乗り心地と実用性を両立した、プレミアムミニバンが理想的です。',
    models: ['アルファード / ヴェルファイア', 'エルグランド', 'オデッセイ'],
    gradient: 'from-purple-500 to-purple-700',
    badge: 'bg-purple-100 text-purple-700',
  },
  'suv': {
    name: 'アウトドアSUV型',
    emoji: '🏔️',
    tagline: '休日は山でも海でも、どこへでも全力で',
    description: 'キャンプ道具も釣り竿も余裕で積んで、悪路もへっちゃら。アクティブな休日を最大限楽しめるSUVがベストパートナーになります。',
    models: ['RAV4', 'フォレスター', 'ヤリスクロス', 'CX-5'],
    gradient: 'from-green-500 to-green-700',
    badge: 'bg-green-100 text-green-700',
  },
  'premium-suv': {
    name: 'プレミアムSUV型',
    emoji: '🌟',
    tagline: 'スタイルも走りも、妥協しないあなたへ',
    description: 'デザインへのこだわりと実用性を両立。街中でも映えて、週末は本格的なドライブも楽しめる上質なSUVがライフスタイルに合っています。',
    models: ['ハリアー', 'NX', 'CX-60', 'RAV4 PHV'],
    gradient: 'from-amber-500 to-orange-600',
    badge: 'bg-amber-100 text-amber-700',
  },
  'eco-hybrid': {
    name: 'エコハイブリッド型',
    emoji: '🌿',
    tagline: '地球にも財布にも優しく、スマートに移動',
    description: '毎日の通勤や買い物で燃費の差が積み重なります。賢くお得に乗りたいあなたには、低燃費のハイブリッド車が強い味方になります。',
    models: ['プリウス', 'アクア', 'フィットe:HEV', 'ノートe-POWER'],
    gradient: 'from-teal-500 to-teal-700',
    badge: 'bg-teal-100 text-teal-700',
  },
  'compact': {
    name: 'スマートコンパクト型',
    emoji: '🏙️',
    tagline: '街乗り最強！取り回しの良さが武器',
    description: '狭い路地も駐車場も怖くない。小回りが効いて燃費も良く、日常使いに最適なコンパクトカーがあなたのライフスタイルにぴったりです。',
    models: ['ヤリス', 'フィット', 'スイフト', 'マーチ'],
    gradient: 'from-orange-400 to-orange-600',
    badge: 'bg-orange-100 text-orange-700',
  },
  'light': {
    name: '軽ライフ型',
    emoji: '⚡',
    tagline: 'コスパ最強！かしこく使って賢く節約',
    description: '維持費を抑えながら日常の移動をしっかりこなします。税金も安くて駐車も楽。軽自動車の賢い活用があなたのライフスタイルにマッチしています。',
    models: ['N-BOX', 'タント', 'スペーシア', 'ルーミー'],
    gradient: 'from-pink-400 to-rose-600',
    badge: 'bg-pink-100 text-pink-700',
  },
} as const;

type CarTypeKey = keyof typeof CAR_TYPES;

// ── 診断ロジック ──────────────────────────────────────────────────────────────
function calcCarType(answers: string[]): CarTypeKey {
  const [family, people, weekend, parking, budget, priority] = answers;

  if (people === 'large') {
    return budget === 'high' ? 'premium-minivan' : 'family-minivan';
  }
  if ((family === 'young_kids' || family === 'elderly') && people === 'medium') {
    return 'family-minivan';
  }
  if (weekend === 'outdoor') {
    return budget === 'high' || priority === 'design' ? 'premium-suv' : 'suv';
  }
  if (budget === 'high' && priority === 'design') return 'premium-suv';
  if (budget === 'low' || parking === 'tight') return 'light';
  if (priority === 'eco' || weekend === 'travel') return 'eco-hybrid';
  return 'compact';
}

// ── コンポーネント ────────────────────────────────────────────────────────────
type Step = 'intro' | number | 'result';

export default function DiagnosisPage() {
  const [step, setStep]       = useState<Step>('intro');
  const [answers, setAnswers] = useState<string[]>([]);

  const qIndex   = typeof step === 'number' ? step : -1;
  const currentQ = qIndex >= 0 ? QUESTIONS[qIndex] : null;
  const typeKey  = step === 'result' ? calcCarType(answers) : null;
  const carType  = typeKey ? CAR_TYPES[typeKey] : null;

  function select(value: string) {
    const next = [...answers, value];
    setAnswers(next);
    const nextIdx = (step as number) + 1;
    setStep(nextIdx >= QUESTIONS.length ? 'result' : nextIdx);
  }

  function back() {
    if (typeof step !== 'number') return;
    setAnswers(answers.slice(0, -1));
    setStep(step - 1);
  }

  function restart() {
    setStep('intro');
    setAnswers([]);
  }

  const pageUrl  = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = carType
    ? `私の中古車タイプは「${carType.emoji} ${carType.name}」でした！\n${carType.tagline}\nあなたはどのタイプ？ #中古車診断 #カーライフ診断`
    : '';

  // ── イントロ ──────────────────────────────────────────────────────────────
  if (step === 'intro') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-sm w-full text-center">
          <div className="text-6xl mb-4">🚗</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-snug">
            あなたにぴったりの<br />中古車タイプ診断
          </h1>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            6つの質問に答えるだけで、<br />
            ライフスタイルにあった車のタイプがわかります
          </p>
          <div className="grid grid-cols-4 gap-2 mb-8">
            {(['🚐', '🏔️', '🌿', '⚡'] as const).map((e, i) => (
              <div key={i} className="bg-white rounded-2xl p-3 shadow-sm text-2xl text-center">{e}</div>
            ))}
          </div>
          <button
            onClick={() => setStep(0)}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-2xl text-lg transition-colors shadow-md"
          >
            診断スタート →
          </button>
          <p className="text-xs text-gray-400 mt-3">所要時間：約1分 / 全6問</p>
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
              <span>Q{step + 1} / {QUESTIONS.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm p-6 mb-4">
            <h2 className="text-lg font-bold text-gray-900 mb-1">{currentQ.question}</h2>
            <p className="text-xs text-gray-400 mb-5">{currentQ.subtitle}</p>
            <div className="space-y-2.5">
              {currentQ.options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => select(opt.value)}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-gray-100 hover:border-blue-400 hover:bg-blue-50 active:bg-blue-100 text-left transition-all group"
                >
                  <span className="text-2xl shrink-0">{opt.emoji}</span>
                  <span className="text-sm font-medium text-gray-800 group-hover:text-blue-700">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {step > 0 && (
            <button
              onClick={back}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← 前の質問に戻る
            </button>
          )}
        </div>
      </main>
    );
  }

  // ── 結果 ──────────────────────────────────────────────────────────────────
  if (step === 'result' && carType) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-sm w-full">
          <div className={`bg-gradient-to-br ${carType.gradient} rounded-3xl p-6 text-white mb-4 shadow-lg`}>
            <p className="text-sm opacity-75 mb-2">あなたは…</p>
            <div className="text-5xl mb-3">{carType.emoji}</div>
            <h2 className="text-2xl font-bold mb-1.5">{carType.name}</h2>
            <p className="text-sm opacity-90 leading-relaxed">{carType.tagline}</p>
          </div>

          <div className="bg-white rounded-3xl shadow-sm p-6 mb-4">
            <h3 className="font-bold text-gray-800 mb-2">このタイプの特徴</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-5">{carType.description}</p>
            <h3 className="font-bold text-gray-800 mb-2">おすすめ車種</h3>
            <div className="flex flex-wrap gap-2">
              {carType.models.map(m => (
                <span key={m} className={`px-3 py-1 rounded-full text-xs font-medium ${carType.badge}`}>{m}</span>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm p-5 mb-4">
            <p className="text-xs text-gray-500 text-center mb-3">結果をシェアする</p>
            <div className="flex gap-3">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-black hover:bg-gray-800 active:bg-gray-900 text-white text-sm font-bold rounded-2xl transition-colors"
              >
                <span className="text-base font-serif">𝕏</span>
                <span>でシェア</span>
              </a>
              <a
                href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-[#06C755] hover:bg-[#05b34c] active:bg-[#049c42] text-white text-sm font-bold rounded-2xl transition-colors"
              >
                <span>LINE</span>
                <span>でシェア</span>
              </a>
            </div>
          </div>

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
