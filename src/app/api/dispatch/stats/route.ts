import { NextRequest, NextResponse } from 'next/server';
import { getRedis, getStaff } from '@/lib/dispatch-redis';
import { isAdmin } from '@/lib/dispatch-admin';
import { jstDate } from '@/lib/dispatch-result';
import { getStats } from '@/lib/dispatch-stats';

// 投票率（管理者のみ）  ?days=1|7|30 … 今日から遡った日数（日本時間）
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const days = Math.min(180, Math.max(1, Number(new URL(req.url).searchParams.get('days')) || 7));
  const now = Date.now();
  const dates = Array.from({ length: days }, (_, i) => jstDate(now - i * 86400_000));
  const stats = await getStats(getRedis(), dates);
  const staff = await getStaff();
  const byId = Object.fromEntries(stats.map(r => [r.id, r]));
  const rows = staff.map(s => {
    const r = byId[s.id] ?? { notified: 0, responded: 0, byResponse: {} };
    return { id: s.id, name: s.name, notified: r.notified, responded: r.responded, byResponse: r.byResponse,
      rate: r.notified > 0 ? Math.round((r.responded / r.notified) * 1000) / 10 : null };
  });
  return NextResponse.json({ from: dates[dates.length - 1], to: dates[0], rows }, { headers: { 'Cache-Control': 'no-store' } });
}
