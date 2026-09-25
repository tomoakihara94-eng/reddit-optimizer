import { NextResponse } from 'next/server';
import { getRedis, getAffinityTable, EVENT_KEY, PRESSES_KEY, CONDITIONS_KEY, STAFF_CONDITIONS_KEY, type DispatchEvent } from '@/lib/dispatch-redis';
import { determineWinner, parsePresses } from '@/lib/dispatch-winner';
import { WINDOW_MS } from '@/lib/dispatch-config';

export async function GET() {
  const redis = getRedis();
  const event = await redis.get<DispatchEvent>(EVENT_KEY);
  if (!event) return NextResponse.json({ status: 'idle' }, { headers: { 'Cache-Control': 's-maxage=8, stale-while-revalidate=2' } });

  const rawConditions = (await redis.hgetall(CONDITIONS_KEY)) ?? {};
  const conditions = rawConditions as Record<string, string>;
  const staffConditions = ((await redis.hgetall(STAFF_CONDITIONS_KEY)) ?? {}) as Record<string, string>;

  if (event.status === 'assigned') {
    return NextResponse.json({ status: 'assigned', winner: event.winner, conditions });
  }

  const raw = (await redis.hgetall(PRESSES_KEY)) ?? {};
  const presses = parsePresses(raw as Record<string, unknown>);
  const winner = determineWinner(event, presses, staffConditions, await getAffinityTable());

  if (winner) {
    const updated: DispatchEvent = { ...event, status: 'assigned', winner };
    await redis.set(EVENT_KEY, updated, { ex: 3600 });
    await redis.del(PRESSES_KEY);
    return NextResponse.json({ status: 'assigned', winner, conditions });
  }

  const remaining = Math.max(0, Math.ceil((event.startedAt + WINDOW_MS - Date.now()) / 1000));
  return NextResponse.json({
    status: 'active',
    remaining,
    pressedIds: presses.map(p => p.id),
    responses: Object.fromEntries(presses.map(p => [p.id, p.response])),
    staffConditions,
    dispatcherId: event.dispatcherId ?? null,
    conditions,
  });
}
