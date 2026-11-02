import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from '@/lib/dispatch-redis';
import { isAdmin } from '@/lib/dispatch-admin';
import { registerToken } from '@/lib/dispatch-tokens';

// 営業の通知の登録。その名前が別のスマホで登録済みなら 409 taken（上書きしない）
// 管理者の暗証番号（X-Admin-Pin）付きなら、このスマホに引き継ぐ（機種変更・入れ直し用）
export async function POST(req: NextRequest) {
  const { staffId, token } = await req.json() as { staffId: string; token: string };
  if (!staffId || !token) return NextResponse.json({ error: 'staffId and token required' }, { status: 400 });
  const r = await registerToken(getRedis(), staffId, token, isAdmin(req));
  if (r.taken) return NextResponse.json({ error: 'taken' }, { status: 409 });
  return NextResponse.json({ success: true, removed: r.removed });
}
