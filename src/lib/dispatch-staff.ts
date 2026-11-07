import type { Redis } from '@upstash/redis';
import {
  getStaff, STAFF_ADDED_KEY, STAFF_REMOVED_KEY, STAFF_NAMES_KEY, EXPO_TOKENS_KEY, MUTES_KEY, MUTE_REASONS_KEY, INQUIRY_ONLY_KEY,
} from './dispatch-redis';

// 営業の追加・削除（2026-11-07〜。アプリの営業選択画面から管理者の暗証番号で）
//   ID は変えない設計なので、追加は新しい ID（s + 時刻）、削除は dispatch:staff_removed に記録するだけ（過去の計算結果は残る）

export async function addStaff(redis: Redis, name: string, now = Date.now()): Promise<{ id: string } | { error: string }> {
  const n = name.trim();
  if (n.length < 1 || n.length > 10) return { error: 'invalid name' };
  if ((await getStaff(redis)).some(s => s.name === n)) return { error: 'duplicate' };
  const id = `s${now.toString(36)}`;
  await redis.hset(STAFF_ADDED_KEY, { [id]: n });
  return { id };
}

export async function removeStaff(redis: Redis, id: string, now = Date.now()): Promise<boolean> {
  if (!(await getStaff(redis)).some(s => s.id === id)) return false;
  await redis.hset(STAFF_REMOVED_KEY, { [id]: now });
  // 通知が届かないように、登録・停止・問い合わせのみの設定を消す
  for (const key of [EXPO_TOKENS_KEY, MUTES_KEY, MUTE_REASONS_KEY, INQUIRY_ONLY_KEY, STAFF_NAMES_KEY]) await redis.hdel(key, id);
  return true;
}
