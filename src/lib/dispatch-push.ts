import { STAFF, WINDOW_MS } from './dispatch-config';
import { getRedis, getActiveMutes, EVENT_KEY, EXPO_TOKENS_KEY, PRESSES_KEY, type DispatchEvent } from './dispatch-redis';

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

// 同じ来店で、まだ応答していない営業にだけもう一度通知する（差配者と応答済みの人は除く）
export async function repushToPending(eventId: string, title: string, body: string) {
  const redis = getRedis();
  const event = await redis.get<DispatchEvent>(EVENT_KEY);
  if (!event || event.id !== eventId || event.status !== 'active') return;
  if (Date.now() > event.startedAt + WINDOW_MS) return;
  const expoTokens = (await redis.hgetall(EXPO_TOKENS_KEY)) ?? {};
  const pressedIds = Object.keys((await redis.hgetall(PRESSES_KEY)) ?? {}).map(k => k.split('::')[0]);
  await sendVisitPush(expoTokens, [event.dispatcherId, ...pressedIds], title, body);
}

// 来店通知は計3回（0秒・10秒・20秒）。2回目以降は未応答の人だけ
export const REPUSH_DELAYS_MS = [10_000, 20_000];
