import { NextRequest, NextResponse } from 'next/server';
import { getRedis, getStaff, EVENT_KEY, PRESSES_KEY, MUTES_KEY, MUTE_REASONS_KEY, type DispatchEvent } from '@/lib/dispatch-redis';
import { toResponse, MUTE_DEFAULT_MIN, type Response } from '@/lib/dispatch-config';
import { getFastRules, closeSec } from '@/lib/dispatch-fast';
import { finalizeIfDecided } from '@/lib/dispatch-result';

export async function POST(req: NextRequest) {
  const { staffId, response, via } = await req.json() as { staffId: string; response?: string; via?: string };
  const v = via === 'notification' ? 'notification' : via === 'app' ? 'app' : undefined;
  const r: Response = toResponse(response); // 古いアプリの「普通」は「いける」として受ける
  const staff = (await getStaff()).find(s => s.id === staffId);
  if (!staff) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const redis = getRedis();
  const event = await redis.get<DispatchEvent>(EVENT_KEY);
  if (!event || event.status !== 'active')
    return NextResponse.json({ error: 'no active event' }, { status: 400 });
  if (Date.now() > event.startedAt + closeSec(await getFastRules(redis)) * 1000)
    return NextResponse.json({ error: 'closed' }, { status: 400 }); // 受付終了（担当なし）
  if (event.dispatcherId === staffId)
    return NextResponse.json({ error: 'dispatcher cannot press' }, { status: 400 });

  const key = `${staffId}::${staff.name}::${staff.rank}`;
  const existing = await redis.hget(PRESSES_KEY, key);
  if (existing) return NextResponse.json({ error: 'already pressed' }, { status: 400 });

  await redis.hset(PRESSES_KEY, { [key]: JSON.stringify({ t: Date.now(), r, ...(v ? { v } : {}) }) });
  if (r === '対応中') {
    await redis.hset(MUTES_KEY, { [staffId]: Date.now() + MUTE_DEFAULT_MIN * 60_000 });
    await redis.hdel(MUTE_REASONS_KEY, staffId);
  }

  await finalizeIfDecided(redis, event); // 即決定・30秒経過のどちらでも、決まればここで確定

  return NextResponse.json({ success: true });
}
