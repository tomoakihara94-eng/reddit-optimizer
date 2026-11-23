import { NextRequest, NextResponse, after } from 'next/server';
import { getRedis, getStaff, isStaffId, pushText, EVENT_KEY, PRESSES_KEY, CONDITIONS_KEY, TOKENS_KEY, EXPO_TOKENS_KEY, NOTIFY_LOG_KEY, type DispatchEvent } from '@/lib/dispatch-redis';
import { CUSTOMER_TYPES } from '@/lib/dispatch-config';
import { getLabels } from '@/lib/dispatch-labels';
import { finalizeIfDecided, recordUnassigned, recordReserved } from '@/lib/dispatch-result';
import { sendVisitPush, repushToPending, gatedIdsNow, excludeOf } from '@/lib/dispatch-push';
import { getFastRules, repushTimesSec } from '@/lib/dispatch-fast';

export const runtime = 'nodejs';
export const maxDuration = 60; // 再通知（最大20秒後）まで関数を生かしておく

export async function POST(req: NextRequest) {
  try {
    const redis = getRedis();
    const body = await req.json().catch(() => ({})) as {
      dispatcherId?: string; customerType?: string; kind?: string; source?: string; line?: string; dispatchedBy?: string; note?: string; kiosk?: boolean;
      reservation?: { name?: string; staffId?: string; kind?: string }; modelDecided?: boolean; // 受付 iPad（2026-11-19〜）
    };
    // 共有事項（任意、200文字まで）
    const note = typeof body.note === 'string' && body.note.trim() ? body.note.trim().slice(0, 200) : undefined;
    const labels = await getLabels(redis);
    // 差配した人・電話を受けた人（1.1.35 以降のアプリが送る。名前は管理者が変えられるので文字数だけ確かめる）
    const dispatchedBy = typeof body.dispatchedBy === 'string' && body.dispatchedBy.trim() && body.dispatchedBy.trim().length <= 20
      ? body.dispatchedBy.trim() : undefined;
    // 受付 iPad（お客様が押す）。来店のみ。お客様タイプは「？」扱い（ユーザー指定: お客様には選ばせない）
    const kiosk = body.kiosk === true && body.kind !== 'inquiry';
    // 問い合わせ: 内線は必須、サイトは任意（送るなら一覧にあるもの）
    const sourceOk = !body.source || labels.inquirySources.includes(body.source);
    const inquiry = body.kind === 'inquiry' && sourceOk && labels.inquiryLines.includes(body.line ?? '');
    if (body.kind === 'inquiry' && !inquiry) return NextResponse.json({ error: 'invalid inquiry' }, { status: 400 });
    // お客様タイプ（来店・問い合わせとも。担当者以外には見せない）
    // 受付 iPad: 予約あり（名前・担当（任意））／予約なし（お客様タイプ・車種が決まっているか）
    const resName = kiosk && typeof body.reservation?.name === 'string' ? body.reservation.name.trim().slice(0, 20) : '';
    const resKind = body.reservation?.kind === 'delivery' ? 'delivery' as const : body.reservation?.kind === 'nominated' ? 'nominated' as const : 'reserved' as const;
    const reservation = resName ? {
      name: resName, kind: resKind,
      ...(body.reservation?.staffId && (await isStaffId(body.reservation.staffId, redis)) ? { staffId: body.reservation.staffId } : {}),
    } : undefined;
    const validType = (CUSTOMER_TYPES as readonly string[]).includes(body.customerType ?? '') ? body.customerType : undefined;
    const customerType = kiosk ? (reservation ? undefined : validType ?? '？') : validType;
    const staffList = reservation?.staffId ? await getStaff(redis) : [];
    const resStaff = staffList.find(s => s.id === reservation?.staffId);
    const kioskNote = !kiosk ? undefined
      : reservation ? `${resKind === 'delivery' ? '本日納車' : resKind === 'nominated' ? 'ご指名' : 'ご予約'}：${reservation.name}様${resStaff ? `（担当：${resStaff.name}）` : ''}`
      : typeof body.modelDecided === 'boolean' ? `車種：${body.modelDecided ? '決まっている' : 'まだ決まっていない'}` : undefined;
    const dispatcherId = body.dispatcherId && (await isStaffId(body.dispatcherId, redis)) ? body.dispatcherId : undefined;

    // ログ記録（最新10件）
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
    const ua = req.headers.get('user-agent') ?? 'unknown';
    const src = req.headers.get('x-dispatch-source') ?? 'web';
    const logEntry = JSON.stringify({ t: Date.now(), ip, src, ua: ua.slice(0, 80) });
    await redis.lpush(NOTIFY_LOG_KEY, logEntry);
    await redis.ltrim(NOTIFY_LOG_KEY, 0, 9);
    await redis.expire(NOTIFY_LOG_KEY, 86400);

    // 前の回が担当なしのまま残っていたら、計算結果に「担当なし」で残してから上書きする
    const prev = await redis.get<DispatchEvent>(EVENT_KEY);
    if (prev?.status === 'active' && !(await finalizeIfDecided(redis, prev))) await recordUnassigned(redis, prev);

    const event: DispatchEvent = {
      id: Date.now().toString(),
      startedAt: Date.now(),
      status: 'active',
      ...(dispatcherId ? { dispatcherId } : {}),
      ...(customerType ? { customerType } : {}),
      ...(inquiry ? { kind: 'inquiry' as const, ...(body.source ? { source: body.source } : {}), line: body.line } : {}),
      ...(kiosk ? { kiosk: true, dispatchedBy: '受付iPad' } : dispatchedBy ? { dispatchedBy } : {}),
      ...((kioskNote ?? note) ? { note: kioskNote ?? note } : {}),
      ...(reservation ? { reservation } : {}),
    };

    // 受付で担当が選ばれたら: 計算せずにその人に決めて、その人にだけ知らせる（ユーザー指定）
    // 2026-11-24〜 通知OFF・担当後の30分停止・夜間・登録なしでも、ほかの営業には送らない（以前は全員に送っていた）
    if (resStaff) {
      const tokens = ((await redis.hgetall(EXPO_TOKENS_KEY)) ?? {}) as Record<string, string>;
      {
        const assigned: DispatchEvent = { ...event, status: 'assigned', winner: { id: resStaff.id, name: resStaff.name, rank: resStaff.rank } };
        await redis.set(EVENT_KEY, assigned, { ex: 3600 });
        await redis.del(PRESSES_KEY);
        const { title, body: text } = pushText(assigned, 'first');
        const others = staffList.filter(s => s.id !== resStaff.id).map(s => s.id);
        await sendVisitPush(tokens, excludeOf([others, '予約の担当以外']), title, text, { eventId: event.id, startedAt: event.startedAt, kind: 'visit', stage: '予約の担当', force: true });
        await recordReserved(redis, assigned, resStaff);
        return NextResponse.json({ success: true, eventId: event.id, assigned: resStaff.name });
      }
    }

    await redis.set(EVENT_KEY, event, { ex: 3600 });
    await redis.del(PRESSES_KEY);
    await redis.del(CONDITIONS_KEY);

    // Expo push（アプリ）を先に送る（2026-11-17〜。Web 版を先にしていたため最初の通知が約2秒遅れていた）
    try {
      const expoTokens = (await redis.hgetall(EXPO_TOKENS_KEY)) ?? {};
      // 得意度が低い人には、即決定の設定の秒数まで送らない
      const { title, body: text } = pushText(event, 'first');
      await sendVisitPush(expoTokens, excludeOf([[dispatcherId], '差配者'], [await gatedIdsNow(event), '得意度・TELで遅らせ中']), title, text, { eventId: event.id, startedAt: event.startedAt, kind: event.kind, stage: '最初' });
    } catch { /* ignore */ }

    // Web push（旧 PWA）はアプリのあと
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_MAILTO) {
      try {
        const webpush = (await import('web-push')).default;
        webpush.setVapidDetails(
          `mailto:${process.env.VAPID_MAILTO}`,
          process.env.VAPID_PUBLIC_KEY,
          process.env.VAPID_PRIVATE_KEY,
        );
        const tokens = (await redis.hgetall(TOKENS_KEY)) ?? {};
        await Promise.allSettled(
          Object.entries(tokens).filter(([id]) => id !== dispatcherId).map(([, subJson]) => {
            try {
              return webpush.sendNotification(
                JSON.parse(subJson as string),
                JSON.stringify({ title: '🚗 お客様来店', body: '担当するボタンを押してください' }),
              );
            } catch { return Promise.resolve(); }
          })
        );
      } catch { /* ignore */ }
    }

    // 2回目・3回目の通知（未応答の人だけ）。秒数は即決定の設定（10・20秒）に合わせる
    const repushAt = repushTimesSec(await getFastRules(redis, event.kind)).map(s => s * 1000);
    after(async () => {
      let waited = 0;
      for (const delay of repushAt) {
        await new Promise(r => setTimeout(r, delay - waited + 300)); // 少し遅らせ、秒数ちょうどの判定を確実に
        waited = delay + 300;
        await repushToPending(event.id).catch(() => {});
      }
    });

    return NextResponse.json({ success: true, eventId: event.id }); // 受付 iPad は eventId で写真を送る
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
