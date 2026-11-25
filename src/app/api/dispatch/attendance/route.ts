import { NextRequest, NextResponse } from 'next/server';
import { getRedis, isStaffId } from '@/lib/dispatch-redis';
import { deviceCheck } from '@/lib/dispatch-tokens';
import { recordToken } from '@/lib/dispatch-pushlog';
import { setTodayAttendance } from '@/lib/dispatch-offdays';

// 今日の出勤／公休の切り替え（営業本人。今日だけ。公休表の間違いをその場で直す。2026-11-25〜）
//   POST { staffId, off: boolean, token }。本人のスマホ（通知の登録と同じトークン）からだけ
export async function POST(req: NextRequest) {
  const { staffId, off, token } = await req.json().catch(() => ({})) as { staffId?: string; off?: boolean; token?: string };
  const redis = getRedis();
  if (!(await isStaffId(staffId, redis)) || typeof off !== 'boolean') return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const device = await deviceCheck(redis, staffId!, token);
  await recordToken(redis, { t: Date.now(), action: 'mute', staffId: staffId!, result: `今日${off ? '公休' : '出勤'}${device === 'ok' ? '' : '（断った: 本人のスマホではない）'}` });
  if (device !== 'ok') return NextResponse.json({ error: 'not this device' }, { status: 403 });
  await setTodayAttendance(redis, staffId!, off);
  return NextResponse.json({ success: true, off });
}
