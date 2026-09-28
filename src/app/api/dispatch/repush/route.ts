import { NextResponse } from 'next/server';
import { getRedis, EVENT_KEY, TOKENS_KEY, type DispatchEvent } from '@/lib/dispatch-redis';
import { repushToPending } from '@/lib/dispatch-push';

export const runtime = 'nodejs';

export async function POST() {
  const redis = getRedis();
  const event = await redis.get<DispatchEvent>(EVENT_KEY);

  if (!event || event.status !== 'active') {
    return NextResponse.json({ skipped: true });
  }

  // repush is only valid within the 30-second window
  const WINDOW_MS = 30_000;
  if (Date.now() > event.startedAt + WINDOW_MS) {
    return NextResponse.json({ skipped: true, reason: 'window expired' });
  }

  // Web push
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_MAILTO) {
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

  // Expo push — 未応答の営業だけ
  await repushToPending(event.id, '🚗 お客様来店中！', '長押し・Apple Watch で応答を選べます').catch(() => {});

  return NextResponse.json({ success: true });
}
