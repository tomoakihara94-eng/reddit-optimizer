import { NextRequest, NextResponse } from 'next/server';
import { getRedis, EVENT_KEY, PRESSES_KEY, CONDITIONS_KEY, TOKENS_KEY, EXPO_TOKENS_KEY, NOTIFY_LOG_KEY, type DispatchEvent } from '@/lib/dispatch-redis';
import { STAFF, CUSTOMER_TYPES } from '@/lib/dispatch-config';
import { sendVisitPush } from '@/lib/dispatch-push';

export const runtime = 'nodejs';

const ACTIVE_STAFF_IDS: Set<string> = new Set(STAFF.map(s => s.id));
export async function POST(req: NextRequest) {
  try {
    const redis = getRedis();
    const body = await req.json().catch(() => ({})) as { dispatcherId?: string; customerType?: string };
    const customerType = (CUSTOMER_TYPES as readonly string[]).includes(body.customerType ?? '') ? body.customerType : undefined;
    const dispatcherId = body.dispatcherId && ACTIVE_STAFF_IDS.has(body.dispatcherId) ? body.dispatcherId : undefined;

    // ログ記録（最新10件）
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
    const ua = req.headers.get('user-agent') ?? 'unknown';
    const src = req.headers.get('x-dispatch-source') ?? 'web';
    const logEntry = JSON.stringify({ t: Date.now(), ip, src, ua: ua.slice(0, 80) });
    await redis.lpush(NOTIFY_LOG_KEY, logEntry);
    await redis.ltrim(NOTIFY_LOG_KEY, 0, 9);
    await redis.expire(NOTIFY_LOG_KEY, 86400);

    const event: DispatchEvent = {
      id: Date.now().toString(),
      startedAt: Date.now(),
      status: 'active',
      ...(dispatcherId ? { dispatcherId } : {}),
      ...(customerType ? { customerType } : {}),
    };
    await redis.set(EVENT_KEY, event, { ex: 3600 });
    await redis.del(PRESSES_KEY);
    await redis.del(CONDITIONS_KEY);

    // Web push (existing PWA)
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
          Object.entries(tokens).filter(([id]) => id !== dispatcherId).map(([, subJson]) => {
            try {
              return webpush.sendNotification(
                JSON.parse(subJson as string),
                JSON.stringify({ title: '🚗 お客様来店', body: '担当するボタンを押してください' }),
              );
            } catch { return Promise.resolve(); }
          })
        );
      } catch { /* ignore */ }
    }

    // Expo push (native app) — only send to currently active staff
    try {
      const expoTokens = (await redis.hgetall(EXPO_TOKENS_KEY)) ?? {};
      await sendVisitPush(expoTokens, [dispatcherId], '🚗 お客様来店', '長押し・Apple Watch で応答を選べます');
    } catch { /* ignore */ }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
