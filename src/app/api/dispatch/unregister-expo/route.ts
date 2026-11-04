import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from '@/lib/dispatch-redis';
import { isAdmin } from '@/lib/dispatch-admin';
import { unregisterToken } from '@/lib/dispatch-tokens';
import { recordToken } from '@/lib/dispatch-pushlog';

// 通知の登録を消す。token 付き（1.1.40〜）はそのスマホの登録のときだけ、管理者は必ず、どちらもなし（古いアプリ）は消さない
export async function POST(req: NextRequest) {
  const { staffId, token } = await req.json() as { staffId: string; token?: string };
  if (!staffId) return NextResponse.json({ error: 'staffId required' }, { status: 400 });
  const redis = getRedis();
  const admin = isAdmin(req);
  const result = await unregisterToken(redis, staffId, token, admin);
  await recordToken(redis, {
    t: Date.now(), action: 'unregister', staffId, result: admin ? `${result}（管理者）` : result,
    ip: req.headers.get('x-forwarded-for')?.split(',')[0] ?? undefined, ua: req.headers.get('user-agent')?.slice(0, 80) ?? undefined,
  });
  return NextResponse.json(result === 'deleted' ? { success: true } : { success: false, error: result });
}
