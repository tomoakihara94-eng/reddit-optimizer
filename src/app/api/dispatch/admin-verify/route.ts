import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/dispatch-admin';

// 管理者の暗証番号が正しいかだけを確認する（差配者の毎日のログイン用）
export async function POST(req: NextRequest) {
  return isAdmin(req)
    ? NextResponse.json({ success: true })
    : NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}
