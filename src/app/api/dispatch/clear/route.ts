import { NextResponse } from 'next/server';
import { redis, EVENT_KEY, PRESSES_KEY } from '@/lib/dispatch-redis';

export async function POST() {
  await redis.del(EVENT_KEY);
  await redis.del(PRESSES_KEY);
  return NextResponse.json({ success: true });
}
