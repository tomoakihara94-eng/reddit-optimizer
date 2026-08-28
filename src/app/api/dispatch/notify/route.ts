import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { redis, EVENT_KEY, PRESSES_KEY, TOKENS_KEY, type DispatchEvent } from '@/lib/dispatch-redis';

export const runtime = 'nodejs';

export async function POST() {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_MAILTO}`,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  const event: DispatchEvent = {
    id: Date.now().toString(),
    startedAt: Date.now(),
    status: 'active',
  };
  await redis.set(EVENT_KEY, event, { ex: 3600 });
  await redis.del(PRESSES_KEY);

  const tokens = (await redis.hgetall(TOKENS_KEY)) ?? {};
  await Promise.allSettled(
    Object.entries(tokens).map(([, subJson]) => {
      try {
        return webpush.sendNotification(
          JSON.parse(subJson as string),
          JSON.stringify({ title: '🚗 お客様来店', body: '担当するボタンを押してください' }),
        );
      } catch {
        return Promise.resolve();
      }
    })
  );

  return NextResponse.json({ success: true });
}
