import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from '@/lib/dispatch-redis';
import { isAdmin } from '@/lib/dispatch-admin';
import { registerToken } from '@/lib/dispatch-tokens';
import { recordToken } from '@/lib/dispatch-pushlog';

// 営業の通知の登録。その名前が別のスマホで登録済みなら 409 taken（上書きしない）
// 管理者の暗証番号（X-Admin-Pin）付きなら、このスマホに引き継ぐ（機種変更・入れ直し用）
// アプリは営業画面を開くたびに呼ぶので、記録は「新規・引き継ぎ・断った・別の名前を消した」ときだけ残す
export async function POST(req: NextRequest) {
  const { staffId, token } = await req.json() as { staffId: string; token: string };
  if (!staffId || !token) return NextResponse.json({ error: 'staffId and token required' }, { status: 400 });
  const redis = getRedis();
  const admin = isAdmin(req);
  const r = await registerToken(redis, staffId, token, admin);
  const result = r.taken ? 'taken（別のスマホで登録済み）'
    : r.changed ? `${admin ? '引き継ぎ（管理者）' : '新規登録'}${r.removed.length ? `・このスマホの ${r.removed.join(',')} を消した` : ''}`
    : null;
  if (result) {
    await recordToken(redis, {
      t: Date.now(), action: 'register', staffId, result,
      ip: req.headers.get('x-forwarded-for')?.split(',')[0] ?? undefined, ua: req.headers.get('user-agent')?.slice(0, 80) ?? undefined,
    });
  }
  if (r.taken) return NextResponse.json({ error: 'taken' }, { status: 409 });
  return NextResponse.json({ success: true, removed: r.removed });
}
