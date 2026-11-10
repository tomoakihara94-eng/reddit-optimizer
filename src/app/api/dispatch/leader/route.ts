import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from '@/lib/dispatch-redis';
import { setLeader, getLeader } from '@/lib/dispatch-leader';

// 今日の責任者を選ぶ（差配者画面）。POST { staffId }（null で解除）。表示は /status の leader
export async function POST(req: NextRequest) {
  const { staffId } = await req.json().catch(() => ({})) as { staffId?: string | null };
  const redis = getRedis();
  if (!(await setLeader(redis, staffId ?? null))) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ success: true, leader: await getLeader(redis) });
}
