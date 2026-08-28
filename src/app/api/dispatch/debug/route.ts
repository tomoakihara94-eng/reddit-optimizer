import { NextResponse } from 'next/server';
import { getRedis, EVENT_KEY } from '@/lib/dispatch-redis';

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
    const tokens = await redis.hgetall('dispatch:tokens') ?? {};
    checks.redis_connected = true;
    checks.current_event = event ?? 'none';
    checks.push_token_count = Object.keys(tokens).length;
    checks.push_token_ids = Object.keys(tokens);
  } catch (e) {
    checks.redis_connected = false;
    checks.redis_error = String(e);
  }

  return NextResponse.json(checks);
}
