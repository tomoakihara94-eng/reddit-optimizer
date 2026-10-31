import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from '@/lib/dispatch-redis';
import { getResults, jstDate } from '@/lib/dispatch-result';

// 当選の計算結果（2026-10-31〜 営業も見られるよう暗証番号なし。編集の API は引き続き管理者のみ）
//   ?date=YYYY-MM-DD … その日（日本時間）の全結果
//   ?eventId=…       … 1回分の結果
export async function GET(req: NextRequest) {
  const redis = getRedis();
  const url = new URL(req.url);
  const eventId = url.searchParams.get('eventId');
  const noStore = { headers: { 'Cache-Control': 'no-store' } };

  if (eventId) {
    const results = await getResults(redis, jstDate(Number(eventId)));
    const result = results.find(r => r.eventId === eventId) ?? null;
    return NextResponse.json({ result }, noStore);
  }

  const date = url.searchParams.get('date') ?? jstDate(Date.now());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: 'invalid date' }, { status: 400 });
  return NextResponse.json({ date, results: await getResults(redis, date) }, noStore);
}
