import { NextResponse } from 'next/server';
import { getRedis, MUTES_KEY, MUTE_REASONS_KEY } from '@/lib/dispatch-redis';
import { STAFF, MUTE_OPTIONS_MIN, MUTE_OFF, MUTE_OFF_MS, MUTE_CUSTOM_MAX_MIN, MUTE_REASON_MAX } from '@/lib/dispatch-config';

// 来店通知を止める
//   minutes: 10〜60（10分刻み）… 理由なし
//   minutes: 61〜720 … reason（理由）が必須。差配者画面に表示される
//   minutes: 0 … 再開
//   minutes: -1 … 「ON に戻すまで」（1.1.32 以前のアプリ用に残す）
export async function POST(req: Request) {
  const { staffId, minutes, reason } = await req.json() as { staffId: string; minutes: number; reason?: string };
  const why = typeof reason === 'string' ? reason.trim() : '';
  const custom = Number.isInteger(minutes) && minutes > 60 && minutes <= MUTE_CUSTOM_MAX_MIN;
  const ok = STAFF.some(s => s.id === staffId) && (
    minutes === 0 || minutes === MUTE_OFF || MUTE_OPTIONS_MIN.includes(minutes)
    || (custom && why.length >= 1 && why.length <= MUTE_REASON_MAX)
  );
  if (!ok) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const redis = getRedis();
  if (minutes === 0) {
    await redis.hdel(MUTES_KEY, staffId);
    await redis.hdel(MUTE_REASONS_KEY, staffId);
    return NextResponse.json({ success: true, mutedUntil: null });
  }
  const mutedUntil = Date.now() + (minutes === MUTE_OFF ? MUTE_OFF_MS : minutes * 60_000);
  await redis.hset(MUTES_KEY, { [staffId]: mutedUntil });
  if (custom) await redis.hset(MUTE_REASONS_KEY, { [staffId]: why });
  else await redis.hdel(MUTE_REASONS_KEY, staffId);
  return NextResponse.json({ success: true, mutedUntil });
}
