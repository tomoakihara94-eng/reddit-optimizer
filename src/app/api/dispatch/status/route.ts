import { NextResponse } from 'next/server';
import { getRedis, getActiveMutes, getActiveMuteReasons, EVENT_KEY, PRESSES_KEY, CONDITIONS_KEY, STAFF_CONDITIONS_KEY, type DispatchEvent } from '@/lib/dispatch-redis';
import { parsePresses } from '@/lib/dispatch-winner';
import { finalizeIfDecided } from '@/lib/dispatch-result';
import { WINDOW_MS, isQuietHours } from '@/lib/dispatch-config';

export async function GET(req: Request) {
  // 営業アプリは自分の staffId を付けて問い合わせる。当選者本人にだけお客様タイプを返す
  const staffId = new URL(req.url).searchParams.get('staffId');
  const redis = getRedis();
  const event = await redis.get<DispatchEvent>(EVENT_KEY);
  const mutes = await getActiveMutes(redis);
  const muteReasons = await getActiveMuteReasons(redis).catch(() => ({}));
  const quiet = isQuietHours(); // 差配者画面に「夜間は通知なし」を出すため
  if (!event) return NextResponse.json({ status: 'idle', mutes, muteReasons, quiet }, { headers: { 'Cache-Control': 'no-store' } });

  const rawConditions = (await redis.hgetall(CONDITIONS_KEY)) ?? {};
  const conditions = rawConditions as Record<string, string>;
  const staffConditions = ((await redis.hgetall(STAFF_CONDITIONS_KEY)) ?? {}) as Record<string, string>;

  // 来店 / 問い合わせ（問い合わせはサイト・内線も営業全員に見せる）
  const kindInfo = {
    ...(event.kind === 'inquiry' ? { kind: 'inquiry', source: event.source, line: event.line } : { kind: 'visit' }),
    ...(event.dispatchedBy ? { dispatchedBy: event.dispatchedBy } : {}),
  };

  if (event.status === 'assigned') {
    const customerType = staffId && staffId === event.winner?.id ? event.customerType ?? null : undefined;
    return NextResponse.json({ status: 'assigned', winner: event.winner, eventId: event.id, ...kindInfo, conditions, mutes, muteReasons, ...(customerType !== undefined ? { customerType } : {}) });
  }

  const winner = await finalizeIfDecided(redis, event);
  if (winner) {
    const customerType = staffId && staffId === winner.id ? event.customerType ?? null : undefined;
    return NextResponse.json({ status: 'assigned', winner, eventId: event.id, ...kindInfo, conditions, mutes, muteReasons, ...(customerType !== undefined ? { customerType } : {}) });
  }

  const raw = (await redis.hgetall(PRESSES_KEY)) ?? {};
  const presses = parsePresses(raw as Record<string, unknown>);

  const remaining = Math.max(0, Math.ceil((event.startedAt + WINDOW_MS - Date.now()) / 1000));
  return NextResponse.json({
    status: 'active',
    remaining,
    pressedIds: presses.map(p => p.id),
    responses: Object.fromEntries(presses.map(p => [p.id, p.response])),
    staffConditions,
    dispatcherId: event.dispatcherId ?? null,
    mutes,
    muteReasons,
    ...kindInfo,
    conditions,
  });
}
