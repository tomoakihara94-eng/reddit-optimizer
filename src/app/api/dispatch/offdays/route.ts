import { NextRequest, NextResponse } from 'next/server';
import { getRedis, getStaff } from '@/lib/dispatch-redis';
import { isAdmin } from '@/lib/dispatch-admin';
import { jstDate } from '@/lib/dispatch-result';
import { OFFDAYS_SOURCES_KEY, OFFDAYS_SYNC_KEY, getMonthOffdays, offStaffOn, syncOffdays } from '@/lib/dispatch-offdays';

// 公休（2026-11-25〜）
//   GET ?month=YYYY-MM … その月の日ごとの公休の名前と、今日の公休（誰でも。アプリの「公休」画面）
//       管理者（X-Admin-Pin）には取り込み元の URL と最後の取り込み結果も返す
//   POST（管理者）{ sources?: string[], sync?: true } … 取り込み元を保存して／今すぐ取り込む
export async function GET(req: NextRequest) {
  const redis = getRedis();
  const month = new URL(req.url).searchParams.get('month') ?? jstDate(Date.now()).slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ error: 'invalid month' }, { status: 400 });
  const staff = await getStaff(redis);
  const name = (id: string) => staff.find(s => s.id === id)?.name ?? id;
  const off = await getMonthOffdays(redis, month);
  const days: Record<number, string[]> = {};
  for (const [id, ds] of Object.entries(off)) for (const d of ds) (days[d] ??= []).push(name(id));
  const today = (await offStaffOn(redis)).map(name);
  const admin = isAdmin(req)
    ? { sources: (await redis.get<string[]>(OFFDAYS_SOURCES_KEY)) ?? [], lastSync: await redis.get(OFFDAYS_SYNC_KEY) }
    : {};
  return NextResponse.json({ month, days, today, imported: Object.keys(off).length > 0, ...admin }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({})) as { sources?: unknown; sync?: boolean };
  const redis = getRedis();
  if (body.sources !== undefined) {
    const urls = Array.isArray(body.sources) ? body.sources.filter((u): u is string => typeof u === 'string' && /^https:\/\/docs\.google\.com\/spreadsheets\//.test(u.trim())).map(u => u.trim()).slice(0, 12) : [];
    await redis.set(OFFDAYS_SOURCES_KEY, JSON.stringify(urls));
  }
  const result = await syncOffdays(redis);
  return NextResponse.json({ success: true, ...result });
}
