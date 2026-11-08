import type { Redis } from '@upstash/redis';
import { EXPO_TOKENS_KEY } from './dispatch-redis';

// 営業の通知の登録（Redis dispatch:expo_tokens 営業ID → Expo push トークン）
// 1人の名前は1台のスマホだけ（2026-11-02〜）。1台のスマホも1人だけ（同じトークンの別の名前は消す）

// 登録する。その名前が別のスマホで登録済みなら 'taken'（admin なら引き継ぐ）
export async function registerToken(
  redis: Redis, staffId: string, token: string, admin: boolean,
): Promise<{ taken: true } | { taken: false; removed: string[]; changed: boolean }> {
  const all = ((await redis.hgetall(EXPO_TOKENS_KEY)) ?? {}) as Record<string, string>;
  if (all[staffId] && all[staffId] !== token && !admin) return { taken: true };
  const removed = Object.entries(all).filter(([id, t]) => t === token && id !== staffId).map(([id]) => id);
  if (removed.length > 0) await redis.hdel(EXPO_TOKENS_KEY, ...removed);
  const changed = all[staffId] !== token || removed.length > 0; // 毎回の同じ登録ではない
  if (all[staffId] !== token) await redis.hset(EXPO_TOKENS_KEY, { [staffId]: token });
  return { taken: false, removed, changed };
}

// 消す。token 付きならそのスマホの登録のときだけ、admin は必ず
// どちらもなし（1.1.39 以前のアプリ）は消さない（2026-11-04〜）: 古いアプリで「差配者」に切り替えたり名前を選び直したりすると、
// 別のスマホ（本人）の登録まで消していたため。同じスマホの別の名前の登録は registerToken が消すので残らない
export async function unregisterToken(
  redis: Redis, staffId: string, token: string | undefined, admin: boolean,
): Promise<'deleted' | 'not this device' | 'legacy ignored'> {
  if (!admin) {
    if (!token) return 'legacy ignored';
    const all = ((await redis.hgetall(EXPO_TOKENS_KEY)) ?? {}) as Record<string, string>;
    if (all[staffId] && all[staffId] !== token) return 'not this device';
  }
  await redis.hdel(EXPO_TOKENS_KEY, staffId);
  return 'deleted';
}

// 設定の変更（電話問い合わせだけ・来店通知OFF）が、その営業の名前で登録されているスマホからか（2026-11-08〜）
//   'ok' 本人のスマホ ／ 'other' 別のスマホ（「別のスマホで使われています」の端末など）／ 'none' トークンなし（古いアプリ）
//   背景: 1.1.44 以降のアプリから、別の人の名前で「電話問い合わせだけ」をオンにでき、浅倉・柿崎の来店通知が止まっていた
export async function deviceCheck(redis: Redis, staffId: string, token: unknown): Promise<'ok' | 'other' | 'none'> {
  if (typeof token !== 'string' || !token) return 'none';
  const current = await redis.hget<string>(EXPO_TOKENS_KEY, staffId);
  return current === token ? 'ok' : 'other';
}
