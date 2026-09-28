import { NextRequest, NextResponse } from 'next/server';
import { getRedis, EVENT_KEY, PRESSES_KEY, type DispatchEvent } from '@/lib/dispatch-redis';
import { STAFF, WINDOW_MS, RESPONSES, DEFAULT_RESPONSE, type Response } from '@/lib/dispatch-config';
import { finalizeIfDecided } from '@/lib/dispatch-result';

export async function POST(req: NextRequest) {
  const { staffId, response, via } = await req.json() as { staffId: string; response?: string; via?: string };
  const v = via === 'notification' ? 'notification' : via === 'app' ? 'app' : undefined;
  const r: Response = response && response in RESPONSES ? (response as Response) : DEFAULT_RESPONSE;
  const staff = STAFF.find(s => s.id === staffId);
  if (!staff) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const redis = getRedis();
  const event = await redis.get<DispatchEvent>(EVENT_KEY);
  if (!event || event.status !== 'active')
    return NextResponse.json({ error: 'no active event' }, { status: 400 });
  if (event.dispatcherId === staffId)
    return NextResponse.json({ error: 'dispatcher cannot press' }, { status: 400 });

  const key = `${staffId}::${staff.name}::${staff.rank}`;
  const existing = await redis.hget(PRESSES_KEY, key);
  if (existing) return NextResponse.json({ error: 'already pressed' }, { status: 400 });

  await redis.hset(PRESSES_KEY, { [key]: JSON.stringify({ t: Date.now(), r, ...(v ? { v } : {}) }) });

  if (Date.now() > event.startedAt + WINDOW_MS) await finalizeIfDecided(redis, event);

  return NextResponse.json({ success: true });
}
