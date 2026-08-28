import { NextResponse } from 'next/server';
import { getRedis, EVENT_KEY, TOKENS_KEY } from '@/lib/dispatch-redis';

export const runtime = 'nodejs';

export async function POST() {
  const redis = getRedis();
  const event = await redis.get<{ status: string }>(EVENT_KEY);

  // イベントが active でなければ何もしない
  if (!event || event.status !== 'active') {
    return NextResponse.json({ skipped: true });
  }

  if (
    process.env.VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY &&
    process.env.VAPID_MAILTO
  ) {
    try {
      const webpush = (await import('web-push')).default;
      webpush.setVapidDetails(
        `mailto:${process.env.VAPID_MAILTO}`,
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY,
      );
      const tokens = (await redis.hgetall(TOKENS_KEY)) ?? {};
      await Promise.allSettled(
        Object.entries(tokens).map(([, subJson]) => {
          try {
            return webpush.sendNotification(
              JSON.parse(subJson as string),
              JSON.stringify({ title: '🚗 お客様来店中！', body: '担当するボタンを押してください' }),
            );
          } catch { return Promise.resolve(); }
        })
      );
    } catch { /* ignore */ }
  }

  return NextResponse.json({ success: true });
}
