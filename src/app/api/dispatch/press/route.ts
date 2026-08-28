import { NextRequest, NextResponse } from 'next/server';
import { redis, EVENT_KEY, PRESSES_KEY, type DispatchEvent } from '@/lib/dispatch-redis';
import { STAFF, WINDOW_MS } from '@/lib/dispatch-config';
import { determineWinner, parsePresses } from '@/lib/dispatch-winner';

export async function POST(req: NextRequest) {
  const { staffId } = await req.json() as { staffId: string };
  const staff = STAFF.find(s => s.id === staffId);
  if (!staff) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const event = await redis.get<DispatchEvent>(EVENT_KEY);
  if (!event || event.status !== 'active')
    return NextResponse.json({ error: 'no active event' }, { status: 400 });

  const key = `${staffId}::${staff.name}::${staff.rank}`;
  const existing = await redis.hget(PRESSES_KEY, key);
  if (existing) return NextResponse.json({ error: 'already pressed' }, { status: 400 });

  await redis.hset(PRESSES_KEY, { [key]: Date.now() });

  // After window closes, determine winner immediately
  if (Date.now() > event.startedAt + WINDOW_MS) {
    const raw = (await redis.hgetall(PRESSES_KEY)) ?? {};
    const presses = parsePresses(raw as Record<string, unknown>);
    const winner = determineWinner(event, presses);
    if (winner) {
      await redis.set(EVENT_KEY, { ...event, status: 'assigned', winner }, { ex: 3600 });
      await redis.del(PRESSES_KEY);
    }
  }

  return NextResponse.json({ success: true });
}
