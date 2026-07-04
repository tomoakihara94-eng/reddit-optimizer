import type { CarBody, PassengerType } from '@/components/CarIllustration';

export type { CarBody, PassengerType };
export type Axis = 'fs' | 'uo' | 'ep' | 'cw';

export interface Question {
  axis: Axis;
  question: string;
  // 選択肢は 0→A強 / 1→A弱 / 2→B弱 / 3→B強 の順で配置
  options: { label: string; emoji: string }[];
}

// ── スコアリング設計 ──────────────────────────────────────────────────────
// 各選択肢の index がそのままスコア (0〜3)
// 軸ごとに3問 × 最大3点 = 最大9点
// 合計 0〜4 → A極 (F/U/E/C) ／ 5〜9 → B極 (S/O/P/W)
// ──────────────────────────────────────────────────────────────────────────

export const QUESTIONS: Question[] = [
  // ── F/S 軸 ──────────────────────────────────────────────────────
  {
    axis: 'fs',
    question: '車に同乗する人は主に誰ですか？',
    options: [
      { emoji: '👨‍👩‍👧‍👦', label: '子どもを含む家族全員で乗ることが多い' },
      { emoji: '👪',       label: '家族と乗るが、一人での移動もある' },
      { emoji: '👫',       label: 'パートナーや友人と二人が中心' },
      { emoji: '👤',       label: 'ほぼ一人で乗ることがほとんど' },
    ],
  },
  {
    axis: 'fs',
    question: '車内空間に一番求めることは？',
    options: [
      { emoji: '🚌', label: '後部座席の広さと家族全員の快適さ' },
      { emoji: '🪑', label: 'みんなが使いやすい実用的な設計' },
      { emoji: '🎵', label: '運転しやすく、自分が快適な空間' },
      { emoji: '⚡', label: 'ドライビングの楽しさや個性的な内装' },
    ],
  },
  {
    axis: 'fs',
    question: '必要な乗車定員は？',
    options: [
      { emoji: '🧒', label: '7人以上乗れることが理想' },
      { emoji: '👨‍👩‍👧', label: '5〜6人はしっかり乗れてほしい' },
      { emoji: '👫', label: '3〜4人乗れれば問題ない' },
      { emoji: '🙋', label: '1〜2人乗れれば十分' },
    ],
  },
  // ── U/O 軸 ──────────────────────────────────────────────────────
  {
    axis: 'uo',
    question: '主に走る場所・道路環境は？',
    options: [
      { emoji: '🏙️', label: '市街地・住宅地・幹線道路がほとんど' },
      { emoji: '🛒', label: '街中が中心だが、たまに郊外も走る' },
      { emoji: '🌳', label: '郊外・田舎道・ドライブルートが多い' },
      { emoji: '⛰️', label: '山道・砂利道・キャンプ地など自然の中' },
    ],
  },
  {
    axis: 'uo',
    question: '週末の過ごし方に近いのは？',
    options: [
      { emoji: '🛍️', label: '地元でショッピング・外食・映画など' },
      { emoji: '🚗', label: '近〜中距離のドライブや観光スポット' },
      { emoji: '🏖️', label: '自然豊かな場所でゆっくり過ごす' },
      { emoji: '🏕️', label: 'キャンプ・釣り・登山など本格アウトドア' },
    ],
  },
  {
    axis: 'uo',
    question: '荷物の積み込みについて、実態に近いのは？',
    options: [
      { emoji: '🛍️', label: '普段の買い物袋や小物が入れば十分' },
      { emoji: '🧳', label: '旅行バッグや大きめの荷物も載せたい' },
      { emoji: '🪑', label: 'アウトドアチェアやBBQ道具も積みたい' },
      { emoji: '⛺', label: 'テント・クーラーなど大量の道具を積む' },
    ],
  },
  // ── E/P 軸 ──────────────────────────────────────────────────────
  {
    axis: 'ep',
    question: '車の購入・維持費に対する考え方は？',
    options: [
      { emoji: '💴', label: 'とにかく安く抑えたい、コスパ最優先' },
      { emoji: '💰', label: 'コスパ重視だが、ある程度は出せる' },
      { emoji: '💳', label: '品質・装備が良ければ多少高くても構わない' },
      { emoji: '💎', label: '良い車なら費用はあまり気にしない' },
    ],
  },
  {
    axis: 'ep',
    question: 'デザイン・スタイルへのこだわりは？',
    options: [
      { emoji: '🔧', label: '実用的であれば外見はまったく気にしない' },
      { emoji: '👌', label: 'シンプルで清潔感があれば十分' },
      { emoji: '✨', label: 'かっこいい・かわいいデザインを選びたい' },
      { emoji: '👑', label: 'デザインや高級感に強くこだわる' },
    ],
  },
  {
    axis: 'ep',
    question: '燃費・税金・保険などの維持コストは？',
    options: [
      { emoji: '🌿', label: '燃費最優先、毎月の出費を極力減らしたい' },
      { emoji: '📊', label: '節約を意識しつつ、バランスを取りたい' },
      { emoji: '🙆', label: '快適さのためなら多少のコスト増は許容できる' },
      { emoji: '🌟', label: 'コストより乗り心地やブランドを優先する' },
    ],
  },
  // ── C/W 軸 ──────────────────────────────────────────────────────
  {
    axis: 'cw',
    question: '普段よく使う駐車場の環境は？',
    options: [
      { emoji: '🅿️', label: '機械式・縦列・狭小など制約が多い' },
      { emoji: '🏘️', label: '一般的な平置き、特別広くはない' },
      { emoji: '🏪', label: '広めのモール・ロードサイド店が多い' },
      { emoji: '🏟️', label: '広大なスペースで、サイズを気にしない' },
    ],
  },
  {
    axis: 'cw',
    question: '高速道路や長距離ドライブの頻度は？',
    options: [
      { emoji: '🏘️', label: 'ほぼ使わない・近場の移動のみ' },
      { emoji: '🗓️', label: '月に1〜2回程度、たまに使う' },
      { emoji: '🛣️', label: '週に1〜2回、中〜長距離を走る' },
      { emoji: '✈️', label: 'ほぼ毎週、長距離・高速ドライブをする' },
    ],
  },
  {
    axis: 'cw',
    question: '理想の車のサイズ感は？',
    options: [
      { emoji: '🤏', label: 'コンパクトで街中の小回りが最優先' },
      { emoji: '📦', label: 'やや小さめだが積載力もある使い勝手重視' },
      { emoji: '📐', label: 'ゆとりある中〜大型で快適な乗り心地' },
      { emoji: '🚐', label: '広くて存在感のある大型の車が好き' },
    ],
  },
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
  passengers: PassengerType;
}

const B = 'https://www.ecar.co.jp';
const mu = (maker: string, model: string) =>
  `${B}/maker_${maker}/model_${model}/type_0/price_0_1/car.html`;

export const CAR_TYPES_16: Record<string, CarType16> = {
  // ── Family × Urban ────────────────────────────────────────────────────
  FUEC: {
    code: 'FUEC', body: 'hatchback', illustColor: '#60a5fa', passengers: 'family',
    name: '街の頼れるファミリーカー型', emoji: '🚗',
    tagline: 'コスパ最強、家族みんな笑顔で移動',
    description: '毎日の送り迎えや買い物に大活躍。小回りが効いて燃費もよく、家族全員が快適に乗れるコンパクトミニバンが最適です。',
    models: [{ name: 'シエンタ',  maker: 'トヨタ',   url: mu('toyota','sienta')    },
             { name: 'フリード',  maker: 'ホンダ',   url: mu('honda','freed')      },
             { name: 'タント',    maker: 'ダイハツ', url: mu('daihatsu','tanto')   },
             { name: 'スペーシア', maker: 'スズキ',  url: mu('suzuki','spacia')    }],
    gradient: 'from-blue-400 to-blue-600', badge: 'bg-blue-100 text-blue-700',
    cardBg: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
  },
  FUEW: {
    code: 'FUEW', body: 'minivan', illustColor: '#3b82f6', passengers: 'family',
    name: '家族の大黒柱ミニバン型', emoji: '🚐',
    tagline: '乗り心地も広さも、家族第一',
    description: 'スライドドアの使いやすさと広い車内が魅力。チャイルドシートもしっかり設置できる、ファミリーの定番ミニバンが理想です。',
    models: [{ name: 'ヴォクシー',    maker: 'トヨタ', url: mu('toyota','voxy')    },
             { name: 'セレナ',        maker: '日産',   url: mu('nissan','serena')  },
             { name: 'ステップワゴン', maker: 'ホンダ', url: mu('honda','stepwgn')  },
             { name: 'オデッセイ',    maker: 'ホンダ', url: mu('honda','odyssey')  }],
    gradient: 'from-blue-500 to-blue-700', badge: 'bg-blue-100 text-blue-700',
    cardBg: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
  },
  FUPC: {
    code: 'FUPC', body: 'hatchback', illustColor: '#8b5cf6', passengers: 'family',
    name: 'おしゃれファミリー型', emoji: '✨',
    tagline: 'デザインも諦めない、かっこいいパパ・ママ',
    description: '家族との移動もスタイリッシュに。実用性とデザイン性を両立した、街で映えるコンパクトファミリーカーが似合います。',
    models: [{ name: 'ルーミー',  maker: 'トヨタ', url: mu('toyota','roomy')    },
             { name: 'ヴェゼル',  maker: 'ホンダ', url: mu('honda','vezel')     },
             { name: 'ソリオ',    maker: 'スズキ', url: mu('suzuki','solio')    }],
    gradient: 'from-violet-400 to-violet-600', badge: 'bg-violet-100 text-violet-700',
    cardBg: 'bg-violet-50 hover:bg-violet-100 border-violet-200',
  },
  FUPW: {
    code: 'FUPW', body: 'luxury-van', illustColor: '#7c3aed', passengers: 'vip',
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
    code: 'FOEC', body: 'suv', illustColor: '#34d399', passengers: 'family',
    name: 'みんなでアウトドア型', emoji: '🌲',
    tagline: 'キャンプも遠足も、家族みんなで行こう',
    description: '週末は家族でアウトドアへ。荷物もしっかり積めて燃費もよい、頼りになるコンパクトSUVが家族の冒険を支えます。',
    models: [{ name: 'クロストレック', maker: 'スバル',   url: mu('subaru','crosstrek')  },
             { name: 'ライズ',        maker: 'トヨタ',   url: mu('toyota','raize')      },
             { name: 'ロッキー',      maker: 'ダイハツ', url: mu('daihatsu','rocky')    },
             { name: 'ハスラー',      maker: 'スズキ',   url: mu('suzuki','hustler')    }],
    gradient: 'from-green-400 to-green-600', badge: 'bg-green-100 text-green-700',
    cardBg: 'bg-green-50 hover:bg-green-100 border-green-200',
  },
  FOEW: {
    code: 'FOEW', body: 'minivan', illustColor: '#10b981', passengers: 'family',
    name: '冒険する大家族型', emoji: '🏕️',
    tagline: 'どこへでも行ける、家族の冒険基地',
    description: 'キャンプ道具を積んで、家族全員でアウトドアへ。広い荷室と4WDの頼もしさで、大家族の冒険を完全サポートします。',
    models: [{ name: 'デリカD:5',    maker: '三菱',   url: mu('mitsubishi','delicad5')  },
             { name: 'ノア',         maker: 'トヨタ', url: mu('toyota','noah')          },
             { name: 'アウトランダー', maker: '三菱',  url: mu('mitsubishi','outlander') }],
    gradient: 'from-emerald-500 to-emerald-700', badge: 'bg-emerald-100 text-emerald-700',
    cardBg: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200',
  },
  FOPC: {
    code: 'FOPC', body: 'suv', illustColor: '#f97316', passengers: 'couple',
    name: 'かっこいいアウトドアファミリー型', emoji: '🦁',
    tagline: 'スタイルも、自然も、両方手に入れる',
    description: 'デザインにこだわりながら、家族でアウトドアも楽しみたい。スタイリッシュなSUVが休日をもっとかっこよくしてくれます。',
    models: [{ name: 'ハリアー', maker: 'トヨタ', url: mu('toyota','harrier') },
             { name: 'CX-5',   maker: 'マツダ', url: mu('mazda','cx5')       },
             { name: 'ZR-V',   maker: 'ホンダ', url: mu('honda','zrv')       }],
    gradient: 'from-orange-500 to-orange-700', badge: 'bg-orange-100 text-orange-700',
    cardBg: 'bg-orange-50 hover:bg-orange-100 border-orange-200',
  },
  FOPW: {
    code: 'FOPW', body: 'suv', illustColor: '#ea580c', passengers: 'couple',
    name: '贅沢アウトドアファミリー型', emoji: '🏔️',
    tagline: '最高の自然を、最高の車で体感する',
    description: '大人数でアウトドアに行っても快適さは妥協しない。広くて上質なプレミアムSUVが、家族の贅沢な冒険を演出します。',
    models: [{ name: 'RAV4',       maker: 'トヨタ', url: mu('toyota','rav4')      },
             { name: 'CX-60',      maker: 'マツダ', url: mu('mazda','cx60')       },
             { name: 'フォレスター', maker: 'スバル', url: mu('subaru','forester') }],
    gradient: 'from-amber-500 to-orange-600', badge: 'bg-amber-100 text-amber-700',
    cardBg: 'bg-amber-50 hover:bg-amber-100 border-amber-200',
  },
  // ── Solo × Urban ──────────────────────────────────────────────────────
  SUEC: {
    code: 'SUEC', body: 'hatchback', illustColor: '#2dd4bf', passengers: 'solo',
    name: 'スマートシティドライバー型', emoji: '🌿',
    tagline: '賢く乗って、毎日をもっとお得に',
    description: '街乗りで燃費を最大限活かすスマートな選択。コンパクトで小回りが効いて、駐車も楽なエコカーが毎日の相棒になります。',
    models: [{ name: 'アクア',  maker: 'トヨタ', url: mu('toyota','aqua')   },
             { name: 'ノート',  maker: '日産',   url: mu('nissan','note')   },
             { name: 'フィット', maker: 'ホンダ', url: mu('honda','fit')     },
             { name: 'ワゴンR', maker: 'スズキ', url: mu('suzuki','wagonr') }],
    gradient: 'from-teal-400 to-teal-600', badge: 'bg-teal-100 text-teal-700',
    cardBg: 'bg-teal-50 hover:bg-teal-100 border-teal-200',
  },
  SUEW: {
    code: 'SUEW', body: 'sedan', illustColor: '#06b6d4', passengers: 'solo',
    name: 'エコ通勤エース型', emoji: '🚀',
    tagline: '毎日の通勤を、最もかしこく快適に',
    description: '長距離通勤でも燃費が気にならない。ゆとりある車内と低燃費を両立したハイブリッドセダンが、日々の通勤を快適にします。',
    models: [{ name: 'プリウス', maker: 'トヨタ', url: mu('toyota','prius')  },
             { name: 'リーフ',   maker: '日産',   url: mu('nissan','leaf')   },
             { name: 'キックス', maker: '日産',   url: mu('nissan','kicks')  }],
    gradient: 'from-cyan-500 to-cyan-700', badge: 'bg-cyan-100 text-cyan-700',
    cardBg: 'bg-cyan-50 hover:bg-cyan-100 border-cyan-200',
  },
  SUPC: {
    code: 'SUPC', body: 'sports', illustColor: '#f43f5e', passengers: 'solo',
    name: '走りを極めるシティドライバー型', emoji: '⚡',
    tagline: '街中でも、ドライブは本気で楽しむ',
    description: 'コンパクトでも走りに妥協しない。スポーティなデザインと軽快なハンドリングで、毎日の運転が楽しくなる一台です。',
    models: [{ name: 'GR86',    maker: 'トヨタ', url: mu('toyota','gr86')    },
             { name: 'スイフト', maker: 'スズキ', url: mu('suzuki','swift')   },
             { name: 'シビック', maker: 'ホンダ', url: mu('honda','civic')    },
             { name: 'マツダ3',  maker: 'マツダ', url: mu('mazda','mazda3')   }],
    gradient: 'from-rose-500 to-rose-700', badge: 'bg-rose-100 text-rose-700',
    cardBg: 'bg-rose-50 hover:bg-rose-100 border-rose-200',
  },
  SUPW: {
    code: 'SUPW', body: 'sedan', illustColor: '#eab308', passengers: 'couple',
    name: '大人の余裕セダン型', emoji: '🌟',
    tagline: '上質な移動が、あなたのステータスを語る',
    description: '乗り心地、デザイン、存在感——すべてにこだわるあなたへ。余裕のある大人のためのプレミアムセダンが理想です。',
    models: [{ name: 'クラウン',  maker: 'トヨタ', url: mu('toyota','crown')   },
             { name: 'レヴォーグ', maker: 'スバル', url: mu('subaru','levorg')  },
             { name: 'カムリ',    maker: 'トヨタ', url: mu('toyota','camry')   }],
    gradient: 'from-yellow-500 to-amber-600', badge: 'bg-yellow-100 text-yellow-700',
    cardBg: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200',
  },
  // ── Solo × Outdoor ────────────────────────────────────────────────────
  SOEC: {
    code: 'SOEC', body: 'kei', illustColor: '#78716c', passengers: 'solo',
    name: '孤高の冒険者型', emoji: '🗻',
    tagline: '一人でどこまでも、自分の道を行く',
    description: '行き先は自分で決める。どんな悪路もへっちゃらなコンパクトオフローダーで、誰も知らない絶景を目指しましょう。',
    models: [{ name: 'ジムニー', maker: 'スズキ',   url: mu('suzuki','jimny')    },
             { name: 'タフト',   maker: 'ダイハツ', url: mu('daihatsu','taft')   },
             { name: 'CX-3',    maker: 'マツダ',   url: mu('mazda','cx3')        }],
    gradient: 'from-stone-500 to-stone-700', badge: 'bg-stone-100 text-stone-700',
    cardBg: 'bg-stone-50 hover:bg-stone-100 border-stone-200',
  },
  SOEW: {
    code: 'SOEW', body: 'suv', illustColor: '#16a34a', passengers: 'solo',
    name: '自然と生きるアウトドア型', emoji: '🌲',
    tagline: '週末は山へ、フィールドが自分の庭',
    description: '釣りにキャンプに登山——道具をたっぷり積んで、自然の中へ。余裕のある積載力と走破性を持つSUVが相棒になります。',
    models: [{ name: 'XV',         maker: 'スバル', url: mu('subaru','xv')        },
             { name: 'エクストレイル', maker: '日産', url: mu('nissan','xtrail')   },
             { name: 'アウトバック',  maker: 'スバル', url: mu('subaru','outback') }],
    gradient: 'from-green-600 to-green-800', badge: 'bg-green-100 text-green-700',
    cardBg: 'bg-green-50 hover:bg-green-100 border-green-200',
  },
  SOPC: {
    code: 'SOPC', body: 'suv', illustColor: '#0ea5e9', passengers: 'solo',
    name: '都会派アウトドアマン型', emoji: '🦅',
    tagline: '街でもかっこよく、自然でも頼もしく',
    description: '都市の洗練さとアウトドアの機能性を両立したい。スタイリッシュなクロスオーバーSUVがそのニーズに答えます。',
    models: [{ name: 'C-HR',          maker: 'トヨタ', url: mu('toyota','chr')               },
             { name: 'CX-30',         maker: 'マツダ', url: mu('mazda','cx30')                },
             { name: 'エクリプスクロス', maker: '三菱', url: mu('mitsubishi','eclipsecross')   }],
    gradient: 'from-sky-500 to-sky-700', badge: 'bg-sky-100 text-sky-700',
    cardBg: 'bg-sky-50 hover:bg-sky-100 border-sky-200',
  },
  SOPW: {
    code: 'SOPW', body: 'suv', illustColor: '#6366f1', passengers: 'couple',
    name: '完璧主義のドライバー型', emoji: '💎',
    tagline: 'スタイルも走りも自然も、すべてを手に入れる',
    description: 'プレミアムな乗り心地で、本格的なアウトドアへ。デザインと性能の両方を極めたプレミアムSUVが、あなたの理想です。',
    models: [{ name: 'ランドクルーザー', maker: 'トヨタ', url: mu('toyota','landcruiser') },
             { name: 'CX-8',          maker: 'マツダ', url: mu('mazda','cx8')            },
             { name: 'ヤリスクロス',   maker: 'トヨタ', url: mu('toyota','yariscross')    }],
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
  // answers[i] は選択肢 index (0〜3) をそのまま加算
  // 0=A強 / 1=A弱 / 2=B弱 / 3=B強
  // 3問×最大3点 = 最大9点。5点以上でB極。
  QUESTIONS.forEach((q, i) => { if (i < answers.length) score[q.axis] += answers[i]; });
  return [
    score.fs <= 4 ? 'F' : 'S',
    score.uo <= 4 ? 'U' : 'O',
    score.ep <= 4 ? 'E' : 'P',
    score.cw <= 4 ? 'C' : 'W',
  ].join('');
}
