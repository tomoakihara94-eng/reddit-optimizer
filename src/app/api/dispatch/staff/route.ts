import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from '@/lib/dispatch-redis';
import { isAdmin } from '@/lib/dispatch-admin';
import { addStaff, removeStaff } from '@/lib/dispatch-staff';

// 営業の追加（POST { name }）・削除（DELETE { staffId }）。管理者のみ
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { name } = await req.json().catch(() => ({})) as { name?: string };
  const r = await addStaff(getRedis(), String(name ?? ''));
  return 'error' in r ? NextResponse.json(r, { status: 400 }) : NextResponse.json({ success: true, id: r.id });
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { staffId } = await req.json().catch(() => ({})) as { staffId?: string };
  const ok = await removeStaff(getRedis(), String(staffId ?? ''));
  return ok ? NextResponse.json({ success: true }) : NextResponse.json({ error: 'not found' }, { status: 404 });
}
