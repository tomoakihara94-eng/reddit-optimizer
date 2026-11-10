import type { Redis } from '@upstash/redis';
import { getStaff } from './dispatch-redis';
import { jstDate } from './dispatch-result';

// 今日の責任者（2026-11-11〜）。差配者画面の右上で長押しして営業の一覧から選ぶ。日付（JST）ごとに保存し、次の日は未選択
export const leaderKey = (date: string) => `dispatch:leader:${date}`;

export async function getLeader(redis: Redis, now = Date.now()): Promise<{ id: string; name: string } | null> {
  const id = await redis.get<string>(leaderKey(jstDate(now)));
  if (!id) return null;
  const s = (await getStaff(redis)).find(x => x.id === id);
  return s ? { id: s.id, name: s.name } : null;
}

// staffId が空なら解除
export async function setLeader(redis: Redis, staffId: string | null, now = Date.now()): Promise<boolean> {
  const key = leaderKey(jstDate(now));
  if (!staffId) { await redis.del(key); return true; }
  if (!(await getStaff(redis)).some(s => s.id === staffId)) return false;
  await redis.set(key, staffId, { ex: 3 * 86400 });
  return true;
}
