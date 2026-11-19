import type { Redis } from '@upstash/redis';
import { EXPO_TOKENS_KEY } from './dispatch-redis';

// 受付 iPad で撮ったお客様の写真（2026-11-19〜）
//   保存: Vercel Blob（非公開、東京 hnd1）の photos/<eventId>.jpg。ttlDays 1 で1日後に自動削除
//   あるかどうか: Redis dispatch:photo:<eventId>（1日）
//   見られる人: 通知の登録がある営業のスマホ（X-Device-Token）と管理者（X-Admin-Pin）。ユーザー指定「通知が届いた営業全員」
export const photoPath = (eventId: string) => `photos/${eventId}.jpg`;
export const photoKey = (eventId: string) => `dispatch:photo:${eventId}`;
export const PHOTO_MAX_BYTES = 1_500_000;   // 1.5MB まで（アプリ側で縮小して送る）
export const PHOTO_UPLOAD_WINDOW_MS = 10 * 60_000; // 来店通知から10分以内だけ受け付ける

export async function hasPhoto(redis: Redis, eventId: string): Promise<boolean> {
  return !!(await redis.get(photoKey(eventId)));
}

// 営業のスマホ（通知の登録がある端末）か
export async function isRegisteredDevice(redis: Redis, token: string | null): Promise<boolean> {
  if (!token) return false;
  const all = ((await redis.hgetall(EXPO_TOKENS_KEY)) ?? {}) as Record<string, string>;
  return Object.values(all).includes(token);
}
