'use client';
// 在庫 CSV の取り込み（パソコンのブラウザ用。2026-11-26〜）
//   グーネットの「在庫検索一覧」でダウンロードした CSV を選んで送る。管理者の暗証番号が必要（このページ自体はログインなしで開ける）
//   暗証番号は画面を閉じれば消える（保存しない）
import { useState } from 'react';

type Meta = { at: number; count: number; numbers: number; exportedAt?: string };
type Car = { memo: string; maker: string; model: string; grade: string; year: string; mileage: string; color: string; total: string; gooUrl?: string };

export default function InventoryUploadPage() {
  const [pin, setPin] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [no, setNo] = useState('');
  const [cars, setCars] = useState<Car[] | null>(null);

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

  const box = 'w-full rounded-xl bg-white/10 border border-white/15 px-4 py-3 text-white placeholder-white/40';
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 p-6 flex justify-center">
      <div className="w-full max-w-lg space-y-6 text-white">
        <div>
          <p className="text-indigo-400/60 text-xs tracking-[0.3em] uppercase mb-1">Inventory</p>
          <h1 className="text-2xl font-bold">在庫 CSV の取り込み</h1>
          <p className="text-white/60 text-sm mt-2 leading-relaxed">
            在庫検索一覧でダウンロードした CSV（在庫検索一覧YYYYMMDD.csv）をそのまま選んでください。取り込むたびに前の在庫は全部入れ替わります。仕入れの列は取り込みません。
          </p>
        </div>

        <section className="space-y-3 rounded-2xl bg-white/5 border border-white/10 p-5">
          <input className={box} type="password" inputMode="numeric" autoComplete="off" placeholder="管理者の暗証番号" value={pin} onChange={e => setPin(e.target.value)} />
          <input className="block w-full text-sm text-white/80 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-500 file:px-4 file:py-2 file:text-white" type="file" accept=".csv,text/csv" onChange={e => setFile(e.target.files?.[0] ?? null)} />
          <button disabled={!file || !pin || busy} onClick={upload} className="w-full rounded-xl bg-amber-500 disabled:opacity-40 py-3 font-bold">
            {busy ? '取り込み中…' : '取り込む'}
          </button>
          {msg ? <p className={msg.ok ? 'text-emerald-300 text-sm' : 'text-rose-300 text-sm'}>{msg.ok ? '✅ ' : '⚠️ '}{msg.text}</p> : null}
        </section>

        <section className="space-y-3 rounded-2xl bg-white/5 border border-white/10 p-5">
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
      </div>
    </main>
  );
}
