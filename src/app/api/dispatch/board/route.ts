import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from '@/lib/dispatch-redis';
import { isAdmin } from '@/lib/dispatch-admin';
import {
  BOARD_CATEGORIES, BOARD_MAX_LENGTH, addPost, deletePost, isBoardCategory, listPosts,
} from '@/lib/dispatch-board';

// 掲示板。GET は暗証番号なし（営業画面で表示）、POST / DELETE は管理者のみ
export async function GET() {
  const redis = getRedis();
  const entries = await Promise.all(BOARD_CATEGORIES.map(async c => [c, await listPosts(redis, c)] as const));
  return NextResponse.json(Object.fromEntries(entries), { headers: { 'Cache-Control': 'no-store' } });
}

// body: { category: 'notice' | 'president', body: 本文 }
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { category, body } = await req.json() as { category: string; body: string };
  const text = typeof body === 'string' ? body.trim() : '';
  if (!isBoardCategory(category) || !text || text.length > BOARD_MAX_LENGTH)
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const post = await addPost(getRedis(), category, text);
  return NextResponse.json({ success: true, post });
}

// ?category=notice&id=...
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const url = new URL(req.url);
  const category = url.searchParams.get('category');
  const id = url.searchParams.get('id') ?? '';
  if (!isBoardCategory(category) || !id) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const deleted = await deletePost(getRedis(), category, id);
  return NextResponse.json({ success: deleted });
}
