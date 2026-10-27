import { Redis } from '@upstash/redis';
import { SALES_UNITS, STAFF, type StaffMember } from './dispatch-config';

let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return _redis;
}

export type DispatchEvent = {
  id: string;
  startedAt: number;
  status: 'active' | 'assigned';
  dispatcherId?: string; // この回の差配者（当選対象外・通知対象外）
  customerType?: string; // お客様タイプ（差配者のみ。営業側には返さない）
  winner?: { id: string; name: string; rank: string };
};

export const EVENT_KEY        = 'dispatch:event';
export const PRESSES_KEY      = 'dispatch:presses';
export const CONDITIONS_KEY   = 'dispatch:conditions';
export const STAFF_CONDITIONS_KEY = 'dispatch:staff_conditions'; // 来店前に選ぶコンディション（回をまたいで保持）
export const TOKENS_KEY       = 'dispatch:tokens';
export const EXPO_TOKENS_KEY  = 'dispatch:expo_tokens';
export const AFFINITY_KEY     = 'dispatch:affinity'; // staffId → { タイプ: 得意度(1〜10) }
export const MUTES_KEY        = 'dispatch:mutes'; // staffId → 通知を止める期限(ms)。「対応中（行けない）」で設定
export const SALES_UNITS_KEY  = 'dispatch:sales_units'; // staffId → 実績（台数）。管理者画面で入力
export const STAFF_NAMES_KEY  = 'dispatch:staff_names'; // staffId → 表示名。管理者が営業画面から変更
export const NOTIFY_LOG_KEY   = 'dispatch:notify_log';

export async function getAffinityTable(redis: Redis = getRedis()): Promise<Record<string, Record<string, number>>> {
  const raw = (await redis.hgetall(AFFINITY_KEY)) ?? {};
  return Object.fromEntries(Object.entries(raw).map(([id, v]) =>
    [id, (typeof v === 'string' ? JSON.parse(v) : v) as Record<string, number>]));
}

// 今、通知を止めている営業（期限切れは除く）。値は期限の時刻(ms)
export async function getActiveMutes(redis: Redis = getRedis()): Promise<Record<string, number>> {
  const raw = ((await redis.hgetall(MUTES_KEY)) ?? {}) as Record<string, unknown>;
  const now = Date.now();
  return Object.fromEntries(
    Object.entries(raw).map(([id, v]) => [id, Number(v)] as const).filter(([, until]) => until > now),
  );
}

// 実績（台数）。管理者画面で入力した値を優先し、未入力の人は dispatch-config の初期値
export async function getSalesUnits(redis: Redis = getRedis()): Promise<Record<string, number>> {
  const raw = ((await redis.hgetall(SALES_UNITS_KEY)) ?? {}) as Record<string, unknown>;
  const saved = Object.fromEntries(Object.entries(raw).map(([id, v]) => [id, Number(v)]));
  return { ...SALES_UNITS, ...saved };
}

// スタッフ一覧（名前は変更分を反映）。ID は固定、名前だけ Redis で上書きできる
export async function getStaff(redis: Redis = getRedis()): Promise<StaffMember[]> {
  try {
    const names = ((await redis.hgetall(STAFF_NAMES_KEY)) ?? {}) as Record<string, string>;
    return STAFF.map(s => (names[s.id] ? { ...s, name: names[s.id] } : s));
  } catch {
    return [...STAFF]; // Redis に届かないときは初期の名前
  }
}
