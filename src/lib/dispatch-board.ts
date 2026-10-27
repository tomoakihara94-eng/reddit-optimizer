import type { Redis } from '@upstash/redis';

// 掲示板（営業画面の下に横流しで表示）。読むのは誰でも、書く・消すのは管理者のみ
export const BOARD_CATEGORIES = ['notice', 'president'] as const; // 周知事項 / 社長は何を考えているのか
export type BoardCategory = typeof BOARD_CATEGORIES[number];
export type BoardPost = { id: string; body: string; createdAt: number };

export const BOARD_MAX_POSTS = 20;   // 1つの欄に残す件数（新しい順）
export const BOARD_MAX_LENGTH = 2000;

const key = (c: BoardCategory) => `dispatch:board:${c}`;
const parse = (v: unknown) => (typeof v === 'string' ? JSON.parse(v) : v) as BoardPost;

export function isBoardCategory(c: unknown): c is BoardCategory {
  return (BOARD_CATEGORIES as readonly unknown[]).includes(c);
}

export async function listPosts(redis: Redis, c: BoardCategory): Promise<BoardPost[]> {
  return ((await redis.lrange(key(c), 0, BOARD_MAX_POSTS - 1)) ?? []).map(parse);
}

export async function addPost(redis: Redis, c: BoardCategory, body: string, now = Date.now()): Promise<BoardPost> {
  const post: BoardPost = { id: `${now}-${Math.random().toString(36).slice(2, 7)}`, body, createdAt: now };
  await redis.lpush(key(c), JSON.stringify(post));
  await redis.ltrim(key(c), 0, BOARD_MAX_POSTS - 1);
  return post;
}

export async function deletePost(redis: Redis, c: BoardCategory, id: string): Promise<boolean> {
  const posts = await listPosts(redis, c);
  const rest = posts.filter(p => p.id !== id);
  if (rest.length === posts.length) return false;
  await redis.del(key(c));
  if (rest.length > 0) await redis.rpush(key(c), ...rest.map(p => JSON.stringify(p)));
  return true;
}
