import { NextResponse } from 'next/server';
import { getRedis, MUTES_KEY } from '@/lib/dispatch-redis';
import { STAFF, MUTE_OPTIONS_MIN, MUTE_OFF, MUTE_OFF_MS } from '@/lib/dispatch-config';

// 来店通知を止める。minutes: 10〜60 は時間指定、-1 は「OFF」（ON に戻すまで）、0 で再開
export async function POST(req: Request) {
  const { staffId, minutes } = await req.json() as { staffId: string; minutes: number };
  if (!STAFF.some(s => s.id === staffId) || !(minutes === 0 || minutes === MUTE_OFF || MUTE_OPTIONS_MIN.includes(minutes)))
    return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const redis = getRedis();
  if (minutes === 0) {
    await redis.hdel(MUTES_KEY, staffId);
    return NextResponse.json({ success: true, mutedUntil: null });
  }
  const mutedUntil = Date.now() + (minutes === MUTE_OFF ? MUTE_OFF_MS : minutes * 60_000);
  await redis.hset(MUTES_KEY, { [staffId]: mutedUntil });
  return NextResponse.json({ success: true, mutedUntil });
}
