import { NextRequest, NextResponse } from 'next/server';
import { getRedis, EXPO_TOKENS_KEY } from '@/lib/dispatch-redis';

export async function POST(req: NextRequest) {
  const { staffId } = await req.json() as { staffId: string };
  if (!staffId) return NextResponse.json({ error: 'staffId required' }, { status: 400 });
  const redis = getRedis();
  await redis.hdel(EXPO_TOKENS_KEY, staffId);
  return NextResponse.json({ success: true });
}
