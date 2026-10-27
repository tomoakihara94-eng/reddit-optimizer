import { NextResponse } from 'next/server';
import { keepNotifying } from '@/lib/dispatch-push';

// 30秒たっても当選者がいないとき、差配者のアプリが定期的に呼ぶ。間隔・上限はサーバー側で守る
export async function POST() {
  const sent = await keepNotifying().catch(() => false);
  return NextResponse.json({ sent });
}
