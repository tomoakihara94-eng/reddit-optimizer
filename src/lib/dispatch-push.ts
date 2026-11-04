import { STAFF, WINDOW_MS, isQuietHours } from './dispatch-config';
import { getRedis, getActiveMutes, getAffinityTable, getTelTable, scoringContext, pushText, EVENT_KEY, EXPO_TOKENS_KEY, PRESSES_KEY, type DispatchEvent } from './dispatch-redis';
import { getFastRules, blockedAffinity, gatedStaffIds } from './dispatch-fast';
import { finalizeIfDecided } from './dispatch-result';
import { planPush, recordPush, type PushLog, type SkipReason } from './dispatch-pushlog';

const ACTIVE_STAFF_IDS: Set<string> = new Set(STAFF.map(s => s.id));
const PUSH_TTL_SECONDS = 120;

// アプリ側で登録する通知カテゴリ（「いくぜ」などのボタン付き。Apple Watch でも押せる）
export const VISIT_CATEGORY_ID = 'dispatch_visit';

// 来店通知の音（アプリ 1.1.13 以降に同梱。入っていない旧バージョンは iOS 標準音になる）
const VISIT_SOUND = 'raiten.wav';

// Expo push をスタッフごとに送る。data.staffId を付けて、通知ボタンの応答が誰のものか分かるようにする
// exclude: 送らない人 → 理由。送った・送らなかった・Expo の返事は dispatch:push_log に残す
export async function sendVisitPush(
  expoTokens: Record<string, unknown>,
  exclude: Record<string, SkipReason>,
  title: string,
  body: string,
  meta: { eventId?: string; stage: string } = { stage: '?' },
) {
  const redis = getRedis();
  const muted = await getActiveMutes(redis); // 「いけない」・通知OFF・来店の当選で止めている人
  const { targets, skipped } = planPush(
    [...ACTIVE_STAFF_IDS], expoTokens as Record<string, string>, exclude, muted, isQuietHours(), // 夜間（19:00〜翌8:15）は送らない
  );
  const log: PushLog = { t: Date.now(), ...meta, sent: targets.map(x => x.staffId), skipped };
  if (targets.length > 0) {
    const messages = targets.map(({ staffId, token }) => ({
      to: token, sound: VISIT_SOUND, title, body, ttl: PUSH_TTL_SECONDS,
      categoryId: VISIT_CATEGORY_ID,
      interruptionLevel: 'time-sensitive', // 集中モード中でも届く（アプリ側に権限が必要）
      data: { staffId },
    }));
    try {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(messages),
      });
      const json = await res.json().catch(() => null) as { data?: { status: string; id?: string; message?: string; details?: { error?: string } }[] } | null;
      if (!res.ok) log.error = `HTTP ${res.status}`;
      log.tickets = Object.fromEntries(targets.map((x, i) => {
        const d = json?.data?.[i];
        return [x.staffId, !d ? 'unknown' : d.status === 'ok' ? `ok:${d.id ?? ''}` : `error:${d.details?.error ?? d.message ?? ''}`];
      }));
    } catch (e) {
      log.error = String(e).slice(0, 200);
    }
  }
  await recordPush(redis, log);
}

// 理由つきの「送らない人」を作る
export function excludeOf(...groups: [(string | undefined)[], SkipReason][]): Record<string, SkipReason> {
  const out: Record<string, SkipReason> = {};
  for (const [ids, reason] of groups) for (const id of ids) if (id && !out[id]) out[id] = reason;
  return out;
}

// 即決定の設定で、まだ通知しない人（その時点で得意度が低い人）の ID
export async function gatedIdsNow(event: DispatchEvent, now = Date.now()): Promise<string[]> {
  const redis = getRedis();
  const rules = await getFastRules(redis);
  const blocked = blockedAffinity(rules, (now - event.startedAt) / 1000);
  if (blocked <= 0) return [];
  const ctx = scoringContext(event, await getAffinityTable(redis), await getTelTable(redis));
  if (!ctx.customerType) return [];
  return gatedStaffIds([...ACTIVE_STAFF_IDS], ctx.affinity, ctx.customerType, blocked);
}

// 同じ来店で、まだ応答していない営業にだけもう一度通知する（差配者・応答済み・得意度でまだ止めている人は除く）
// 先に当選が決まるか確かめ、決まっていれば送らない
export async function repushToPending(eventId: string) {
  const redis = getRedis();
  const event = await redis.get<DispatchEvent>(EVENT_KEY);
  if (!event || event.id !== eventId || event.status !== 'active') return;
  if (Date.now() > event.startedAt + WINDOW_MS) return;
  if (await finalizeIfDecided(redis, event)) return;
  const expoTokens = (await redis.hgetall(EXPO_TOKENS_KEY)) ?? {};
  const pressedIds = Object.keys((await redis.hgetall(PRESSES_KEY)) ?? {}).map(k => k.split('::')[0]);
  const { title, body } = pushText(event, 'again');
  const exclude = excludeOf([[event.dispatcherId], '差配者'], [pressedIds, '応答済み'], [await gatedIdsNow(event), '得意度・TELで遅らせ中']);
  await sendVisitPush(expoTokens, exclude, title, body, { eventId: event.id, stage: `再通知 ${Math.round((Date.now() - event.startedAt) / 1000)}秒` });
}

// 30秒たっても当選者がいないとき、未応答の全員に通知を送り続ける（差配者のアプリが定期的に呼ぶ）
// 間隔は Redis のロックで守り、上限の分数を過ぎたら送らない。送ったら true
export async function keepNotifying(): Promise<boolean> {
  const redis = getRedis();
  const event = await redis.get<DispatchEvent>(EVENT_KEY);
  if (!event || event.status !== 'active') return false;
  const elapsed = Date.now() - event.startedAt;
  if (elapsed <= WINDOW_MS) return false;
  if (await finalizeIfDecided(redis, event)) return false;
  const { keepNotify } = await getFastRules(redis);
  if (elapsed > keepNotify.untilSec * 1000) return false; // 受付終了
  const locked = await redis.set(`dispatch:keepnotify:${event.id}`, '1', { nx: true, ex: keepNotify.everySec });
  if (!locked) return false;
  const expoTokens = (await redis.hgetall(EXPO_TOKENS_KEY)) ?? {};
  const pressedIds = Object.keys((await redis.hgetall(PRESSES_KEY)) ?? {}).map(k => k.split('::')[0]);
  const { title, body } = pushText(event, 'keep');
  const exclude = excludeOf([[event.dispatcherId], '差配者'], [pressedIds, '応答済み']);
  await sendVisitPush(expoTokens, exclude, title, body, { eventId: event.id, stage: `送り続け ${Math.round(elapsed / 1000)}秒` });
  return true;
}
