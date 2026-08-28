import { NextResponse } from 'next/server';
import { redis, EVENT_KEY, PRESSES_KEY, type DispatchEvent } from '@/lib/dispatch-redis';
import { determineWinner, parsePresses } from '@/lib/dispatch-winner';
import { WINDOW_MS } from '@/lib/dispatch-config';

export async function GET() {
  const event = await redis.get<DispatchEvent>(EVENT_KEY);
  if (!event) return NextResponse.json({ status: 'idle' });

  if (event.status === 'assigned') {
    return NextResponse.json({ status: 'assigned', winner: event.winner });
  }

  const raw = (await redis.hgetall(PRESSES_KEY)) ?? {};
  const presses = parsePresses(raw as Record<string, unknown>);
  const winner = determineWinner(event, presses);

  if (winner) {
    const updated: DispatchEvent = { ...event, status: 'assigned', winner };
    await redis.set(EVENT_KEY, updated, { ex: 3600 });
    await redis.del(PRESSES_KEY);
    return NextResponse.json({ status: 'assigned', winner });
  }

  const remaining = Math.max(0, Math.ceil((event.startedAt + WINDOW_MS - Date.now()) / 1000));
  return NextResponse.json({
    status: 'active',
    remaining,
    pressedIds: presses.map(p => p.id),
  });
}
