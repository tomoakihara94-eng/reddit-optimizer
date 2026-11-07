import { NextRequest, NextResponse } from 'next/server';
import { getRedis, isStaffId, INQUIRY_ONLY_KEY } from '@/lib/dispatch-redis';

// 「電話問い合わせだけ受ける」の切り替え（営業本人。本人が戻すまで続く。2026-11-07〜）
export async function POST(req: NextRequest) {
  const { staffId, on } = await req.json().catch(() => ({})) as { staffId?: string; on?: boolean };
  const redis = getRedis();
  if (!(await isStaffId(staffId, redis)) || typeof on !== 'boolean') return NextResponse.json({ error: 'invalid' }, { status: 400 });
  if (on) await redis.hset(INQUIRY_ONLY_KEY, { [staffId!]: '1' });
  else await redis.hdel(INQUIRY_ONLY_KEY, staffId!);
  return NextResponse.json({ success: true, on });
}
