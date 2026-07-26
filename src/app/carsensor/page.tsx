'use client';

import { useState, useCallback, useRef, ChangeEvent } from 'react';

// ─── CSV パーサー（クォート対応）─────────────────────────────────
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current); current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(text: string): string[][] {
  return text.split('\n').filter(l => l.trim()).map(parseCSVLine);
}

// ─── カーセンサー変換ロジック ──────────────────────────────────────
// TODO: カーセンサー仕様書が届いたらここを更新する
// 現在は ecar.co.jp の列をそのまま UTF-8 で出力
function convertToCarSensor(header: string[], rows: string[][]): { header: string[]; rows: string[][] } {
  return { header, rows };
}

// ─── CSV 生成 ─────────────────────────────────────────────────────
function toCSVText(header: string[], rows: string[][]): string {
  const escape = (cell: string) => {
    if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
      return `"${cell.replace(/"/g, '""')}"`;
    }
    return cell;
  };
  return [header, ...rows].map(row => row.map(escape).join(',')).join('\n');
}

function downloadCSV(text: string, filename: string) {
  const bom = '﻿'; // Excel で文字化けしないよう BOM 付き
  const blob = new Blob([bom + text], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── ecar.co.jp の主要列インデックス（プレビュー用）────────────────
const PREVIEW_COLS = [
  { idx: 0,  label: '車両ID' },
  { idx: 3,  label: 'メーカー' },
  { idx: 5,  label: 'モデル' },
  { idx: 7,  label: 'グレード' },
  { idx: 9,  label: '年式' },
  { idx: 10, label: '走行距離' },
  { idx: 12, label: '車体色' },
  { idx: 20, label: '本体価格(万)' },
  { idx: 21, label: '支払総額(万)' },
  { idx: 18, label: '修復歴' },
];

type Status = 'idle' | 'loading' | 'ready' | 'error';

export default function CarSensorPage() {
  const [status, setStatus]   = useState<Status>('idle');
  const [header, setHeader]   = useState<string[]>([]);
  const [rows, setRows]       = useState<string[][]>([]);
  const [errMsg, setErrMsg]   = useState('');
  const fileInputRef          = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    setStatus('loading');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buf = e.target?.result as ArrayBuffer;
        // Shift-JIS / CP932 で読む（ブラウザは WHATWG 仕様で CP932 と同等）
        const text = new TextDecoder('shift-jis').decode(buf);
        const allRows = parseCSV(text);
        if (allRows.length < 2) throw new Error('データが見つかりません');
        const [h, ...r] = allRows;
        setHeader(h);
        setRows(r);
        setStatus('ready');
      } catch (err) {
        setErrMsg(err instanceof Error ? err.message : '読み込みエラー');
        setStatus('error');
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDownload = useCallback(() => {
    const out = convertToCarSensor(header, rows);
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    downloadCSV(toCSVText(out.header, out.rows), `carsensor_${today}.csv`);
  }, [header, rows]);

  const reset = () => { setStatus('idle'); setHeader([]); setRows([]); setErrMsg(''); };

  return (
    <main className="min-h-screen bg-slate-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-slate-100 px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-black text-slate-800">カーセンサー 在庫CSV変換ツール</h1>
            <p className="text-slate-400 text-sm mt-0.5">ecar.co.jp の在庫CSVをカーセンサー形式に変換してダウンロード</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
            仕様確認中 — 変換ロジックは仕様入手後に更新
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-5">

        {/* ── アップロードエリア ── */}
        {(status === 'idle' || status === 'error') && (
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-2xl p-16 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition-all group"
          >
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleChange} />
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📂</div>
            <p className="text-slate-700 font-bold text-lg mb-1">CSVファイルをドロップ</p>
            <p className="text-slate-400 text-sm mb-1">または クリックしてファイルを選択</p>
            <p className="text-slate-300 text-xs">ecar.co.jp 在庫CSV（Shift-JIS / CP932）対応</p>
            {errMsg && (
              <p className="mt-4 text-red-500 text-sm font-medium bg-red-50 rounded-xl px-4 py-2 inline-block">
                ⚠ {errMsg}
              </p>
            )}
          </div>
        )}

        {/* ── ローディング ── */}
        {status === 'loading' && (
          <div className="text-center py-20">
            <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-medium">読み込み中...</p>
          </div>
        )}

        {/* ── 完了 ── */}
        {status === 'ready' && (
          <>
            {/* サマリーカード */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl p-5 border border-slate-100 text-center shadow-sm">
                <p className="text-4xl font-black text-blue-600">{rows.length.toLocaleString()}</p>
                <p className="text-slate-400 text-xs mt-1 font-medium">台数</p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-100 text-center shadow-sm">
                <p className="text-4xl font-black text-slate-700">{header.length}</p>
                <p className="text-slate-400 text-xs mt-1 font-medium">列数</p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-100 text-center shadow-sm">
                <p className="text-4xl font-black text-emerald-600">
                  {rows.filter(r => r[1] === '在庫').length.toLocaleString()}
                </p>
                <p className="text-slate-400 text-xs mt-1 font-medium">在庫中</p>
              </div>
            </div>

            {/* プレビューテーブル */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-600">データプレビュー（先頭5件）</span>
                <button onClick={reset} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                  ← 別のファイルを選択
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="text-xs w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {PREVIEW_COLS.map(c => (
                        <th key={c.idx} className="px-4 py-2.5 text-left text-slate-500 font-semibold whitespace-nowrap">
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-t border-slate-50 hover:bg-slate-50/50">
                        {PREVIEW_COLS.map(c => (
                          <td key={c.idx} className="px-4 py-2.5 text-slate-700 whitespace-nowrap">
                            {row[c.idx] || <span className="text-slate-300">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ダウンロードボタン */}
            <button
              onClick={handleDownload}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-lg transition-colors shadow-md hover:shadow-lg"
            >
              カーセンサー用CSVをダウンロード →
            </button>

            <p className="text-center text-slate-400 text-xs">
              ※ カーセンサーから仕様書が届き次第、変換ロジックを更新します
            </p>
          </>
        )}
      </div>
    </main>
  );
}
