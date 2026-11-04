import type { Redis } from '@upstash/redis';

// 通知の送信記録・登録の変更記録（2026-11-04〜。「鳴らない」の原因を後から調べるため）
// トークンそのものは残さない。営業ID・理由・Apple(Expo) の返事だけ
export const PUSH_LOG_KEY  = 'dispatch:push_log';   // 新しい順 最大300件、3日
export const TOKEN_LOG_KEY = 'dispatch:token_log';  // 新しい順 最大300件、14日

export type SkipReason = '未登録' | '通知OFF' | '差配者' | '応答済み' | '得意度・TELで遅らせ中' | '同じスマホ' | '夜間';
export type PushLog = {
  t: number; eventId?: string; stage: string;
  sent: string[];                        // 送った営業ID
  skipped: Record<string, SkipReason>;   // 送らなかった営業ID → 理由
  tickets?: Record<string, string>;      // 営業ID → 'ok:<ticketId>' / 'error:<内容>'
  error?: string;                        // Expo への送信自体の失敗
};
export type TokenLog = { t: number; action: 'register' | 'unregister'; staffId: string; result: string; ip?: string; ua?: string };

// 誰に送り、誰に送らないか（理由つき）を決める。同じスマホが複数の名前で登録されていたら1通だけ
export function planPush(
  activeIds: string[], tokens: Record<string, string>, exclude: Record<string, SkipReason>,
  muted: Record<string, number>, quiet: boolean,
): { targets: { staffId: string; token: string }[]; skipped: Record<string, SkipReason> } {
  const skipped: Record<string, SkipReason> = {};
  const targets: { staffId: string; token: string }[] = [];
  const seen = new Set<string>();
  for (const id of activeIds) {
    const token = tokens[id];
    if (quiet) skipped[id] = '夜間';
    else if (exclude[id]) skipped[id] = exclude[id];
    else if (!token) skipped[id] = '未登録';
    else if (id in muted) skipped[id] = '通知OFF';
    else if (seen.has(token)) skipped[id] = '同じスマホ';
    else { seen.add(token); targets.push({ staffId: id, token }); }
  }
  return { targets, skipped };
}

async function pushList(redis: Redis, key: string, entry: unknown, ttlSec: number) {
  try {
    await redis.lpush(key, JSON.stringify(entry));
    await redis.ltrim(key, 0, 299);
    await redis.expire(key, ttlSec);
  } catch { /* 記録の失敗で通知を止めない */ }
}
export const recordPush  = (redis: Redis, log: PushLog) => pushList(redis, PUSH_LOG_KEY, log, 3 * 86400);
export const recordToken = (redis: Redis, log: TokenLog) => pushList(redis, TOKEN_LOG_KEY, log, 14 * 86400);

export async function readLog<T>(redis: Redis, key: string, n = 100): Promise<T[]> {
  const raw = (await redis.lrange(key, 0, n - 1)) ?? [];
  return raw.map(v => (typeof v === 'string' ? JSON.parse(v) : v) as T);
}
