import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from '@/lib/dispatch-redis';
import { isAdmin } from '@/lib/dispatch-admin';
import { FAST_RULES_KEY, getFastRules, validateFastRules } from '@/lib/dispatch-fast';

// 即決定方式の設定（管理者のみ）
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json({ rules: await getFastRules(getRedis()) }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const rules = validateFastRules((await req.json()).rules);
  if (!rules) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  await getRedis().set(FAST_RULES_KEY, JSON.stringify(rules));
  return NextResponse.json({ success: true, rules });
}
