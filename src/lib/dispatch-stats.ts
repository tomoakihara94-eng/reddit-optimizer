import type { Redis } from '@upstash/redis';
import { jstDate } from './dispatch-result';

// 投票率（2026-11-04〜）。営業ごとに「通知が届いた回数」と「応答した回数」を日ごとに数える
//   分母: その来店・問い合わせで通知を送った人（通知OFF・夜間・未登録は送らないので入らない）＋通知の前にアプリで応答した人
//   分子: 応答した人（いけない も含む。ユーザー指定）
//   出勤日だけ: 1回も応答しなかった日は休みとして数えない（getStats）
// Redis: dispatch:stats:YYYY-MM-DD（JST）ハッシュ  `<id>:n` 届いた / `<id>:r` 応答 / `<id>:r:<応答>` 内訳。180日
//        dispatch:notified:<eventId> セット  この回ですでに数えた人（再通知で二重に数えない）。1日
export const statsKey = (date: string) => `dispatch:stats:${date}`;
const notifiedKey = (eventId: string) => `dispatch:notified:${eventId}`;
const STATS_TTL = 180 * 86400;

async function countNotified(redis: Redis, eventId: string, startedAt: number, id: string) {
  const added = await redis.sadd(notifiedKey(eventId), id);
  await redis.expire(notifiedKey(eventId), 86400);
  if (added) {
    await redis.hincrby(statsKey(jstDate(startedAt)), `${id}:n`, 1);
    await redis.expire(statsKey(jstDate(startedAt)), STATS_TTL);
  }
}

// 通知を送った人を数える（同じ回の再通知・送り続けは数えない）
export async function markNotified(redis: Redis, event: { id: string; startedAt: number }, ids: string[]) {
  try { for (const id of ids) await countNotified(redis, event.id, event.startedAt, id); } catch { /* 集計の失敗で通知を止めない */ }
}

// 応答を数える。通知が届く前にアプリで応答した人は、ここで「届いた」にも数える
export async function markResponded(redis: Redis, event: { id: string; startedAt: number }, id: string, response: string) {
  try {
    await countNotified(redis, event.id, event.startedAt, id);
    const key = statsKey(jstDate(event.startedAt));
    await redis.hincrby(key, `${id}:r`, 1);
    await redis.hincrby(key, `${id}:r:${response}`, 1);
  } catch { /* 集計の失敗で応答を止めない */ }
}

export type StatsRow = { id: string; days: number; notified: number; responded: number; wins: number; byResponse: Record<string, number> };

// 期間（日付の配列）の合計。1回も応答しなかった日は休みとみなし、その日の通知は数えない（2026-11-04 ユーザー指定）
// days = 出勤日（1回以上応答した日）の数。wins = 当選回数（winsByDate: 日付 → 営業ID → 当選回数。計算結果の記録から数える）
export async function getStats(redis: Redis, dates: string[], winsByDate: Record<string, Record<string, number>> = {}): Promise<StatsRow[]> {
  const rows: Record<string, StatsRow> = {};
  const row = (id: string) => (rows[id] ??= { id, days: 0, notified: 0, responded: 0, wins: 0, byResponse: {} });
  for (const date of dates) {
    const h = ((await redis.hgetall(statsKey(date))) ?? {}) as Record<string, unknown>;
    const day: Record<string, { n: number; r: number; by: Record<string, number> }> = {};
    for (const [field, v] of Object.entries(h)) {
      const [id, kind, resp] = field.split(':');
      const n = Number(v) || 0;
      const d = (day[id] ??= { n: 0, r: 0, by: {} });
      if (kind === 'n') d.n += n;
      else if (kind === 'r' && resp) d.by[resp] = (d.by[resp] ?? 0) + n;
      else if (kind === 'r') d.r += n;
    }
    for (const [id, d] of Object.entries(day)) {
      if (d.r <= 0) continue; // 休み
      const r = row(id);
      r.days += 1; r.notified += d.n; r.responded += d.r; r.wins += winsByDate[date]?.[id] ?? 0;
      for (const [k, n] of Object.entries(d.by)) r.byResponse[k] = (r.byResponse[k] ?? 0) + n;
    }
  }
  return Object.values(rows);
}
