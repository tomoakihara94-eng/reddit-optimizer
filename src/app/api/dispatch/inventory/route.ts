import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from '@/lib/dispatch-redis';
import { isAdmin } from '@/lib/dispatch-admin';
import { isRegisteredDevice } from '@/lib/dispatch-photo';
import { INVENTORY_META_KEY, decodeCsv, findCars, normalizeNo, parseInventory, saveInventory } from '@/lib/dispatch-inventory';

// 在庫検索（2026-11-26〜）
//   GET ?no=07-12 … その管理用番号の車（同じ番号が複数あれば全部）と最後の取り込み。営業のスマホ（X-Device-Token）か管理者だけ
//       ?no なしは最後の取り込みだけ
//   POST（管理者）本文は在庫検索一覧の CSV そのまま（Shift_JIS のままでよい）。全部入れ替え
export async function GET(req: NextRequest) {
  const redis = getRedis();
  if (!isAdmin(req) && !(await isRegisteredDevice(redis, req.headers.get('x-device-token')))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const no = normalizeNo(new URL(req.url).searchParams.get('no') ?? '');
  const meta = await redis.get(INVENTORY_META_KEY);
  if (!no) return NextResponse.json({ meta }, { headers: { 'Cache-Control': 'no-store' } });
  if (!/^[0-9A-Z]+-[0-9A-Z]+$/.test(no)) return NextResponse.json({ error: 'invalid no' }, { status: 400 });
  return NextResponse.json({ no, cars: await findCars(redis, no), meta }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const buf = await req.arrayBuffer();
  if (buf.byteLength === 0 || buf.byteLength > 4_000_000) return NextResponse.json({ error: 'ファイルが空か、大きすぎます' }, { status: 400 });
  const parsed = parseInventory(decodeCsv(new Uint8Array(buf)));
  if (!parsed || parsed.cars.length === 0) {
    return NextResponse.json({ error: '在庫検索一覧の CSV ではないようです（「管理用番号」「車種」の列が見つからないか、車が0台）' }, { status: 400 });
  }
  const meta = await saveInventory(getRedis(), parsed.cars, parsed.exportedAt);
  return NextResponse.json({ success: true, meta });
}
