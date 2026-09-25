import { NextResponse } from 'next/server';
import { getRedis, TOKENS_KEY } from '@/lib/dispatch-redis';

export const runtime = 'nodejs';

export async function GET() {
  const redis = getRedis();
  const tokens = (await redis.hgetall(TOKENS_KEY)) ?? {};

  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_MAILTO) {
    return NextResponse.json({ error: 'VAPID env vars missing' });
  }

  const webpush = (await import('web-push')).default;
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_MAILTO}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );

  const results: Record<string, unknown> = {};
  for (const [staffId, subJson] of Object.entries(tokens)) {
    try {
      const sub = JSON.parse(subJson as string);
      await webpush.sendNotification(
        sub,
        JSON.stringify({ title: '🔔 テスト通知', body: 'プッシュ通知テストです' }),
      );
      results[staffId] = { ok: true, endpoint: (sub as { endpoint: string }).endpoint?.slice(0, 60) };
    } catch (e: unknown) {
      const err = e as { statusCode?: number; message?: string };
      results[staffId] = { ok: false, statusCode: err?.statusCode, message: err?.message };
    }
  }

  return NextResponse.json({ results, count: Object.keys(tokens).length });
}
