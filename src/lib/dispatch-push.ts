import { STAFF, WINDOW_MS, isQuietHours } from './dispatch-config';
import { getRedis, getActiveMutes, getAffinityTable, EVENT_KEY, EXPO_TOKENS_KEY, PRESSES_KEY, type DispatchEvent } from './dispatch-redis';
import { getFastRules, blockedAffinity, gatedStaffIds } from './dispatch-fast';
import { finalizeIfDecided } from './dispatch-result';

const ACTIVE_STAFF_IDS: Set<string> = new Set(STAFF.map(s => s.id));
const PUSH_TTL_SECONDS = 120;

// アプリ側で登録する通知カテゴリ（「いくぜ」などのボタン付き。Apple Watch でも押せる）
export const VISIT_CATEGORY_ID = 'dispatch_visit';

// 来店通知の音（アプリ 1.1.13 以降に同梱。入っていない旧バージョンは iOS 標準音になる）
const VISIT_SOUND = 'raiten.wav';

// Expo push をスタッフごとに送る。data.staffId を付けて、通知ボタンの応答が誰のものか分かるようにする
export async function sendVisitPush(
  expoTokens: Record<string, unknown>,
  excludeIds: (string | undefined)[],
  title: string,
  body: string,
) {
  if (isQuietHours()) return; // 夜間（18:00〜翌8:15）は通知しない
  const muted = await getActiveMutes(); // 「対応中（行けない）」で通知を止めている人
  const seen = new Set<string>(); // 同端末で複数スタッフIDに登録されている場合の重複排除
  const messages = Object.entries(expoTokens)
    .filter(([staffId]) => ACTIVE_STAFF_IDS.has(staffId) && !excludeIds.includes(staffId) && !(staffId in muted))
    .filter(([, token]) => !seen.has(token as string) && !!seen.add(token as string))
    .map(([staffId, to]) => ({
      to, sound: VISIT_SOUND, title, body, ttl: PUSH_TTL_SECONDS,
      categoryId: VISIT_CATEGORY_ID,
      interruptionLevel: 'time-sensitive', // 集中モード中でも届く（アプリ側に権限が必要）
      data: { staffId },
    }));
  if (messages.length === 0) return;
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(messages),
  });
}

// 即決定の設定で、まだ通知しない人（その時点で得意度が低い人）の ID
export async function gatedIdsNow(event: DispatchEvent, now = Date.now()): Promise<string[]> {
  const redis = getRedis();
  const rules = await getFastRules(redis);
  const blocked = blockedAffinity(rules, (now - event.startedAt) / 1000);
  if (blocked <= 0 || !event.customerType) return [];
  return gatedStaffIds([...ACTIVE_STAFF_IDS], await getAffinityTable(redis), event.customerType, blocked);
}

// 同じ来店で、まだ応答していない営業にだけもう一度通知する（差配者・応答済み・得意度でまだ止めている人は除く）
// 先に当選が決まるか確かめ、決まっていれば送らない
export async function repushToPending(eventId: string, title: string, body: string) {
  const redis = getRedis();
  const event = await redis.get<DispatchEvent>(EVENT_KEY);
  if (!event || event.id !== eventId || event.status !== 'active') return;
  if (Date.now() > event.startedAt + WINDOW_MS) return;
  if (await finalizeIfDecided(redis, event)) return;
  const expoTokens = (await redis.hgetall(EXPO_TOKENS_KEY)) ?? {};
  const pressedIds = Object.keys((await redis.hgetall(PRESSES_KEY)) ?? {}).map(k => k.split('::')[0]);
  await sendVisitPush(expoTokens, [event.dispatcherId, ...pressedIds, ...(await gatedIdsNow(event))], title, body);
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
  if (keepNotify.maxMin <= 0 || elapsed > WINDOW_MS + keepNotify.maxMin * 60_000) return false;
  const locked = await redis.set(`dispatch:keepnotify:${event.id}`, '1', { nx: true, ex: keepNotify.everySec });
  if (!locked) return false;
  const expoTokens = (await redis.hgetall(EXPO_TOKENS_KEY)) ?? {};
  const pressedIds = Object.keys((await redis.hgetall(PRESSES_KEY)) ?? {}).map(k => k.split('::')[0]);
  await sendVisitPush(expoTokens, [event.dispatcherId, ...pressedIds], '🚗 お客様がお待ちです', 'まだ担当が決まっていません。応答をお願いします');
  return true;
}
