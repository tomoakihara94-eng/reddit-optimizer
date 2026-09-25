'use client';

import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { ArticleEvent } from '../api/article/route';

type Topic = 'regret' | 'minorchange';

const TOPICS: { id: Topic; label: string; desc: string; icon: string }[] = [
  {
    id: 'regret',
    label: '後悔しないために',
    desc: '評判・レビューと「後悔する人／おすすめな人」を販売店目線で解説',
    icon: '✅',
  },
  {
    id: 'minorchange',
    label: 'マイナーチェンジで何が変わった？',
    desc: '前期・後期の違いを比較し、中古で買うならどっちかを解説',
    icon: '🔄',
  },
];

type Parsed = { title: string; body: string; meta: string };

// ストリーム途中のテキストも含めて「# タイトル」「本文」「META: 説明文」に分ける
function parseArticle(raw: string): Parsed {
  let text = raw.replace(/^\s+/, '');
  let title = '';
  const titleMatch = text.match(/^# (.+)\n?/);
  if (titleMatch) {
    title = titleMatch[1].trim();
    text = text.slice(titleMatch[0].length);
  }
  let meta = '';
  const metaMatch = text.match(/\n*META[:：]\s*(.*)\s*$/);
  if (metaMatch) {
    meta = metaMatch[1].trim();
    text = text.slice(0, metaMatch.index);
  }
  return { title, body: text.trim(), meta };
}

// ── マークダウン → HTML（ブログ貼り付け用） ────────────────────────────
function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inlineHtml(s: string): string {
  return escapeHtml(s).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

function splitRow(line: string): string[] {
  return line.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
}

function isTableSeparator(line: string): boolean {
  return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);
}

const IMAGE_LINE = /^\s*\[\[IMAGE[:：]\s*(.+?)\s*\|\s*(.+?)\s*\]\]\s*$/;

function imageFileName(n: number): string {
  return `article-image-${n}.jpg`;
}

type Block =
  | { kind: 'h2' | 'h3' | 'p'; text: string }
  | { kind: 'image'; n: number; alt: string; scene: string }
  | { kind: 'ul' | 'ol'; items: string[] }
  | { kind: 'table'; head: string[]; rows: string[][] };

function toBlocks(md: string): Block[] {
  const lines = md.split('\n');
  const blocks: Block[] = [];
  let imageCount = 0;
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') { i++; continue; }
    const img = line.match(IMAGE_LINE);
    if (img) { blocks.push({ kind: 'image', n: ++imageCount, alt: img[1], scene: img[2] }); i++; continue; }
    // ストリーム途中で閉じていない画像指定行は表示しない
    if (line.trimStart().startsWith('[[')) { i++; continue; }
    if (line.startsWith('### ')) { blocks.push({ kind: 'h3', text: line.slice(4) }); i++; continue; }
    if (line.startsWith('## '))  { blocks.push({ kind: 'h2', text: line.slice(3) }); i++; continue; }
    if (/^\s*[-*・] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*・] /.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*・] /, '')); i++; }
      blocks.push({ kind: 'ul', items });
      continue;
    }
    if (/^\s*\d+[.)] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)] /.test(lines[i])) { items.push(lines[i].replace(/^\s*\d+[.)] /, '')); i++; }
      blocks.push({ kind: 'ol', items });
      continue;
    }
    if (line.trim().startsWith('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const head = splitRow(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith('|')) { rows.push(splitRow(lines[i])); i++; }
      blocks.push({ kind: 'table', head, rows });
      continue;
    }
    blocks.push({ kind: 'p', text: line });
    i++;
  }
  return blocks;
}

function toHtml(p: Parsed): string {
  const out: string[] = [];
  for (const b of toBlocks(p.body)) {
    switch (b.kind) {
      case 'h2': out.push(`<h2>${inlineHtml(b.text)}</h2>`); break;
      case 'h3': out.push(`<h3>${inlineHtml(b.text)}</h3>`); break;
      case 'p':  out.push(`<p>${inlineHtml(b.text)}</p>`); break;
      case 'image': out.push(`<figure><img src="${imageFileName(b.n)}" alt="${escapeHtml(b.alt).replace(/"/g, '&quot;')}" width="1200" height="675" loading="lazy"></figure>`); break;
      case 'ul':
      case 'ol': out.push(`<${b.kind}>\n${b.items.map(it => `  <li>${inlineHtml(it)}</li>`).join('\n')}\n</${b.kind}>`); break;
      case 'table':
        out.push(`<table>\n  <thead><tr>${b.head.map(c => `<th>${inlineHtml(c)}</th>`).join('')}</tr></thead>\n  <tbody>\n${b.rows.map(r => `    <tr>${r.map(c => `<td>${inlineHtml(c)}</td>`).join('')}</tr>`).join('\n')}\n  </tbody>\n</table>`);
        break;
    }
  }
  return out.join('\n');
}

function toMarkdown(p: Parsed): string {
  let n = 0;
  const body = p.body.split('\n').map(line => {
    const img = line.match(IMAGE_LINE);
    return img ? `![${img[1]}](${imageFileName(++n)})` : line;
  }).join('\n');
  return `# ${p.title}\n\n${body}`;
}

function toPlainText(p: Parsed): string {
  return p.body.split('\n').filter(line => !IMAGE_LINE.test(line)).join('\n').replace(/\n{3,}/g, '\n\n').replace(/^#{2,3} /gm, '■ ').replace(/\*\*([^*]+)\*\*/g, '$1');
}

// ── 表示用レンダラー ──────────────────────────────────────────────────
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') && part.length > 4
          ? <strong key={i} className="font-bold text-gray-900 bg-gradient-to-t from-amber-100 from-40% to-transparent to-40%">{part.slice(2, -2)}</strong>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}

type ImageState = { status: 'loading' } | { status: 'done'; src: string } | { status: 'error'; error: string };

function downloadDataUrl(src: string, filename: string) {
  const a = document.createElement('a');
  a.href = src;
  a.download = filename;
  a.click();
}

function ArticleImage({ block, state, onRetry }: { block: Extract<Block, { kind: 'image' }>; state?: ImageState; onRetry: () => void }) {
  return (
    <figure className="my-6">
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 ring-1 ring-gray-200/70">
        {state?.status === 'done' ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={state.src} alt={block.alt} className="w-full h-full object-cover" />
            <div className="absolute top-2 right-2 flex gap-1.5">
              <button type="button" onClick={onRetry} className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-black/55 hover:bg-black/70 text-white backdrop-blur cursor-pointer">↻ 作り直す</button>
              <button type="button" onClick={() => downloadDataUrl(state.src, imageFileName(block.n))} className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-black/55 hover:bg-black/70 text-white backdrop-blur cursor-pointer">保存</button>
            </div>
          </>
        ) : state?.status === 'error' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
            <p className="text-xs text-gray-500">{state.error}</p>
            <button type="button" onClick={onRetry} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white ring-1 ring-gray-200 hover:ring-indigo-300 text-gray-700 cursor-pointer">↻ もう一度</button>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400 animate-pulse">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs">画像 {block.n} を生成中…</span>
          </div>
        )}
      </div>
      <figcaption className="mt-2 text-xs text-gray-400 flex gap-2">
        <span className="font-bold text-gray-300 tabular-nums">{String(block.n).padStart(2, '0')}</span>
        {block.alt}
      </figcaption>
    </figure>
  );
}

function ArticleBody({ markdown, images, onRetryImage }: { markdown: string; images: Record<number, ImageState>; onRetryImage: (b: Extract<Block, { kind: 'image' }>) => void }) {
  const blocks = useMemo(() => toBlocks(markdown), [markdown]);
  return (
    <div className="text-[15px] text-gray-700 leading-[1.9]">
      {blocks.map((b, i) => {
        switch (b.kind) {
          case 'h2':
            return (
              <h2 key={i} className="text-lg sm:text-xl font-bold text-gray-900 mt-10 mb-4 pl-3.5 py-1 border-l-4 border-indigo-500 leading-snug">
                <Inline text={b.text} />
              </h2>
            );
          case 'h3':
            return <h3 key={i} className="text-base font-bold text-gray-900 mt-6 mb-2"><Inline text={b.text} /></h3>;
          case 'p':
            return <p key={i} className="mb-4"><Inline text={b.text} /></p>;
          case 'image':
            return <ArticleImage key={i} block={b} state={images[b.n]} onRetry={() => onRetryImage(b)} />;
          case 'ul':
            return (
              <ul key={i} className="mb-5 space-y-1.5 bg-slate-50 rounded-xl px-5 py-4">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-2.5">
                    <span className="mt-[0.7em] w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                    <span><Inline text={it} /></span>
                  </li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={i} className="mb-5 space-y-1.5 bg-slate-50 rounded-xl px-5 py-4">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-2.5">
                    <span className="text-indigo-500 font-bold tabular-nums shrink-0">{j + 1}.</span>
                    <span><Inline text={it} /></span>
                  </li>
                ))}
              </ol>
            );
          case 'table':
            return (
              <div key={i} className="mb-5 overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>{b.head.map((c, j) => <th key={j} className="px-3 py-2 text-left font-bold text-gray-900 whitespace-nowrap"><Inline text={c} /></th>)}</tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, j) => (
                      <tr key={j} className="border-t border-gray-100">
                        {r.map((c, k) => <td key={k} className="px-3 py-2 align-top"><Inline text={c} /></td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
        }
      })}
    </div>
  );
}

type CopyKind = 'html' | 'markdown' | 'text' | 'title' | 'meta';

export default function ArticlePage() {
  const [carName, setCarName]               = useState('');
  const [carType, setCarType]               = useState('');
  const [ownPerspective, setOwnPerspective] = useState('');
  const [topic, setTopic]                   = useState<Topic>('regret');
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState('');
  const [raw, setRaw]                       = useState('');
  const [status, setStatus]                 = useState('');
  const [facts, setFacts]                   = useState('');
  const [copied, setCopied]                 = useState<CopyKind | null>(null);
  const [images, setImages]                 = useState<Record<number, ImageState>>({});
  const resultRef                           = useRef<HTMLDivElement>(null);
  const abortRef                            = useRef<AbortController | null>(null);
  const requestedRef                        = useRef<Set<number>>(new Set());
  const carRef                              = useRef({ carName: '', carType: '', imageHint: '' });

  const parsed = useMemo(() => parseArticle(raw), [raw]);
  const charCount = parsed.body.split('\n').filter(l => !l.trimStart().startsWith('[[')).join('').replace(/[#*|\-\s]/g, '').length;
  const done = !loading && parsed.body.length > 0;
  const imageBlocks = useMemo(
    () => toBlocks(parsed.body).filter((b): b is Extract<Block, { kind: 'image' }> => b.kind === 'image'),
    [parsed.body],
  );
  const readyImages = imageBlocks.filter(b => images[b.n]?.status === 'done');

  const requestImage = useCallback(async (b: Extract<Block, { kind: 'image' }>) => {
    setImages(prev => ({ ...prev, [b.n]: { status: 'loading' } }));
    try {
      const res = await fetch('/api/article/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...carRef.current, scene: b.scene }),
      });
      const data = await res.json().catch(() => ({})) as { mimeType?: string; data?: string; error?: string };
      if (!res.ok || !data.data) throw new Error(data.error ?? `画像生成に失敗しました（${res.status}）`);
      setImages(prev => ({ ...prev, [b.n]: { status: 'done', src: `data:${data.mimeType ?? 'image/jpeg'};base64,${data.data}` } }));
    } catch (err) {
      setImages(prev => ({ ...prev, [b.n]: { status: 'error', error: err instanceof Error ? err.message : '画像生成に失敗しました' } }));
    }
  }, []);

  // 画像指定の行が届いたものから順に生成を始める
  useEffect(() => {
    for (const b of imageBlocks) {
      if (requestedRef.current.has(b.n)) continue;
      requestedRef.current.add(b.n);
      void requestImage(b);
    }
  }, [imageBlocks, requestImage]);

  function handleDownloadAll() {
    readyImages.forEach((b, i) => {
      const s = images[b.n];
      if (s?.status === 'done') setTimeout(() => downloadDataUrl(s.src, imageFileName(b.n)), i * 300);
    });
  }

  async function handleGenerate() {
    if (!carName.trim() || loading) return;
    setLoading(true);
    setError('');
    setRaw('');
    setStatus('');
    setFacts('');
    setImages({});
    requestedRef.current = new Set();
    carRef.current = { carName: carName.trim(), carType: carType.trim(), imageHint: '' };
    const ac = new AbortController();
    abortRef.current = ac;
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);

    const base = { carName: carName.trim(), carType: carType.trim(), ownPerspective: ownPerspective.trim(), topic };

    // NDJSON のイベントを1つずつ受け取る。エラーイベントが来たら例外にする
    async function streamEvents(payload: object, onEvent: (e: ArticleEvent) => void) {
      const res = await fetch('/api/article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: ac.signal,
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({} as { error?: string }));
        throw new Error(data.error ?? `サーバーエラー (${res.status})`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          const e = JSON.parse(line) as ArticleEvent;
          if (e.type === 'error') throw new Error(e.text);
          onEvent(e);
        }
      }
    }

    try {
      let researched = '';
      await streamEvents({ ...base, phase: 'research' }, e => {
        if (e.type === 'status') setStatus(e.text);
        else if (e.type === 'facts') {
          researched = e.text;
          setFacts(e.text);
          carRef.current.imageHint = e.imageHint;
        }
      });
      if (!researched) throw new Error('調査結果を取得できませんでした。もう一度お試しください');

      setStatus('調べた事実をもとに記事を書いています…');
      let article = '';
      await streamEvents({ ...base, phase: 'write', facts: researched }, e => {
        if (e.type === 'delta') {
          article += e.text;
          setRaw(article);
        }
      });
    } catch (err) {
      if (ac.signal.aborted) return;
      setError(err instanceof Error ? err.message : '生成に失敗しました');
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function handleStop() {
    abortRef.current?.abort();
  }

  async function handleCopy(kind: CopyKind) {
    const text =
      kind === 'html'     ? toHtml(parsed) :
      kind === 'markdown' ? toMarkdown(parsed) :
      kind === 'text'     ? toPlainText(parsed) :
      kind === 'title'    ? parsed.title :
                            parsed.meta;
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    setTimeout(() => setCopied(c => (c === kind ? null : c)), 1800);
  }

  const inputClass = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-[15px] text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-colors';

  return (
    <div className="min-h-screen page-bg">

      {/* ── ヘッダー ── */}
      <header className="header-mesh sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-1 text-slate-400 hover:text-white text-sm font-medium transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            戻る
          </Link>
          <div className="w-px h-4 bg-white/15" />
          <p className="text-sm font-bold text-white">バズ記事 自動生成</p>
          <span className="ml-auto text-[10px] font-semibold text-slate-500 bg-slate-800/60 border border-slate-700/60 rounded-full px-3 py-1">社内専用</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* ── タイトル ── */}
        <div>
          <p className="text-[11px] font-bold text-indigo-400 tracking-[0.2em] mb-2">AI ARTICLE GENERATOR</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">車種別 バズ記事 自動生成</h1>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            車種・型式・松下モータースならではの視点を入れると、販売店目線のSEO記事（3,000〜4,000字）と、その車種の画像5枚を作ります。
          </p>
        </div>

        {/* ── 入力フォーム ── */}
        <div className="bg-white rounded-3xl shadow-xl shadow-black/20 p-5 sm:p-7 space-y-6">

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-gray-600 mb-1.5">
                車種名 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={carName}
                onChange={e => setCarName(e.target.value)}
                placeholder="例: 三菱 デリカミニ"
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-600 mb-1.5">
                型式・世代 <span className="text-gray-400 font-normal">推奨</span>
              </label>
              <input
                type="text"
                value={carType}
                onChange={e => setCarType(e.target.value)}
                placeholder="例: B34A / 40系 / 2023年〜"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-600">
                松下モータースの独自の視点 <span className="text-gray-400 font-normal">記事の軸になります</span>
              </label>
              <span className="text-[11px] text-gray-400 tabular-nums">{ownPerspective.length}字</span>
            </div>
            <textarea
              value={ownPerspective}
              onChange={e => setOwnPerspective(e.target.value)}
              placeholder={'例:\n・当店では年間○台ほど販売。グリーン系が約7割\n・雪が少ない地域なのに約3割のお客様が4WDを選ぶ\n・「見た瞬間に気に入った」と即決するお客様が多い'}
              rows={6}
              className={`${inputClass} resize-y leading-relaxed`}
            />
            <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">
              販売台数・人気の色やグレード・お客様の声・意外な売れ方などを箇条書きで。<strong className="text-gray-500">ここに書いた数字やエピソードだけ</strong>が「当店では」として記事に使われます（AIが実績を創作することはありません）。
            </p>
          </div>

          {/* ── 記事テーマ ── */}
          <div>
            <p className="text-xs font-bold text-gray-600 mb-2">記事テーマ</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TOPICS.map(t => {
                const active = topic === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTopic(t.id)}
                    aria-pressed={active}
                    className={`text-left p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      active ? 'border-indigo-500 bg-indigo-50/70' : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl shrink-0">{t.icon}</span>
                      <div className="flex-1">
                        <p className={`text-sm font-bold mb-1 ${active ? 'text-indigo-700' : 'text-gray-800'}`}>{t.label}</p>
                        <p className="text-[12px] text-gray-500 leading-relaxed">{t.desc}</p>
                      </div>
                      <span className={`shrink-0 w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center ${active ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'}`}>
                        {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── 生成ボタン ── */}
          {loading ? (
            <button
              type="button"
              onClick={handleStop}
              className="w-full py-4 rounded-2xl font-bold text-base bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              執筆中… {charCount > 0 && <span className="tabular-nums">{charCount.toLocaleString()}字</span>}
              <span className="text-xs font-medium text-gray-400 ml-1">（タップで中止）</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!carName.trim()}
              className="w-full py-4 rounded-2xl font-bold text-base transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-lg shadow-indigo-500/30"
            >
              {raw ? '↻ もう一度生成する' : '✍️ 記事を生成する'}
            </button>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}
        </div>

        {/* ── 結果 ── */}
        <div ref={resultRef} className="scroll-mt-20">
          {(loading || raw) && (
            <div className="bg-white rounded-3xl shadow-xl shadow-black/20 overflow-hidden">

              {/* ツールバー */}
              <div className="sticky top-[57px] z-[5] bg-white/95 backdrop-blur border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${done ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-600'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${done ? 'bg-emerald-500' : 'bg-indigo-500 animate-pulse'}`} />
                  {done ? '完成' : '執筆中'}
                </span>
                <span className="text-xs text-gray-400 tabular-nums">{charCount.toLocaleString()}字</span>
                {imageBlocks.length > 0 && (
                  <span className="text-xs text-gray-400 tabular-nums">画像 {readyImages.length}/{imageBlocks.length}</span>
                )}
                <div className="ml-auto flex gap-1.5 flex-wrap">
                  {readyImages.length > 0 && (
                    <button type="button" onClick={handleDownloadAll} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer">
                      画像を一括保存
                    </button>
                  )}
                  {([
                    ['html', 'HTMLコピー'],
                    ['markdown', 'Markdown'],
                    ['text', 'テキスト'],
                  ] as const).map(([k, label]) => (
                    <button
                      key={k}
                      type="button"
                      disabled={!done}
                      onClick={() => handleCopy(k)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                        copied === k
                          ? 'bg-emerald-500 text-white'
                          : k === 'html' ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {copied === k ? '✓ コピー済み' : label}
                    </button>
                  ))}
                </div>
              </div>

              <article className="px-5 sm:px-10 py-8">
                {parsed.title ? (
                  <div className="group flex items-start gap-2 mb-6">
                    <h1 className="flex-1 text-xl sm:text-2xl font-extrabold text-gray-900 leading-snug">{parsed.title}</h1>
                    {done && (
                      <button type="button" onClick={() => handleCopy('title')} className="shrink-0 text-[11px] font-bold text-gray-400 hover:text-indigo-600 px-2 py-1 rounded-md hover:bg-indigo-50 cursor-pointer">
                        {copied === 'title' ? '✓' : 'コピー'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 mb-6">
                    <div className="h-6 bg-gray-100 rounded-lg animate-pulse w-4/5" />
                    <div className="h-3 bg-gray-100 rounded-full animate-pulse w-full" />
                    <div className="h-3 bg-gray-100 rounded-full animate-pulse w-11/12" />
                    <div className="h-3 bg-gray-100 rounded-full animate-pulse w-2/3" />
                    <p className="text-xs text-gray-500 pt-2 truncate">{status || '準備しています…'}</p>
                    <p className="text-[11px] text-gray-400">正確さのため、先にWebで型式・発売時期・変更履歴を調べてから書きます（1〜2分ほど）</p>
                  </div>
                )}

                <ArticleBody markdown={parsed.body} images={images} onRetryImage={requestImage} />
                {loading && parsed.body && <span className="inline-block w-2 h-5 bg-indigo-500 animate-pulse align-middle" />}

                {parsed.meta && (
                  <div className="mt-10 rounded-2xl border border-dashed border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[11px] font-bold text-gray-500">メタディスクリプション（{parsed.meta.length}字）</p>
                      {done && (
                        <button type="button" onClick={() => handleCopy('meta')} className="text-[11px] font-bold text-gray-400 hover:text-indigo-600 cursor-pointer">
                          {copied === 'meta' ? '✓ コピー済み' : 'コピー'}
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{parsed.meta}</p>
                  </div>
                )}
                {facts && (
                  <details className="mt-6 rounded-2xl bg-slate-50 ring-1 ring-slate-200/70 group">
                    <summary className="cursor-pointer list-none px-4 py-3 flex items-center gap-2 text-xs font-bold text-slate-600">
                      <span className="transition-transform group-open:rotate-90">▶</span>
                      調査メモ（記事の根拠と情報源）— 公開前の事実確認に使ってください
                    </summary>
                    <div className="px-4 pb-4 text-[13px] text-slate-600 leading-relaxed whitespace-pre-wrap break-words">{facts}</div>
                  </details>
                )}
              </article>
            </div>
          )}
        </div>

        {done && (
          <p className="text-[11px] text-slate-500 text-center leading-relaxed">
            公開前に、価格・燃費などの数値とマイナーチェンジ時期、画像の車が正しいか確認してください。<br />
            HTMLコピーの画像は article-image-1.jpg のようなファイル名で入っています。「画像を一括保存」したファイルをブログにアップロードして差し替えてください。
          </p>
        )}
      </main>
    </div>
  );
}
