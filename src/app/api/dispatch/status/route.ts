import { NextResponse } from 'next/server';
import { getRedis, EVENT_KEY, PRESSES_KEY, CONDITIONS_KEY, STAFF_CONDITIONS_KEY, type DispatchEvent } from '@/lib/dispatch-redis';
import { parsePresses } from '@/lib/dispatch-winner';
import { finalizeIfDecided } from '@/lib/dispatch-result';
import { WINDOW_MS } from '@/lib/dispatch-config';

export async function GET() {
  const redis = getRedis();
  const event = await redis.get<DispatchEvent>(EVENT_KEY);
  if (!event) return NextResponse.json({ status: 'idle' }, { headers: { 'Cache-Control': 's-maxage=8, stale-while-revalidate=2' } });

  const rawConditions = (await redis.hgetall(CONDITIONS_KEY)) ?? {};
  const conditions = rawConditions as Record<string, string>;
  const staffConditions = ((await redis.hgetall(STAFF_CONDITIONS_KEY)) ?? {}) as Record<string, string>;

  if (event.status === 'assigned') {
    return NextResponse.json({ status: 'assigned', winner: event.winner, eventId: event.id, conditions });
  }

  const winner = await finalizeIfDecided(redis, event);
  if (winner) {
    return NextResponse.json({ status: 'assigned', winner, eventId: event.id, conditions });
  }

  const raw = (await redis.hgetall(PRESSES_KEY)) ?? {};
  const presses = parsePresses(raw as Record<string, unknown>);

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
