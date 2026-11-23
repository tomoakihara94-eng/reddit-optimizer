import { NextRequest, NextResponse } from 'next/server';
import { getRedis, EVENT_KEY, type DispatchEvent } from '@/lib/dispatch-redis';
import { deviceCheck } from '@/lib/dispatch-tokens';

// 受付 iPad の来店で、担当が「すぐ行きます（0）／5分後／◯分後に行きます」を知らせる（2026-11-24〜）
//   POST { staffId, eventId, minutes(0〜120), token? }。今の来店の担当本人だけ。token 付きなら本人のスマホか確かめる
//   受付 iPad は /status の eta を見て「◯◯がすぐまいります／◯分後にまいります」と出す
export async function POST(req: NextRequest) {
  const { staffId, eventId, minutes, token } = await req.json().catch(() => ({})) as { staffId?: string; eventId?: string; minutes?: number; token?: string };
  const redis = getRedis();
  const event = await redis.get<DispatchEvent>(EVENT_KEY);
  if (!event || String(event.id) !== String(eventId) || !event.kiosk || event.status !== 'assigned' || event.winner?.id !== staffId) {
    return NextResponse.json({ error: 'not your kiosk visit' }, { status: 400 });
  }
  if (!Number.isInteger(minutes) || minutes! < 0 || minutes! > 120) return NextResponse.json({ error: 'invalid minutes' }, { status: 400 });
  if ((await deviceCheck(redis, staffId!, token)) === 'other') return NextResponse.json({ error: 'not this device' }, { status: 403 });
  const eta = { minutes: minutes!, at: Date.now() };
  await redis.set(EVENT_KEY, { ...event, eta }, { keepTtl: true });
  return NextResponse.json({ success: true, eta });
}
