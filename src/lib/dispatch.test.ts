// 差配システムのテスト（npm test）。Redis はモックを使い、本番には触れない
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { determineWinner, parsePresses, scoreBreakdown, type Press } from './dispatch-winner';
import { finalizeIfDecided, getResults, jstDate } from './dispatch-result';
import { isQuietHours, WINNER_MUTE_MIN } from './dispatch-config';

// ─── 共通 ───
const START = Date.UTC(2026, 9, 20, 3, 0); // 2026-10-20 12:00 JST
const after = (sec: number) => START + sec * 1000;
const event = (extra: object = {}) => ({ id: String(START), startedAt: START, status: 'active' as const, ...extra });
const press = (id: string, sec: number, response: Press['response']): Press =>
  ({ id, name: id, rank: 'B', time: after(sec), response });

// determineWinner は「30秒経過後」かを Date.now() で見るので、テスト中だけ時刻を固定する
function at<T>(ms: number, fn: () => T): T {
  const real = Date.now;
  Date.now = () => ms;
  try { return fn(); } finally { Date.now = real; }
}
async function atAsync<T>(ms: number, fn: () => Promise<T>): Promise<T> {
  const real = Date.now;
  Date.now = () => ms;
  try { return await fn(); } finally { Date.now = real; }
}

function mockRedis(init: Record<string, unknown> = {}) {
  const store: Record<string, any> = { ...init };
  const redis: any = {
    store,
    hgetall: async (k: string) => store[k] ?? null,
    hset: async (k: string, o: object) => { store[k] = { ...(store[k] ?? {}), ...o }; },
    set: async (k: string, v: unknown, o?: { nx?: boolean }) => {
      if (o?.nx && k in store) return null;
      store[k] = v;
      return 'OK';
    },
    rpush: async (k: string, v: string) => { (store[k] ??= []).push(v); },
    lrange: async (k: string) => store[k] ?? [],
    expire: async () => 1,
    del: async (k: string) => { delete store[k]; },
  };
  return redis;
}
const rawPress = (id: string, sec: number, r: string) => [`${id}::${id}::B`, JSON.stringify({ t: after(sec), r })];

// ─── 得点 ───
test('得点 =（応答 + コンディション + 実績×0.1）× 得意度×0.1', () => {
  const b = scoreBreakdown(press('asakura', 1, 'いくぜ'), { asakura: '好調' }, '軽自動車',
    { asakura: { '軽自動車': 8 } }, { asakura: 30 });
  assert.equal(b.responsePts, 40);
  assert.equal(b.conditionPts, 6);
  assert.equal(b.unitsPts, 3);
  assert.equal(b.base, 49);
  assert.equal(b.score, 39.2);
});

test('得意度・実績・コンディションが未設定なら 10 / 0 / 0 扱い', () => {
  const b = scoreBreakdown(press('nobody', 1, '普通'), {}, '普通車', {}, {});
  assert.equal(b.affinityLevel, 10);
  assert.equal(b.score, 20);
});

// ─── 当選者 ───
test('30秒以内に応答した人の中で最高得点が当選', () => {
  const w = at(after(40), () => determineWinner(event(), [press('a', 1, '普通'), press('b', 5, 'いくぜ')], {}, {}, {}));
  assert.equal(w?.id, 'b');
});

test('同点なら早押し', () => {
  const w = at(after(40), () => determineWinner(event(), [press('a', 5, '普通'), press('b', 1, '普通')], {}, {}, {}));
  assert.equal(w?.id, 'b');
});

test('「対応中」は当選しない。対応中だけなら当選なし', () => {
  const w1 = at(after(40), () => determineWinner(event(), [press('a', 1, '対応中'), press('b', 2, '今は無理かも')], {}, {}, {}));
  assert.equal(w1?.id, 'b');
  const w2 = at(after(40), () => determineWinner(event(), [press('a', 1, '対応中')], {}, {}, {}));
  assert.equal(w2, null);
});

test('30秒以内の応答が優先。誰もいなければ30秒後の最初の人', () => {
  const w1 = at(after(40), () => determineWinner(event(), [press('a', 2, '普通'), press('b', 35, 'いくぜ')], {}, {}, {}));
  assert.equal(w1?.id, 'a');
  const w2 = at(after(40), () => determineWinner(event(), [press('a', 38, '普通'), press('b', 35, '普通')], {}, {}, {}));
  assert.equal(w2?.id, 'b');
});

test('30秒たつまでは当選を決めない', () => {
  const w = at(after(20), () => determineWinner(event(), [press('a', 1, 'いくぜ')], {}, {}, {}));
  assert.equal(w, null);
});

test('お客様タイプ別の得意度で逆転する', () => {
  const presses = [press('a', 1, 'いくぜ'), press('b', 2, '普通')];
  const aff = { a: { '軽自動車': 3 } };
  const w = at(after(40), () => determineWinner(event({ customerType: '軽自動車' }), presses, {}, aff, {}));
  assert.equal(w?.id, 'b'); // a: 40×0.3=12 < b: 20
  const w2 = at(after(40), () => determineWinner(event({ customerType: '普通車' }), presses, {}, aff, {}));
  assert.equal(w2?.id, 'a');
});

test('押下データは旧形式（時刻の数値）も読める。応答は「普通」扱い', () => {
  const [p] = parsePresses({ 'ito::伊藤::B': after(3) });
  assert.equal(p.response, '普通');
  assert.equal(p.time, after(3));
});

// ─── 当選の確定と記録 ───
test('確定すると結果を1回だけ記録し、当選者の通知を30分止める', async () => {
  const redis = mockRedis({
    'dispatch:presses': Object.fromEntries([rawPress('oori', 2, 'いくぜ'), rawPress('ito', 3, '普通')]),
  });
  const now = after(40);
  const [w1, w2] = await atAsync(now, () => Promise.all([finalizeIfDecided(redis, event()), finalizeIfDecided(redis, event())]));
  assert.equal(w1?.id, 'oori');
  assert.equal(w2?.id, 'oori');
  const results = await getResults(redis, jstDate(START));
  assert.equal(results.length, 1, '同時に確定しても記録は1件');
  assert.equal(redis.store['dispatch:mutes'].oori, now + WINNER_MUTE_MIN * 60_000);
  assert.equal(redis.store['dispatch:mutes'].ito, undefined, '当選者以外は止めない');
  assert.equal(redis.store['dispatch:presses'], undefined);
});

test('管理者画面で入力した実績が、初期値より優先される', async () => {
  const redis = mockRedis({
    'dispatch:presses': Object.fromEntries([rawPress('asakura', 2, '普通'), rawPress('yamato', 3, '普通')]),
    'dispatch:sales_units': { yamato: 100 },
  });
  const w = await atAsync(after(40), () => finalizeIfDecided(redis, event()));
  assert.equal(w?.id, 'yamato'); // 初期値なら浅倉42台 > 大和3台
});

// ─── 夜間 ───
test('夜間（日本時間 18:00〜翌8:15）の判定', () => {
  const jst = (h: number, m: number) => Date.UTC(2026, 9, 20, h - 9, m);
  assert.equal(isQuietHours(jst(8, 14)), true);
  assert.equal(isQuietHours(jst(8, 15)), false);
  assert.equal(isQuietHours(jst(17, 59)), false);
  assert.equal(isQuietHours(jst(18, 0)), true);
  assert.equal(isQuietHours(jst(0, 0)), true);
});

// ─── アプリ向けの共通設定 ───
test('GET /config はアプリが使う一覧を返す（スタッフ・応答の表示名と点数・夜間）', async () => {
  const { GET } = await import('../app/api/dispatch/config/route');
  const body = await (await GET()).json();
  assert.ok(body.staff.length > 0);
  assert.ok(body.staff.every((s: { id: string; name: string }) => s.id && s.name));
  assert.deepEqual(body.responses.find((r: { value: string }) => r.value === '対応中'),
    { value: '対応中', label: '対応中（行けない）', points: 0 });
  assert.deepEqual(body.quiet, { start: { h: 18, m: 0 }, end: { h: 8, m: 15 } });
  assert.equal(body.windowSec, 30);
});

test('営業の名前は Redis の変更分で上書きされ、ID は変わらない', async () => {
  const { getStaff } = await import('./dispatch-redis');
  const staff = await getStaff(mockRedis({ 'dispatch:staff_names': { hara: '原田' } }));
  assert.equal(staff.find(s => s.id === 'hara')?.name, '原田');
  assert.equal(staff.find(s => s.id === 'asakura')?.name, '浅倉');
  assert.equal(staff.length, (await import('./dispatch-config')).STAFF.length);
});

// ─── 掲示板 ───
test('掲示板: 新しい順に並び、20件まで、削除できる', async () => {
  const { addPost, listPosts, deletePost } = await import('./dispatch-board');
  const store: Record<string, string[]> = {};
  const redis: any = {
    lpush: async (k: string, v: string) => { (store[k] ??= []).unshift(v); },
    rpush: async (k: string, ...v: string[]) => { (store[k] ??= []).push(...v); },
    ltrim: async (k: string, a: number, b: number) => { store[k] = (store[k] ?? []).slice(a, b + 1); },
    lrange: async (k: string, a: number, b: number) => (store[k] ?? []).slice(a, b + 1),
    del: async (k: string) => { delete store[k]; },
  };
  for (let i = 0; i < 22; i++) await addPost(redis, 'notice', `お知らせ${i}`, 1000 + i);
  const posts = await listPosts(redis, 'notice');
  assert.equal(posts.length, 20);
  assert.equal(posts[0].body, 'お知らせ21');
  assert.ok(await deletePost(redis, 'notice', posts[0].id));
  assert.equal((await listPosts(redis, 'notice'))[0].body, 'お知らせ20');
  assert.equal((await listPosts(redis, 'president')).length, 0, '欄は別々');
});
