'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { STAFF } from '@/lib/dispatch-config';

export default function DispatchPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'select' | 'staff'>('select');

  const goManager = () => {
    localStorage.setItem('dispatch_role', 'manager');
    router.push('/dispatch/manager');
  };

  const goStaff = (id: string, name: string) => {
    localStorage.setItem('dispatch_staff_id', id);
    localStorage.setItem('dispatch_staff_name', name);
    router.push('/dispatch/staff');
  };

  if (mode === 'staff') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-xs">
          <div className="text-center mb-8">
            <p className="text-indigo-400/60 text-xs tracking-[0.3em] uppercase mb-2">Staff Login</p>
            <h2 className="text-white text-2xl font-bold">あなたは誰ですか？</h2>
          </div>
          <div className="space-y-2.5">
            {STAFF.map(s => (
              <button
                key={s.id}
                onClick={() => goStaff(s.id, s.name)}
                className="w-full py-4 px-5 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all border border-white/10 hover:border-indigo-400/40 text-white font-semibold flex items-center justify-between group"
              >
                <span className="text-lg">{s.name}</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold tracking-wider ${
                  s.rank === 'A' ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' :
                  s.rank === 'B' ? 'bg-blue-400/20 text-blue-300 border border-blue-400/30' :
                  'bg-slate-400/20 text-slate-300 border border-slate-400/30'
                }`}>RANK {s.rank}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setMode('select')}
            className="mt-8 w-full text-white/30 text-sm hover:text-white/50 transition-colors"
          >
            ← 戻る
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xs text-center">
        <div className="mb-10">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center mx-auto mb-4 backdrop-blur">
            <span className="text-3xl">🚗</span>
          </div>
          <p className="text-indigo-400/60 text-xs tracking-[0.3em] uppercase mb-1">Matsushita Motors</p>
          <h1 className="text-white text-3xl font-bold">差配システム</h1>
        </div>

        <div className="space-y-3">
          <button
            onClick={goManager}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 transition-all text-white font-bold text-lg shadow-xl shadow-orange-500/25"
          >
            🎩 店長
          </button>
          <button
            onClick={() => setMode('staff')}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-95 transition-all text-white font-bold text-lg shadow-xl shadow-indigo-500/25"
          >
            👔 営業マン
          </button>
        </div>
      </div>
    </main>
  );
}
