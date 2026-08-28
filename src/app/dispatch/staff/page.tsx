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

// ファンファーレ：複数音符を1つのWAVに結合
function makeWinMelody(sr = 22050): string {
  // C5 D5 E5 G5 C6 - 明るく上昇するメロディ
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
  const prevStatusRef  = useRef<string>('idle');
  const audiosRef      = useRef<HTMLAudioElement[]>([]);
  const winAudioRef    = useRef<HTMLAudioElement | null>(null);
  const chimeTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const staffNameRef   = useRef('');

  useEffect(() => {
    const id   = localStorage.getItem('dispatch_staff_id') ?? '';
    const name = localStorage.getItem('dispatch_staff_name') ?? '';
    setStaffId(id);
    setStaffName(name);
    staffNameRef.current = name;
  }, []);

  const startAudio = useCallback(() => {
    if (audioReady) return;
    // Audio要素を作成
    audiosRef.current = CHIME_FREQS.map(freq => new Audio(makeWavUri(freq)));
    winAudioRef.current = new Audio(makeWinMelody());
    // ボタンを押した瞬間にチャイムを鳴らして動作確認
    audiosRef.current.forEach((audio, i) => {
      setTimeout(() => { audio.currentTime = 0; audio.play().catch(() => {}); }, i * 180);
    });
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

  // Register push subscription
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
      // 当選者だったらファンファーレ
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
    <main className="min-h-screen bg-[#07071a] flex flex-col items-center justify-center p-6 text-white select-none">
      <div className="w-full max-w-sm text-center space-y-8">

        <div>
          <p className="text-white/30 text-xs tracking-widest mb-1">差配システム</p>
          <h1 className="text-2xl font-black">{staffName || '---'}</h1>
          {pushOk === true  && <p className="text-green-400 text-xs mt-1">🔔 通知 ON</p>}
          {pushOk === false && <p className="text-red-400 text-xs mt-1">⚠️ 通知をオンにしてください</p>}
        </div>

        {!audioReady && (
          <button
            onClick={startAudio}
            className="w-full py-4 rounded-2xl bg-yellow-500 hover:bg-yellow-400 active:scale-95 transition-all text-black font-black text-lg shadow-lg shadow-yellow-500/30"
          >
            🔊 音を有効にする（必須）
          </button>
        )}
        {audioReady && <p className="text-green-400 text-xs">🔊 音 ON ✓</p>}

        {status.status === 'idle' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-36 h-36 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center text-5xl">🟢</div>
            <p className="text-white/40">待機中</p>
          </div>
        )}

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

        {status.status === 'assigned' && status.winner && (
          <div className={`rounded-3xl p-8 border ${
            isMyWin ? 'bg-green-500/15 border-green-400/25' : 'bg-white/5 border-white/10'
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
