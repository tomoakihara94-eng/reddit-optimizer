import { NextResponse } from 'next/server';
import { getRedis, MUTES_KEY, MUTE_REASONS_KEY, isStaffId } from '@/lib/dispatch-redis';
import { deviceCheck } from '@/lib/dispatch-tokens';
import { recordToken } from '@/lib/dispatch-pushlog';
import { MUTE_OPTIONS_MIN, MUTE_OFF, MUTE_OFF_MS, MUTE_CUSTOM_MAX_MIN, MUTE_REASON_MAX } from '@/lib/dispatch-config';

// 来店通知を止める
//   minutes: 10〜60（10分刻み）… 理由なし
//   minutes: 61〜720 … reason（理由）が必須。差配者画面に表示される
//   minutes: 0 … 再開
//   minutes: -1 … 「ON に戻すまで」（1.1.32 以前のアプリ用に残す）
// 2026-11-08〜: token 付き（1.1.47〜）は、その営業の名前で登録されているスマホのときだけ変えられる。token なし（古いアプリ）は従来どおり受ける
export async function POST(req: Request) {
  const { staffId, minutes, reason, token } = await req.json() as { staffId: string; minutes: number; reason?: string; token?: string };
  const why = typeof reason === 'string' ? reason.trim() : '';
  const custom = Number.isInteger(minutes) && minutes > 60 && minutes <= MUTE_CUSTOM_MAX_MIN;
  const ok = (await isStaffId(staffId)) && (
    minutes === 0 || minutes === MUTE_OFF || MUTE_OPTIONS_MIN.includes(minutes)
    || (custom && why.length >= 1 && why.length <= MUTE_REASON_MAX)
  );
  if (!ok) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const redis = getRedis();
  if ((await deviceCheck(redis, staffId, token)) === 'other') {
    await recordToken(redis, { t: Date.now(), action: 'mute', staffId, result: `${minutes}分（断った: 本人のスマホではない）`,
      ip: req.headers.get('x-forwarded-for')?.split(',')[0] ?? undefined });
    return NextResponse.json({ error: 'not this device' }, { status: 403 });
  }
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
