import { NextRequest, NextResponse } from 'next/server';
import { getRedis, TOKENS_KEY } from '@/lib/dispatch-redis';

export async function POST(req: NextRequest) {
  const { staffId, subscription } = await req.json() as { staffId: string; subscription: unknown };
  const redis = getRedis();
  await redis.hset(TOKENS_KEY, { [staffId]: JSON.stringify(subscription) });
  return NextResponse.json({ success: true });
}
