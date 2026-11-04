import { NextRequest, NextResponse } from 'next/server';
import { getRedis, getStaff } from '@/lib/dispatch-redis';
import { isAdmin } from '@/lib/dispatch-admin';
import { jstDate } from '@/lib/dispatch-result';
import { getStats } from '@/lib/dispatch-stats';

// 投票率（管理者の暗証番号に加えて、投票率専用のパスワードが必要。2026-11-04 ユーザー指定）
//   ヘッダー X-Admin-Pin（DISPATCH_ADMIN_PIN）と X-Stats-Pin（Vercel の環境変数 DISPATCH_STATS_PIN。未設定なら誰も見られない）
//   ?days=1|7|30 … 今日から遡った日数（日本時間）。出勤日（1回以上応答した日）だけを集計
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const statsPin = process.env.DISPATCH_STATS_PIN;
  if (!statsPin) return NextResponse.json({ error: 'not configured' }, { status: 503 });
  if (req.headers.get('x-stats-pin') !== statsPin) return NextResponse.json({ error: 'wrong stats pin' }, { status: 403 });
  const days = Math.min(180, Math.max(1, Number(new URL(req.url).searchParams.get('days')) || 7));
  const now = Date.now();
  const dates = Array.from({ length: days }, (_, i) => jstDate(now - i * 86400_000));
  const stats = await getStats(getRedis(), dates);
  const staff = await getStaff();
  const byId = Object.fromEntries(stats.map(r => [r.id, r]));
  const rows = staff.map(s => {
    const r = byId[s.id] ?? { days: 0, notified: 0, responded: 0, byResponse: {} };
    return { id: s.id, name: s.name, days: r.days, notified: r.notified, responded: r.responded, byResponse: r.byResponse,
      rate: r.notified > 0 ? Math.round((r.responded / r.notified) * 1000) / 10 : null };
  });
  return NextResponse.json({ from: dates[dates.length - 1], to: dates[0], rows }, { headers: { 'Cache-Control': 'no-store' } });
}
