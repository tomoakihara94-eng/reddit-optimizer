import type { Redis } from '@upstash/redis';
import { parseCsv } from './dispatch-offdays';

// 在庫検索（2026-11-26〜）。グーネットの「在庫検索一覧」CSV（Shift_JIS）を管理者が手動で取り込み、
// 営業が管理用番号の左の「07-12」で車を調べる。同じ番号が複数の車に付くことがある（展示場所が違う）ので配列で持つ
//   取り込み: パソコンのブラウザ（/dispatch/inventory）かアプリの管理者画面から POST /inventory（取り込むたびに全部入れ替え）
//   仕入れ関係（仕入コメント・仕入先・仕入価格・仕入日）とローンの内訳は取り込まない
export const INVENTORY_KEY = 'dispatch:inventory';            // ハッシュ: 番号 → JSON（Car の配列）
export const INVENTORY_META_KEY = 'dispatch:inventory_meta';  // JSON: { at, count, numbers, exportedAt }

export type Car = {
  stockId: string;     // 在庫ID
  memo: string;        // 管理用番号（全部。展示場所・日付・走行距離のメモ）
  maker: string; model: string; grade: string; gradeInfo: string;
  year: string; mileage: string; color: string; inspection: string;
  price: string; total: string; repair: string; door: string; displacement: string; fuel: string;
  modelCode: string; chassis: string; catchCopy: string; listed: string;
  features: string[];  // 「○」の付いた装備
  gooUrl?: string;     // グーネットの車のページ（検索で返すときに在庫ID から作る。保存はしない）
};

// 在庫ID → グーネットの車のページ（2026-11-26 確認）
//   在庫ID「0600173A30261117W047」から英字を抜いて頭に 700 →「700060017330261117047」
//   URL の途中の数字（/15/）は何でも同じページが出るので 15 に固定。売れて掲載が終わると「掲載終了」のページになる
export function gooUrlOf(car: Pick<Car, 'stockId' | 'listed'>): string | undefined {
  const m = /^(\d{7})[A-Z](\d{8})[A-Z](\d{3})$/.exec(car.stockId);
  if (!m || car.listed !== '掲載') return undefined;
  return `https://www.goo-net.com/usedcar/spread/goo/15/700${m[1]}${m[2]}${m[3]}.html`;
}

// CSV のバイト列 → 文字列。サイトの CSV は Shift_JIS。Excel などで UTF-8 に保存し直したものも読めるように
export function decodeCsv(bytes: Uint8Array): string {
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^\uFEFF/, ''); }
  catch { return new TextDecoder('shift_jis').decode(bytes); }
}

// 番号のゆれをそろえる（全角→半角、ハイフンの種類）
export function normalizeNo(s: string): string {
  return s.normalize('NFKC').replace(/[‐‑‒–—―ー−－]/g, '-').trim().toUpperCase();
}

// 管理用番号の先頭「07-12★ ●1005 展示：…」から「07-12」
export function keyOf(memo: string): string | null {
  const m = /^\s*([0-9A-Za-z]+-[0-9A-Za-z]+)/.exec(normalizeNo(memo));
  return m ? m[1] : null;
}

// 装備の欄（○/× の列）。並びは CSV の見出しどおり
const NOT_FEATURES = new Set(['在庫ID', 'グーネット中古車掲載', 'MOTORGATE AI', 'AI成約POINT', '管理用番号', '国', 'ブランド', '車種', 'グレード']);

export function parseInventory(text: string): { cars: Car[]; exportedAt?: string } | null {
  const rows = parseCsv(text);
  const hi = rows.findIndex(r => r.includes('管理用番号') && r.includes('車種'));
  if (hi < 0) return null;
  const h = rows[hi].map(c => c.trim());
  const col = (name: string) => h.indexOf(name);
  const get = (r: string[], name: string) => { const i = col(name); return i >= 0 ? (r[i] ?? '').trim() : ''; };
  const featureCols = h.map((name, i) => ({ name, i })).filter(x => !NOT_FEATURES.has(x.name));
  const exportedAt = /日時：(.+)/.exec(rows[0]?.[0] ?? '')?.[1]?.trim();
  const cars: Car[] = [];
  for (const r of rows.slice(hi + 1)) {
    if (r.length < 10) continue;
    const memo = get(r, '管理用番号');
    if (!keyOf(memo)) continue;
    cars.push({
      stockId: get(r, '在庫ID'), memo: memo.replace(/　/g, ' '),
      maker: get(r, 'ブランド'), model: get(r, '車種'), grade: get(r, 'グレード'), gradeInfo: get(r, 'グレード付加情報'),
      year: get(r, '年式'), mileage: get(r, '走行'), color: get(r, '色'), inspection: get(r, '車検'),
      price: get(r, '車両本体価格'), total: get(r, '支払総額'), repair: get(r, '修復'), door: get(r, 'ドア'),
      displacement: get(r, '排気'), fuel: get(r, '燃料').split('|').pop() ?? '',
      modelCode: get(r, '型式'), chassis: get(r, '車台番号（全桁）'), catchCopy: get(r, '大判キャッチ'), listed: get(r, 'グーネット中古車掲載'),
      features: featureCols.filter(x => (r[x.i] ?? '').trim() === '○').map(x => x.name),
    });
  }
  return { cars, exportedAt };
}

// 取り込み（全部入れ替え）
export async function saveInventory(redis: Redis, cars: Car[], exportedAt?: string) {
  const byKey: Record<string, Car[]> = {};
  for (const c of cars) (byKey[keyOf(c.memo)!] ??= []).push(c);
  await redis.del(INVENTORY_KEY);
  const entries = Object.entries(byKey);
  for (let i = 0; i < entries.length; i += 200) {
    await redis.hset(INVENTORY_KEY, Object.fromEntries(entries.slice(i, i + 200).map(([k, v]) => [k, JSON.stringify(v)])));
  }
  const meta = { at: Date.now(), count: cars.length, numbers: entries.length, ...(exportedAt ? { exportedAt } : {}) };
  await redis.set(INVENTORY_META_KEY, JSON.stringify(meta));
  return meta;
}

export async function findCars(redis: Redis, no: string): Promise<Car[]> {
  const raw = await redis.hget(INVENTORY_KEY, normalizeNo(no));
  if (!raw) return [];
  const cars = (typeof raw === 'string' ? JSON.parse(raw) : raw) as Car[];
  return cars.map(c => ({ ...c, gooUrl: gooUrlOf(c) }));
}
