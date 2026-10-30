import { NextRequest, NextResponse } from 'next/server';
import { getRedis, EVENT_KEY, type DispatchEvent } from '@/lib/dispatch-redis';
import { getResults, jstDate } from '@/lib/dispatch-result';

// 今回の当選の計算結果（営業も見られる・暗証番号なし）
//   ?eventId=… … いま表示中（担当決定）の1件だけ返す。過去の結果は管理者の /results
export async function GET(req: NextRequest) {
  const eventId = new URL(req.url).searchParams.get('eventId');
  const noStore = { headers: { 'Cache-Control': 'no-store' } };
  const redis = getRedis();
  const event = await redis.get<DispatchEvent>(EVENT_KEY);
  if (!eventId || !event || String(event.id) !== eventId || event.status !== 'assigned') {
    return NextResponse.json({ result: null }, noStore);
  }
  const results = await getResults(redis, jstDate(event.startedAt));
  return NextResponse.json({ result: results.find(r => r.eventId === eventId) ?? null }, noStore);
}
