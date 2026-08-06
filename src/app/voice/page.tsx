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

function searchInventory(
  rows: string[][],
  query: { model: string | null; grade: string | null; maker: string | null },
): CarMatch[] {
  return rows
    .filter(r => {
      if (r[1] !== '在庫') return false;
      const model  = r[5]?.replace(/"/g, '').toLowerCase() ?? '';
      const grade  = r[7]?.replace(/"/g, '').toLowerCase() ?? '';
      const maker  = r[3]?.replace(/"/g, '').toLowerCase() ?? '';
      if (query.model  && !model.includes(query.model.toLowerCase()))  return false;
      if (query.grade  && !grade.includes(query.grade.toLowerCase()))  return false;
      if (query.maker  && !maker.includes(query.maker.toLowerCase()))  return false;
      return true;
    })
    .map(r => ({
      id:    r[0],
      maker: r[3]?.replace(/"/g, ''),
      model: r[5]?.replace(/"/g, ''),
      grade: r[7]?.replace(/"/g, ''),
      year:  r[9],
      price: r[20],
      color: r[12],
    }));
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
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // 在庫CSV読み込み
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
      const res  = await fetch('/api/voice-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text }),
      });
      const { model, grade, maker } = await res.json() as {
        model: string | null; grade: string | null; maker: string | null;
      };

      const matches = searchInventory(inventory, { model, grade, maker });
      setResults(matches);

      const carLabel = [maker, model, grade].filter(Boolean).join(' ') || 'ご指定の車';
      let reply = '';
      if (matches.length === 0) {
        reply = `${carLabel}は現在在庫がございません。他のご希望はございますか？`;
      } else if (matches.length === 1) {
        const m = matches[0];
        reply = `${m.model} ${m.grade}は1台ございます。${m.year}年式、${m.color}、本体価格${m.price}万円です。`;
      } else {
        const prices  = matches.map(m => parseFloat(m.price)).filter(n => !isNaN(n));
        const minPrice = prices.length ? Math.min(...prices) : null;
        reply = `${carLabel}は現在${matches.length}台ございます。${minPrice ? `本体価格${minPrice}万円からとなっております。` : ''}スタッフにお声がけください。`;
      }

      setResponseText(reply);
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
    const SR = (window as Window & typeof globalThis & { webkitSpeechRecognition?: typeof SpeechRecognition })
      .webkitSpeechRecognition ?? window.SpeechRecognition;
    if (!SR) { alert('このブラウザは音声認識に対応していません（Chrome推奨）'); return; }

    const rec = new SR();
    rec.lang            = 'ja-JP';
    rec.interimResults  = false;
    rec.maxAlternatives = 1;
    rec.onstart  = () => { setStatus('listening'); setTranscript(''); setResponseText(''); setResults(null); };
    rec.onend    = () => { if (status === 'listening') setStatus('ready'); };
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const t = e.results[0][0].transcript;
      setTranscript(t);
      handleSearch(t);
    };
    rec.onerror  = () => setStatus('ready');
    rec.start();
    recognitionRef.current = rec;
  }

  const isListening  = status === 'listening';
  const isSearching  = status === 'searching';
  const isReady      = status === 'ready' || status === 'done';

  return (
    <main className="min-h-screen bg-[#07071a] flex flex-col items-center justify-center p-6 text-white select-none">
      <div className="w-full max-w-sm text-center space-y-8">

        {/* ヘッダー */}
        <div>
          <p className="text-white/30 text-xs tracking-widest uppercase mb-2">在庫確認</p>
          <h1 className="text-2xl font-black">車種・グレードを<br />話しかけてください</h1>
          <p className="text-white/30 text-xs mt-2">例：「ヴォクシーのZSはありますか」</p>
        </div>

        {/* マイクボタン */}
        {(status === 'loading') ? (
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

        {/* 認識テキスト */}
        {transcript && (
          <div className="bg-white/8 border border-white/10 rounded-2xl px-5 py-3 text-left">
            <p className="text-white/40 text-[10px] mb-1 tracking-wider">認識した発言</p>
            <p className="text-white font-medium">「{transcript}」</p>
          </div>
        )}

        {/* 回答 */}
        {responseText && (
          <div className="bg-indigo-500/20 border border-indigo-400/30 rounded-2xl p-5 text-left space-y-4">
            <div>
              <p className="text-indigo-300 text-[10px] tracking-wider mb-1.5">回答</p>
              <p className="text-white font-semibold leading-relaxed">{responseText}</p>
            </div>

            {results && results.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/10">
                {results.slice(0, 3).map(car => (
                  <div key={car.id} className="bg-white/8 rounded-xl px-4 py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-white">{car.model}</p>
                      <p className="text-white/50 text-xs">{car.grade} · {car.year}年 · {car.color}</p>
                    </div>
                    <p className="text-indigo-300 font-black text-sm">{car.price}万</p>
                  </div>
                ))}
                {results.length > 3 && (
                  <p className="text-white/30 text-xs text-center">他 {results.length - 3}台</p>
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

        <p className="text-white/15 text-xs">{inventory.length > 0 ? `${inventory.length}台の在庫データ` : ''}</p>
      </div>
    </main>
  );
}
