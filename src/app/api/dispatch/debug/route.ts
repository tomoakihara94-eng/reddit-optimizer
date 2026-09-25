import { NextResponse } from 'next/server';
import { getRedis, EVENT_KEY, NOTIFY_LOG_KEY } from '@/lib/dispatch-redis';

export async function GET() {
  const checks: Record<string, unknown> = {
    upstash_url: !!process.env.UPSTASH_REDIS_REST_URL,
    upstash_token: !!process.env.UPSTASH_REDIS_REST_TOKEN,
    vapid_public: !!process.env.VAPID_PUBLIC_KEY,
    vapid_private: !!process.env.VAPID_PRIVATE_KEY,
    vapid_mailto: !!process.env.VAPID_MAILTO,
    next_public_vapid: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  };

  try {
    const redis = getRedis();
    const event = await redis.get(EVENT_KEY);
    const webTokens = (await redis.hgetall('dispatch:tokens')) ?? {};
    const expoTokens = (await redis.hgetall('dispatch:expo_tokens')) ?? {};
    const rawLog = await redis.lrange(NOTIFY_LOG_KEY, 0, 9);

    const notifyLog = (rawLog as string[]).map((s: string) => {
      try { return JSON.parse(s); } catch { return s; }
    });

    checks.redis_connected = true;
    checks.current_event = event ?? 'none';
    checks.web_push_token_count = Object.keys(webTokens).length;
    checks.expo_token_ids = Object.keys(expoTokens);
    checks.expo_token_count = Object.keys(expoTokens).length;
    checks.notify_log = notifyLog;
  } catch (e) {
    checks.redis_connected = false;
    checks.redis_error = String(e);
  }

  return NextResponse.json(checks);
}
