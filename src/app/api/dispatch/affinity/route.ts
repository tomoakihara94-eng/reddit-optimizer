import { NextRequest, NextResponse } from 'next/server';
import { getRedis, getAffinityTable, AFFINITY_KEY } from '@/lib/dispatch-redis';
import { STAFF, CUSTOMER_TYPES, AFFINITY_MIN, AFFINITY_MAX } from '@/lib/dispatch-config';

// 得意度（1〜10）の管理者用API。暗証番号は Vercel の環境変数 DISPATCH_ADMIN_PIN
function authorized(req: NextRequest) {
  const pin = process.env.DISPATCH_ADMIN_PIN;
  return !!pin && req.headers.get('x-admin-pin') === pin;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json({ affinity: await getAffinityTable() }, { headers: { 'Cache-Control': 'no-store' } });
}

// body: { staffId, levels: { 軽自動車: 1〜10, ... } }
export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { staffId, levels } = await req.json() as { staffId: string; levels: Record<string, number> };
  if (!STAFF.some(s => s.id === staffId) || !levels || typeof levels !== 'object')
    return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const clean: Record<string, number> = {};
  for (const t of CUSTOMER_TYPES) {
    const v = levels[t];
    if (v === undefined) continue;
    if (!Number.isInteger(v) || v < AFFINITY_MIN || v > AFFINITY_MAX)
      return NextResponse.json({ error: `invalid level for ${t}` }, { status: 400 });
    clean[t] = v;
  }
  await getRedis().hset(AFFINITY_KEY, { [staffId]: JSON.stringify(clean) });
  return NextResponse.json({ success: true });
}
