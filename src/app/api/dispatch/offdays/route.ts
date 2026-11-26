import { NextRequest, NextResponse } from 'next/server';
import { getRedis, getStaff } from '@/lib/dispatch-redis';
import { isAdmin } from '@/lib/dispatch-admin';
import { jstDate } from '@/lib/dispatch-result';
import { OFFDAYS_SOURCES_KEY, OFFDAYS_SYNC_KEY, getMonthOffdays, importOffdaysCsv, offStaffOn, syncOffdays, toCsvUrl } from '@/lib/dispatch-offdays';
import { decodeCsv } from '@/lib/dispatch-inventory';

// 公休（2026-11-25〜）
//   GET ?month=YYYY-MM … その月の日ごとの公休の名前と、今日の公休（誰でも。アプリの「公休」画面）
//       管理者（X-Admin-Pin）には取り込み元の URL と最後の取り込み結果も返す
//   POST（管理者）{ sources?: string[], sync?: true } … 取り込み元を保存して／今すぐ取り込む
//        Content-Type: text/csv なら本文の CSV（その月の公休シートをダウンロードしたもの）をそのまま取り込む（2026-11-26〜）
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
  if ((req.headers.get('content-type') ?? '').startsWith('text/csv')) {
    const buf = await req.arrayBuffer();
    if (buf.byteLength === 0 || buf.byteLength > 2_000_000) return NextResponse.json({ error: 'ファイルが空か、大きすぎます' }, { status: 400 });
    const r = await importOffdaysCsv(getRedis(), decodeCsv(new Uint8Array(buf)));
    if (!r) return NextResponse.json({ error: '表の形が違います（A1 の日付・D 列「アプリ名称」・1行目の日付を確かめてください）' }, { status: 400 });
    return NextResponse.json({ success: true, ...r });
  }
  const body = await req.json().catch(() => ({})) as { sources?: unknown; sync?: boolean };
  const redis = getRedis();
  if (body.sources !== undefined) {
    const urls = Array.isArray(body.sources) ? body.sources.filter((u): u is string => typeof u === 'string' && /^https:\/\/docs\.google\.com\/spreadsheets\//.test(u.trim())).map(toCsvUrl).slice(0, 12) : [];
    await redis.set(OFFDAYS_SOURCES_KEY, JSON.stringify(urls));
  }
  const result = await syncOffdays(redis);
  return NextResponse.json({ success: true, ...result });
}
