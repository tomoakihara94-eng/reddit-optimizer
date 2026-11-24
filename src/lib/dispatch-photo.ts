import type { Redis } from '@upstash/redis';
import { list, del } from '@vercel/blob';
import { EXPO_TOKENS_KEY } from './dispatch-redis';

// 受付 iPad で撮ったお客様の写真（2026-11-19〜）
//   保存: Vercel Blob（非公開、東京 hnd1）の photos/<eventId>.jpg
//   2026-11-24〜 1時間で削除（受付画面に「1時間後に自動で削除」と表示。ユーザー指定）:
//     ① 見られるのは1時間だけ（Redis dispatch:photo:<eventId> を1時間で消す → GET /photo は 404）
//     ② 1時間を過ぎた写真を cleanupPhotos が消す（/status のたびに、5分に1回まで）
//     ③ 保険として Blob の ttlDays 1（1日）
//   あるかどうか: Redis dispatch:photo:<eventId>（1時間）
//   見られる人: 通知の登録がある営業のスマホ（X-Device-Token）と管理者（X-Admin-Pin）。ユーザー指定「通知が届いた営業全員」
export const photoPath = (eventId: string) => `photos/${eventId}.jpg`;
export const photoKey = (eventId: string) => `dispatch:photo:${eventId}`;
export const PHOTO_MAX_BYTES = 1_500_000;   // 1.5MB まで（アプリ側で縮小して送る）
export const PHOTO_UPLOAD_WINDOW_MS = 10 * 60_000; // 来店通知から10分以内だけ受け付ける
export const PHOTO_KEEP_SEC = 3600;                // 写真を残す時間（1時間）
const CLEANUP_LOCK = 'dispatch:photo_cleanup';     // 消す処理は5分に1回まで

export async function hasPhoto(redis: Redis, eventId: string): Promise<boolean> {
  return !!(await redis.get(photoKey(eventId)));
}

// 営業のスマホ（通知の登録がある端末）か
export async function isRegisteredDevice(redis: Redis, token: string | null): Promise<boolean> {
  if (!token) return false;
  const all = ((await redis.hgetall(EXPO_TOKENS_KEY)) ?? {}) as Record<string, string>;
  return Object.values(all).includes(token);
}

// 1時間を過ぎた写真を Blob から消す（5分に1回まで。消した数を返す）
export async function cleanupPhotos(redis: Redis, now = Date.now()): Promise<number> {
  if (!(await redis.set(CLEANUP_LOCK, '1', { nx: true, ex: 300 }))) return 0;
  const old: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: 'photos/', cursor, limit: 1000 });
    for (const b of page.blobs) if (now - new Date(b.uploadedAt).getTime() > PHOTO_KEEP_SEC * 1000) old.push(b.url);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  if (old.length) await del(old);
  return old.length;
}
