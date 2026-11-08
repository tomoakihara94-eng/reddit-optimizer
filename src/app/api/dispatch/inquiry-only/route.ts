import { NextRequest, NextResponse } from 'next/server';
import { getRedis, isStaffId, INQUIRY_ONLY_KEY } from '@/lib/dispatch-redis';
import { deviceCheck } from '@/lib/dispatch-tokens';
import { recordToken } from '@/lib/dispatch-pushlog';

// 「電話問い合わせだけ受ける」の切り替え（営業本人。本人が戻すまで続く。2026-11-07〜）
// その営業の名前で登録されているスマホ（token が一致）からだけ変えられる（2026-11-08〜。別の人の名前では変えられない）
export async function POST(req: NextRequest) {
  const { staffId, on, token } = await req.json().catch(() => ({})) as { staffId?: string; on?: boolean; token?: string };
  const redis = getRedis();
  if (!(await isStaffId(staffId, redis)) || typeof on !== 'boolean') return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const device = await deviceCheck(redis, staffId!, token);
  await recordToken(redis, {
    t: Date.now(), action: 'inquiry-only', staffId: staffId!, result: `${on ? 'オン' : 'オフ'}${device === 'ok' ? '' : '（断った: 本人のスマホではない）'}`,
    ip: req.headers.get('x-forwarded-for')?.split(',')[0] ?? undefined, ua: req.headers.get('user-agent')?.slice(0, 80) ?? undefined,
  });
  if (device !== 'ok') return NextResponse.json({ error: 'not this device' }, { status: 403 });
  if (on) await redis.hset(INQUIRY_ONLY_KEY, { [staffId!]: '1' });
  else await redis.hdel(INQUIRY_ONLY_KEY, staffId!);
  return NextResponse.json({ success: true, on });
}
