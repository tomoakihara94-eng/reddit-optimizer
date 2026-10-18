import { NextRequest, NextResponse } from 'next/server';
import { getRedis, getSalesUnits, SALES_UNITS_KEY } from '@/lib/dispatch-redis';
import { STAFF } from '@/lib/dispatch-config';
import { isAdmin } from '@/lib/dispatch-admin';

// 実績（台数）の管理者用API
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json({ salesUnits: await getSalesUnits() }, { headers: { 'Cache-Control': 'no-store' } });
}

// body: { staffId, units: 0〜999 の整数 }
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { staffId, units } = await req.json() as { staffId: string; units: number };
  if (!STAFF.some(s => s.id === staffId) || !Number.isInteger(units) || units < 0 || units > 999)
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  await getRedis().hset(SALES_UNITS_KEY, { [staffId]: units });
  return NextResponse.json({ success: true });
}
