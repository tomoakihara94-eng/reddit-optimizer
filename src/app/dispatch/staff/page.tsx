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
  return new Uint8Array([...raw].map(c => c.charCodeAt(0))).buffer as ArrayBuffer;
}

function makeWavUri(freq: number, dur = 0.35, sr = 22050): string {
  const n = Math.floor(sr * dur);
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const str = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true);
  str(8, 'WAVE'); str(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true);
  v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, 'data'); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const env = Math.min(t / 0.01, 1) * Math.min((dur - t) / 0.05, 1);
    v.setInt16(44 + i * 2, Math.round(Math.sin(2 * Math.PI * freq * t) * env * 0.7 * 32767), true);
  }
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return 'data:audio/wav;base64,' + btoa(bin);
}

function makeWinMelody(sr = 22050): string {
  const notes: [number, number][] = [
    [523.25, 0.12], [587.33, 0.10], [659.25, 0.12],
    [783.99, 0.10], [1046.50, 0.12], [1318.51, 0.55],
  ];
  const totalN = notes.reduce((acc, [, d]) => acc + Math.floor(sr * d), 0);
  const buf = new ArrayBuffer(44 + totalN * 2);
  const v = new DataView(buf);
  const str = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF'); v.setUint32(4, 36 + totalN * 2, true);
  str(8, 'WAVE'); str(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true);
  v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, 'data'); v.setUint32(40, totalN * 2, true);
  let offset = 44;
  for (const [freq, dur] of notes) {
    const n = Math.floor(sr * dur);
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      const env = Math.min(t / 0.01, 1) * Math.min((dur - t) / 0.05, 1);
      v.setInt16(offset + i * 2, Math.round(Math.sin(2 * Math.PI * freq * t) * env * 0.8 * 32767), true);
    }
    offset += n * 2;
  }
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return 'data:audio/wav;base64,' + btoa(bin);
}

const CHIME_FREQS = [880, 1108, 1320];

export default function StaffPage() {
  const [staffId, setStaffId]       = useState('');
  const [staffName, setStaffName]   = useState('');
  const [status, setStatus]         = useState<ApiStatus>({ status: 'idle' });
  const [pressed, setPressed]       = useState(false);
  const [pushOk, setPushOk]         = useState<boolean | null>(null);
  const [audioReady, setAudioReady] = useState(false);
  const prevStatusRef = useRef<string>('idle');
  const audiosRef     = useRef<HTMLAudioElement[]>([]);
  const winAudioRef   = useRef<HTMLAudioElement | null>(null);
  const chimeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const staffNameRef  = useRef('');

  useEffect(() => {
    const id   = localStorage.getItem('dispatch_staff_id') ?? '';
    const name = localStorage.getItem('dispatch_staff_name') ?? '';
    setStaffId(id); setStaffName(name); staffNameRef.current = name;
  }, []);

  const startAudio = useCallback(() => {
    if (audioReady) return;
    audiosRef.current = CHIME_FREQS.map(freq => new Audio(makeWavUri(freq)));
    audiosRef.current.forEach((audio, i) => {
      setTimeout(() => { audio.currentTime = 0; audio.play().catch(() => {}); }, i * 180);
    });
    const win = new Audio(makeWinMelody());
    winAudioRef.current = win;
    win.volume = 0.01;
    win.play().then(() => { win.pause(); win.currentTime = 0; win.volume = 1; }).catch(() => {});
    setAudioReady(true);
  }, [audioReady]);

  const playChime = useCallback(() => {
    audiosRef.current.forEach((audio, i) => {
      setTimeout(() => { audio.currentTime = 0; audio.play().catch(() => {}); }, i * 180);
    });
  }, []);

  const startChimeLoop = useCallback(() => {
    playChime();
    if (chimeTimerRef.current) clearInterval(chimeTimerRef.current);
    chimeTimerRef.current = setInterval(playChime, 3000);
  }, [playChime]);

  const stopChimeLoop = useCallback(() => {
    if (chimeTimerRef.current) { clearInterval(chimeTimerRef.current); chimeTimerRef.current = null; }
  }, []);

  const playWin = useCallback(() => {
    const audio = winAudioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, []);

  useEffect(() => {
    if (!staffId || !VAPID_KEY) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    navigator.serviceWorker
      .register('/dispatch-sw.js')
      .then(reg => reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
      }))
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
    if (prevStatusRef.current !== 'active' && data.status === 'active') {
      setPressed(false);
      startChimeLoop();
      if ('vibrate' in navigator) navigator.vibrate([300, 100, 300, 100, 300]);
    }
    if (prevStatusRef.current === 'active' && data.status !== 'active') {
      stopChimeLoop();
      if (data.status === 'assigned' && data.winner.name === staffNameRef.current) {
        playWin();
      }
    }
    prevStatusRef.current = data.status;
    setStatus(data);
  }, [startChimeLoop, stopChimeLoop, playWin]);

  useEffect(() => {
    pollStatus();
    const id = setInterval(pollStatus, 2000);
    return () => clearInterval(id);
  }, [pollStatus]);

  const handlePress = async () => {
    if (pressed || !staffId || status.status !== 'active') return;
    setPressed(true);
    stopChimeLoop();
    await fetch('/api/dispatch/press', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId }),
    });
    pollStatus();
  };

  const isMyWin      = status.status === 'assigned' && status.winner.name === staffName;
  const iHavePressed = pressed || (status.status === 'active' && status.pressedIds.includes(staffId));

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex flex-col items-center justify-center p-6 text-white select-none">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-indigo-400/60 text-xs tracking-[0.3em] uppercase mb-1">Sales Staff</p>
          <h1 className="text-2xl font-bold">{staffName || '---'}</h1>
          <div className="flex items-center justify-center gap-3 mt-2">
            {pushOk === true  && <span className="text-xs text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />通知 ON</span>}
            {pushOk === false && <span className="text-xs text-red-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />通知 OFF</span>}
            {audioReady && <span className="text-xs text-indigo-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />音 ON</span>}
          </div>
        </div>

        {/* Audio unlock */}
        {!audioReady && (
          <button
            onClick={startAudio}
            className="w-full py-4 rounded-2xl mb-6 font-bold text-sm transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, rgba(234,179,8,0.2), rgba(234,179,8,0.1))', border: '1px solid rgba(234,179,8,0.3)', color: '#fde047' }}
          >
            🔊 音を有効にする（必須）
          </button>
        )}

        {/* Idle */}
        {status.status === 'idle' && (
          <div className="flex flex-col items-center gap-6">
            <div className="w-40 h-40 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="text-center">
                <div className="w-3 h-3 rounded-full bg-emerald-400 mx-auto mb-2 shadow-lg shadow-emerald-400/50" style={{ animation: 'pulse 2s infinite' }} />
                <p className="text-white/30 text-sm">待機中</p>
              </div>
            </div>
            <p className="text-white/20 text-xs tracking-widest">STANDBY</p>
          </div>
        )}

        {/* Active */}
        {status.status === 'active' && (
          <div className="space-y-5">
            {!iHavePressed ? (
              <button
                onClick={handlePress}
                className="w-full aspect-square rounded-3xl flex flex-col items-center justify-center gap-4 font-bold text-2xl transition-all active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  boxShadow: '0 0 60px rgba(99,102,241,0.5), 0 0 120px rgba(99,102,241,0.2)',
                  animation: 'pulse 1.5s infinite',
                }}
              >
                <span className="text-6xl">🙋</span>
                <span>担当する</span>
              </button>
            ) : (
              <div className="w-full aspect-square rounded-3xl flex flex-col items-center justify-center gap-4"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-6xl">⏳</span>
                <p className="text-white/40 font-semibold">応答済み</p>
              </div>
            )}
            <div className="bg-white/5 backdrop-blur border border-white/8 rounded-2xl px-4 py-3 flex items-center justify-between">
              <span className="text-white/40 text-sm">残り時間</span>
              <span className="text-white font-black text-xl tabular-nums">{status.remaining}秒</span>
            </div>
          </div>
        )}

        {/* Assigned */}
        {status.status === 'assigned' && status.winner && (
          <div className={`rounded-3xl p-8 text-center overflow-hidden relative ${
            isMyWin
              ? 'border border-emerald-400/25'
              : 'border border-white/10'
          }`}
            style={{
              background: isMyWin
                ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.08))'
                : 'rgba(255,255,255,0.04)',
            }}>
            {isMyWin ? (
              <>
                <div className="text-6xl mb-4">🎉</div>
                <p className="text-emerald-300 font-black text-2xl mb-2">あなたが担当！</p>
                <p className="text-white/40 text-sm">お客様をご案内してください</p>
              </>
            ) : (
              <>
                <div className="text-4xl mb-4">👤</div>
                <p className="text-white/40 text-xs tracking-widest uppercase mb-2">今回の担当</p>
                <p className="text-4xl font-black">{status.winner.name}</p>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
