import { NextResponse } from 'next/server';
import { getRedis, STAFF_CONDITIONS_KEY } from '@/lib/dispatch-redis';
import { STAFF, STAFF_CONDITIONS } from '@/lib/dispatch-config';

// 来店通知の前に営業があらかじめ選んでおくコンディション（絶好調〜絶不調）
export async function POST(req: Request) {
  try {
    const { staffId, condition } = await req.json();
    if (!STAFF.some(s => s.id === staffId) || !(condition in STAFF_CONDITIONS)) {
      return NextResponse.json({ error: 'invalid' }, { status: 400 });
    }
    await getRedis().hset(STAFF_CONDITIONS_KEY, { [staffId]: condition });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
