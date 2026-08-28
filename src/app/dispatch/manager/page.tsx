'use client';
import { useEffect, useState, useCallback } from 'react';
import { STAFF } from '@/lib/dispatch-config';

type ApiStatus =
  | { status: 'idle' }
  | { status: 'active'; remaining: number; pressedIds: string[] }
  | { status: 'assigned'; winner: { id: string; name: string; rank: string } };

export default function ManagerPage() {
  const [status, setStatus] = useState<ApiStatus>({ status: 'idle' });
  const [sending, setSending] = useState(false);

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

  const notify = async () => {
    setSending(true);
    await fetch('/api/dispatch/notify', { method: 'POST' });
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
    <main className="min-h-screen bg-[#07071a] flex flex-col items-center justify-center p-6 text-white">
      <div className="w-full max-w-sm text-center space-y-8">
        <div>
          <p className="text-white/30 text-xs tracking-widest mb-1">差配システム</p>
          <h1 className="text-2xl font-black">店長画面</h1>
        </div>

        {status.status === 'idle' && (
          <button
            onClick={notify}
            disabled={sending}
            className="w-52 h-52 rounded-full mx-auto flex flex-col items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 active:scale-95 disabled:opacity-60 transition-all shadow-2xl shadow-orange-500/40 font-black text-2xl"
          >
            <span className="text-4xl">🚗</span>
            {sending ? '送信中...' : '来店\n通知'}
          </button>
        )}

        {status.status === 'active' && (
          <div className="space-y-6">
            <div>
              <p className="text-white/40 text-sm mb-1">ウィンドウ終了まで</p>
              <div className="text-7xl font-black tabular-nums text-orange-400">
                {status.remaining}
              </div>
              <p className="text-white/30 text-sm mt-1">秒</p>
            </div>

            {pressedNames.length > 0 ? (
              <div className="bg-white/8 rounded-2xl p-4">
                <p className="text-white/40 text-xs mb-3">応答済み ({pressedNames.length}名)</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {pressedNames.map(name => (
                    <span key={name} className="bg-indigo-600 px-3 py-1.5 rounded-full text-sm font-bold">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-white/30 text-sm">応答待ち...</p>
            )}
          </div>
        )}

        {status.status === 'assigned' && status.winner && (
          <div className="space-y-6">
            <div className="bg-green-500/15 border border-green-400/25 rounded-3xl p-8">
              <p className="text-green-300 text-sm font-bold mb-3">✅ 担当者決定</p>
              <p className="text-5xl font-black mb-3">{status.winner.name}</p>
              <span className={`text-sm px-3 py-1 rounded-full font-bold ${
                status.winner.rank === 'A' ? 'bg-yellow-400 text-black' :
                status.winner.rank === 'B' ? 'bg-blue-400 text-white' :
                'bg-slate-500 text-white'
              }`}>
                Rank {status.winner.rank}
              </span>
            </div>
            <button
              onClick={clear}
              className="w-full py-4 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white font-bold text-lg"
            >
              次のお客様 →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
