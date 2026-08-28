'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { STAFF } from '@/lib/dispatch-config';

type ApiStatus =
  | { status: 'idle' }
  | { status: 'active'; remaining: number; pressedIds: string[] }
  | { status: 'assigned'; winner: { id: string; name: string; rank: string } };

export default function ManagerPage() {
  const [status, setStatus] = useState<ApiStatus>({ status: 'idle' });
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const repushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pollStatus = useCallback(async () => {
    const res = await fetch('/api/dispatch/status');
    const data = await res.json() as ApiStatus;
    setStatus(data);
  }, []);

  useEffect(() => {
    pollStatus();
    const interval = setInterval(pollStatus, 2000);
    return () => clearInterval(interval);
  }, [pollStatus]);

  useEffect(() => {
    if (status.status === 'active') {
      if (!repushTimerRef.current) {
        repushTimerRef.current = setInterval(() => {
          fetch('/api/dispatch/repush', { method: 'POST' });
        }, 10000);
      }
    } else {
      if (repushTimerRef.current) {
        clearInterval(repushTimerRef.current);
        repushTimerRef.current = null;
      }
    }
  }, [status.status]);

  const notify = async () => {
    setSending(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/dispatch/notify', { method: 'POST' });
      if (!res.ok) {
        const text = await res.text();
        setErrorMsg(`エラー ${res.status}: ${text.slice(0, 100)}`);
      }
    } catch (e) {
      setErrorMsg(`通信エラー: ${String(e)}`);
    }
    setSending(false);
    pollStatus();
  };

  const clear = async () => {
    await fetch('/api/dispatch/clear', { method: 'POST' });
    setStatus({ status: 'idle' });
  };

  const pressedNames =
    status.status === 'active'
      ? status.pressedIds.map(id => STAFF.find(s => s.id === id)?.name).filter(Boolean)
      : [];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex flex-col items-center justify-center p-6 text-white">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-amber-400/60 text-xs tracking-[0.3em] uppercase mb-1">Manager</p>
          <h1 className="text-2xl font-bold">店長画面</h1>
          {errorMsg && (
            <p className="text-red-400 text-xs mt-2 bg-red-400/10 border border-red-400/20 rounded-xl p-2 break-all">{errorMsg}</p>
          )}
        </div>

        {/* Idle */}
        {status.status === 'idle' && (
          <div className="flex flex-col items-center gap-6">
            <button
              onClick={notify}
              disabled={sending}
              className="relative w-52 h-52 rounded-full flex flex-col items-center justify-center gap-3 font-bold text-xl transition-all active:scale-95 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                boxShadow: '0 0 60px rgba(245,158,11,0.4), 0 0 120px rgba(245,158,11,0.15)',
              }}
            >
              <span className="text-5xl">{sending ? '⏳' : '🚗'}</span>
              <span>{sending ? '送信中...' : '来店通知'}</span>
            </button>
            <p className="text-white/30 text-sm">ボタンを押して来店を通知</p>
          </div>
        )}

        {/* Active */}
        {status.status === 'active' && (
          <div className="space-y-5">
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-6 text-center">
              <p className="text-white/40 text-xs tracking-widest uppercase mb-2">Time Remaining</p>
              <div className="text-8xl font-black tabular-nums text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
                {status.remaining}
              </div>
              <p className="text-white/30 text-sm mt-1">秒</p>
            </div>

            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4">
              <p className="text-white/40 text-xs tracking-widest uppercase mb-3">
                応答済み {pressedNames.length > 0 ? `(${pressedNames.length}名)` : ''}
              </p>
              {pressedNames.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {pressedNames.map(name => (
                    <span key={name}
                      className="bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 px-3 py-1.5 rounded-full text-sm font-semibold">
                      {name}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-white/25">
                  <div className="w-2 h-2 rounded-full bg-white/25 animate-pulse" />
                  <span className="text-sm">待機中...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Assigned */}
        {status.status === 'assigned' && status.winner && (
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-3xl p-8 text-center"
              style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.1))', border: '1px solid rgba(16,185,129,0.25)' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
              <p className="text-emerald-400 text-xs tracking-[0.3em] uppercase mb-4">✅ 担当者決定</p>
              <p className="text-6xl font-black mb-4">{status.winner.name}</p>
              <span className={`text-xs px-3 py-1.5 rounded-full font-bold tracking-wider ${
                status.winner.rank === 'A' ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' :
                status.winner.rank === 'B' ? 'bg-blue-400/20 text-blue-300 border border-blue-400/30' :
                'bg-slate-400/20 text-slate-300 border border-slate-400/30'
              }`}>RANK {status.winner.rank}</span>
            </div>
            <button
              onClick={clear}
              className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all border border-white/10 text-white font-semibold"
            >
              次のお客様 →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
