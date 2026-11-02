import type { Redis } from '@upstash/redis';
import { EXPO_TOKENS_KEY } from './dispatch-redis';

// 営業の通知の登録（Redis dispatch:expo_tokens 営業ID → Expo push トークン）
// 1人の名前は1台のスマホだけ（2026-11-02〜）。1台のスマホも1人だけ（同じトークンの別の名前は消す）

// 登録する。その名前が別のスマホで登録済みなら 'taken'（admin なら引き継ぐ）
export async function registerToken(
  redis: Redis, staffId: string, token: string, admin: boolean,
): Promise<{ taken: true } | { taken: false; removed: string[] }> {
  const all = ((await redis.hgetall(EXPO_TOKENS_KEY)) ?? {}) as Record<string, string>;
  if (all[staffId] && all[staffId] !== token && !admin) return { taken: true };
  const removed = Object.entries(all).filter(([id, t]) => t === token && id !== staffId).map(([id]) => id);
  if (removed.length > 0) await redis.hdel(EXPO_TOKENS_KEY, ...removed);
  await redis.hset(EXPO_TOKENS_KEY, { [staffId]: token });
  return { taken: false, removed };
}

// 消す。token 付きならそのスマホの登録のときだけ（admin は必ず、どちらもなしは古いアプリ用に従来どおり）
export async function unregisterToken(redis: Redis, staffId: string, token: string | undefined, admin: boolean): Promise<boolean> {
  if (token && !admin) {
    const all = ((await redis.hgetall(EXPO_TOKENS_KEY)) ?? {}) as Record<string, string>;
    if (all[staffId] && all[staffId] !== token) return false;
  }
  await redis.hdel(EXPO_TOKENS_KEY, staffId);
  return true;
}
