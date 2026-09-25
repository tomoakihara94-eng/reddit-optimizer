import { STAFF } from './dispatch-config';

const ACTIVE_STAFF_IDS: Set<string> = new Set(STAFF.map(s => s.id));
const PUSH_TTL_SECONDS = 120;

// アプリ側で登録する通知カテゴリ（「いくぜ」などのボタン付き。Apple Watch でも押せる）
export const VISIT_CATEGORY_ID = 'dispatch_visit';

// Expo push をスタッフごとに送る。data.staffId を付けて、通知ボタンの応答が誰のものか分かるようにする
export async function sendVisitPush(
  expoTokens: Record<string, unknown>,
  excludeIds: (string | undefined)[],
  title: string,
  body: string,
) {
  const seen = new Set<string>(); // 同端末で複数スタッフIDに登録されている場合の重複排除
  const messages = Object.entries(expoTokens)
    .filter(([staffId]) => ACTIVE_STAFF_IDS.has(staffId) && !excludeIds.includes(staffId))
    .filter(([, token]) => !seen.has(token as string) && !!seen.add(token as string))
    .map(([staffId, to]) => ({
      to, sound: 'default', title, body, ttl: PUSH_TTL_SECONDS,
      categoryId: VISIT_CATEGORY_ID,
      data: { staffId },
    }));
  if (messages.length === 0) return;
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(messages),
  });
}
