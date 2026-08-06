'use client';

import { useState, useEffect, useRef } from 'react';

interface CarMatch {
  id: string;
  maker: string;
  model: string;
  grade: string;
  year: string;
  price: string;
  color: string;
  makerUrl: string;
  modelUrl: string;
}

interface SearchContext {
  maker: string | null;
  model: string | null;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = ''; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
    else if (c === ',' && !inQ) { result.push(cur); cur = ''; }
    else cur += c;
  }
  result.push(cur);
  return result;
}

function toRow(r: string[]): CarMatch {
  return {
    id:       r[0],
    maker:    r[3]?.replace(/"/g, '') ?? '',
    model:    r[5]?.replace(/"/g, '') ?? '',
    grade:    r[7]?.replace(/"/g, '') ?? '',
    year:     r[9] ?? '',
    price:    r[20] ?? '',
    color:    r[12]?.replace(/"/g, '') ?? '',
    makerUrl: r[4]?.replace(/"/g, '') ?? '',
    modelUrl: r[6]?.replace(/"/g, '') ?? '',
  };
}

function ecarUrl(car: { makerUrl: string; modelUrl: string }) {
  return `https://www.ecar.co.jp/maker_${car.makerUrl}/model_${car.modelUrl}/type_0/price_0_1/car.html`;
}

// スマホ音声認識がカタカナ化する車名を正規化
const KANA_TO_EN: [RegExp, string][] = [
  [/ボックス/g, 'BOX'], [/エヌ/g, 'N-'], [/ワゴン/g, 'WGN'],
  [/エックス/g, 'X'],  [/ジー/g, 'G'],   [/エス/g, 'S'],
  [/ブイ/g, 'V'],      [/ゼット/g, 'Z'],  [/アール/g, 'R'],
];
function normalizeModel(s: string): string {
  let r = s.toLowerCase().replace(/\s+/g, '').replace(/ー/g, '');
  for (const [from, to] of KANA_TO_EN) r = r.replace(from, to.toLowerCase());
  return r.replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function searchInventory(
  rows: string[][],
  query: { model?: string | null; grade?: string | null; maker?: string | null; color?: string | null },
): CarMatch[] {
  const qModel = query.model ? normalizeModel(query.model) : null;
  return rows.filter(r => {
    if (r[1] !== '在庫') return false;
    const model = normalizeModel(r[5] ?? '');
    const grade = r[7]?.toLowerCase() ?? '';
    const maker = r[3]?.toLowerCase() ?? '';
    const color = r[12]?.toLowerCase() ?? '';
    if (qModel && !model.includes(qModel)) return false;
    if (query.grade && !grade.includes(query.grade.toLowerCase())) return false;
    if (query.maker && !maker.includes(query.maker.toLowerCase())) return false;
    if (query.color && !color.includes(query.color.toLowerCase())) return false;
    return true;
  }).map(toRow);
}

function buildGradeInfo(rows: string[][], model: string): { text: string; cars: CarMatch[] } {
  const qModel = normalizeModel(model);
  const matched = rows.filter(r => r[1] === '在庫' && normalizeModel(r[5] ?? '').includes(qModel));
  const map = new Map<string, { count: number; prices: number[]; sample: string[] }>();
  matched.forEach(r => {
    const g = r[7]?.replace(/"/g, '') || '（不明）';
    if (!map.has(g)) map.set(g, { count: 0, prices: [], sample: r });
    const entry = map.get(g)!;
    entry.count++;
    const p = parseFloat(r[20]);
    if (!isNaN(p)) entry.prices.push(p);
  });

  if (map.size === 0) return { text: `${model}の在庫はございません。`, cars: [] };

  const entries = [...map.entries()].sort((a, b) => {
    const aMin = a[1].prices.length ? Math.min(...a[1].prices) : 0;
    const bMin = b[1].prices.length ? Math.min(...b[1].prices) : 0;
    return aMin - bMin;
  });

  const parts = entries.map(([grade, v]) => {
    const min = v.prices.length ? Math.min(...v.prices) : 0;
    const max = v.prices.length ? Math.max(...v.prices) : 0;
    return `${grade}が${v.count}台（${min > 0 ? `${min}〜${max}万円` : '価格未定'}）`;
  });
  const text = `${model}は${map.size}種類のグレードがございます。${parts.join('、')}です。`;

  const cars: CarMatch[] = entries.map(([grade, v]) => {
    const r = v.sample;
    const min = v.prices.length ? Math.min(...v.prices) : 0;
    const max = v.prices.length ? Math.max(...v.prices) : 0;
    return {
      id: grade, maker: r[3]?.replace(/"/g, '') ?? '', model: r[5]?.replace(/"/g, '') ?? '',
      grade, year: '', price: min > 0 ? `${min}〜${max}` : '-', color: `${v.count}台`,
      makerUrl: r[4]?.replace(/"/g, '') ?? '', modelUrl: r[6]?.replace(/"/g, '') ?? '',
    };
  });
  return { text, cars };
}

function buildRecommendations(rows: string[][], ctx: SearchContext): CarMatch[] {
  const seen = new Map<string, CarMatch>();
  rows.filter(r => {
    if (r[1] !== '在庫') return false;
    if (ctx.maker && !r[3]?.toLowerCase().includes(ctx.maker.toLowerCase())) return false;
    if (ctx.model && r[5]?.toLowerCase().includes(ctx.model.toLowerCase())) return false;
    return true;
  }).forEach(r => {
    const model = r[5]?.replace(/"/g, '') ?? '';
    if (model && !seen.has(model)) seen.set(model, toRow(r));
  });
  return [...seen.values()].slice(0, 4);
}

function speak(text: string) {
  if (typeof window === 'undefined') return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ja-JP';
  u.rate = 0.88;
  window.speechSynthesis.speak(u);
}

type Status = 'loading' | 'ready' | 'listening' | 'searching' | 'done' | 'error';

export default function VoicePage() {
  const [status,       setStatus]       = useState<Status>('loading');
  const [inventory,    setInventory]    = useState<string[][]>([]);
  const [transcript,   setTranscript]   = useState('');
  const [responseText, setResponseText] = useState('');
  const [results,      setResults]      = useState<CarMatch[] | null>(null);
  const [context,      setContext]      = useState<SearchContext>({ maker: null, model: null });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    fetch('/inventory.csv')
      .then(r => r.arrayBuffer())
      .then(buf => {
        const text = new TextDecoder('shift-jis').decode(buf);
        const rows = text.split('\n').filter(l => l.trim()).slice(1).map(parseCsvLine);
        setInventory(rows);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  async function handleSearch(text: string) {
    setStatus('searching');
    setResults(null);
    setResponseText('');
    try {
      const res = await fetch('/api/voice-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text, context }),
      });
      const { intent, model, grade, maker, color } = await res.json() as {
        intent: 'search' | 'grade_info' | 'recommend';
        model: string | null;
        grade: string | null;
        maker: string | null;
        color: string | null;
      };

      let reply = '';
      let matchedCars: CarMatch[] = [];

      if (intent === 'grade_info') {
        const targetModel = model ?? context.model;
        if (!targetModel) {
          reply = 'どの車種のグレードについてお知らせしますか？';
        } else {
          const { text: gradeText, cars: gradeCars } = buildGradeInfo(inventory, targetModel);
          reply = gradeText;
          matchedCars = gradeCars;
        }

      } else if (intent === 'recommend') {
        const ctx = { maker: maker ?? context.maker, model: model ?? context.model };
        const recs = buildRecommendations(inventory, ctx);
        if (recs.length === 0) {
          reply = '他のおすすめ車種が見つかりませんでした。';
        } else {
          const names = recs.map(r => r.model).join('、');
          reply = `${ctx.maker ?? 'こちら'}の他のおすすめとして、${names}がございます。`;
          matchedCars = recs;
        }

      } else {
        // search
        matchedCars = searchInventory(inventory, { model, grade, maker, color });
        const newCtx = { maker: maker ?? context.maker, model: model ?? context.model };
        setContext(newCtx);

        const carLabel = [maker, model, grade].filter(Boolean).join(' ') || 'ご指定の車';
        const colorLabel = color ? `${color}の` : '';

        if (matchedCars.length === 0) {
          reply = `${colorLabel}${carLabel}は現在在庫がございません。他のご希望はございますか？`;
        } else if (matchedCars.length === 1) {
          const m = matchedCars[0];
          reply = `${colorLabel}${m.model} ${m.grade}は1台ございます。${m.year}年式、${m.color}、本体価格${m.price}万円です。`;
        } else {
          const prices = matchedCars.map(m => parseFloat(m.price)).filter(n => !isNaN(n));
          const minPrice = prices.length ? Math.min(...prices) : null;
          reply = `${colorLabel}${carLabel}は現在${matchedCars.length}台ございます。${minPrice ? `本体価格${minPrice}万円からとなっております。` : ''}スタッフにお声がけください。`;
        }
      }

      setResponseText(reply);
      setResults(matchedCars);
      speak(reply);
      setStatus('done');
    } catch {
      const err = '申し訳ございません。もう一度お試しください。';
      setResponseText(err);
      speak(err);
      setStatus('done');
    }
  }

  function startListening() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.webkitSpeechRecognition ?? w.SpeechRecognition;
    if (!SR) { alert('このブラウザは音声認識に対応していません（Chrome推奨）'); return; }

    const rec = new SR();
    rec.lang            = 'ja-JP';
    rec.interimResults  = false;
    rec.maxAlternatives = 1;
    rec.onstart  = () => { setStatus('listening'); setTranscript(''); setResponseText(''); setResults(null); };
    rec.onend    = () => { setStatus((s: Status) => s === 'listening' ? 'ready' : s); };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      const t = e.results[0][0].transcript as string;
      setTranscript(t);
      handleSearch(t);
    };
    rec.onerror  = () => setStatus('ready');
    rec.start();
    recognitionRef.current = rec;
  }

  const isListening = status === 'listening';
  const isSearching = status === 'searching';
  const isReady     = status === 'ready' || status === 'done';

  return (
    <main className="min-h-screen bg-[#07071a] flex flex-col items-center justify-center p-6 text-white select-none">
      <div className="w-full max-w-sm text-center space-y-8">

        <div>
          <p className="text-white/30 text-xs tracking-widest uppercase mb-2">在庫確認</p>
          <h1 className="text-2xl font-black">車種・グレードを<br />話しかけてください</h1>
          <p className="text-white/30 text-xs mt-2">例：「白いヴォクシーZSはある？」「グレードの違いは？」「他のおすすめは？」</p>
        </div>

        {status === 'loading' ? (
          <div className="flex items-center justify-center gap-2 text-white/40">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
            在庫データ読み込み中...
          </div>
        ) : status === 'error' ? (
          <p className="text-red-400">在庫データの読み込みに失敗しました</p>
        ) : (
          <button
            onClick={isReady ? startListening : undefined}
            disabled={isListening || isSearching}
            className={`w-36 h-36 rounded-full mx-auto flex flex-col items-center justify-center gap-2 text-white font-bold transition-all duration-300 shadow-2xl ${
              isListening ? 'bg-red-500 scale-110 shadow-red-500/40 animate-pulse' :
              isSearching ? 'bg-slate-600 cursor-wait' :
              'bg-indigo-600 hover:bg-indigo-500 hover:scale-105 active:scale-95 shadow-indigo-500/30'
            }`}
          >
            <span className="text-4xl">{isListening ? '🔴' : isSearching ? '⏳' : '🎤'}</span>
            <span className="text-xs">
              {isListening ? '聞いています' : isSearching ? '検索中' : 'タップして話す'}
            </span>
          </button>
        )}

        {transcript && (
          <div className="bg-white/8 border border-white/10 rounded-2xl px-5 py-3 text-left">
            <p className="text-white/40 text-[10px] mb-1 tracking-wider">認識した発言</p>
            <p className="text-white font-medium">「{transcript}」</p>
          </div>
        )}

        {responseText && (
          <div className="bg-indigo-500/20 border border-indigo-400/30 rounded-2xl p-5 text-left space-y-4">
            <div>
              <p className="text-indigo-300 text-[10px] tracking-wider mb-1.5">回答</p>
              <p className="text-white font-semibold leading-relaxed">{responseText}</p>
            </div>

            {results && results.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/10">
                {results.slice(0, 4).map((car, i) => (
                  <a
                    key={car.id + i}
                    href={ecarUrl(car)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/8 rounded-xl px-4 py-2.5 flex items-center justify-between hover:bg-white/15 active:bg-white/20 transition-colors"
                  >
                    <div>
                      <p className="font-bold text-sm text-white">{car.model}</p>
                      <p className="text-white/50 text-xs">
                        {car.grade}{car.year ? ` · ${car.year}年` : ''}{car.color ? ` · ${car.color}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-indigo-300 font-black text-sm whitespace-nowrap">{car.price}万</p>
                      <p className="text-white/30 text-[10px]">詳細 →</p>
                    </div>
                  </a>
                ))}
                {results.length > 4 && (
                  <p className="text-white/30 text-xs text-center">他 {results.length - 4}台</p>
                )}
              </div>
            )}

            <button
              onClick={startListening}
              className="w-full py-2.5 rounded-xl border border-white/20 text-white/60 text-sm hover:bg-white/10 transition-colors"
            >
              もう一度話す
            </button>
          </div>
        )}

        {context.model && status === 'done' && (
          <p className="text-white/20 text-xs">
            会話中の車種: {[context.maker, context.model].filter(Boolean).join(' ')}
          </p>
        )}

        <p className="text-white/15 text-xs">{inventory.length > 0 ? `${inventory.length}台の在庫データ` : ''}</p>
      </div>
    </main>
  );
}
