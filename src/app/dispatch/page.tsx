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
      <main className="min-h-screen bg-[#07071a] flex flex-col items-center justify-center p-6">
        <h2 className="text-white text-xl font-bold mb-8">あなたは誰ですか？</h2>
        <div className="w-full max-w-xs space-y-3">
          {STAFF.map(s => (
            <button
              key={s.id}
              onClick={() => goStaff(s.id, s.name)}
              className="w-full py-4 rounded-2xl bg-indigo-700 hover:bg-indigo-600 active:scale-95 transition-all text-white font-bold text-lg flex items-center justify-between px-6"
            >
              <span>{s.name}</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-black ${
                s.rank === 'A' ? 'bg-yellow-400 text-black' :
                s.rank === 'B' ? 'bg-blue-400 text-white' :
                'bg-slate-500 text-white'
              }`}>Rank {s.rank}</span>
            </button>
          ))}
        </div>
        <button onClick={() => setMode('select')} className="mt-8 text-white/30 text-sm">← 戻る</button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07071a] flex flex-col items-center justify-center p-6 gap-6">
      <div className="text-center mb-4">
        <p className="text-white/30 text-xs tracking-widest mb-2">差配システム</p>
        <h1 className="text-white text-3xl font-black">役割を選択</h1>
      </div>
      <div className="w-full max-w-xs space-y-4">
        <button
          onClick={goManager}
          className="w-full py-6 rounded-2xl bg-orange-500 hover:bg-orange-400 active:scale-95 transition-all text-white font-black text-xl shadow-xl shadow-orange-500/30"
        >
          🎩 店長
        </button>
        <button
          onClick={() => setMode('staff')}
          className="w-full py-6 rounded-2xl bg-indigo-700 hover:bg-indigo-600 active:scale-95 transition-all text-white font-black text-xl shadow-xl shadow-indigo-500/30"
        >
          👔 営業マン
        </button>
      </div>
    </main>
  );
}
