import type { CarBody } from '@/components/CarIllustration';

export type { CarBody };
export type Axis = 'fs' | 'uo' | 'ep' | 'cw';

export interface Question {
  axis: Axis;
  question: string;
  options: [{ label: string; emoji: string }, { label: string; emoji: string }];
}

export const QUESTIONS: Question[] = [
  { axis: 'fs', question: '家族・同乗者について教えてください',
    options: [{ label: '子どもや家族と一緒に乗ることが多い', emoji: '👨‍👩‍👧‍👦' },
              { label: '一人か、パートナーと二人が多い',     emoji: '👤' }] },
  { axis: 'fs', question: '車内空間に求めることは？',
    options: [{ label: 'みんながゆったり乗れる広さ', emoji: '🚌' },
              { label: '自分好みの快適な空間',       emoji: '🎵' }] },
  { axis: 'fs', question: '乗る人数で選ぶとしたら？',
    options: [{ label: '3人以上乗れることが必須', emoji: '👪' },
              { label: '1〜2人乗れれば十分',       emoji: '🙋' }] },
  { axis: 'uo', question: '週末はどこへ行くことが多い？',
    options: [{ label: 'ショッピング・外食・街なか',   emoji: '🛒' },
              { label: 'キャンプ・山・海・アウトドア', emoji: '🏕️' }] },
  { axis: 'uo', question: 'よく走る道は？',
    options: [{ label: '市街地・幹線道路がメイン', emoji: '🏙️' },
              { label: '山道・郊外・田舎道も走る', emoji: '🌲' }] },
  { axis: 'uo', question: '荷物の積み方について',
    options: [{ label: '普段の買い物袋が入ればOK', emoji: '🛍️' },
              { label: 'テントや道具を積みたい',   emoji: '⛺' }] },
  { axis: 'ep', question: '車にかける予算の考え方は？',
    options: [{ label: 'コスパ重視・維持費も抑えたい',    emoji: '💴' },
              { label: 'いい車ならお金をかけてもいい',    emoji: '💎' }] },
  { axis: 'ep', question: '車のデザインへのこだわりは？',
    options: [{ label: '実用性があれば見た目は二の次',       emoji: '🔧' },
              { label: 'デザインも重要、外見にこだわりたい', emoji: '✨' }] },
  { axis: 'ep', question: '燃費・税金などランニングコストは？',
    options: [{ label: 'できるだけ安く抑えたい', emoji: '🌿' },
              { label: 'あまり気にしない',         emoji: '🌟' }] },
  { axis: 'cw', question: '駐車場の広さは？',
    options: [{ label: '狭め、小回りが効く車がいい', emoji: '🅿️' },
              { label: '広め、大型でも問題なし',     emoji: '🏟️' }] },
  { axis: 'cw', question: '高速道路はよく使いますか？',
    options: [{ label: 'ほとんど使わない・近場メイン',   emoji: '🏘️' },
              { label: '長距離ドライブ・高速もよく使う', emoji: '🛣️' }] },
  { axis: 'cw', question: '車内の広さについて',
    options: [{ label: 'コンパクトで取り回しやすい方が好き', emoji: '🚗' },
              { label: 'ゆったりした広い車内がいい',         emoji: '🛋️' }] },
];

export interface CarType16 {
  code: string;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  models: { name: string; maker: string; url: string }[];
  gradient: string;
  badge: string;
  cardBg: string;
  body: CarBody;
  illustColor: string;
}

const B = 'https://www.ecar.co.jp';
const mu = (maker: string, model: string) =>
  `${B}/maker_${maker}/model_${model}/type_0/price_0_1/car.html`;

export const CAR_TYPES_16: Record<string, CarType16> = {
  // ── Family × Urban ────────────────────────────────────────────────────
  FUEC: {
    code: 'FUEC', body: 'hatchback', illustColor: '#60a5fa',
    name: '街の頼れるファミリーカー型', emoji: '🚗',
    tagline: 'コスパ最強、家族みんな笑顔で移動',
    description: '毎日の送り迎えや買い物に大活躍。小回りが効いて燃費もよく、家族全員が快適に乗れるコンパクトミニバンが最適です。',
    models: [{ name: 'シエンタ',  maker: 'トヨタ', url: mu('toyota','sienta') },
             { name: 'フリード',  maker: 'ホンダ', url: mu('honda','freed')   },
             { name: 'ルーミー',  maker: 'トヨタ', url: mu('toyota','roomy')  }],
    gradient: 'from-blue-400 to-blue-600', badge: 'bg-blue-100 text-blue-700',
    cardBg: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
  },
  FUEW: {
    code: 'FUEW', body: 'minivan', illustColor: '#3b82f6',
    name: '家族の大黒柱ミニバン型', emoji: '🚐',
    tagline: '乗り心地も広さも、家族第一',
    description: 'スライドドアの使いやすさと広い車内が魅力。チャイルドシートもしっかり設置できる、ファミリーの定番ミニバンが理想です。',
    models: [{ name: 'ヴォクシー',    maker: 'トヨタ', url: mu('toyota','voxy')    },
             { name: 'セレナ',        maker: '日産',   url: mu('nissan','serena')  },
             { name: 'ステップワゴン', maker: 'ホンダ', url: mu('honda','stepwgn')  }],
    gradient: 'from-blue-500 to-blue-700', badge: 'bg-blue-100 text-blue-700',
    cardBg: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
  },
  FUPC: {
    code: 'FUPC', body: 'hatchback', illustColor: '#8b5cf6',
    name: 'おしゃれファミリー型', emoji: '✨',
    tagline: 'デザインも諦めない、かっこいいパパ・ママ',
    description: '家族との移動もスタイリッシュに。実用性とデザイン性を両立した、街で映えるコンパクトファミリーカーが似合います。',
    models: [{ name: 'シエンタ',    maker: 'トヨタ', url: mu('toyota','sienta')     },
             { name: 'ヤリスクロス', maker: 'トヨタ', url: mu('toyota','yariscross') },
             { name: 'ルーミー',    maker: 'トヨタ', url: mu('toyota','roomy')       }],
    gradient: 'from-violet-400 to-violet-600', badge: 'bg-violet-100 text-violet-700',
    cardBg: 'bg-violet-50 hover:bg-violet-100 border-violet-200',
  },
  FUPW: {
    code: 'FUPW', body: 'luxury-van', illustColor: '#7c3aed',
    name: 'VIPファミリー型', emoji: '👑',
    tagline: '家族への最高のプレゼントは、最上級の移動空間',
    description: '広くて豪華な車内で家族全員をVIP待遇に。品格あるプレミアムミニバンがあなたのファミリーライフを格上げします。',
    models: [{ name: 'アルファード',   maker: 'トヨタ', url: mu('toyota','alphard')  },
             { name: 'ヴェルファイア', maker: 'トヨタ', url: mu('toyota','vellfire') },
             { name: 'エルグランド',   maker: '日産',   url: mu('nissan','elgrand')  }],
    gradient: 'from-purple-500 to-purple-700', badge: 'bg-purple-100 text-purple-700',
    cardBg: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
  },
  // ── Family × Outdoor ──────────────────────────────────────────────────
  FOEC: {
    code: 'FOEC', body: 'suv', illustColor: '#34d399',
    name: 'みんなでアウトドア型', emoji: '🌲',
    tagline: 'キャンプも遠足も、家族みんなで行こう',
    description: '週末は家族でアウトドアへ。荷物もしっかり積めて燃費もよい、頼りになるコンパクトSUVが家族の冒険を支えます。',
    models: [{ name: 'ヤリスクロス',  maker: 'トヨタ', url: mu('toyota','yariscross') },
             { name: 'クロストレック', maker: 'スバル', url: mu('subaru','crosstrek')  },
             { name: 'XV',            maker: 'スバル', url: mu('subaru','xv')          }],
    gradient: 'from-green-400 to-green-600', badge: 'bg-green-100 text-green-700',
    cardBg: 'bg-green-50 hover:bg-green-100 border-green-200',
  },
  FOEW: {
    code: 'FOEW', body: 'minivan', illustColor: '#10b981',
    name: '冒険する大家族型', emoji: '🏕️',
    tagline: 'どこへでも行ける、家族の冒険基地',
    description: 'キャンプ道具を積んで、家族全員でアウトドアへ。広い荷室と4WDの頼もしさで、大家族の冒険を完全サポートします。',
    models: [{ name: 'ステップワゴン', maker: 'ホンダ',   url: mu('honda','stepwgn')        },
             { name: 'デリカD:5',     maker: '三菱',     url: mu('mitsubishi','delicad5')   },
             { name: 'セレナ',         maker: '日産',     url: mu('nissan','serena')         }],
    gradient: 'from-emerald-500 to-emerald-700', badge: 'bg-emerald-100 text-emerald-700',
    cardBg: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200',
  },
  FOPC: {
    code: 'FOPC', body: 'suv', illustColor: '#f97316',
    name: 'かっこいいアウトドアファミリー型', emoji: '🦁',
    tagline: 'スタイルも、自然も、両方手に入れる',
    description: 'デザインにこだわりながら、家族でアウトドアも楽しみたい。スタイリッシュなSUVが休日をもっとかっこよくしてくれます。',
    models: [{ name: 'RAV4',       maker: 'トヨタ', url: mu('toyota','rav4')      },
             { name: 'CX-5',       maker: 'マツダ', url: mu('mazda','cx5')        },
             { name: 'フォレスター', maker: 'スバル', url: mu('subaru','forester') }],
    gradient: 'from-orange-500 to-orange-700', badge: 'bg-orange-100 text-orange-700',
    cardBg: 'bg-orange-50 hover:bg-orange-100 border-orange-200',
  },
  FOPW: {
    code: 'FOPW', body: 'suv', illustColor: '#ea580c',
    name: '贅沢アウトドアファミリー型', emoji: '🏔️',
    tagline: '最高の自然を、最高の車で体感する',
    description: '大人数でアウトドアに行っても快適さは妥協しない。広くて上質なプレミアムSUVが、家族の贅沢な冒険を演出します。',
    models: [{ name: 'ハリアー',    maker: 'トヨタ', url: mu('toyota','harrier')   },
             { name: 'CX-60',      maker: 'マツダ', url: mu('mazda','cx60')        },
             { name: 'フォレスター', maker: 'スバル', url: mu('subaru','forester')  }],
    gradient: 'from-amber-500 to-orange-600', badge: 'bg-amber-100 text-amber-700',
    cardBg: 'bg-amber-50 hover:bg-amber-100 border-amber-200',
  },
  // ── Solo × Urban ──────────────────────────────────────────────────────
  SUEC: {
    code: 'SUEC', body: 'hatchback', illustColor: '#2dd4bf',
    name: 'スマートシティドライバー型', emoji: '🌿',
    tagline: '賢く乗って、毎日をもっとお得に',
    description: '街乗りで燃費を最大限活かすスマートな選択。コンパクトで小回りが効いて、駐車も楽なエコカーが毎日の相棒になります。',
    models: [{ name: 'アクア',  maker: 'トヨタ', url: mu('toyota','aqua') },
             { name: 'ノート',  maker: '日産',   url: mu('nissan','note') },
             { name: 'フィット', maker: 'ホンダ', url: mu('honda','fit')   }],
    gradient: 'from-teal-400 to-teal-600', badge: 'bg-teal-100 text-teal-700',
    cardBg: 'bg-teal-50 hover:bg-teal-100 border-teal-200',
  },
  SUEW: {
    code: 'SUEW', body: 'sedan', illustColor: '#06b6d4',
    name: 'エコ通勤エース型', emoji: '🚀',
    tagline: '毎日の通勤を、最もかしこく快適に',
    description: '長距離通勤でも燃費が気にならない。ゆとりある車内と低燃費を両立したハイブリッドセダンが、日々の通勤を快適にします。',
    models: [{ name: 'プリウス', maker: 'トヨタ', url: mu('toyota','prius') },
             { name: 'アクア',   maker: 'トヨタ', url: mu('toyota','aqua')  },
             { name: 'ノート',   maker: '日産',   url: mu('nissan','note')  }],
    gradient: 'from-cyan-500 to-cyan-700', badge: 'bg-cyan-100 text-cyan-700',
    cardBg: 'bg-cyan-50 hover:bg-cyan-100 border-cyan-200',
  },
  SUPC: {
    code: 'SUPC', body: 'sports', illustColor: '#f43f5e',
    name: '走りを極めるシティドライバー型', emoji: '⚡',
    tagline: '街中でも、ドライブは本気で楽しむ',
    description: 'コンパクトでも走りに妥協しない。スポーティなデザインと軽快なハンドリングで、毎日の運転が楽しくなる一台です。',
    models: [{ name: 'GR86',       maker: 'トヨタ', url: mu('toyota','gr86')       },
             { name: 'スイフト',   maker: 'スズキ', url: mu('suzuki','swift')      },
             { name: 'ヤリスクロス', maker: 'トヨタ', url: mu('toyota','yariscross') }],
    gradient: 'from-rose-500 to-rose-700', badge: 'bg-rose-100 text-rose-700',
    cardBg: 'bg-rose-50 hover:bg-rose-100 border-rose-200',
  },
  SUPW: {
    code: 'SUPW', body: 'sedan', illustColor: '#eab308',
    name: '大人の余裕セダン型', emoji: '🌟',
    tagline: '上質な移動が、あなたのステータスを語る',
    description: '乗り心地、デザイン、存在感——すべてにこだわるあなたへ。余裕のある大人のためのプレミアムセダンが理想です。',
    models: [{ name: 'クラウン', maker: 'トヨタ', url: mu('toyota','crown')   },
             { name: 'プリウス', maker: 'トヨタ', url: mu('toyota','prius')   },
             { name: 'ハリアー', maker: 'トヨタ', url: mu('toyota','harrier') }],
    gradient: 'from-yellow-500 to-amber-600', badge: 'bg-yellow-100 text-yellow-700',
    cardBg: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200',
  },
  // ── Solo × Outdoor ────────────────────────────────────────────────────
  SOEC: {
    code: 'SOEC', body: 'kei', illustColor: '#78716c',
    name: '孤高の冒険者型', emoji: '🗻',
    tagline: '一人でどこまでも、自分の道を行く',
    description: '行き先は自分で決める。どんな悪路もへっちゃらなコンパクトオフローダーで、誰も知らない絶景を目指しましょう。',
    models: [{ name: 'ジムニー',     maker: 'スズキ', url: mu('suzuki','jimny')       },
             { name: 'ヤリスクロス', maker: 'トヨタ', url: mu('toyota','yariscross')  },
             { name: 'XV',           maker: 'スバル', url: mu('subaru','xv')           }],
    gradient: 'from-stone-500 to-stone-700', badge: 'bg-stone-100 text-stone-700',
    cardBg: 'bg-stone-50 hover:bg-stone-100 border-stone-200',
  },
  SOEW: {
    code: 'SOEW', body: 'suv', illustColor: '#16a34a',
    name: '自然と生きるアウトドア型', emoji: '🌲',
    tagline: '週末は山へ、フィールドが自分の庭',
    description: '釣りにキャンプに登山——道具をたっぷり積んで、自然の中へ。余裕のある積載力と走破性を持つSUVが相棒になります。',
    models: [{ name: 'フォレスター',   maker: 'スバル', url: mu('subaru','forester')  },
             { name: 'クロストレック', maker: 'スバル', url: mu('subaru','crosstrek') },
             { name: 'RAV4',          maker: 'トヨタ', url: mu('toyota','rav4')       }],
    gradient: 'from-green-600 to-green-800', badge: 'bg-green-100 text-green-700',
    cardBg: 'bg-green-50 hover:bg-green-100 border-green-200',
  },
  SOPC: {
    code: 'SOPC', body: 'suv', illustColor: '#0ea5e9',
    name: '都会派アウトドアマン型', emoji: '🦅',
    tagline: '街でもかっこよく、自然でも頼もしく',
    description: '都市の洗練さとアウトドアの機能性を両立したい。スタイリッシュなクロスオーバーSUVがそのニーズに答えます。',
    models: [{ name: 'ハリアー',    maker: 'トヨタ', url: mu('toyota','harrier')   },
             { name: 'CX-5',       maker: 'マツダ', url: mu('mazda','cx5')         },
             { name: 'フォレスター', maker: 'スバル', url: mu('subaru','forester')  }],
    gradient: 'from-sky-500 to-sky-700', badge: 'bg-sky-100 text-sky-700',
    cardBg: 'bg-sky-50 hover:bg-sky-100 border-sky-200',
  },
  SOPW: {
    code: 'SOPW', body: 'suv', illustColor: '#6366f1',
    name: '完璧主義のドライバー型', emoji: '💎',
    tagline: 'スタイルも走りも自然も、すべてを手に入れる',
    description: 'プレミアムな乗り心地で、本格的なアウトドアへ。デザインと性能の両方を極めたプレミアムSUVが、あなたの理想です。',
    models: [{ name: 'ハリアー',    maker: 'トヨタ', url: mu('toyota','harrier')   },
             { name: 'CX-60',      maker: 'マツダ', url: mu('mazda','cx60')        },
             { name: 'フォレスター', maker: 'スバル', url: mu('subaru','forester')  }],
    gradient: 'from-indigo-500 to-indigo-700', badge: 'bg-indigo-100 text-indigo-700',
    cardBg: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200',
  },
};

export const GROUPS = [
  { label: 'ファミリー × 街乗り系',         emoji: '🏙️', color: 'text-blue-700',   border: 'border-blue-200',   headerBg: 'bg-blue-50',   codes: ['FUEC','FUEW','FUPC','FUPW'] as const },
  { label: 'ファミリー × アウトドア系',     emoji: '🌲', color: 'text-green-700',  border: 'border-green-200',  headerBg: 'bg-green-50',  codes: ['FOEC','FOEW','FOPC','FOPW'] as const },
  { label: 'ソロ・カップル × 街乗り系',     emoji: '⚡', color: 'text-cyan-700',   border: 'border-cyan-200',   headerBg: 'bg-cyan-50',   codes: ['SUEC','SUEW','SUPC','SUPW'] as const },
  { label: 'ソロ・カップル × アウトドア系', emoji: '🏔️', color: 'text-stone-700',  border: 'border-stone-200',  headerBg: 'bg-stone-50',  codes: ['SOEC','SOEW','SOPC','SOPW'] as const },
] as const;

export function calcType16(answers: number[]): string {
  const score = { fs: 0, uo: 0, ep: 0, cw: 0 };
  QUESTIONS.forEach((q, i) => { if (answers[i] === 0) score[q.axis]++; });
  return [
    score.fs >= 2 ? 'F' : 'S',
    score.uo >= 2 ? 'U' : 'O',
    score.ep >= 2 ? 'E' : 'P',
    score.cw >= 2 ? 'C' : 'W',
  ].join('');
}
