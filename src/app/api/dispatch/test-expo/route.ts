import { NextRequest, NextResponse } from 'next/server';
import { getRedis, getStaff, EXPO_TOKENS_KEY } from '@/lib/dispatch-redis';
import { recordPush } from '@/lib/dispatch-pushlog';

// 1人の営業にだけテスト通知を送る（「通知が来ない」の調査用。2026-11-04〜）
//   POST { staffId } … 来店通知と同じ音・同じ形で送る。同じ人には30秒に1回まで。夜間・通知OFFでも送る（調査のため）
//   結果は dispatch:push_log に stage 'テスト' で残る。Apple まで届いたかは GET /push-log?receipts=1（1分ほど後）
export async function POST(req: NextRequest) {
  const { staffId } = await req.json().catch(() => ({})) as { staffId?: string };
  const staff = (await getStaff()).find(s => s.id === staffId);
  if (!staffId || !staff) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const redis = getRedis();
  const token = await redis.hget<string>(EXPO_TOKENS_KEY, staffId);
  if (!token) return NextResponse.json({ error: 'not registered' }, { status: 400 });
  if (!(await redis.set(`dispatch:testpush:${staffId}`, '1', { nx: true, ex: 30 }))) {
    return NextResponse.json({ error: 'wait 30 seconds' }, { status: 429 });
  }
  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify([{
      to: token, sound: 'raiten.wav', title: '🔔 テスト通知', body: `${staff.name}さんへのテストです（応答は不要です）`,
      ttl: 120, interruptionLevel: 'time-sensitive', data: { staffId, test: true },
    }]),
  });
  const json = await res.json().catch(() => null) as { data?: { status: string; id?: string; message?: string; details?: { error?: string } }[] } | null;
  const d = json?.data?.[0];
  const ticket = !d ? `unknown(HTTP ${res.status})` : d.status === 'ok' ? `ok:${d.id ?? ''}` : `error:${d.details?.error ?? d.message ?? ''}`;
  await recordPush(redis, { t: Date.now(), stage: 'テスト', sent: [staffId], skipped: {}, tickets: { [staffId]: ticket } });
  return NextResponse.json({ staffId, ticket });
}
