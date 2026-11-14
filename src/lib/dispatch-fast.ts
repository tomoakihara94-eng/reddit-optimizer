import type { Redis } from '@upstash/redis';
import { WINDOW_MS, AFFINITY_DEFAULT } from './dispatch-config';

// 即決定方式。管理者画面「当選の設定 → 即決定」で変更し、Redis に保存する
//   tiers[i]: 来店通知から afterSec 秒以降、minScore 点以上の応答があればその場で当選を決める
//   gates[i]: 得意度（そのお客様タイプ）が maxAffinity 以下の人には、tiers[i+1] の秒数まで来店通知を送らない
//   keepNotify: 30秒たっても当選者がいなければ、everySec 秒ごとに 来店通知から untilSec 秒まで通知を送り続ける。
//               untilSec を過ぎても決まらなければ受付終了（担当なし・差配者が対応）
export type FastRules = {
  enabled: boolean;
  tiers: { minScore: number; afterSec: number }[];
  gates: { maxAffinity: number }[];
  keepNotify: { everySec: number; untilSec: number };
};

export const DEFAULT_FAST_RULES: FastRules = {
  enabled: true,
  tiers: [{ minScore: 36, afterSec: 0 }, { minScore: 33, afterSec: 10 }, { minScore: 30, afterSec: 20 }],
  gates: [{ maxAffinity: 5 }, { maxAffinity: 3 }],
  keepNotify: { everySec: 5, untilSec: 50 },
};

export const FAST_RULES_KEY = 'dispatch:fast_rules';

const int = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) ? v : NaN);

// 管理者画面から送られた値を検査する。おかしければ null
export function validateFastRules(x: unknown): FastRules | null {
  const r = x as FastRules;
  if (!r || typeof r.enabled !== 'boolean') return null;
  if (!Array.isArray(r.tiers) || r.tiers.length !== 3) return null;
  if (!Array.isArray(r.gates) || r.gates.length !== 2) return null;
  const windowSec = WINDOW_MS / 1000;
  for (const [i, t] of r.tiers.entries()) {
    const score = Number(t?.minScore), sec = int(t?.afterSec);
    if (!(score >= 0 && score <= 200) || !(sec >= 0 && sec < windowSec)) return null;
    if (i > 0 && sec < r.tiers[i - 1].afterSec) return null; // 秒数は 1→2→3 の順に増える
  }
  for (const g of r.gates) { const a = int(g?.maxAffinity); if (!(a >= 0 && a <= 10)) return null; }
  // 旧形式（maxMin 分まで。1.1.38 以前の管理者画面・保存済みの設定）は新しい既定値に置き換える
  let keepNotify = DEFAULT_FAST_RULES.keepNotify;
  if (r.keepNotify && 'untilSec' in r.keepNotify) {
    const every = int(r.keepNotify.everySec), until = int(r.keepNotify.untilSec);
    if (!(every >= 5 && every <= 60) || !(until >= windowSec && until <= 300)) return null;
    keepNotify = { everySec: every, untilSec: until };
  }
  return {
    enabled: r.enabled,
    tiers: r.tiers.map(t => ({ minScore: Number(t.minScore), afterSec: t.afterSec })),
    gates: r.gates.map(g => ({ maxAffinity: g.maxAffinity })),
    keepNotify,
  };
}

// 来店と問い合わせで別々の設定（2026-11-14〜）。問い合わせ用がまだなければ来店用と同じ
export const FAST_RULES_INQUIRY_KEY = 'dispatch:fast_rules_inquiry';
export type RulesKind = 'visit' | 'inquiry';
export const fastRulesKey = (kind: RulesKind = 'visit') => (kind === 'inquiry' ? FAST_RULES_INQUIRY_KEY : FAST_RULES_KEY);

async function readRules(redis: Redis, key: string): Promise<FastRules | null> {
  const raw = await redis.get(key);
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return validateFastRules(parsed);
}

// kind: 'inquiry' は問い合わせの回（event.kind をそのまま渡せる。undefined は来店）
export async function getFastRules(redis: Redis, kind?: RulesKind): Promise<FastRules> {
  try {
    if (kind === 'inquiry') {
      const inquiry = await readRules(redis, FAST_RULES_INQUIRY_KEY);
      if (inquiry) return inquiry;
    }
    return (await readRules(redis, FAST_RULES_KEY)) ?? DEFAULT_FAST_RULES;
  } catch {
    return DEFAULT_FAST_RULES;
  }
}

// 受付終了の秒数（来店通知から）。これを過ぎても担当が決まらなければ担当なし
export function closeSec(rules: FastRules): number {
  return Math.max(WINDOW_MS / 1000, rules.keepNotify.untilSec);
}

// 来店通知から elapsedSec 秒の時点で、通知を止めている得意度の上限（この値以下の人には送らない）。0 なら全員に送る
export function blockedAffinity(rules: FastRules, elapsedSec: number): number {
  if (!rules.enabled) return 0;
  let blocked = 0;
  rules.gates.forEach((g, i) => {
    const liftAt = rules.tiers[i + 1]?.afterSec ?? 0;
    if (elapsedSec < liftAt) blocked = Math.max(blocked, g.maxAffinity);
  });
  return blocked;
}

// 得意度で通知を止める人の ID
export function gatedStaffIds(
  staffIds: string[], affinity: Record<string, Record<string, number>>, customerType: string | undefined, blocked: number,
): string[] {
  if (!customerType || blocked <= 0) return [];
  return staffIds.filter(id => (affinity[id]?.[customerType] ?? AFFINITY_DEFAULT) <= blocked);
}

// 再通知を送る時刻（秒）。即決定がオフなら従来どおり 10・20 秒
export function repushTimesSec(rules: FastRules): number[] {
  if (!rules.enabled) return [10, 20];
  return [...new Set(rules.tiers.slice(1).map(t => t.afterSec).filter(s => s > 0))].sort((a, b) => a - b);
}
