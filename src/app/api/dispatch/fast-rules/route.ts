import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from '@/lib/dispatch-redis';
import { isAdmin } from '@/lib/dispatch-admin';
import { fastRulesKey, getFastRules, validateFastRules, type RulesKind } from '@/lib/dispatch-fast';

// 即決定方式の設定（管理者のみ）。?kind=inquiry で問い合わせ用（2026-11-14〜）。なしは来店用（古いアプリもこちら）
const kindOf = (req: NextRequest): RulesKind => (new URL(req.url).searchParams.get('kind') === 'inquiry' ? 'inquiry' : 'visit');

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json({ rules: await getFastRules(getRedis(), kindOf(req)) }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const rules = validateFastRules((await req.json()).rules);
  if (!rules) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  await getRedis().set(fastRulesKey(kindOf(req)), JSON.stringify(rules));
  return NextResponse.json({ success: true, rules });
}
