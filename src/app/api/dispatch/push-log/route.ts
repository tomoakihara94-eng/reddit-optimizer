import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from '@/lib/dispatch-redis';
import { PUSH_LOG_KEY, TOKEN_LOG_KEY, readLog, type PushLog, type TokenLog } from '@/lib/dispatch-pushlog';

// 通知の送信記録と登録の変更記録（調査用。トークンは含まない）
//   ?receipts=1 … 直近の送信について、Apple まで届いたか（Expo の receipt）も調べて付ける（送信から24時間以内）
export async function GET(req: NextRequest) {
  const redis = getRedis();
  const pushes = await readLog<PushLog>(redis, PUSH_LOG_KEY, 100);
  const tokens = await readLog<TokenLog>(redis, TOKEN_LOG_KEY, 100);
  let receipts: Record<string, unknown> | undefined;
  if (new URL(req.url).searchParams.get('receipts')) {
    const ids = pushes.slice(0, 30).flatMap(p => Object.values(p.tickets ?? {}))
      .filter(v => v.startsWith('ok:')).map(v => v.slice(3)).filter(Boolean).slice(0, 300);
    if (ids.length) {
      const res = await fetch('https://exp.host/--/api/v2/push/getReceipts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }),
      }).catch(() => null);
      receipts = (await res?.json().catch(() => null))?.data ?? {};
    }
  }
  return NextResponse.json({ pushes, tokens, ...(receipts ? { receipts } : {}) }, { headers: { 'Cache-Control': 'no-store' } });
}
