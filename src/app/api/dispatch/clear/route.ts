import { NextResponse } from 'next/server';
import { getRedis, EVENT_KEY, PRESSES_KEY, CONDITIONS_KEY, type DispatchEvent } from '@/lib/dispatch-redis';
import { finalizeIfDecided, recordUnassigned } from '@/lib/dispatch-result';

// 次のお客様（今の来店・問い合わせを終える）。担当が決まらないまま終えた回も計算結果に「担当なし」で残す
export async function POST() {
  const redis = getRedis();
  const event = await redis.get<DispatchEvent>(EVENT_KEY);
  if (event?.status === 'active' && !(await finalizeIfDecided(redis, event))) await recordUnassigned(redis, event);
  await redis.del(EVENT_KEY);
  await redis.del(PRESSES_KEY);
  await redis.del(CONDITIONS_KEY);
  return NextResponse.json({ success: true });
}
