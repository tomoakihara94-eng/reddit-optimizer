import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from '@/lib/dispatch-redis';
import { isAdmin } from '@/lib/dispatch-admin';
import { unregisterToken } from '@/lib/dispatch-tokens';

// 通知の登録を消す。token 付き（1.1.40〜）はそのスマホの登録のときだけ、管理者は必ず、どちらもなし（古いアプリ）は従来どおり
export async function POST(req: NextRequest) {
  const { staffId, token } = await req.json() as { staffId: string; token?: string };
  if (!staffId) return NextResponse.json({ error: 'staffId required' }, { status: 400 });
  const ok = await unregisterToken(getRedis(), staffId, token, isAdmin(req));
  return NextResponse.json(ok ? { success: true } : { success: false, error: 'not this device' });
}
