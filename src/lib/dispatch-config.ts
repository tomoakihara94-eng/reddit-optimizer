export const STAFF = [
  { id: 'oori',     name: '大類',  rank: 'A' },
  { id: 'asakura',  name: '朝倉',  rank: 'A' },
  { id: 'ishigami', name: '石神',  rank: 'A' },
  { id: 'haraki',   name: '原木',  rank: 'B' },
  { id: 'yamato',   name: '大和',  rank: 'B' },
  { id: 'hara',     name: '原',    rank: 'C' },
] as const;

export type StaffMember = typeof STAFF[number];
export type Rank = 'A' | 'B' | 'C';

export const RANK_ORDER: Record<Rank, number> = { A: 3, B: 2, C: 1 };
export const WINDOW_MS = 30_000;
