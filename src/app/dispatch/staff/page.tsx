'use client';
import { useEffect, useState, useCallback, useRef } from 'react';

type ApiStatus =
  | { status: 'idle' }
  | { status: 'active'; remaining: number; pressedIds: string[] }
  | { status: 'assigned'; winner: { id: string; name: string; rank: string } };

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';

function urlBase64ToUint8Array(b64: string): ArrayBuffer {
  const padding = '='.repeat((4 - b64.length % 4) % 4);
  const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array([...raw].map(c => c.charCodeAt(0)));
  return arr.buffer as ArrayBuffer;
}

export default function StaffPage() {
  const [staffId, setStaffId]     = useState('');
  const [staffName, setStaffName] = useState('');
  const [status, setStatus]       = useState<ApiStatus>({ status: 'idle' });
  const [pressed, setPressed]     = useState(false);
  const [pushOk, setPushOk]       = useState<boolean | null>(null);
  const prevStatusRef = useRef<string>('idle');
  const audioCtxRef  = useRef<AudioContext | null>(null);

  // Unlock AudioContext on first user touch (required by iOS Safari)
  useEffect(() => {
    const unlock = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      audioCtxRef.current.resume();
    };
    window.addEventListener('touchstart', unlock, { once: true });
    window.addEventListener('click', unlock, { once: true });
    return () => {
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('click', unlock);
    };
  }, []);

  const playAlert = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    ctx.resume().then(() => {
      const frequencies = [880, 1108, 1320];
      frequencies.forEach((freq, i) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        const t = ctx.currentTime + i * 0.18;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.4, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        osc.start(t);
        osc.stop(t + 0.5);
      });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setStaffId(localStorage.getItem('dispatch_staff_id') ?? '');
    setStaffName(localStorage.getItem('dispatch_staff_name') ?? '');
  }, []);

  // Register push subscription
  useEffect(() => {
    if (!staffId || !VAPID_KEY) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    navigator.serviceWorker
      .register('/dispatch-sw.js')
      .then(reg =>
        reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
        })
      )
      .then(sub => {
        setPushOk(true);
        return fetch('/api/dispatch/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ staffId, subscription: sub }),
        });
      })
      .catch(() => setPushOk(false));
  }, [staffId]);

  const pollStatus = useCallback(async () => {
    const res = await fetch('/api/dispatch/status');
    const data = await res.json() as ApiStatus;

    // Reset pressed flag and play alert when a new active event starts
    if (prevStatusRef.current !== 'active' && data.status === 'active') {
      setPressed(false);
      playAlert();
    }
    prevStatusRef.current = data.status;
    setStatus(data);
  }, []);

  useEffect(() => {
    pollStatus();
    const interval = setInterval(pollStatus, 2000);
    return () => clearInterval(interval);
  }, [pollStatus]);

  const handlePress = async () => {
    if (pressed || !staffId || status.status !== 'active') return;
    setPressed(true);
    await fetch('/api/dispatch/press', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId }),
    });
    pollStatus();
  };

  const isMyWin    = status.status === 'assigned' && status.winner.name === staffName;
  const iHavePressed =
    pressed || (status.status === 'active' && status.pressedIds.includes(staffId));

  return (
    <main className="min-h-screen bg-[#07071a] flex flex-col items-center justify-center p-6 text-white select-none">
      <div className="w-full max-w-sm text-center space-y-8">

        {/* Header */}
        <div>
          <p className="text-white/30 text-xs tracking-widest mb-1">差配システム</p>
          <h1 className="text-2xl font-black">{staffName || '---'}</h1>
          {pushOk === true  && <p className="text-green-400 text-xs mt-1">🔔 通知 ON</p>}
          {pushOk === false && <p className="text-red-400 text-xs mt-1">⚠️ 通知をオンにしてください</p>}
        </div>

        {/* Idle */}
        {status.status === 'idle' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-36 h-36 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center text-5xl">
              🟢
            </div>
            <p className="text-white/40">待機中</p>
          </div>
        )}

        {/* Active */}
        {status.status === 'active' && (
          <div className="space-y-6">
            {!iHavePressed ? (
              <button
                onClick={handlePress}
                className="w-52 h-52 rounded-full mx-auto flex flex-col items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all shadow-2xl shadow-indigo-500/40 font-black text-xl animate-pulse"
              >
                <span className="text-4xl">🙋</span>
                担当する
              </button>
            ) : (
              <div className="w-52 h-52 rounded-full mx-auto bg-white/8 border-2 border-white/15 flex flex-col items-center justify-center gap-3">
                <span className="text-4xl">⏳</span>
                <p className="text-white/50 font-bold">応答済み</p>
              </div>
            )}
            <p className="text-white/40 text-sm">残り <span className="text-white font-bold">{status.remaining}</span> 秒</p>
          </div>
        )}

        {/* Assigned */}
        {status.status === 'assigned' && status.winner && (
          <div className={`rounded-3xl p-8 border ${
            isMyWin
              ? 'bg-green-500/15 border-green-400/25'
              : 'bg-white/5 border-white/10'
          }`}>
            {isMyWin ? (
              <>
                <p className="text-5xl mb-3">🎉</p>
                <p className="text-green-300 font-black text-xl">あなたが担当です！</p>
                <p className="text-white/50 text-sm mt-2">お客様をご案内してください</p>
              </>
            ) : (
              <>
                <p className="text-4xl mb-3">👤</p>
                <p className="text-white/50 text-sm mb-2">今回の担当</p>
                <p className="text-3xl font-black">{status.winner.name}</p>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
