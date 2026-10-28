import { NextRequest, NextResponse } from 'next/server';
import { getRedis, getTelTable, TEL_KEY } from '@/lib/dispatch-redis';
import { STAFF } from '@/lib/dispatch-config';
import { isAdmin } from '@/lib/dispatch-admin';

// 問い合わせの TEL（1〜10）。管理者画面「当選の設定 → TEL」
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json({ tel: await getTelTable(getRedis()) }, { headers: { 'Cache-Control': 'no-store' } });
}

// body: { staffId, level: 1〜10 }
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { staffId, level } = await req.json() as { staffId: string; level: number };
  if (!STAFF.some(s => s.id === staffId) || !Number.isInteger(level) || level < 1 || level > 10)
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  await getRedis().hset(TEL_KEY, { [staffId]: level });
  return NextResponse.json({ success: true });
}
