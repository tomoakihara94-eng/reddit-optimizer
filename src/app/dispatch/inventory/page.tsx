'use client';
// 在庫・公休の取り込み（パソコンのブラウザ用。2026-11-26〜）
//   在庫: グーネットの「在庫検索一覧」でダウンロードした CSV を選んで送る
//   公休: 公休シートの「ウェブに公開」CSV リンクを登録して今すぐ取り込む（毎朝も自動）／シートをダウンロードした CSV を直接送る
//   どちらも管理者の暗証番号が必要（このページ自体はログインなしで開ける）。暗証番号は画面を閉じれば消える（保存しない）
import { useState } from 'react';

type Meta = { at: number; count: number; numbers: number; exportedAt?: string };
type Car = { memo: string; maker: string; model: string; grade: string; year: string; mileage: string; color: string; total: string; gooUrl?: string };
type SyncResult = { url?: string; month?: string; staffCount?: number; unmatched?: string[]; error?: string };
type Msg = { ok: boolean; text: string } | null;

const monthLabel = (m?: string) => (m ? `${m.slice(0, 4)}年${Number(m.slice(5, 7))}月` : '');
const resultText = (r: SyncResult) =>
  r.error ? `⚠️ ${r.error}` : `✅ ${monthLabel(r.month)}：${r.staffCount}人を取り込みました${r.unmatched?.length ? `（アプリに見つからない名前：${r.unmatched.join('・')}）` : ''}`;

export default function InventoryUploadPage() {
  const [pin, setPin] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const [no, setNo] = useState('');
  const [cars, setCars] = useState<Car[] | null>(null);
  // 公休
  const [links, setLinks] = useState<string | null>(null); // null = まだ読んでいない
  const [offBusy, setOffBusy] = useState(false);
  const [offResults, setOffResults] = useState<string[]>([]);
  const [offFile, setOffFile] = useState<File | null>(null);
  const [offMsg, setOffMsg] = useState<Msg>(null);

  const upload = async () => {
    if (!file || !pin) return;
    setBusy(true); setMsg(null);
    try {
      const res = await fetch('/api/dispatch/inventory', {
        method: 'POST', headers: { 'X-Admin-Pin': pin, 'Content-Type': 'text/csv' }, body: await file.arrayBuffer(),
      });
      const d = await res.json().catch(() => ({}));
      if (res.status === 401) setMsg({ ok: false, text: '暗証番号が違います' });
      else if (!res.ok) setMsg({ ok: false, text: d.error ?? `取り込めませんでした（${res.status}）` });
      else {
        const m = d.meta as Meta;
        setMsg({ ok: true, text: `取り込みました：${m.count}台（管理用番号 ${m.numbers}件）${m.exportedAt ? `／CSV の出力日時 ${m.exportedAt}` : ''}` });
      }
    } catch {
      setMsg({ ok: false, text: '通信できませんでした' });
    } finally {
      setBusy(false);
    }
  };

  const search = async () => {
    if (!no || !pin) return;
    const res = await fetch(`/api/dispatch/inventory?no=${encodeURIComponent(no)}`, { headers: { 'X-Admin-Pin': pin } });
    const d = await res.json().catch(() => ({}));
    setCars(res.ok ? d.cars : []);
  };

  // 公休: 登録済みのリンクを読む
  const loadLinks = async () => {
    if (!pin) return;
    const res = await fetch('/api/dispatch/offdays', { headers: { 'X-Admin-Pin': pin } });
    const d = await res.json().catch(() => ({}));
    if (!res.ok || !Array.isArray(d.sources)) { setOffResults(['⚠️ 読み込めませんでした（暗証番号を確かめてください）']); return; }
    setLinks(d.sources.join('\n'));
    setOffResults((d.lastSync?.results ?? []).map(resultText));
  };

  // 公休: リンクを保存して今すぐ取り込む
  const saveLinks = async () => {
    if (!pin || links === null) return;
    setOffBusy(true);
    try {
      const sources = links.split(/\s+/).map(t => t.trim()).filter(Boolean);
      const res = await fetch('/api/dispatch/offdays', {
        method: 'POST', headers: { 'X-Admin-Pin': pin, 'Content-Type': 'application/json' }, body: JSON.stringify({ sync: true, sources }),
      });
      const d = await res.json().catch(() => ({}));
      setOffResults(res.ok ? (d.results ?? []).map(resultText) : [res.status === 401 ? '⚠️ 暗証番号が違います' : '⚠️ 取り込めませんでした']);
      if (res.ok) setLinks(sources.filter(u => /^https:\/\/docs\.google\.com\/spreadsheets\//.test(u)).join('\n'));
    } finally {
      setOffBusy(false);
    }
  };

  // 公休: ダウンロードした CSV を送る
  const uploadOff = async () => {
    if (!offFile || !pin) return;
    setOffBusy(true); setOffMsg(null);
    try {
      const res = await fetch('/api/dispatch/offdays', {
        method: 'POST', headers: { 'X-Admin-Pin': pin, 'Content-Type': 'text/csv' }, body: await offFile.arrayBuffer(),
      });
      const d = await res.json().catch(() => ({}));
      if (res.status === 401) setOffMsg({ ok: false, text: '暗証番号が違います' });
      else if (!res.ok) setOffMsg({ ok: false, text: d.error ?? `取り込めませんでした（${res.status}）` });
      else setOffMsg({ ok: true, text: resultText(d).replace(/^✅ /, '') });
    } catch {
      setOffMsg({ ok: false, text: '通信できませんでした' });
    } finally {
      setOffBusy(false);
    }
  };

  const box = 'w-full rounded-xl bg-white/10 border border-white/15 px-4 py-3 text-white placeholder-white/40';
  const fileBox = 'block w-full text-sm text-white/80 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-500 file:px-4 file:py-2 file:text-white';
  const card = 'space-y-3 rounded-2xl bg-white/5 border border-white/10 p-5';
  const note = (m: Msg) => (m ? <p className={m.ok ? 'text-emerald-300 text-sm' : 'text-rose-300 text-sm'}>{m.ok ? '✅ ' : '⚠️ '}{m.text}</p> : null);
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 p-6 flex justify-center">
      <div className="w-full max-w-lg space-y-6 text-white">
        <div>
          <p className="text-indigo-400/60 text-xs tracking-[0.3em] uppercase mb-1">Import</p>
          <h1 className="text-2xl font-bold">在庫・公休の取り込み</h1>
          <p className="text-white/60 text-sm mt-2">差配システムの管理者用です。最初に管理者の暗証番号を入れてください。</p>
        </div>

        <section className={card}>
          <input className={box} type="password" inputMode="numeric" autoComplete="off" placeholder="管理者の暗証番号" value={pin} onChange={e => setPin(e.target.value)} />
        </section>

        <h2 className="text-lg font-bold pt-2">🚗 在庫</h2>
        <section className={card}>
          <p className="text-white/60 text-sm leading-relaxed">
            在庫検索一覧でダウンロードした CSV（在庫検索一覧YYYYMMDD.csv）をそのまま選んでください。取り込むたびに前の在庫は全部入れ替わります。仕入れの列は取り込みません。
          </p>
          <input className={fileBox} type="file" accept=".csv,text/csv" onChange={e => setFile(e.target.files?.[0] ?? null)} />
          <button disabled={!file || !pin || busy} onClick={upload} className="w-full rounded-xl bg-amber-500 disabled:opacity-40 py-3 font-bold">
            {busy ? '取り込み中…' : '在庫を取り込む'}
          </button>
          {note(msg)}
        </section>

        <section className={card}>
          <p className="text-sm text-white/70">確認：管理用番号で探す（例 07-12）</p>
          <div className="flex gap-2">
            <input className={box} placeholder="07-12" value={no} onChange={e => setNo(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') search(); }} />
            <button disabled={!no || !pin} onClick={search} className="rounded-xl bg-indigo-500 disabled:opacity-40 px-5 font-bold shrink-0">検索</button>
          </div>
          {cars ? (cars.length === 0 ? <p className="text-white/60 text-sm">見つかりません</p> : (
            <ul className="space-y-2">
              {cars.map((c, i) => (
                <li key={i} className="rounded-xl bg-white/5 p-3 text-sm">
                  <p className="font-bold">{c.maker} {c.model} {c.grade}</p>
                  <p className="text-white/60">{c.year}・{c.mileage}・{c.color}・支払総額 {c.total}</p>
                  <p className="text-amber-200/80">{c.memo}</p>
                  {c.gooUrl ? <a href={c.gooUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-300 underline">グーネットで見る</a> : null}
                </li>
              ))}
            </ul>
          )) : null}
        </section>

        <h2 className="text-lg font-bold pt-2">🗓 公休表</h2>
        <section className={card}>
          <p className="text-white/80 text-sm font-bold">① 公開リンクで取り込む（毎朝自動で取り込み直します）</p>
          <p className="text-white/60 text-sm leading-relaxed">
            スプレッドシートで「ファイル → 共有 → ウェブに公開」を開き、その月の公休のシートだけを選んで「カンマ区切り形式（.csv）」で公開し、出たリンクを月ごとに1行ずつ貼ります。ファイル全体の共有は変えないでください（別のシートも見えてしまうため）。
          </p>
          {links === null ? (
            <button disabled={!pin} onClick={loadLinks} className="w-full rounded-xl bg-indigo-500 disabled:opacity-40 py-3 font-bold">登録済みのリンクを読む</button>
          ) : (
            <>
              <textarea className={`${box} min-h-32 text-xs`} value={links} onChange={e => setLinks(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/e/…/pub?gid=…&single=true&output=csv" />
              <button disabled={!pin || offBusy} onClick={saveLinks} className="w-full rounded-xl bg-amber-500 disabled:opacity-40 py-3 font-bold">
                {offBusy ? '取り込み中…' : '保存して今すぐ取り込む'}
              </button>
            </>
          )}
          {offResults.map((t, i) => <p key={i} className={t.startsWith('✅') ? 'text-emerald-300 text-sm' : 'text-rose-300 text-sm'}>{t}</p>)}
        </section>

        <section className={card}>
          <p className="text-white/80 text-sm font-bold">② CSV ファイルで取り込む（公開しなくてよい）</p>
          <p className="text-white/60 text-sm leading-relaxed">
            その月の公休のシートを開いて「ファイル → ダウンロード → カンマ区切り形式（.csv）」で保存したファイルを選びます。自動では取り込み直さないので、表を直したらもう一度送ってください。
          </p>
          <input className={fileBox} type="file" accept=".csv,text/csv" onChange={e => setOffFile(e.target.files?.[0] ?? null)} />
          <button disabled={!offFile || !pin || offBusy} onClick={uploadOff} className="w-full rounded-xl bg-amber-500 disabled:opacity-40 py-3 font-bold">
            {offBusy ? '取り込み中…' : '公休表を取り込む'}
          </button>
          {note(offMsg)}
        </section>
      </div>
    </main>
  );
}
