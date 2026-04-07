'use client';

import { useState, useEffect } from 'react';

const FREE_LIMIT = 5;
const STORAGE_KEY = 'reddit_optimizer_usage';

interface UsageData {
  count: number;
  month: string;
}

interface OptimizeResult {
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

const POST_TYPES = ['Text', 'Link', 'Image', 'Video', 'Poll', 'AMA'];
const POPULAR_SUBREDDITS = [
  'AskReddit', 'worldnews', 'technology', 'programming', 'gaming',
  'science', 'todayilearned', 'showerthoughts', 'LifeProTips', 'explainlikeimfive',
];

export default function Home() {
  const [subreddit, setSubreddit] = useState('');
  const [postType, setPostType] = useState('Text');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizeResult | null>(null);
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
    if (!title.trim() || isLimitReached) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subreddit, postType, title, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setResult(data);
      setUsage(incrementUsage());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to optimize post');
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string, type: 'title' | 'body') {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 0C4.478 0 0 4.478 0 10s4.478 10 10 10 10-4.478 10-10S15.522 0 10 0zm6.326 10.184a1.334 1.334 0 00-2.252-.954c-1.12-.74-2.654-1.218-4.354-1.286l.74-3.483 2.41.513a.946.946 0 101.02-.953.952.952 0 00-.881.6l-2.692-.574a.236.236 0 00-.28.175l-.826 3.887c-1.728.054-3.287.532-4.42 1.282a1.334 1.334 0 10-1.503 2.146 2.64 2.64 0 000 .378c0 1.915 2.228 3.468 4.977 3.468s4.977-1.553 4.977-3.468a2.7 2.7 0 000-.374 1.336 1.336 0 00.084-2.357zM6.652 11.13a.947.947 0 110 1.895.947.947 0 010-1.895zm6.682 2.51c-.583.583-1.702.626-2.336.626-.636 0-1.757-.046-2.337-.626a.236.236 0 01.334-.334c.374.374 1.174.505 2.003.505.828 0 1.63-.13 2.003-.505a.236.236 0 01.334.334zm-.198-1.568a.947.947 0 110-1.895.947.947 0 010 1.895z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Reddit Post Optimizer</h1>
              <p className="text-xs text-gray-500">AI-powered post enhancement</p>
            </div>
          </div>
          <div className={`text-sm px-3 py-1.5 rounded-full font-medium ${
            isLimitReached
              ? 'bg-red-100 text-red-700'
              : remaining <= 2
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-green-100 text-green-700'
          }`}>
            {isLimitReached ? '0 uses left' : `${remaining} free use${remaining !== 1 ? 's' : ''} left`}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Input card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Your Post</h2>
          {isLimitReached ? (
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-5 text-white text-center">
              <p className="font-bold text-lg mb-1">You&apos;ve used all 5 free optimizations</p>
              <p className="text-sm opacity-90 mb-4">Upgrade to Pro for unlimited optimizations</p>
              <button
                onClick={() => { window.location.href = 'https://buy.stripe.com/6oUaEW9cx6y589IgI77AI01'; }}
                className="inline-block bg-white text-orange-600 font-bold px-6 py-2.5 rounded-lg text-sm hover:bg-orange-50 transition-colors cursor-pointer"
              >
                Upgrade to Pro — $9/month
              </button>
              <p className="text-xs opacity-70 mt-3">Free uses reset on the 1st of each month</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Subreddit</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">r/</span>
                    <input
                      type="text"
                      value={subreddit}
                      onChange={e => setSubreddit(e.target.value)}
                      placeholder="e.g. AskReddit"
                      list="subreddits"
                      style={{ color: '#111827' }}
                      className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                    />
                    <datalist id="subreddits">
                      {POPULAR_SUBREDDITS.map(s => <option key={s} value={s} />)}
                    </datalist>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Post Type</label>
                  <select
                    value={postType}
                    onChange={e => setPostType(e.target.value)}
                    style={{ color: '#111827' }}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white"
                  >
                    {POST_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Write your post title..."
                  maxLength={300}
                  style={{ color: '#111827' }}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{title.length}/300</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Body <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Write your post body..."
                  rows={5}
                  style={{ color: '#111827' }}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Optimizing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Optimize My Post
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
              <h2 className="text-base font-semibold text-gray-900">Optimized Post</h2>
            </div>

            {/* Optimized title */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</span>
                <button
                  onClick={() => copyToClipboard(result.optimizedTitle, 'title')}
                  className="text-xs text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  {copied === 'title' ? (
                    <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Copied!</>
                  ) : (
                    <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy</>
                  )}
                </button>
              </div>
              <p className="text-gray-900 font-medium text-sm leading-relaxed">{result.optimizedTitle}</p>
            </div>

            {/* Optimized body */}
            {result.optimizedBody && result.optimizedBody !== '(no body)' && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Body</span>
                  <button
                    onClick={() => copyToClipboard(result.optimizedBody, 'body')}
                    className="text-xs text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copied === 'body' ? (
                      <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Copied!</>
                    ) : (
                      <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy</>
                    )}
                  </button>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{result.optimizedBody}</p>
              </div>
            )}

            {/* Improvements */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">What we improved</h3>
              <ul className="space-y-2.5">
                {result.improvements.map((imp, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-700">
                    <span className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400">
          Free tier: {FREE_LIMIT} optimizations/month · Resets on the 1st of each month
        </p>
        <p className="text-center text-xs text-gray-400">
          <a href="/legal" className="hover:text-gray-600 underline">特定商取引法に基づく表記</a>
        </p>
      </main>
    </div>
  );
}
