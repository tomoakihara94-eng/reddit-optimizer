import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from '@/lib/dispatch-redis';
import { isAdmin } from '@/lib/dispatch-admin';
import { LABELS_KEY, getLabels, validateLabels } from '@/lib/dispatch-labels';

// 差配者画面のボタンの名前（読むのは /config でも可。変更は管理者のみ）
export async function GET() {
  return NextResponse.json({ labels: await getLabels(getRedis()) }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const labels = validateLabels((await req.json()).labels);
  if (!labels) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  await getRedis().set(LABELS_KEY, JSON.stringify(labels));
  return NextResponse.json({ success: true, labels });
}
