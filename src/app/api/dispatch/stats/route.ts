import { NextRequest, NextResponse } from 'next/server';
import { getRedis, getStaff } from '@/lib/dispatch-redis';
import { isAdmin } from '@/lib/dispatch-admin';
import { getResults, jstDate } from '@/lib/dispatch-result';
import { getStats } from '@/lib/dispatch-stats';

// 投票率・当選率（管理者のみ。2026-11-07 専用パスワードは廃止＝ユーザー指定）
//   ?days=1|7|30 … 今日から遡った日数（日本時間）。出勤日（1回以上応答した日）だけを集計
//   投票率 = 応答 ÷ 通知が届いた回数、当選率 = 当選 ÷ 応答（当選回数は計算結果の記録から）
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const days = Math.min(180, Math.max(1, Number(new URL(req.url).searchParams.get('days')) || 7));
  const redis = getRedis();
  const now = Date.now();
  const dates = Array.from({ length: days }, (_, i) => jstDate(now - i * 86400_000));
  const winsByDate: Record<string, Record<string, number>> = {};
  for (const date of dates) {
    for (const r of await getResults(redis, date)) {
      if (r.unassigned || !r.winnerId) continue; // 担当なしの回は当選に数えない
      const w = (winsByDate[date] ??= {});
      w[r.winnerId] = (w[r.winnerId] ?? 0) + 1;
    }
  }
  const stats = await getStats(redis, dates, winsByDate);
  const staff = await getStaff(redis);
  const byId = Object.fromEntries(stats.map(r => [r.id, r]));
  const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : null);
  const rows = staff.map(s => {
    const r = byId[s.id] ?? { days: 0, notified: 0, responded: 0, wins: 0, byResponse: {} };
    return {
      id: s.id, name: s.name, days: r.days, notified: r.notified, responded: r.responded, wins: r.wins, byResponse: r.byResponse,
      rate: pct(r.responded, r.notified), winRate: pct(r.wins, r.responded),
    };
  });
  return NextResponse.json({ from: dates[dates.length - 1], to: dates[0], rows }, { headers: { 'Cache-Control': 'no-store' } });
}
