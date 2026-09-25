import { NextRequest, NextResponse } from 'next/server';
import { getRedis, EXPO_TOKENS_KEY } from '@/lib/dispatch-redis';

export async function POST(req: NextRequest) {
  const { staffId, token } = await req.json() as { staffId: string; token: string };
  const redis = getRedis();
  await redis.hset(EXPO_TOKENS_KEY, { [staffId]: token });
  return NextResponse.json({ success: true });
}
