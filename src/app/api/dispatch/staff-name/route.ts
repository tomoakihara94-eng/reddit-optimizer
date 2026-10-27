import { NextRequest, NextResponse } from 'next/server';
import { getRedis, STAFF_NAMES_KEY } from '@/lib/dispatch-redis';
import { STAFF } from '@/lib/dispatch-config';
import { isAdmin } from '@/lib/dispatch-admin';

// 営業の表示名を変える（管理者のみ）。ID は変えないので実績・得意度・通知登録はそのまま
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { staffId, name } = await req.json() as { staffId: string; name: string };
  const trimmed = typeof name === 'string' ? name.trim() : '';
  if (!STAFF.some(s => s.id === staffId) || trimmed.length < 1 || trimmed.length > 10)
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  await getRedis().hset(STAFF_NAMES_KEY, { [staffId]: trimmed });
  return NextResponse.json({ success: true, name: trimmed });
}
