export type Rank = 'A' | 'B' | 'C';
export type StaffMember = { id: string; name: string; rank: Rank };

export const STAFF: readonly StaffMember[] = [
  { id: 'asakura',   name: '浅倉',   rank: 'B' },
  { id: 'ishigami',  name: '石神',   rank: 'B' },
  { id: 'ishiyama',  name: '石山',   rank: 'B' },
  { id: 'ito',       name: '伊藤',   rank: 'B' },
  { id: 'otaki',     name: '大瀧',   rank: 'B' },
  { id: 'oba',       name: '大庭',   rank: 'B' },
  { id: 'omatsu',    name: '大松',   rank: 'B' },
  { id: 'oori',      name: '大類',   rank: 'B' },
  { id: 'kakizaki',  name: '柿崎',   rank: 'B' },
  { id: 'kyotoku',   name: '教徳',   rank: 'B' },
  { id: 'kondo',     name: '近藤',   rank: 'B' },
  { id: 'sato',      name: '佐藤',   rank: 'B' },
  { id: 'shinomi',   name: '四野見', rank: 'B' },
  { id: 'takahiro',  name: '孝宏',   rank: 'B' },
  { id: 'chihara',   name: '千原',   rank: 'B' },
  { id: 'hara',      name: '原',     rank: 'B' },
  { id: 'haraki',    name: '原木',   rank: 'B' },
  { id: 'motonari',  name: '基成',   rank: 'B' },
  { id: 'yamato',    name: '大和',   rank: 'B' },
];

// ─── 担当者の決め方 ───────────────────────────────
// 得点 =（応答 ＋ コンディション ＋ 実績台数 × 0.1）× お客様タイプ別の得意係数
// 得点が同じなら先に押した人。

// 来店通知の後に営業が選ぶ応答
export const RESPONSES = {
  'いくぜ':           40,
  '行けたら行きたい': 30,
  '普通':             20,
  '今は無理かも':     10,
  '対応中':            0,
} as const;
export type Response = keyof typeof RESPONSES;
export const DEFAULT_RESPONSE: Response = '普通'; // 応答を送らない旧クライアント（Web版など）用

// 営業が来店通知の前にあらかじめ選んでおくコンディション
export const STAFF_CONDITIONS = {
  '絶好調': 8,
  '好調':   6,
  '普通':   4,
  '不調':   2,
  '絶不調': 0,
} as const;
export type StaffCondition = keyof typeof STAFF_CONDITIONS;

// 実績（台数）
export const SALES_UNITS: Record<string, number> = {
  asakura:  42,   // 浅倉
  ishigami: 29,   // 石神
  ishiyama: 28,   // 石山
  ito:      12,   // 伊藤
  otaki:    14,   // 大瀧
  oba:      24,   // 大庭
  omatsu:   13,   // 大松
  oori:     28,   // 大類
  kakizaki: 30,   // 柿崎
  kyotoku:  20,   // 教徳
  kondo:    13,   // 近藤
  sato:      9,   // 佐藤
  shinomi:  40,   // 四野見
  takahiro: 29,   // 孝宏
  chihara:  22,   // 千原
  hara:      7,   // 原
  haraki:   17,   // 原木
  motonari: 36,   // 基成
  yamato:    3,   // 大和
};
export const SALES_UNITS_WEIGHT = 0.1;

// 差配者が選ぶお客様のタイプ（営業側には見せない）
export const CUSTOMER_TYPES = ['軽自動車', '普通車', 'オークション探し', '？', 'バン・トラック'] as const;
export type CustomerType = typeof CUSTOMER_TYPES[number];

// お客様タイプ別の得意度（1〜10）。管理者画面から入力し Redis に保存。係数 = 得意度 × 0.1
export const AFFINITY_MIN = 1;
export const AFFINITY_MAX = 10;
export const AFFINITY_DEFAULT = 10; // 未入力は 10（係数 1.0 = 影響なし）
export const AFFINITY_WEIGHT = 0.1;
export type AffinityTable = Record<string, Partial<Record<CustomerType, number>>>;

export const RANK_ORDER: Record<Rank, number> = { A: 3, B: 2, C: 1 };
export const WINDOW_MS = 30_000;
