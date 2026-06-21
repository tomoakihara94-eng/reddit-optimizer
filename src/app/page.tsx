'use client';

import { useState, useEffect } from 'react';

const FREE_LIMIT = 100;
const STORAGE_KEY = 'matsushita_motors_usage';

interface UsageData {
  count: number;
  month: string;
}

interface GenerateResult {
  optimizedTitle: string;
  optimizedBody: string;
  improvements: string[];
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getUsage(): UsageData {
  if (typeof window === 'undefined') return { count: 0, month: currentMonth() };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { count: 0, month: currentMonth() };
    const data: UsageData = JSON.parse(raw);
    if (data.month !== currentMonth()) return { count: 0, month: currentMonth() };
    return data;
  } catch {
    return { count: 0, month: currentMonth() };
  }
}

function incrementUsage(): UsageData {
  const next = { count: getUsage().count + 1, month: currentMonth() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

const MEDIA_OPTIONS = [
  { value: 'instagram', label: 'Instagram（投稿文・ハッシュタグ自動生成）' },
  { value: 'website', label: '自社サイト（ブログ記事・お知らせ用）' },
  { value: 'carsensor', label: 'カーセンサー（グレード補記・アピールポイント提案）' },
  { value: 'goonet', label: 'グーネット（車両状態・おすすめコメント生成）' },
];

const MEDIA_RESULT_LABELS: Record<string, { title: string; body: string }> = {
  instagram: { title: '投稿文', body: 'ハッシュタグ' },
  website: { title: '記事タイトル', body: '本文' },
  carsensor: { title: 'グレード補記', body: 'アピールポイント' },
  goonet: { title: '車両状態説明', body: 'おすすめコメント' },
};

export default function Home() {
  const [media, setMedia] = useState('instagram');
  const [carModel, setCarModel] = useState('');
  const [features, setFeatures] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [resultMedia, setResultMedia] = useState('instagram');
  const [error, setError] = useState('');
  const [usage, setUsage] = useState<UsageData>({ count: 0, month: '' });
  const [copied, setCopied] = useState<'title' | 'body' | null>(null);

  useEffect(() => {
    setUsage(getUsage());
  }, []);

  const remaining = Math.max(0, FREE_LIMIT - usage.count);
  const isLimitReached = usage.count >= FREE_LIMIT;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!carModel.trim() || isLimitReached) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ media, carModel, features }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '生成に失敗しました');
      setResult(data);
      setResultMedia(media);
      setUsage(incrementUsage());
    } catch (err) {
      setError(err instanceof Error ? err.message : '文章の生成に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string, type: 'title' | 'body') {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  const resultLabels = MEDIA_RESULT_LABELS[resultMedia] ?? { title: '生成テキスト①', body: '生成テキスト②' };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">松下モータース 社員用投稿最適化ツール</h1>
              <p className="text-xs text-gray-500">AI文章自動生成 — 社内専用</p>
            </div>
          </div>
          <div className={`text-sm px-3 py-1.5 rounded-full font-medium ${
            isLimitReached
              ? 'bg-red-100 text-red-700'
              : remaining <= 10
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-green-100 text-green-700'
          }`}>
            {isLimitReached ? '残り0回' : `残り${remaining}回`}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Input card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-5">車両情報を入力</h2>
          {isLimitReached ? (
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-5 text-white text-center">
              <p className="font-bold text-lg mb-1">今月の利用上限（{FREE_LIMIT}回）に達しました</p>
              <p className="text-sm opacity-90 mb-2">管理者にお問い合わせください</p>
              <p className="text-xs opacity-70">毎月1日にリセットされます</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">投稿・掲載媒体</label>
                <select
                  value={media}
                  onChange={e => setMedia(e.target.value)}
                  style={{ color: '#111827' }}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white"
                >
                  {MEDIA_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  車種・グレード <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={carModel}
                  onChange={e => setCarModel(e.target.value)}
                  placeholder="例: トヨタ アルファード 2.5S Aパッケージ 2022年式"
                  maxLength={200}
                  style={{ color: '#111827' }}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{carModel.length}/200</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  車両の特徴・アピールポイント <span className="text-gray-400 font-normal">（任意）</span>
                </label>
                <textarea
                  value={features}
                  onChange={e => setFeatures(e.target.value)}
                  placeholder={`例: 走行距離2.8万km、禁煙車、純正ナビ・バックカメラ付き、両側パワースライドドア、ワンオーナー、車検2年付き`}
                  rows={4}
                  style={{ color: '#111827' }}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !carModel.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    生成中...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    文章を生成する
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Result card */}
        {result && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-gray-900">生成された文章</h2>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{resultLabels.title}</span>
                <button
                  onClick={() => copyToClipboard(result.optimizedTitle, 'title')}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  {copied === 'title' ? (
                    <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>コピー済み!</>
                  ) : (
                    <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>コピー</>
                  )}
                </button>
              </div>
              <p className="text-gray-900 font-medium text-sm leading-relaxed whitespace-pre-wrap">{result.optimizedTitle}</p>
            </div>

            {result.optimizedBody && result.optimizedBody !== '（なし）' && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{resultLabels.body}</span>
                  <button
                    onClick={() => copyToClipboard(result.optimizedBody, 'body')}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copied === 'body' ? (
                      <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>コピー済み!</>
                    ) : (
                      <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>コピー</>
                    )}
                  </button>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{result.optimizedBody}</p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">生成のポイント</h3>
              <ul className="space-y-2.5">
                {result.improvements.map((imp, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-700">
                    <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400">社内専用ツール · 月{FREE_LIMIT}回 · 毎月1日リセット</p>
      </main>
    </div>
  );
}
