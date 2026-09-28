import type { Redis } from '@upstash/redis';
import { EVENT_KEY, PRESSES_KEY, STAFF_CONDITIONS_KEY, getAffinityTable, type DispatchEvent } from './dispatch-redis';
import { WINDOW_MS } from './dispatch-config';
import { determineWinner, parsePresses, scoreBreakdown, type Press, type ScoreBreakdown } from './dispatch-winner';

export type ResultRow = ScoreBreakdown & {
  rank: number | null;          // 当選順位（対象外は null）
  id: string; name: string;
  pressedAfterSec: number;      // 来店通知から押すまでの秒数
  via?: 'app' | 'notification'; // 応答した経路
  status: 'winner' | 'candidate' | 'late' | 'excluded';
  note?: string;
};

export type DispatchResult = {
  eventId: string;
  startedAt: number;
  assignedAt: number;
  customerType: string | null;
  winnerId: string;
  winnerName: string;
  rows: ResultRow[];
};

const RESULT_TTL_SECONDS = 60 * 60 * 24 * 180; // 180日保存

// 日本時間の日付（YYYY-MM-DD）
export function jstDate(ts: number) {
  return new Date(ts + 9 * 3600_000).toISOString().slice(0, 10);
}
export const resultsKey = (date: string) => `dispatch:results:${date}`;

function buildResult(
  event: DispatchEvent, presses: Press[], winner: Press,
  staffConditions: Record<string, string>, affinity: Awaited<ReturnType<typeof getAffinityTable>>,
): DispatchResult {
  const windowEnd = event.startedAt + WINDOW_MS;
  const row = (p: Press, status: ResultRow['status'], note?: string): ResultRow => ({
    ...scoreBreakdown(p, staffConditions, event.customerType, affinity),
    rank: null, id: p.id, name: p.name,
    pressedAfterSec: Math.round((p.time - event.startedAt) / 100) / 10,
    status, ...(note ? { note } : {}), ...(p.via ? { via: p.via } : {}),
  });

  const excluded = presses
    .filter(p => p.id === event.dispatcherId || p.response === '対応中')
    .map(p => row(p, 'excluded', p.id === event.dispatcherId ? '差配者' : '対応中'));
  const eligible = presses.filter(p => p.id !== event.dispatcherId && p.response !== '対応中');
  const within = eligible.filter(p => p.time <= windowEnd).map(p => row(p, 'candidate'))
    .sort((a, b) => b.score - a.score || a.pressedAfterSec - b.pressedAfterSec);
  const late = eligible.filter(p => p.time > windowEnd).map(p => row(p, 'late', '30秒後に応答'))
    .sort((a, b) => a.pressedAfterSec - b.pressedAfterSec);

  const ranked = [...within, ...late].map((r, i) => ({
    ...r, rank: i + 1, status: r.id === winner.id ? 'winner' as const : r.status,
  }));
  return {
    eventId: event.id, startedAt: event.startedAt, assignedAt: Date.now(),
    customerType: event.customerType ?? null,
    winnerId: winner.id, winnerName: winner.name,
    rows: [...ranked, ...excluded],
  };
}

// 当選者が決まる状態なら確定して結果を記録する。確定したら当選者を返す
// status のポーリングが同時に来ても記録が1回になるよう、イベントごとにロックを取る
export async function finalizeIfDecided(redis: Redis, event: DispatchEvent): Promise<Press | null> {
  const raw = (await redis.hgetall(PRESSES_KEY)) ?? {};
  const presses = parsePresses(raw as Record<string, unknown>);
  const staffConditions = ((await redis.hgetall(STAFF_CONDITIONS_KEY)) ?? {}) as Record<string, string>;
  const affinity = await getAffinityTable(redis);
  const winner = determineWinner(event, presses, staffConditions, affinity);
  if (!winner) return null;

  const locked = await redis.set(`dispatch:finalize:${event.id}`, '1', { nx: true, ex: 300 });
  if (locked) {
    const result = buildResult(event, presses, winner, staffConditions, affinity);
    const key = resultsKey(jstDate(event.startedAt));
    await redis.rpush(key, JSON.stringify(result));
    await redis.expire(key, RESULT_TTL_SECONDS);
    await redis.set(EVENT_KEY, { ...event, status: 'assigned', winner }, { ex: 3600 });
    await redis.del(PRESSES_KEY);
  }
  return winner;
}

export async function getResults(redis: Redis, date: string): Promise<DispatchResult[]> {
  const list = (await redis.lrange(resultsKey(date), 0, -1)) ?? [];
  return list.map(v => (typeof v === 'string' ? JSON.parse(v) : v) as DispatchResult);
}
