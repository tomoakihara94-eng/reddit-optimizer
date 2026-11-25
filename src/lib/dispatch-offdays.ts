import type { Redis } from '@upstash/redis';
import { getStaff } from './dispatch-redis';
import { jstDate } from './dispatch-result';

// 公休（2026-11-25〜）。Google スプレッドシートの公休表を取り込み、その日休みの営業には通知しない
//   表の形: A1 がその月の日付（例 2026/12/25）、1行目の E 列から日（1,2,3…）、D 列「アプリ名称」がアプリの営業名。「該当なし」は取り込まない
//           セルが「休」なら公休。「国」「出」・空欄は出勤（ユーザー指定）
//   取り込み元: 管理者が「ウェブに公開 → このシートだけ → CSV」のリンクを月ごとに登録（ファイル全体は公開しない。別のシートがあるため）
//   本人の切り替え: 営業画面の「今日：出勤／公休」。その日だけ有効（表の間違いを本人が直せる）
export const OFFDAYS_SOURCES_KEY = 'dispatch:offdays_sources';  // JSON: 公開 CSV の URL の配列
export const OFFDAYS_SYNC_KEY = 'dispatch:offdays_sync';        // JSON: 最後に取り込んだ結果
const offdaysKey = (month: string) => `dispatch:offdays:${month}`;      // JSON: { staffId: [日, …] }
const overrideKey = (date: string) => `dispatch:attendance:${date}`;   // ハッシュ: staffId → 'off' | 'work'
const SYNC_LOCK = 'dispatch:offdays_sync_lock';

// CSV を表に（"…" で囲んだセル・カンマ入りにも対応）
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

export type ParsedOffdays = { month: string; off: Record<string, number[]>; unmatched: string[]; staffCount: number };

// 公休表 → { month: 'YYYY-MM', off: { staffId: [日] }, unmatched: アプリに見つからない名前 }
export function parseOffdays(csv: string, staff: { id: string; name: string }[]): ParsedOffdays | null {
  const rows = parseCsv(csv);
  if (rows.length < 2) return null;
  const m = /^(\d{4})[/\-年](\d{1,2})/.exec((rows[0][0] ?? '').trim());
  if (!m) return null;
  const month = `${m[1]}-${m[2].padStart(2, '0')}`;
  const header = rows[0];
  const appCol = header.findIndex(h => h.trim() === 'アプリ名称');
  if (appCol < 0) return null;
  const dayCols = header.map((h, i) => ({ i, d: Number(h.trim()) })).filter(x => x.i > appCol && Number.isInteger(x.d) && x.d >= 1 && x.d <= 31);
  const byName = new Map(staff.map(s => [s.name, s.id]));
  const off: Record<string, number[]> = {};
  const unmatched: string[] = [];
  let staffCount = 0;
  for (const r of rows.slice(1)) {
    const name = (r[appCol] ?? '').trim();
    if (!name || name === '該当なし') continue;
    const id = byName.get(name);
    if (!id) { unmatched.push(name); continue; }
    staffCount++;
    off[id] = dayCols.filter(c => (r[c.i] ?? '').trim() === '休').map(c => c.d);
  }
  return { month, off, unmatched, staffCount };
}

// 登録された公開 CSV をすべて取り込む
export async function syncOffdays(redis: Redis): Promise<{ at: number; results: { url: string; month?: string; staffCount?: number; unmatched?: string[]; error?: string }[] }> {
  const urls = ((await redis.get<string[]>(OFFDAYS_SOURCES_KEY)) ?? []) as string[];
  const staff = await getStaff(redis);
  const results = [];
  for (const url of urls) {
    try {
      const res = await fetch(url, { redirect: 'follow' });
      const text = await res.text();
      if (!res.ok || text.trimStart().startsWith('<')) { results.push({ url, error: `読み込めません（${res.status}）。「ウェブに公開」の CSV のリンクか確かめてください` }); continue; }
      const p = parseOffdays(text, staff);
      if (!p) { results.push({ url, error: '表の形が違います（A1 の日付・D 列「アプリ名称」・1行目の日付を確かめてください）' }); continue; }
      await redis.set(offdaysKey(p.month), JSON.stringify(p.off), { ex: 120 * 86400 });
      results.push({ url, month: p.month, staffCount: p.staffCount, unmatched: p.unmatched });
    } catch (e) {
      results.push({ url, error: String(e).slice(0, 120) });
    }
  }
  const out = { at: Date.now(), results };
  await redis.set(OFFDAYS_SYNC_KEY, JSON.stringify(out));
  return out;
}

// 1時間に1回まで（/status のたびに呼ぶ）
export async function syncOffdaysHourly(redis: Redis) {
  if (await redis.set(SYNC_LOCK, '1', { nx: true, ex: 3600 })) await syncOffdays(redis);
}

export async function getMonthOffdays(redis: Redis, month: string): Promise<Record<string, number[]>> {
  const raw = await redis.get(offdaysKey(month));
  if (!raw) return {};
  return (typeof raw === 'string' ? JSON.parse(raw) : raw) as Record<string, number[]>;
}

// その日（JST）公休の営業ID。表＋本人の切り替え（切り替えが優先）
export async function offStaffOn(redis: Redis, now = Date.now()): Promise<string[]> {
  const date = jstDate(now);
  const day = Number(date.slice(8, 10));
  const sheet = await getMonthOffdays(redis, date.slice(0, 7));
  const set = new Set(Object.entries(sheet).filter(([, days]) => days.includes(day)).map(([id]) => id));
  const overrides = ((await redis.hgetall(overrideKey(date))) ?? {}) as Record<string, string>;
  for (const [id, v] of Object.entries(overrides)) { if (v === 'off') set.add(id); else set.delete(id); }
  return [...set];
}

// 本人の切り替え（今日だけ）
export async function setTodayAttendance(redis: Redis, staffId: string, off: boolean, now = Date.now()) {
  const key = overrideKey(jstDate(now));
  await redis.hset(key, { [staffId]: off ? 'off' : 'work' });
  await redis.expire(key, 2 * 86400);
}
