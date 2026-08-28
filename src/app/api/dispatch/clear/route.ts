import { NextResponse } from 'next/server';
import { getRedis, EVENT_KEY, PRESSES_KEY } from '@/lib/dispatch-redis';

export async function POST() {
  const redis = getRedis();
  await redis.del(EVENT_KEY);
  await redis.del(PRESSES_KEY);
  return NextResponse.json({ success: true });
}
