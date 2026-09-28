import { NextRequest, NextResponse } from 'next/server';
import { getRedis, EXPO_TOKENS_KEY } from '@/lib/dispatch-redis';

export async function POST(req: NextRequest) {
  const { staffId, token } = await req.json() as { staffId: string; token: string };
  const redis = getRedis();
  // 同じ端末が別の営業の名前でも登録されたままだと、その名前で応答が記録されてしまうため消す
  const all = ((await redis.hgetall(EXPO_TOKENS_KEY)) ?? {}) as Record<string, string>;
  const stale = Object.entries(all).filter(([id, t]) => t === token && id !== staffId).map(([id]) => id);
  if (stale.length > 0) await redis.hdel(EXPO_TOKENS_KEY, ...stale);
  await redis.hset(EXPO_TOKENS_KEY, { [staffId]: token });
  return NextResponse.json({ success: true, removed: stale });
}
