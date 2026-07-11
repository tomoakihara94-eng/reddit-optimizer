import type { CarBody, PassengerType } from '@/components/CarIllustration';

export type PAxis = 'an' | 'gs' | 'ck' | 'wl';

export interface PQuestion {
  axis: PAxis;
  question: string;
  options: [{ label: string; emoji: string }, { label: string; emoji: string }];
}

export interface CarMatch {
  name: string;
  maker: string;
  body: CarBody;
  illustColor: string;
  passengers: PassengerType;
  reason: string;
  url: string;
}

export interface PersonalityType {
  code: string;
  name: string;
  emoji: string;
  tagline: string;
  personality: string;
  drivingStyle: string;
  cars: CarMatch[];
  gradient: string;
  accentColor: string;
  compatibleWith: [string, string];
}

const B = 'https://www.ecar.co.jp';
const mu = (maker: string, model: string) =>
  `${B}/maker_${maker}/model_${model}/type_0/price_0_1/car.html`;

export const P_QUESTIONS: PQuestion[] = [
  {
    axis: 'an',
    question: '週末に何もない日、気づいたらどっちにいる？',
    options: [
      { label: 'どこかに出かけてる', emoji: '🚗' },
      { label: '家やお気に入りの場所でのんびり', emoji: '🏠' },
    ],
  },
  {
    axis: 'an',
    question: '気になるお店を見つけたとき、どっちに近い？',
    options: [
      { label: 'すぐ行く。とにかく行ってみる', emoji: '⚡' },
      { label: 'じっくり調べてから、タイミングを見て行く', emoji: '🔍' },
    ],
  },
  {
    axis: 'gs',
    question: 'ドライブするなら？',
    options: [
      { label: '友達や家族と、みんなで行きたい', emoji: '👥' },
      { label: 'ひとりか少人数で、自分のペースで', emoji: '🎧' },
    ],
  },
  {
    axis: 'gs',
    question: '車内の雰囲気、好みは？',
    options: [
      { label: 'みんなで盛り上がる、わいわい空間', emoji: '🎵' },
      { label: '好きな音楽・ポッドキャスト、自分だけの時間', emoji: '🎶' },
    ],
  },
  {
    axis: 'ck',
    question: 'インテリアを選ぶなら？',
    options: [
      { label: 'モノトーン・シンプル・かっこいい系', emoji: '🖤' },
      { label: 'カラフル・ナチュラル・温かみのある系', emoji: '🌸' },
    ],
  },
  {
    axis: 'ck',
    question: '自分のスタイルに一番近いのは？',
    options: [
      { label: 'スッキリ、余計なものはいらない派', emoji: '🕶️' },
      { label: '個性的・ポップ、自分らしさを表現したい派', emoji: '🌈' },
    ],
  },
  {
    axis: 'wl',
    question: '荷物は？',
    options: [
      { label: 'いろいろ持ちたい、多めでもOK', emoji: '🎒' },
      { label: '最小限で身軽にしたい', emoji: '👜' },
    ],
  },
  {
    axis: 'wl',
    question: '車のサイズ感の好みは？',
    options: [
      { label: '余裕と安心感のある大きめが好き', emoji: '🚐' },
      { label: '小回りが効くコンパクトが好き', emoji: '🔑' },
    ],
  },
];

// sum < 2 → first pole (ties favor first), sum >= 2 → second pole
export function calcPersonality(answers: number[]): string {
  const poles = [0, 1, 2, 3].map(i => {
    const a = answers[i * 2] ?? 0;
    const b = answers[i * 2 + 1] ?? 0;
    return (a + b) < 2 ? 0 : 1;
  });
  return [
    poles[0] === 0 ? 'A' : 'N',
    poles[1] === 0 ? 'G' : 'S',
    poles[2] === 0 ? 'C' : 'K',
    poles[3] === 0 ? 'W' : 'L',
  ].join('');
}

export const PERSONALITY_TYPES: Record<string, PersonalityType> = {
  AGCW: {
    code: 'AGCW', name: '冒険隊長', emoji: '🏔️',
    tagline: 'みんなを連れて、どこまでも行く',
    personality: '行動力とリーダーシップが武器。友達を引き連れてどんな場所にも向かえるタフさと、クールな雰囲気を両立している。大自然の中でも都会でも、常にみんなの中心にいる存在。',
    drivingStyle: '目的地は自分が決める。道中はみんなでわいわい、でも運転は真剣。頼りになるドライバー。',
    cars: [
      { name: 'ランドクルーザー', maker: 'トヨタ', body: 'suv', illustColor: '#374151', passengers: 'couple', url: mu('toyota','landcruiser'), reason: '圧倒的な存在感と走破性。あなたのリーダー気質に応えてくれる、本物の冒険車。' },
      { name: 'RAV4',           maker: 'トヨタ', body: 'suv', illustColor: '#1d4ed8', passengers: 'couple', url: mu('toyota','rav4'),        reason: '実用性と冒険心のバランスが絶妙。仲間との旅行も、ひとりの遠征も全てこなす万能SUV。' },
      { name: 'アウトランダー',   maker: '三菱',   body: 'suv', illustColor: '#064e3b', passengers: 'family', url: mu('mitsubishi','outlander'), reason: '7人乗れる大きさで、大人数の冒険にも対応。あなたの行動範囲をさらに広げてくれる。' },
    ],
    gradient: 'from-slate-700 to-indigo-900', accentColor: '#6366f1',
    compatibleWith: ['NGCW', 'ASCW'],
  },
  AGCL: {
    code: 'AGCL', name: 'シティリーダー', emoji: '🌆',
    tagline: '都会のセンスで、みんなをまとめる',
    personality: '流行に敏感でスタイリッシュ。友達グループの中で自然とリーダーになるが、無理に目立とうとしないクールさが魅力。都市を自分のホームにしている、センスの塊。',
    drivingStyle: '街中をスマートに走る。派手な運転はしないが、センスを感じさせる走り方ができる。',
    cars: [
      { name: 'ヴェゼル',  maker: 'ホンダ', body: 'suv',      illustColor: '#dc2626', passengers: 'couple', url: mu('honda','vezel'),   reason: 'スタイリッシュなデザインと使い勝手の良さを兼備。都会派リーダーにぴったりのSUV。' },
      { name: 'C-HR',    maker: 'トヨタ', body: 'suv',      illustColor: '#1e293b', passengers: 'couple', url: mu('toyota','chr'),    reason: '個性的なフォルムが街で目立つ。あなたのセンスの良さをさりげなく主張できる一台。' },
      { name: 'マツダ3',  maker: 'マツダ', body: 'hatchback', illustColor: '#7c3aed', passengers: 'couple', url: mu('mazda','mazda3'),  reason: '洗練されたデザインで高級感も漂う。友達からセンスを褒められること間違いなし。' },
    ],
    gradient: 'from-indigo-600 to-blue-800', accentColor: '#60a5fa',
    compatibleWith: ['NGCL', 'AGCW'],
  },
  AGKW: {
    code: 'AGKW', name: 'パーティキャプテン', emoji: '🎉',
    tagline: 'みんなの笑顔が、あなたのエネルギー',
    personality: '誰とでもすぐ仲良くなれる、場を盛り上げる天才。大人数でわいわいするのが何より好き。温かみのある雰囲気を大切にしながら、どこでも楽しい空間を作り出す。',
    drivingStyle: '車内BGMの選曲を担当し、みんなのテンションを上げるのが得意。乗り降りのサポートも完璧。',
    cars: [
      { name: 'ヴォクシー',    maker: 'トヨタ', body: 'minivan', illustColor: '#1e40af', passengers: 'family', url: mu('toyota','voxy'),      reason: '大人数を快適に乗せられる広い車内。あなたの「みんなで行こう」精神を完全サポート。' },
      { name: 'セレナ',        maker: '日産',   body: 'minivan', illustColor: '#831843', passengers: 'family', url: mu('nissan','serena'),     reason: '後席の乗り心地が特に優秀。みんなが快適に楽しめる、まさにパーティ仕様のミニバン。' },
      { name: 'デリカD:5',     maker: '三菱',   body: 'minivan', illustColor: '#78350f', passengers: 'family', url: mu('mitsubishi','delicad5'), reason: '悪路もへっちゃら。アウトドアパーティもドライブ旅行も、どんなシーンにも対応できる最強ミニバン。' },
    ],
    gradient: 'from-orange-400 to-pink-600', accentColor: '#f97316',
    compatibleWith: ['NGKW', 'AGKL'],
  },
  AGKL: {
    code: 'AGKL', name: '笑顔メーカー', emoji: '😊',
    tagline: 'どこに行っても、みんなが笑顔になる',
    personality: '明るくて気遣いができる、コミュニティの太陽。コンパクトでもみんなと一緒なら最高の冒険になると知っている。フレンドリーで裏表がない、自然体の魅力がある。',
    drivingStyle: '会話が弾む助手席泥棒。でも安全運転でみんなを気持ちよく送り届ける。',
    cars: [
      { name: 'シエンタ', maker: 'トヨタ', body: 'hatchback', illustColor: '#f97316', passengers: 'family', url: mu('toyota','sienta'), reason: '小さめなのに最大7人乗れる。あなたの「全員乗れる！」精神にぴったりのコンパクトミニバン。' },
      { name: 'フリード', maker: 'ホンダ', body: 'hatchback', illustColor: '#0ea5e9', passengers: 'family', url: mu('honda','freed'),   reason: '親しみやすいデザインと使いやすさ。気軽に友達を乗せてどこへでも行ける相棒。' },
      { name: 'ルーミー', maker: 'トヨタ', body: 'hatchback', illustColor: '#ec4899', passengers: 'family', url: mu('toyota','roomy'),  reason: '背が高くて居住性抜群。みんながリラックスできる温かみのある車内が魅力。' },
    ],
    gradient: 'from-yellow-400 to-orange-500', accentColor: '#fbbf24',
    compatibleWith: ['NGKL', 'AGKW'],
  },
  ASCW: {
    code: 'ASCW', name: 'ワイルドライダー', emoji: '🐺',
    tagline: 'ひとりで、どこまでも行ける',
    personality: '自立していてクール。ひとりでどこへでも行けるタフさと、大自然の中でも動じない冷静さがある。集団より単独行動が好きで、自分だけの道を切り開くことに喜びを感じる。',
    drivingStyle: '目的地は自分だけが知っている。山道も悪路も楽しみながら走る、本物のドライバー。',
    cars: [
      { name: 'エクストレイル', maker: '日産',   body: 'suv', illustColor: '#1f2937', passengers: 'solo', url: mu('nissan','xtrail'),   reason: '悪路もオンロードも自在にこなす万能SUV。あなたのひとり旅をどこまでも支えてくれる。' },
      { name: 'フォレスター',   maker: 'スバル', body: 'suv', illustColor: '#166534', passengers: 'solo', url: mu('subaru','forester'),  reason: '走行安定性と積載力が高水準で両立。ひとりで山奥に乗り込む、そのシーンが目に浮かぶ。' },
      { name: 'CX-5',          maker: 'マツダ', body: 'suv', illustColor: '#7c3aed', passengers: 'solo', url: mu('mazda','cx5'),        reason: 'スタイリッシュな外観でひとりの時間をかっこよく演出。長距離でも疲れにくい。' },
    ],
    gradient: 'from-stone-700 to-slate-900', accentColor: '#94a3b8',
    compatibleWith: ['AGCW', 'NSCW'],
  },
  ASCL: {
    code: 'ASCL', name: 'スピードスター', emoji: '⚡',
    tagline: '走ることが、自分を表現すること',
    personality: 'スポーティで瞬発力があり、かっこよさへのこだわりが人一倍強い。コンパクトでも速くてかっこいい方が好き。運転そのものが楽しくて仕方がない、本物のドライビングラバー。',
    drivingStyle: '走ることが好きで、助手席には座っていられないタイプ。ワインディングでも臆せず走る。',
    cars: [
      { name: 'GR86',        maker: 'トヨタ', body: 'sports', illustColor: '#dc2626', passengers: 'solo', url: mu('toyota','gr86'),  reason: '純粋に走る楽しさを追求したスポーツカー。あなたの「運転が好き」という気持ちに完璧に応える。' },
      { name: 'シビック',     maker: 'ホンダ', body: 'sports', illustColor: '#1e293b', passengers: 'solo', url: mu('honda','civic'),  reason: 'スポーティさと実用性を両立。かっこよく日常を走りたいあなたにとって理想の相棒。' },
      { name: 'スイフトスポーツ', maker: 'スズキ', body: 'sports', illustColor: '#ea580c', passengers: 'solo', url: mu('suzuki','swift'), reason: 'コンパクトでも走りは本格派。軽快なハンドリングの楽しさをあなたにぴったり届ける。' },
    ],
    gradient: 'from-red-600 to-rose-900', accentColor: '#f43f5e',
    compatibleWith: ['AGCL', 'NSCL'],
  },
  ASKW: {
    code: 'ASKW', name: '自由な旅人', emoji: '🌿',
    tagline: '気の向くまま、風の行く方へ',
    personality: '自由奔放で好奇心旺盛。かわいいものや自然が好きで、ひとりでもどこへでも行ける行動力がある。計画より直感、地図より感覚で動くタイプ。旅の途中の発見が何よりも好き。',
    drivingStyle: '気になる道があったら即ハンドルを切る。目的地は出発してから決めることも多い。',
    cars: [
      { name: 'ハスラー',      maker: 'スズキ',   body: 'kei', illustColor: '#f59e0b', passengers: 'solo', url: mu('suzuki','hustler'),    reason: 'ポップでかわいいのに未舗装路もOKな万能軽。あなたの自由な旅をどこまでも連れて行く。' },
      { name: 'クロストレック', maker: 'スバル',   body: 'suv', illustColor: '#0d9488', passengers: 'solo', url: mu('subaru','crosstrek'),  reason: '小さめなのに走破性が高い。ナチュラルな外観があなたの旅のスタイルにぴったり合う。' },
      { name: 'ロッキー',      maker: 'ダイハツ', body: 'suv', illustColor: '#16a34a', passengers: 'solo', url: mu('daihatsu','rocky'),    reason: 'コンパクトSUVなのにアウトドア性能抜群。自由に走り回りたいあなたの価値観に共鳴する。' },
    ],
    gradient: 'from-green-500 to-teal-700', accentColor: '#34d399',
    compatibleWith: ['AGKW', 'NSKW'],
  },
  ASKL: {
    code: 'ASKL', name: '一匹狼アドベンチャラー', emoji: '🦊',
    tagline: '最小限で、最大限に楽しむ',
    personality: '身軽さが武器。最小限の荷物でひとり旅に飛び出し、思わぬ絶景を見つけるのが得意。かわいいものが好きでもアクティブ。小さくてもパワーのある、しなやかな強さを持っている。',
    drivingStyle: '小さい車の機動力を最大限に活かす。細い道も悪路も、身軽に突き進む。',
    cars: [
      { name: 'ジムニー', maker: 'スズキ',   body: 'kei', illustColor: '#4b5563', passengers: 'solo', url: mu('suzuki','jimny'),   reason: '軽自動車最強の走破性。小さくてかわいいのに本格オフロードをこなせる、あなたの分身のような車。' },
      { name: 'タフト',   maker: 'ダイハツ', body: 'kei', illustColor: '#2563eb', passengers: 'solo', url: mu('daihatsu','taft'),  reason: 'ガラスルーフで開放感たっぷり。ひとりで走る時間をもっと特別にしてくれるアウトドア軽。' },
      { name: 'N-BOX',   maker: 'ホンダ',   body: 'kei', illustColor: '#dc2626', passengers: 'solo', url: mu('honda','nbox'),    reason: '広い室内とかわいいデザインで、ひとりの空間を快適に。どこでも停めやすい小回りも魅力。' },
    ],
    gradient: 'from-amber-500 to-orange-700', accentColor: '#f97316',
    compatibleWith: ['ASKW', 'NSKL'],
  },
  NGCW: {
    code: 'NGCW', name: '帝王', emoji: '👑',
    tagline: '余裕と品格が、最高のおもてなし',
    personality: '落ち着いていて品があり、一緒にいる人を居心地よくさせる才能がある。派手ではないが、そこにいるだけで場の空気が変わる。高いものへのこだわりは、周囲への敬意の表れでもある。',
    drivingStyle: '急がない。ゆったりと走りながら、助手席の人が一番リラックスできる運転を心がける。',
    cars: [
      { name: 'アルファード',   maker: 'トヨタ', body: 'luxury-van', illustColor: '#1e1b4b', passengers: 'vip', url: mu('toyota','alphard'),  reason: '日本最高峰の高級ミニバン。乗り込んだ瞬間に格が違うとわかる、まさに帝王の車。' },
      { name: 'ヴェルファイア', maker: 'トヨタ', body: 'luxury-van', illustColor: '#111827', passengers: 'vip', url: mu('toyota','vellfire'), reason: '威圧感のある迫力フェイスと豪華な内装。あなたの「余裕と品格」を外からも内からも体現する。' },
      { name: 'エルグランド',   maker: '日産',   body: 'luxury-van', illustColor: '#0f172a', passengers: 'vip', url: mu('nissan','elgrand'),  reason: '上質な内装と静粛性で、移動時間そのものが贅沢な体験に。VIPを乗せるならこの一択。' },
    ],
    gradient: 'from-gray-800 to-purple-950', accentColor: '#a855f7',
    compatibleWith: ['AGCW', 'NSCW'],
  },
  NGCL: {
    code: 'NGCL', name: 'アーバンクール', emoji: '🌃',
    tagline: '都会に溶け込む、知的なドライバー',
    personality: '知的でスマート。友達と過ごす時間も大切にしながら、どこかひとりの時間も確保している。都市生活に精通していて、センスのいい選択をさりげなくする。',
    drivingStyle: '無駄のない運転が信条。渋滞でもイライラせず、いつも余裕を見せられる。',
    cars: [
      { name: 'プリウス',  maker: 'トヨタ', body: 'sedan', illustColor: '#0f766e', passengers: 'couple', url: mu('toyota','prius'),  reason: '洗練されたデザインと圧倒的な燃費。都市生活のスマートさを体現するハイブリッドセダン。' },
      { name: 'カムリ',    maker: 'トヨタ', body: 'sedan', illustColor: '#1e40af', passengers: 'couple', url: mu('toyota','camry'),  reason: 'ゆとりある大人のセダン。静粛性と快適性が高く、会話を楽しみながらの移動に最適。' },
      { name: 'レヴォーグ', maker: 'スバル', body: 'sedan', illustColor: '#1d4ed8', passengers: 'couple', url: mu('subaru','levorg'), reason: 'スポーティさと実用性を両立したワゴン。クールな外見で都会にも自然にも馴染む。' },
    ],
    gradient: 'from-slate-700 to-cyan-900', accentColor: '#22d3ee',
    compatibleWith: ['AGCL', 'NSCL'],
  },
  NGKW: {
    code: 'NGKW', name: 'みんなのアイドル', emoji: '🌟',
    tagline: 'いるだけで、場が和む',
    personality: '誰からも愛される、天然の人たらし。温かくて自然とみんなが集まってくる。大きな空間でみんながゆったりできる環境を好む。争いが嫌いで、平和を大切にする。',
    drivingStyle: '同乗者全員が快適かどうかをいつも気にしている。音楽もみんなの好みを優先する。',
    cars: [
      { name: 'オデッセイ',    maker: 'ホンダ', body: 'minivan', illustColor: '#4338ca', passengers: 'family', url: mu('honda','odyssey'),  reason: '上質な居住空間と洗練されたデザイン。みんなが快適でいられる、アイドルにふさわしい空間。' },
      { name: 'ステップワゴン', maker: 'ホンダ', body: 'minivan', illustColor: '#0369a1', passengers: 'family', url: mu('honda','stepwgn'),  reason: '広くて使いやすく全員がリラックスできる。あなたの「みんな笑顔」を叶えてくれるミニバン。' },
      { name: 'ノア',          maker: 'トヨタ', body: 'minivan', illustColor: '#7c3aed', passengers: 'family', url: mu('toyota','noah'),    reason: '室内の広さと快適さが最高クラス。一緒にいる全員をVIP待遇にできる、あなたにぴったりの車。' },
    ],
    gradient: 'from-pink-500 to-violet-700', accentColor: '#ec4899',
    compatibleWith: ['AGKW', 'NGKL'],
  },
  NGKL: {
    code: 'NGKL', name: 'ほっこりリーダー', emoji: '☕',
    tagline: '温かさが、いちばんの強み',
    personality: '気が利いて温かく、一緒にいると安心感がある。大きな声を出さなくてもみんながついてくる穏やかなリーダー。小さなことへの気遣いが得意で、コミュニティをそっと支えている。',
    drivingStyle: '丁寧で落ち着いた運転。急発進・急ブレーキをしないので、同乗者が安心して眠れる。',
    cars: [
      { name: 'タント',   maker: 'ダイハツ', body: 'hatchback', illustColor: '#ec4899', passengers: 'couple', url: mu('daihatsu','tanto'),  reason: '大きなドア開口部でみんなが乗り降りしやすい。温かい気遣いを形にしたような車。' },
      { name: 'スペーシア', maker: 'スズキ',   body: 'hatchback', illustColor: '#8b5cf6', passengers: 'couple', url: mu('suzuki','spacia'),   reason: '収納上手で室内広々。みんなが快適に過ごせる環境づくりが得意なあなたの分身みたいな車。' },
      { name: 'ソリオ',   maker: 'スズキ',   body: 'hatchback', illustColor: '#0ea5e9', passengers: 'couple', url: mu('suzuki','solio'),    reason: 'コンパクトなのに5人乗れる実力派。ほっこり系のルックスがあなたの雰囲気にぴったり。' },
    ],
    gradient: 'from-rose-400 to-pink-600', accentColor: '#fb7185',
    compatibleWith: ['AGKL', 'NSKL'],
  },
  NSCW: {
    code: 'NSCW', name: '孤高の美学者', emoji: '🎨',
    tagline: 'こだわりが、あなたの美学',
    personality: '審美眼が高く、自分の美学を大切にする。社交的ではないが、一人一人との深い関係を重視する。独自の価値観を持ち、流行より本質を見極めることができる。',
    drivingStyle: '自分が完璧と思う一台だけに乗り続ける。そのこだわりが走り方にも現れる。',
    cars: [
      { name: 'クラウン', maker: 'トヨタ', body: 'sedan',    illustColor: '#1e293b', passengers: 'solo', url: mu('toyota','crown'),  reason: '日本が誇る高級セダンの代名詞。こだわりを持つあなたが選ぶべき、本物の上質さがある車。' },
      { name: 'CX-60',   maker: 'マツダ', body: 'suv',      illustColor: '#7f1d1d', passengers: 'solo', url: mu('mazda','cx60'),    reason: '芸術的なデザインと走りへのこだわりが詰まった、美学を持つドライバーのためのSUV。' },
      { name: 'マツダ3',  maker: 'マツダ', body: 'hatchback', illustColor: '#312e81', passengers: 'solo', url: mu('mazda','mazda3'),  reason: '日本車離れした洗練されたデザイン。「本物にしか興味がない」というあなたの姿勢と共鳴する。' },
    ],
    gradient: 'from-zinc-800 to-slate-950', accentColor: '#cbd5e1',
    compatibleWith: ['NGCW', 'ASCW'],
  },
  NSCL: {
    code: 'NSCL', name: 'シンプリスト', emoji: '🌙',
    tagline: 'シンプルの中に、本当の豊かさがある',
    personality: 'ミニマルな生き方を愛し、本当に必要なものだけで生きることを美徳とする。スマートで無駄がなく、合理的な判断が得意。周囲に流されない自分軸を持っている。',
    drivingStyle: '無駄な操作をしない、滑らかで効率的な運転。燃費を常に意識している。',
    cars: [
      { name: 'アクア', maker: 'トヨタ', body: 'hatchback', illustColor: '#0d9488', passengers: 'solo', url: mu('toyota','aqua'),  reason: 'シンプルなデザインと最高水準の燃費。必要なものだけを追求したあなたのための究極のエコカー。' },
      { name: 'ノート', maker: '日産',   body: 'hatchback', illustColor: '#0369a1', passengers: 'solo', url: mu('nissan','note'),  reason: 'e-POWERの滑らかな加速が心地よい。シンプルながら走りにもこだわるあなたにフィットする。' },
      { name: 'フィット', maker: 'ホンダ', body: 'hatchback', illustColor: '#64748b', passengers: 'solo', url: mu('honda','fit'),    reason: '無駄を削ぎ落としたコンパクトカーの完成形。シンプリストのあなたが辿り着く答え。' },
    ],
    gradient: 'from-slate-600 to-blue-900', accentColor: '#93c5fd',
    compatibleWith: ['NGCL', 'ASCL'],
  },
  NSKW: {
    code: 'NSKW', name: 'マイペース探索者', emoji: '🌄',
    tagline: '急がなくていい。自分のペースで発見する',
    personality: '自分のペースを大切にする、穏やかな探索者。かわいいものや自然が好きで、ゆっくりと時間をかけて物事を楽しむ。無理をしないが、気がつけばいろんなところに行っている。',
    drivingStyle: '急がない運転が信条。遠回りでも景色のいい道を選ぶ。目的地より道中を楽しむタイプ。',
    cars: [
      { name: 'CX-30',     maker: 'マツダ', body: 'suv', illustColor: '#c2410c', passengers: 'solo', url: mu('mazda','cx30'),         reason: '程よいサイズ感と上質な乗り心地。ゆったりドライブを楽しみたいあなたにちょうどいいSUV。' },
      { name: 'XV',        maker: 'スバル', body: 'suv', illustColor: '#15803d', passengers: 'solo', url: mu('subaru','xv'),           reason: '自然の中でも街でも映えるナチュラルなSUV。あなたのまったりドライブライフに馴染む一台。' },
      { name: 'ヤリスクロス', maker: 'トヨタ', body: 'suv', illustColor: '#0284c7', passengers: 'solo', url: mu('toyota','yariscross'), reason: 'コンパクトSUVながら快適性が高い。マイペースな旅を燃費よく続けられる頼もしい相棒。' },
    ],
    gradient: 'from-emerald-600 to-teal-900', accentColor: '#6ee7b7',
    compatibleWith: ['ASKW', 'NGKL'],
  },
  NSKL: {
    code: 'NSKL', name: '静かな癒し系', emoji: '🌸',
    tagline: 'あなたのそばにいると、なぜか落ち着く',
    personality: 'そこにいるだけで周りが癒される、不思議な存在感の持ち主。内心は好奇心旺盛で、ひとりで好きなことに熱中できる。自分のペースで、無理せず生きることが上手。',
    drivingStyle: 'ゆっくりでいい。丁寧に、大切に運転する。信号待ちで景色を眺める余裕がある。',
    cars: [
      { name: 'ワゴンR', maker: 'スズキ',   body: 'kei', illustColor: '#d1d5db', passengers: 'solo', url: mu('suzuki','wagonr'), reason: '長年愛され続ける軽の定番。シンプルで使いやすく、あなたの穏やかな日常にそっと寄り添う。' },
      { name: 'N-BOX',  maker: 'ホンダ',   body: 'kei', illustColor: '#fca5a5', passengers: 'solo', url: mu('honda','nbox'),    reason: '日本一売れている軽自動車。広い室内でひとりの時間を快適に過ごせる優しい空間。' },
      { name: 'タント',  maker: 'ダイハツ', body: 'kei', illustColor: '#fbcfe8', passengers: 'solo', url: mu('daihatsu','tanto'), reason: 'かわいいデザインと使いやすいドア。あなたの「静かで穏やかな日常」にぴったりの相棒。' },
    ],
    gradient: 'from-pink-400 to-rose-600', accentColor: '#f9a8d4',
    compatibleWith: ['NGKL', 'ASKL'],
  },
};
