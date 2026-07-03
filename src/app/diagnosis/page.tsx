'use client';

import { useState } from 'react';

// ── 4軸 × 3問 = 12問 ────────────────────────────────────────────────────────
// 軸: F/S（家族 vs ソロ）, U/O（街乗り vs アウトドア）,
//     E/P（エコ vs プレミアム）, C/W（コンパクト vs ワイド）

type Axis = 'fs' | 'uo' | 'ep' | 'cw';

interface Question {
  axis: Axis;
  left: string;  // F, U, E, C 側
  right: string; // S, O, P, W 側
  question: string;
  subtitle?: string;
  options: [{ label: string; emoji: string }, { label: string; emoji: string }];
}

const QUESTIONS: Question[] = [
  // ── F vs S ──────────────────────────────────────────────────────────────
  {
    axis: 'fs', left: 'F', right: 'S',
    question: '家族・同乗者について教えてください',
    options: [
      { label: '子どもや家族と一緒に乗ることが多い', emoji: '👨‍👩‍👧‍👦' },
      { label: '一人か、パートナーと二人が多い',     emoji: '👤' },
    ],
  },
  {
    axis: 'fs', left: 'F', right: 'S',
    question: '車内空間に求めることは？',
    options: [
      { label: 'みんながゆったり乗れる広さ',   emoji: '🚌' },
      { label: '自分好みの快適な空間',           emoji: '🎵' },
    ],
  },
  {
    axis: 'fs', left: 'F', right: 'S',
    question: '乗る人数で選ぶとしたら？',
    options: [
      { label: '3人以上乗れることが必須',     emoji: '👪' },
      { label: '1〜2人乗れれば十分',           emoji: '🙋' },
    ],
  },
  // ── U vs O ──────────────────────────────────────────────────────────────
  {
    axis: 'uo', left: 'U', right: 'O',
    question: '週末はどこへ行くことが多い？',
    options: [
      { label: 'ショッピング・外食・街なか', emoji: '🛒' },
      { label: 'キャンプ・山・海・アウトドア', emoji: '🏕️' },
    ],
  },
  {
    axis: 'uo', left: 'U', right: 'O',
    question: 'よく走る道は？',
    options: [
      { label: '市街地・幹線道路がメイン', emoji: '🏙️' },
      { label: '山道・郊外・田舎道も走る', emoji: '🌲' },
    ],
  },
  {
    axis: 'uo', left: 'U', right: 'O',
    question: '荷物の積み方について',
    options: [
      { label: '普段の買い物袋が入ればOK',   emoji: '🛍️' },
      { label: 'テントや道具を積みたい',       emoji: '⛺' },
    ],
  },
  // ── E vs P ──────────────────────────────────────────────────────────────
  {
    axis: 'ep', left: 'E', right: 'P',
    question: '車にかける予算の考え方は？',
    options: [
      { label: 'コスパ重視・維持費も抑えたい', emoji: '💴' },
      { label: 'いい車ならお金をかけてもいい', emoji: '💎' },
    ],
  },
  {
    axis: 'ep', left: 'E', right: 'P',
    question: '車のデザインへのこだわりは？',
    options: [
      { label: '実用性があれば見た目は二の次', emoji: '🔧' },
      { label: 'デザインも重要、外見にこだわりたい', emoji: '✨' },
    ],
  },
  {
    axis: 'ep', left: 'E', right: 'P',
    question: '燃費・税金などランニングコストは？',
    options: [
      { label: 'できるだけ安く抑えたい',   emoji: '🌿' },
      { label: 'あまり気にしない',           emoji: '🌟' },
    ],
  },
  // ── C vs W ──────────────────────────────────────────────────────────────
  {
    axis: 'cw', left: 'C', right: 'W',
    question: '駐車場の広さは？',
    options: [
      { label: '狭め、小回りが効く車がいい', emoji: '🅿️' },
      { label: '広め、大型でも問題なし',     emoji: '🏟️' },
    ],
  },
  {
    axis: 'cw', left: 'C', right: 'W',
    question: '高速道路はよく使いますか？',
    options: [
      { label: 'ほとんど使わない・近場メイン', emoji: '🏘️' },
      { label: '長距離ドライブ・高速もよく使う', emoji: '🛣️' },
    ],
  },
  {
    axis: 'cw', left: 'C', right: 'W',
    question: '車内の広さについて',
    options: [
      { label: 'コンパクトで取り回しやすい方が好き', emoji: '🚗' },
      { label: 'ゆったりした広い車内がいい',         emoji: '🛋️' },
    ],
  },
];

// ── 16タイプ定義 ──────────────────────────────────────────────────────────────
// キー: [F/S][U/O][E/P][C/W]
const BASE = 'https://www.ecar.co.jp';
const mu = (maker: string, model: string) =>
  `${BASE}/maker_${maker}/model_${model}/type_0/price_0_1/car.html`;

interface CarType16 {
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  models: { name: string; maker: string; url: string }[];
  gradient: string;
  badge: string;
}

const CAR_TYPES_16: Record<string, CarType16> = {
  // ── Family × Urban ────────────────────────────────────────────────────
  FUEC: {
    name: '街の頼れるファミリーカー型', emoji: '🚗',
    tagline: 'コスパ最強、家族みんな笑顔で移動',
    description: '毎日の送り迎えや買い物に大活躍。小回りが効いて燃費もよく、家族全員が快適に乗れるコンパクトミニバンが最適です。',
    models: [
      { name: 'シエンタ',  maker: 'トヨタ', url: mu('toyota', 'sienta') },
      { name: 'フリード',  maker: 'ホンダ', url: mu('honda',  'freed')  },
      { name: 'ルーミー',  maker: 'トヨタ', url: mu('toyota', 'roomy')  },
    ],
    gradient: 'from-blue-400 to-blue-600', badge: 'bg-blue-100 text-blue-700',
  },
  FUEW: {
    name: '家族の大黒柱ミニバン型', emoji: '🚐',
    tagline: '乗り心地も広さも、家族第一',
    description: 'スライドドアの使いやすさと広い車内が魅力。チャイルドシートもしっかり設置できる、ファミリーの定番ミニバンが理想です。',
    models: [
      { name: 'ヴォクシー', maker: 'トヨタ', url: mu('toyota', 'voxy')   },
      { name: 'セレナ',     maker: '日産',   url: mu('nissan', 'serena') },
      { name: 'ステップワゴン', maker: 'ホンダ', url: mu('honda', 'stepwgn') },
    ],
    gradient: 'from-blue-500 to-blue-700', badge: 'bg-blue-100 text-blue-700',
  },
  FUPC: {
    name: 'おしゃれファミリー型', emoji: '✨',
    tagline: 'デザインも諦めない、かっこいいパパ・ママ',
    description: '家族との移動もスタイリッシュに。実用性とデザイン性を両立した、街で映えるコンパクトファミリーカーが似合います。',
    models: [
      { name: 'シエンタ',    maker: 'トヨタ', url: mu('toyota', 'sienta') },
      { name: 'ヤリスクロス', maker: 'トヨタ', url: mu('toyota', 'yariscross') },
      { name: 'ルーミー',    maker: 'トヨタ', url: mu('toyota', 'roomy')  },
    ],
    gradient: 'from-violet-400 to-violet-600', badge: 'bg-violet-100 text-violet-700',
  },
  FUPW: {
    name: 'VIPファミリー型', emoji: '👑',
    tagline: '家族への最高のプレゼントは、最上級の移動空間',
    description: '広くて豪華な車内で家族全員をVIP待遇に。品格あるプレミアムミニバンがあなたのファミリーライフを格上げします。',
    models: [
      { name: 'アルファード',   maker: 'トヨタ', url: mu('toyota', 'alphard')  },
      { name: 'ヴェルファイア', maker: 'トヨタ', url: mu('toyota', 'vellfire') },
      { name: 'エルグランド',   maker: '日産',   url: mu('nissan', 'elgrand')  },
    ],
    gradient: 'from-purple-500 to-purple-700', badge: 'bg-purple-100 text-purple-700',
  },
  // ── Family × Outdoor ──────────────────────────────────────────────────
  FOEC: {
    name: 'みんなでアウトドア型', emoji: '🌲',
    tagline: 'キャンプも遠足も、家族みんなで行こう',
    description: '週末は家族でアウトドアへ。荷物もしっかり積めて燃費もよい、頼りになるコンパクトSUVが家族の冒険を支えます。',
    models: [
      { name: 'ヤリスクロス', maker: 'トヨタ', url: mu('toyota', 'yariscross') },
      { name: 'クロストレック', maker: 'スバル', url: mu('subaru', 'crosstrek') },
      { name: 'XV',           maker: 'スバル', url: mu('subaru', 'xv')         },
    ],
    gradient: 'from-green-400 to-green-600', badge: 'bg-green-100 text-green-700',
  },
  FOEW: {
    name: '冒険する大家族型', emoji: '🏕️',
    tagline: 'どこへでも行ける、家族の冒険基地',
    description: 'キャンプ道具を積んで、家族全員でアウトドアへ。広い荷室と4WDの頼もしさで、大家族の冒険を完全サポートします。',
    models: [
      { name: 'ステップワゴン', maker: 'ホンダ',   url: mu('honda',      'stepwgn')  },
      { name: 'デリカD:5',     maker: '三菱',     url: mu('mitsubishi', 'delicad5') },
      { name: 'セレナ',         maker: '日産',     url: mu('nissan',     'serena')   },
    ],
    gradient: 'from-emerald-500 to-emerald-700', badge: 'bg-emerald-100 text-emerald-700',
  },
  FOPC: {
    name: 'かっこいいアウトドアファミリー型', emoji: '🦁',
    tagline: 'スタイルも、自然も、両方手に入れる',
    description: 'デザインにこだわりながら、家族でアウトドアも楽しみたい。スタイリッシュなSUVが休日をもっとかっこよくしてくれます。',
    models: [
      { name: 'RAV4',       maker: 'トヨタ', url: mu('toyota', 'rav4')  },
      { name: 'CX-5',       maker: 'マツダ', url: mu('mazda',  'cx5')   },
      { name: 'フォレスター', maker: 'スバル', url: mu('subaru', 'forester') },
    ],
    gradient: 'from-orange-500 to-orange-700', badge: 'bg-orange-100 text-orange-700',
  },
  FOPW: {
    name: '贅沢アウトドアファミリー型', emoji: '🏔️',
    tagline: '最高の自然を、最高の車で体感する',
    description: '大人数でアウトドアに行っても快適さは妥協しない。広くて上質なプレミアムSUVが、家族の贅沢な冒険を演出します。',
    models: [
      { name: 'ハリアー',    maker: 'トヨタ', url: mu('toyota', 'harrier')    },
      { name: 'CX-60',      maker: 'マツダ', url: mu('mazda',  'cx60')        },
      { name: 'フォレスター', maker: 'スバル', url: mu('subaru', 'forester')   },
    ],
    gradient: 'from-amber-500 to-orange-600', badge: 'bg-amber-100 text-amber-700',
  },
  // ── Solo × Urban ──────────────────────────────────────────────────────
  SUEC: {
    name: 'スマートシティドライバー型', emoji: '🌿',
    tagline: '賢く乗って、毎日をもっとお得に',
    description: '街乗りで燃費を最大限活かすスマートな選択。コンパクトで小回りが効いて、駐車も楽なエコカーが毎日の相棒になります。',
    models: [
      { name: 'アクア', maker: 'トヨタ', url: mu('toyota', 'aqua') },
      { name: 'ノート', maker: '日産',   url: mu('nissan', 'note') },
      { name: 'フィット', maker: 'ホンダ', url: mu('honda', 'fit') },
    ],
    gradient: 'from-teal-400 to-teal-600', badge: 'bg-teal-100 text-teal-700',
  },
  SUEW: {
    name: 'エコ通勤エース型', emoji: '🚀',
    tagline: '毎日の通勤を、最もかしこく快適に',
    description: '長距離通勤でも燃費が気にならない。ゆとりある車内と低燃費を両立したハイブリッドセダンが、日々の通勤を快適にします。',
    models: [
      { name: 'プリウス', maker: 'トヨタ', url: mu('toyota', 'prius') },
      { name: 'アクア',   maker: 'トヨタ', url: mu('toyota', 'aqua')  },
      { name: 'ノート',   maker: '日産',   url: mu('nissan', 'note')  },
    ],
    gradient: 'from-cyan-500 to-cyan-700', badge: 'bg-cyan-100 text-cyan-700',
  },
  SUPC: {
    name: '走りを極めるシティドライバー型', emoji: '⚡',
    tagline: '街中でも、ドライブは本気で楽しむ',
    description: 'コンパクトでも走りに妥協しない。スポーティなデザインと軽快なハンドリングで、毎日の運転が楽しくなる一台です。',
    models: [
      { name: 'GR86',   maker: 'トヨタ', url: mu('toyota', 'gr86')  },
      { name: 'スイフト', maker: 'スズキ', url: mu('suzuki', 'swift') },
      { name: 'ヤリスクロス', maker: 'トヨタ', url: mu('toyota', 'yariscross') },
    ],
    gradient: 'from-rose-500 to-rose-700', badge: 'bg-rose-100 text-rose-700',
  },
  SUPW: {
    name: '大人の余裕セダン型', emoji: '🌟',
    tagline: '上質な移動が、あなたのステータスを語る',
    description: '乗り心地、デザイン、存在感——すべてにこだわるあなたへ。余裕のある大人のためのプレミアムセダンが理想です。',
    models: [
      { name: 'クラウン', maker: 'トヨタ', url: mu('toyota', 'crown')   },
      { name: 'プリウス', maker: 'トヨタ', url: mu('toyota', 'prius')   },
      { name: 'ハリアー', maker: 'トヨタ', url: mu('toyota', 'harrier') },
    ],
    gradient: 'from-yellow-500 to-amber-600', badge: 'bg-yellow-100 text-yellow-700',
  },
  // ── Solo × Outdoor ────────────────────────────────────────────────────
  SOEC: {
    name: '孤高の冒険者型', emoji: '🏔️',
    tagline: '一人でどこまでも、自分の道を行く',
    description: '行き先は自分で決める。どんな悪路もへっちゃらなコンパクトオフローダーで、誰も知らない絶景を目指しましょう。',
    models: [
      { name: 'ジムニー',     maker: 'スズキ', url: mu('suzuki', 'jimny')    },
      { name: 'ヤリスクロス', maker: 'トヨタ', url: mu('toyota', 'yariscross') },
      { name: 'XV',           maker: 'スバル', url: mu('subaru', 'xv')         },
    ],
    gradient: 'from-stone-500 to-stone-700', badge: 'bg-stone-100 text-stone-700',
  },
  SOEW: {
    name: '自然と生きるアウトドア型', emoji: '🌲',
    tagline: '週末は山へ、フィールドが自分の庭',
    description: '釣りにキャンプに登山——道具をたっぷり積んで、自然の中へ。余裕のある積載力と走破性を持つSUVが相棒になります。',
    models: [
      { name: 'フォレスター',   maker: 'スバル', url: mu('subaru',  'forester')  },
      { name: 'クロストレック', maker: 'スバル', url: mu('subaru',  'crosstrek') },
      { name: 'RAV4',          maker: 'トヨタ', url: mu('toyota',  'rav4')       },
    ],
    gradient: 'from-green-600 to-green-800', badge: 'bg-green-100 text-green-700',
  },
  SOPC: {
    name: '都会派アウトドアマン型', emoji: '🦅',
    tagline: '街でもかっこよく、自然でも頼もしく',
    description: '都市の洗練さとアウトドアの機能性を両立したい。スタイリッシュなクロスオーバーSUVがそのニーズに答えます。',
    models: [
      { name: 'ハリアー',    maker: 'トヨタ', url: mu('toyota', 'harrier')  },
      { name: 'CX-5',       maker: 'マツダ', url: mu('mazda',  'cx5')       },
      { name: 'フォレスター', maker: 'スバル', url: mu('subaru', 'forester') },
    ],
    gradient: 'from-sky-500 to-sky-700', badge: 'bg-sky-100 text-sky-700',
  },
  SOPW: {
    name: '完璧主義のドライバー型', emoji: '💎',
    tagline: 'スタイルも走りも自然も、すべてを手に入れる',
    description: 'プレミアムな乗り心地で、本格的なアウトドアへ。デザインと性能の両方を極めたプレミアムSUVが、あなたの理想です。',
    models: [
      { name: 'ハリアー', maker: 'トヨタ', url: mu('toyota', 'harrier') },
      { name: 'CX-60',    maker: 'マツダ', url: mu('mazda',  'cx60')    },
      { name: 'フォレスター', maker: 'スバル', url: mu('subaru', 'forester') },
    ],
    gradient: 'from-indigo-500 to-indigo-700', badge: 'bg-indigo-100 text-indigo-700',
  },
};

// ── スコア計算 → タイプ判定 ──────────────────────────────────────────────────
function calcType16(answers: number[]): string {
  const score = { fs: 0, uo: 0, ep: 0, cw: 0 };
  QUESTIONS.forEach((q, i) => {
    if (answers[i] === 0) score[q.axis]++;   // 0 = left（F/U/E/C）
    // 1 = right（S/O/P/W）はデフォルト0のまま
  });
  const f = score.fs >= 2 ? 'F' : 'S';
  const u = score.uo >= 2 ? 'U' : 'O';
  const e = score.ep >= 2 ? 'E' : 'P';
  const c = score.cw >= 2 ? 'C' : 'W';
  return `${f}${u}${e}${c}`;
}

// ── コンポーネント ────────────────────────────────────────────────────────────
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
          {/* 16タイプ プレビューグリッド */}
          <div className="grid grid-cols-4 gap-1.5 mb-8">
            {['🚗','🚐','✨','👑','🌲','🏕️','🦁','🏔️','🌿','🚀','⚡','🌟','🏔️','🌲','🦅','💎'].map((e, i) => (
              <div key={i} className="bg-white rounded-xl p-2.5 shadow-sm text-xl text-center">{e}</div>
            ))}
          </div>
          <button
            onClick={() => setStep(0)}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-2xl text-lg transition-colors shadow-md"
          >
            診断スタート →
          </button>
          <p className="text-xs text-gray-400 mt-3">所要時間：約2分 / 全12問</p>
        </div>
      </main>
    );
  }

  // ── 質問 ──────────────────────────────────────────────────────────────────
  if (typeof step === 'number' && currentQ) {
    const progress = (step / QUESTIONS.length) * 100;
    const axisLabel: Record<Axis, string> = {
      fs: 'ライフスタイル', uo: '使い方', ep: 'こだわり', cw: '車格',
    };
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

          {/* シェアボタン */}
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
