import { NextRequest, NextResponse, after } from 'next/server';
import { getRedis, pushText, EVENT_KEY, PRESSES_KEY, CONDITIONS_KEY, TOKENS_KEY, EXPO_TOKENS_KEY, NOTIFY_LOG_KEY, type DispatchEvent } from '@/lib/dispatch-redis';
import { STAFF, CUSTOMER_TYPES } from '@/lib/dispatch-config';
import { getLabels } from '@/lib/dispatch-labels';
import { sendVisitPush, repushToPending, gatedIdsNow } from '@/lib/dispatch-push';
import { getFastRules, repushTimesSec } from '@/lib/dispatch-fast';

export const runtime = 'nodejs';
export const maxDuration = 60; // 再通知（最大20秒後）まで関数を生かしておく

const ACTIVE_STAFF_IDS: Set<string> = new Set(STAFF.map(s => s.id));
export async function POST(req: NextRequest) {
  try {
    const redis = getRedis();
    const body = await req.json().catch(() => ({})) as {
      dispatcherId?: string; customerType?: string; kind?: string; source?: string; line?: string; dispatchedBy?: string; note?: string;
    };
    // 共有事項（任意、200文字まで）
    const note = typeof body.note === 'string' && body.note.trim() ? body.note.trim().slice(0, 200) : undefined;
    const labels = await getLabels(redis);
    // 差配した人・電話を受けた人（1.1.35 以降のアプリが送る。名前は管理者が変えられるので文字数だけ確かめる）
    const dispatchedBy = typeof body.dispatchedBy === 'string' && body.dispatchedBy.trim() && body.dispatchedBy.trim().length <= 20
      ? body.dispatchedBy.trim() : undefined;
    // 問い合わせ: 内線は必須、サイトは任意（送るなら一覧にあるもの）
    const sourceOk = !body.source || labels.inquirySources.includes(body.source);
    const inquiry = body.kind === 'inquiry' && sourceOk && labels.inquiryLines.includes(body.line ?? '');
    if (body.kind === 'inquiry' && !inquiry) return NextResponse.json({ error: 'invalid inquiry' }, { status: 400 });
    // お客様タイプ（来店・問い合わせとも。担当者以外には見せない）
    const customerType = (CUSTOMER_TYPES as readonly string[]).includes(body.customerType ?? '') ? body.customerType : undefined;
    const dispatcherId = body.dispatcherId && ACTIVE_STAFF_IDS.has(body.dispatcherId) ? body.dispatcherId : undefined;

    // ログ記録（最新10件）
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
    const ua = req.headers.get('user-agent') ?? 'unknown';
    const src = req.headers.get('x-dispatch-source') ?? 'web';
    const logEntry = JSON.stringify({ t: Date.now(), ip, src, ua: ua.slice(0, 80) });
    await redis.lpush(NOTIFY_LOG_KEY, logEntry);
    await redis.ltrim(NOTIFY_LOG_KEY, 0, 9);
    await redis.expire(NOTIFY_LOG_KEY, 86400);

    const event: DispatchEvent = {
      id: Date.now().toString(),
      startedAt: Date.now(),
      status: 'active',
      ...(dispatcherId ? { dispatcherId } : {}),
      ...(customerType ? { customerType } : {}),
      ...(inquiry ? { kind: 'inquiry' as const, ...(body.source ? { source: body.source } : {}), line: body.line } : {}),
      ...(dispatchedBy ? { dispatchedBy } : {}),
      ...(note ? { note } : {}),
    };
    await redis.set(EVENT_KEY, event, { ex: 3600 });
    await redis.del(PRESSES_KEY);
    await redis.del(CONDITIONS_KEY);

    // Web push (existing PWA)
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

    // Expo push (native app) — only send to currently active staff
    try {
      const expoTokens = (await redis.hgetall(EXPO_TOKENS_KEY)) ?? {};
      // 得意度が低い人には、即決定の設定の秒数まで送らない
      const { title, body: text } = pushText(event, 'first');
      await sendVisitPush(expoTokens, [dispatcherId, ...(await gatedIdsNow(event))], title, text);
    } catch { /* ignore */ }

    // 2回目・3回目の通知（未応答の人だけ）。秒数は即決定の設定（10・20秒）に合わせる
    const repushAt = repushTimesSec(await getFastRules(redis)).map(s => s * 1000);
    after(async () => {
      let waited = 0;
      for (const delay of repushAt) {
        await new Promise(r => setTimeout(r, delay - waited + 300)); // 少し遅らせ、秒数ちょうどの判定を確実に
        waited = delay + 300;
        await repushToPending(event.id).catch(() => {});
      }
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
