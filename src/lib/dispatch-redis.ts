import { Redis } from '@upstash/redis';

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
export const MUTE_LOCKS_KEY   = 'dispatch:mute_locks'; // staffId → 解除できない期限(ms)。当選者の1時間停止
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

// 当選により解除できない通知停止（期限切れは除く）
export async function getActiveMuteLocks(redis: Redis = getRedis()): Promise<Record<string, number>> {
  const raw = ((await redis.hgetall(MUTE_LOCKS_KEY)) ?? {}) as Record<string, unknown>;
  const now = Date.now();
  return Object.fromEntries(
    Object.entries(raw).map(([id, v]) => [id, Number(v)] as const).filter(([, until]) => until > now),
  );
}
