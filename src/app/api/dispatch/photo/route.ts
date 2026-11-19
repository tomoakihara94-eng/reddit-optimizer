import { NextRequest, NextResponse } from 'next/server';
import { put, get } from '@vercel/blob';
import { getRedis, EVENT_KEY, type DispatchEvent } from '@/lib/dispatch-redis';
import { isAdmin } from '@/lib/dispatch-admin';
import { photoPath, photoKey, PHOTO_MAX_BYTES, PHOTO_UPLOAD_WINDOW_MS, isRegisteredDevice } from '@/lib/dispatch-photo';

// 受付 iPad の写真のアップロード（POST、本文は JPEG そのまま、?eventId=）
//   今の来店（受付 iPad から押されたもの）で、通知から10分以内・まだ写真がないときだけ受け付ける
export async function POST(req: NextRequest) {
  const eventId = new URL(req.url).searchParams.get('eventId') ?? '';
  const redis = getRedis();
  const event = await redis.get<DispatchEvent>(EVENT_KEY);
  if (!event || String(event.id) !== eventId || !event.kiosk) return NextResponse.json({ error: 'no kiosk event' }, { status: 400 });
  if (Date.now() - event.startedAt > PHOTO_UPLOAD_WINDOW_MS) return NextResponse.json({ error: 'too late' }, { status: 400 });
  if (await redis.get(photoKey(eventId))) return NextResponse.json({ error: 'already uploaded' }, { status: 409 });
  const body = await req.arrayBuffer();
  if (body.byteLength === 0 || body.byteLength > PHOTO_MAX_BYTES) return NextResponse.json({ error: 'bad size' }, { status: 400 });
  await put(photoPath(eventId), Buffer.from(body), {
    access: 'private', contentType: 'image/jpeg', addRandomSuffix: false, allowOverwrite: false, ttlDays: 1,
  });
  await redis.set(photoKey(eventId), '1', { ex: 86400 });
  return NextResponse.json({ success: true });
}

// 写真を見る（GET ?eventId=）。営業のスマホ（X-Device-Token）か管理者（X-Admin-Pin）だけ
export async function GET(req: NextRequest) {
  const eventId = new URL(req.url).searchParams.get('eventId') ?? '';
  if (!/^\d{10,16}$/.test(eventId)) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const redis = getRedis();
  if (!isAdmin(req) && !(await isRegisteredDevice(redis, req.headers.get('x-device-token')))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!(await redis.get(photoKey(eventId)))) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const r = await get(photoPath(eventId), { access: 'private' }).catch(() => null);
  if (!r) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return new Response(r.stream, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, no-store' } });
}
