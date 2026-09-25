import { NextResponse } from 'next/server';
import { getRedis, CONDITIONS_KEY } from '@/lib/dispatch-redis';

export async function POST(req: Request) {
  try {
    const { staffId, condition } = await req.json();
    if (!staffId || !['抜群', '不良'].includes(condition)) {
      return NextResponse.json({ error: 'invalid' }, { status: 400 });
    }
    const redis = getRedis();
    await redis.hset(CONDITIONS_KEY, { [staffId]: condition });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
