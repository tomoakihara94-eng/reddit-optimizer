'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { CAR_DATA, COLORS, OPTION_GROUPS } from '@/lib/car-data';

// ── Types ──────────────────────────────────────────────────────────────
type Mode = 'multi' | 'grade' | 'reply' | 'photo';

interface MultiResult {
  mode: 'multi';
  instagram: string;
  instagramHashtags: string;
  blogTitle: string;
  blog: string;
}

interface GradeResult {
  mode: 'grade';
  gradeNote: string;
  appealPoints: string[];
}

interface ReplyResult {
  mode: 'reply';
  subject: string;
  body: string;
}

interface PhotoResult {
  mode: 'photo';
  chassisNumber: string;
  modelCode: string;
  colorCode: string;
  trimCode: string;
  year: string;
  grade: string;
  equipment: string[];
  notes: string;
}

interface PhotoFile {
  name: string;
  base64: string;
  mediaType: string;
  preview: string;
}

type Result = MultiResult | GradeResult | ReplyResult | PhotoResult;

// ── Constants ──────────────────────────────────────────────────────────
const MODES: { id: Mode; label: string; desc: string; icon: string }[] = [
  {
    id: 'multi',
    label: 'Instagram ＋ 自社ブログ 投稿文生成',
    desc: 'バズる Instagram 投稿文＋SEO最適化ブログ記事を1入力で同時生成',
    icon: '📢',
  },
  {
    id: 'grade',
    label: 'カーセンサー グレード補記・アピール提案',
    desc: '検索に引っかかりやすいオプション・限定装備の魅力を抽出',
    icon: '🔍',
  },
  {
    id: 'reply',
    label: '問い合わせ返信メール 自動下書き',
    desc: 'お客様の質問文を貼り付けると最適な返答文案を作成',
    icon: '✉️',
  },
  {
    id: 'photo',
    label: '④【開発中】写真から車両情報・装備を自動抽出',
    desc: 'コーションプレート・内装・外観写真をAIが解析し、車台番号・グレード・装備を自動読み取り',
    icon: '📷',
  },
];

const MULTI_TABS = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'blog',      label: '自社ブログ' },
];

// ── カーセンサー 装備チェック項目 ───────────────────────────────────────────
const CARSENSOR_CATEGORIES = [
  {
    id: 'interior',
    label: 'インテリア',
    color: 'blue',
    items: [
      'キーレス', 'スマートキー', 'パワーウインドウ', '後席モニター',
      'ベンチシート', '3列シート', 'ウォークスルー', '電動シート',
      'シートエアコン', 'シートヒーター', 'フルフラットシート', 'オットマン', '本革シート',
    ],
  },
  {
    id: 'exterior',
    label: 'エクステリア',
    color: 'green',
    items: [
      'ヘッドライト：LED', 'フロントフォグランプ', 'サンルーフ・ガラスルーフ',
      'ルーフレール', 'フルエアロ', 'アルミホイール', 'ローダウン', 'リフトアップ',
      'スライドドア：両側(電動)', '全塗装済',
    ],
  },
  {
    id: 'comfort',
    label: '快適装備',
    color: 'purple',
    items: [
      '過給器設定モデル', 'エアコン・クーラー', 'Wエアコン', 'カーナビ',
      'TV', 'ディスプレイオーディオ', 'ミュージックプレイヤー接続可',
      'ETC', 'ドライブレコーダー', 'エアサスペンション', '1500W給電', '寒冷地仕様',
    ],
  },
  {
    id: 'safety',
    label: '安全装備',
    color: 'red',
    items: [
      'パワステ', 'ABS', 'サポカー', '衝突被害軽減ブレーキ',
      'アダプティブクルーズコントロール', 'レーンキープアシスト', 'パーキングアシスト',
      '誤発進防止装置', '障害物センサー',
      'エアバッグ：運転席', 'エアバッグ：助手席', 'エアバッグ：サイド', 'エアバッグ：カーテン',
      '頸部衝撃緩和ヘッドレスト', '全周囲カメラ',
      'カメラ：バック', 'カメラ：フロント', 'カメラ：サイド',
      'ブラインドスポットモニター', '横滑り防止装置', 'ヒルディセントコントロール',
      'アイドリングストップ', '盗難防止装置', 'オートマチックハイビーム',
    ],
  },
] as const;

// デモ用初期検出値（トヨタ アルファード系の装備を想定）
const DEMO_DETECTED = new Set([
  'スマートキー', 'パワーウインドウ', 'シートヒーター', '3列シート',
  'ヘッドライト：LED', 'アルミホイール', 'スライドドア：両側(電動)',
  'エアコン・クーラー', 'Wエアコン', 'カーナビ', 'ETC', 'ドライブレコーダー', 'ディスプレイオーディオ',
  'パワステ', 'ABS', '衝突被害軽減ブレーキ', 'アダプティブクルーズコントロール',
  'レーンキープアシスト', '全周囲カメラ', 'カメラ：バック', 'ブラインドスポットモニター',
  '横滑り防止装置', 'アイドリングストップ', 'エアバッグ：運転席', 'エアバッグ：助手席',
]);

// AI出力テキスト → カーセンサー装備項目 のキーワードマッピング
const EQUIPMENT_KEYWORDS: Record<string, string[]> = {
  'スマートキー':                   ['スマートキー', 'インテリジェントキー', 'プッシュスタート'],
  'キーレス':                       ['キーレス'],
  'パワーウインドウ':               ['パワーウインドウ', 'パワーウィンドウ'],
  '後席モニター':                   ['後席モニター', 'リアモニター', '後席ディスプレイ'],
  'シートヒーター':                  ['シートヒーター', 'シートウォーマー'],
  'シートエアコン':                  ['シートエアコン', 'シートベンチレーション', '通気シート'],
  '本革シート':                     ['本革', 'レザーシート'],
  '3列シート':                      ['3列シート', '7人乗り', '8人乗り'],
  'フルフラットシート':              ['フルフラット'],
  '電動シート':                     ['電動シート', 'パワーシート'],
  'ヘッドライト：LED':              ['LED', 'LEDヘッドライト'],
  'フロントフォグランプ':            ['フォグランプ', 'フォグライト'],
  'サンルーフ・ガラスルーフ':       ['サンルーフ', 'ガラスルーフ', 'ムーンルーフ'],
  'ルーフレール':                   ['ルーフレール', 'ルーフキャリア'],
  'アルミホイール':                  ['アルミホイール', 'アルミ'],
  'スライドドア：両側(電動)':       ['両側パワースライド', '電動スライドドア', '両側スライド'],
  'エアコン・クーラー':             ['エアコン'],
  'Wエアコン':                      ['Wエアコン', 'デュアルエアコン', 'リアエアコン'],
  'カーナビ':                       ['カーナビ', 'ナビ', 'ナビゲーション'],
  'TV':                             ['TV', 'テレビ', 'フルセグ'],
  'ディスプレイオーディオ':         ['ディスプレイオーディオ', 'DA'],
  'ETC':                            ['ETC'],
  'ドライブレコーダー':              ['ドライブレコーダー', 'ドラレコ'],
  '1500W給電':                      ['1500W', 'AC100V', 'コンセント'],
  '衝突被害軽減ブレーキ':           ['衝突軽減', '自動ブレーキ', 'プリクラッシュ', 'AEBS'],
  'アダプティブクルーズコントロール': ['アダプティブクルーズ', 'ACC', 'レーダークルーズ'],
  'レーンキープアシスト':            ['レーンキープ', 'LKA', 'レーン逸脱'],
  '誤発進防止装置':                  ['誤発進', 'ペダル踏み間違い'],
  '障害物センサー':                  ['障害物センサー', 'コーナーセンサー', 'ソナー'],
  '全周囲カメラ':                   ['全周囲カメラ', 'パノラミックビュー', '360度カメラ', '全方位カメラ', 'マルチアラウンド'],
  'カメラ：バック':                  ['バックカメラ', 'リアカメラ', 'バックモニター'],
  'カメラ：フロント':               ['フロントカメラ'],
  'カメラ：サイド':                  ['サイドカメラ'],
  'ブラインドスポットモニター':      ['ブラインドスポット', 'BSM', '側方警告'],
  '横滑り防止装置':                  ['横滑り防止', 'VSC', 'ESC', 'スタビリティ'],
  'アイドリングストップ':            ['アイドリングストップ', 'アイスト'],
  '盗難防止装置':                   ['盗難防止', 'イモビライザー', 'セキュリティ'],
  'オートマチックハイビーム':        ['オートハイビーム', 'AHB', 'オートマチックハイビーム'],
  'ABS':                            ['ABS'],
  'パワステ':                       ['パワーステアリング', 'パワステ', '電動パワステ'],
  'サポカー':                       ['サポカー', 'スマートアシスト', '予防安全'],
  'エアバッグ：運転席':              ['運転席エアバッグ'],
  'エアバッグ：助手席':              ['助手席エアバッグ'],
  'エアバッグ：サイド':              ['サイドエアバッグ'],
  'エアバッグ：カーテン':            ['カーテンエアバッグ', 'カーテンシールドエアバッグ'],
};

// ── Sub-components ─────────────────────────────────────────────────────
function CopyBtn({
  text, id, copied, onCopy,
}: {
  text: string; id: string; copied: string | null; onCopy: (t: string, k: string) => void;
}) {
  const done = copied === id;
  return (
    <button
      onClick={() => onCopy(text, id)}
      className={`text-xs font-medium flex items-center gap-1 shrink-0 transition-colors cursor-pointer ${
        done ? 'text-green-600' : 'text-blue-600 hover:text-blue-700'
      }`}
    >
      {done ? (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          コピー済み
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          コピー
        </>
      )}
    </button>
  );
}

function TextBlock({
  label, text, id, copied, onCopy,
}: {
  label: string; text: string; id: string; copied: string | null; onCopy: (t: string, k: string) => void;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
        <CopyBtn text={text} id={id} copied={copied} onCopy={onCopy} />
      </div>
      <p className="text-gray-900 text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────
export default function Home() {
  const [mode, setMode]         = useState<Mode>('multi');
  const [maker, setMaker]       = useState('');
  const [model, setModel]       = useState('');
  const [grade, setGrade]       = useState('');
  const [year, setYear]         = useState('');
  const [color, setColor]       = useState('');
  const [seating, setSeating]   = useState('');
  const [carStatus, setCarStatus] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [inquiry, setInquiry]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<Result | null>(null);
  const [error, setError]       = useState('');
  const [activeTab, setActiveTab] = useState('carsensor');
  const [copied, setCopied]     = useState<string | null>(null);

  const [photoFiles, setPhotoFiles]       = useState<PhotoFile[]>([]);
  const [dragOver, setDragOver]           = useState(false);
  const [equipmentChecked, setEquipmentChecked] = useState<Set<string>>(new Set(DEMO_DETECTED));
  const [aiDetected, setAiDetected]       = useState<Set<string>>(new Set(DEMO_DETECTED));
  const fileInputRef                      = useRef<HTMLInputElement>(null);
  const resultRef                         = useRef<HTMLDivElement>(null);

  const isVehicleMode = mode === 'multi' || mode === 'grade';
  const canSubmit =
    mode === 'photo'   ? photoFiles.length > 0 :
    isVehicleMode      ? (maker !== '' && model !== '') :
    inquiry.trim() !== '';

  const currentModels = CAR_DATA.find(m => m.name === maker)?.models ?? [];
  const currentGrades = currentModels.find(m => m.name === model)?.grades ?? [];
  const YEARS = Array.from({ length: 27 }, (_, i) => 2026 - i);

  const onCopy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const toggleOption = useCallback((item: string) => {
    setSelectedOptions(prev =>
      prev.includes(item) ? prev.filter(o => o !== item) : [...prev, item]
    );
  }, []);

  useEffect(() => {
    if (result) {
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    }
  }, [result]);

  function matchEquipmentToChecklist(aiEquipment: string[]): Set<string> {
    const result = new Set<string>();
    const allItems = CARSENSOR_CATEGORIES.flatMap(c => c.items);
    for (const detected of aiEquipment) {
      const d = detected.replace('（推測）', '').trim();
      for (const item of allItems) {
        const keywords = EQUIPMENT_KEYWORDS[item] ?? [item];
        if (keywords.some(kw => d.includes(kw) || kw.includes(d))) {
          result.add(item);
        }
      }
    }
    return result;
  }

  function toggleEquipment(item: string) {
    setEquipmentChecked(prev => {
      const next = new Set(prev);
      next.has(item) ? next.delete(item) : next.add(item);
      return next;
    });
  }

  function getCheckedEquipmentText(): string {
    return CARSENSOR_CATEGORIES.map(cat => {
      const checked = cat.items.filter(i => equipmentChecked.has(i));
      if (checked.length === 0) return null;
      return `【${cat.label}】\n${checked.map(i => `・${i}`).join('\n')}`;
    }).filter(Boolean).join('\n\n');
  }

  async function resizeImage(file: File): Promise<{ base64: string; mediaType: string }> {
    return new Promise(resolve => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const MAX = 1120;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
          else { width = Math.round(width * MAX / height); height = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        resolve({ base64: canvas.toDataURL('image/jpeg', 0.88).split(',')[1], mediaType: 'image/jpeg' });
      };
      img.src = url;
    });
  }

  async function addPhotoFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, 80);
    const processed = await Promise.all(arr.map(async file => {
      const { base64, mediaType } = await resizeImage(file);
      return { name: file.name, base64, mediaType, preview: URL.createObjectURL(file) };
    }));
    setPhotoFiles(prev => [...prev, ...processed].slice(0, 80));
  }

  function removePhoto(idx: number) {
    setPhotoFiles(prev => prev.filter((_, i) => i !== idx));
  }

  function selectMode(m: Mode) {
    setMode(m);
    setResult(null);
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const carName = [maker, model].filter(Boolean).join(' ');
      const equipment = [color, ...selectedOptions].filter(Boolean).join('・');
      const body =
        mode === 'photo'
          ? { mode, images: photoFiles.map(f => ({ base64: f.base64, mediaType: f.mediaType })) }
          : isVehicleMode
          ? { mode, carName, grade, year, seating, carStatus, equipment }
          : { mode, inquiry };

      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '生成に失敗しました');
      setResult(data);
      if (data.mode === 'multi') setActiveTab('carsensor');
      if (data.mode === 'photo' && Array.isArray(data.equipment)) {
        const detected = matchEquipmentToChecklist(data.equipment as string[]);
        setAiDetected(detected);
        setEquipmentChecked(prev => new Set([...prev, ...detected]));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '文章の生成に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  // ── Result renderers ───────────────────────────────────────────────
  function renderMulti(r: MultiResult) {
    type TabId = 'instagram' | 'blog';
    const tabSections: Record<TabId, { label: string; text: string; id: string }[]> = {
      instagram: [
        { label: 'Instagram 投稿文',    text: r.instagram,         id: 'ig-post' },
        { label: 'ハッシュタグ',        text: r.instagramHashtags, id: 'ig-hash' },
      ],
      blog: [
        { label: 'ブログ 記事タイトル', text: r.blogTitle,         id: 'bl-title' },
        { label: 'ブログ 本文',         text: r.blog,              id: 'bl-body'  },
      ],
    };
    const sections = tabSections[activeTab as TabId] ?? [];
    const allText = sections.map(s => `【${s.label}】\n${s.text}`).join('\n\n');

    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {MULTI_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-sm font-medium transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/40'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4">
          {sections.map(s => (
            <TextBlock key={s.id} label={s.label} text={s.text} id={s.id} copied={copied} onCopy={onCopy} />
          ))}
          <button
            onClick={() => onCopy(allText, `${activeTab}-all`)}
            className={`w-full py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
              copied === `${activeTab}-all`
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {copied === `${activeTab}-all` ? '✓ このタブをすべてコピー済み' : 'このタブをすべてコピー'}
          </button>
        </div>
      </div>
    );
  }

  function renderGrade(r: GradeResult) {
    const appealsText = r.appealPoints.map((p, i) => `${i + 1}. ${p}`).join('\n');
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <ResultHeader label="グレード補記・アピール提案" />
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">グレード補記（カーセンサー）</span>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-medium tabular-nums ${r.gradeNote.length > 100 ? 'text-red-500' : r.gradeNote.length > 85 ? 'text-yellow-600' : 'text-gray-400'}`}>
                {r.gradeNote.length}/100文字
              </span>
              <CopyBtn text={r.gradeNote} id="grade-note" copied={copied} onCopy={onCopy} />
            </div>
          </div>
          <p className="text-gray-900 text-sm leading-relaxed whitespace-pre-wrap">{r.gradeNote}</p>
          {r.gradeNote.length > 100 && (
            <p className="text-xs text-red-500 mt-2">⚠ 100文字を超えています。カーセンサーへの入力時は調整してください。</p>
          )}
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">アピールポイント</span>
            <CopyBtn text={appealsText} id="appeal" copied={copied} onCopy={onCopy} />
          </div>
          <ul className="space-y-2">
            {r.appealPoints.map((point, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-gray-900">
                <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  function renderReply(r: ReplyResult) {
    const allText = `件名: ${r.subject}\n\n${r.body}`;
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <ResultHeader label="返信メール下書き" />
        <TextBlock label="件名" text={r.subject} id="reply-subject" copied={copied} onCopy={onCopy} />
        <TextBlock label="本文" text={r.body}    id="reply-body"    copied={copied} onCopy={onCopy} />
        <button
          onClick={() => onCopy(allText, 'reply-all')}
          className={`w-full py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
            copied === 'reply-all'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          {copied === 'reply-all' ? '✓ 件名＋本文をすべてコピー済み' : '件名＋本文をすべてコピー'}
        </button>
      </div>
    );
  }

  function renderPhoto(r: PhotoResult) {
    const fields: { label: string; value: string; id: string }[] = [
      { label: '車台番号',     value: r.chassisNumber, id: 'ph-chassis' },
      { label: '型式',         value: r.modelCode,     id: 'ph-model'   },
      { label: 'カラーコード', value: r.colorCode,     id: 'ph-color'   },
      { label: 'トリムコード', value: r.trimCode,      id: 'ph-trim'    },
      { label: '年式',         value: r.year,          id: 'ph-year'    },
      { label: 'グレード',     value: r.grade,         id: 'ph-grade'   },
    ];
    const filledFields = fields.filter(f => f.value);
    const idText       = filledFields.map(f => `${f.label}: ${f.value}`).join('\n');
    const equipText    = getCheckedEquipmentText();
    const totalChecked = CARSENSOR_CATEGORIES.flatMap(c => c.items).filter(i => equipmentChecked.has(i)).length;

    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
        <ResultHeader label="AI解析完了 — 車両識別情報 ＋ 装備チェック" />

        {/* ── 識別情報 ─────────────────────────────────────────── */}
        {filledFields.length > 0 ? (
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">車両識別情報</p>
            {filledFields.map(f => (
              <div key={f.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-gray-400 w-24 shrink-0">{f.label}</span>
                  <span className="text-sm font-mono font-semibold text-gray-900 truncate">{f.value}</span>
                </div>
                <CopyBtn text={f.value} id={f.id} copied={copied} onCopy={onCopy} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 text-center py-2 bg-gray-50 rounded-xl">
            コーションプレートを含む写真を追加すると車台番号・型式を読み取れます
          </p>
        )}

        {/* ── AI生テキストサマリー ─────────────────────────────── */}
        {r.equipment.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
            <p className="text-[11px] font-bold text-orange-700 mb-1.5">
              ✓ AIが検出した装備 {r.equipment.length}件（下のチェックリストに自動反映済み）
            </p>
            <p className="text-xs text-orange-600 leading-relaxed">{r.equipment.join(' ／ ')}</p>
          </div>
        )}

        {/* ── 装備チェックリスト（AI更新済み）────────────────── */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between bg-gray-50 px-4 py-2.5 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900">カーセンサー 装備チェック</span>
              <span className="text-[11px] bg-orange-100 text-orange-700 border border-orange-300 rounded px-1.5 py-0.5 font-medium">
                {aiDetected.size}件 AI検出
              </span>
              <span className="text-[11px] text-gray-400">{totalChecked}項目選択中</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] bg-orange-50 text-orange-700 border border-orange-300 rounded px-1.5 py-0.5">■ AI検出</span>
              <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-300 rounded px-1.5 py-0.5">■ 手動</span>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {CARSENSOR_CATEGORIES.map(cat => {
              const checkedCount = cat.items.filter(i => equipmentChecked.has(i)).length;
              return (
                <div key={cat.id}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      cat.color === 'blue'   ? 'bg-blue-600 text-white' :
                      cat.color === 'green'  ? 'bg-green-600 text-white' :
                      cat.color === 'purple' ? 'bg-purple-600 text-white' :
                      'bg-red-600 text-white'
                    }`}>{cat.label}</span>
                    {checkedCount > 0 && (
                      <span className="text-[10px] text-gray-400">{checkedCount}項目</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.items.map(item => {
                      const isAI      = aiDetected.has(item);
                      const isChecked = equipmentChecked.has(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleEquipment(item)}
                          className={`text-[11px] px-2 py-1 rounded border transition-all cursor-pointer select-none ${
                            isChecked && isAI
                              ? 'bg-orange-50 border-orange-400 text-orange-800 font-semibold ring-1 ring-orange-300'
                              : isChecked
                              ? 'bg-blue-50 border-blue-400 text-blue-800 font-semibold ring-1 ring-blue-300'
                              : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700'
                          }`}
                        >
                          {isChecked && <span className="mr-0.5">✓</span>}{item}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 備考 ───────────────────────────────────────────── */}
        {r.notes && (
          <div className="bg-gray-50 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-500 leading-relaxed">{r.notes}</p>
          </div>
        )}

        {/* ── コピーボタン ──────────────────────────────────── */}
        <div className="flex gap-2">
          <button
            onClick={() => onCopy(equipText, 'photo-equip')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
              copied === 'photo-equip'
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {copied === 'photo-equip' ? '✓ 装備リストをコピー済み' : '装備チェックリストをコピー'}
          </button>
          <button
            onClick={() => onCopy(`${idText}\n\n${equipText}`, 'photo-all')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
              copied === 'photo-all'
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100'
            }`}
          >
            {copied === 'photo-all' ? '✓ 全データをコピー済み' : '識別情報 ＋ 装備を一括コピー'}
          </button>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-700 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">
              松下モータース DX投稿・業務効率化システム
            </h1>
            <p className="text-xs text-gray-500">社内専用 — 車両情報 / マルチAIアシスタント</p>
          </div>
        </div>
      </header>

      <main className={`mx-auto px-4 py-8 space-y-6 ${mode === 'photo' ? 'max-w-5xl' : 'max-w-3xl'}`}>
        {/* Mode selector */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">業務モードを選択</p>
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => selectMode(m.id)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
                mode === m.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">{m.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${mode === m.id ? 'text-blue-700' : 'text-gray-900'}`}>
                    {m.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
                </div>
                {mode === m.id && (
                  <div className="shrink-0 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Input form */}
        <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm ${mode === 'photo' ? 'p-5' : 'p-6'}`}>
          {mode !== 'photo' && (
            <h2 className="text-base font-semibold text-gray-900 mb-5">
              {mode === 'reply' ? 'お客様の問い合わせ内容を入力' : '車両情報を入力'}
            </h2>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'photo' ? (
              <div className="space-y-5">

                {/* ── 写真アップロード ─────────────────────────────── */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-gray-900">📷 車両写真</h2>
                    <span className="text-xs text-gray-400">{photoFiles.length} / 80枚</span>
                  </div>

                  {/* Drop zone */}
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); addPhotoFiles(e.dataTransfer.files); }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors select-none ${
                      dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/40'
                    }`}
                  >
                    <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden"
                      onChange={e => { if (e.target.files) addPhotoFiles(e.target.files); e.target.value = ''; }} />
                    <p className="text-sm font-medium text-gray-600">ドラッグ＆ドロップ、またはクリックして選択</p>
                    <p className="text-xs text-gray-400 mt-0.5">コーションプレート・内装・外観 最大80枚 / JPG・PNG</p>
                  </div>

                  {/* Photo grid */}
                  {photoFiles.length > 0 && (
                    <div className="max-h-52 overflow-y-auto rounded-xl border border-gray-200 p-2 bg-gray-50">
                      <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
                        {photoFiles.map((f, i) => (
                          <div key={i} className="relative group rounded overflow-hidden border border-gray-200 aspect-square bg-gray-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={f.preview} alt={f.name} className="w-full h-full object-cover" />
                            <button type="button" onClick={e => { e.stopPropagation(); removePhoto(i); }}
                              className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 hover:bg-red-500 text-white rounded-full text-[9px] items-center justify-center hidden group-hover:flex transition-colors cursor-pointer">✕</button>
                          </div>
                        ))}
                        {photoFiles.length < 80 && (
                          <button type="button" onClick={() => fileInputRef.current?.click()}
                            className="aspect-square rounded border-2 border-dashed border-gray-300 text-gray-300 hover:border-blue-300 hover:text-blue-400 transition-colors cursor-pointer flex items-center justify-center text-xl">＋</button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── カーセンサー 装備チェックリスト ─────────────── */}
                <div className="border-t border-gray-100 pt-5 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-bold text-gray-900">カーセンサー 装備チェック</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-orange-100 text-orange-700 border border-orange-300 rounded px-1.5 py-0.5 font-medium">■ AI検出</span>
                      <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-300 rounded px-1.5 py-0.5 font-medium">■ 手動選択</span>
                    </div>
                  </div>

                  {CARSENSOR_CATEGORIES.map(cat => {
                    const checkedCount = cat.items.filter(i => equipmentChecked.has(i)).length;
                    return (
                      <div key={cat.id}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                            cat.color === 'blue'   ? 'bg-blue-600 text-white' :
                            cat.color === 'green'  ? 'bg-green-600 text-white' :
                            cat.color === 'purple' ? 'bg-purple-600 text-white' :
                            'bg-red-600 text-white'
                          }`}>{cat.label}</span>
                          {checkedCount > 0 && (
                            <span className="text-[10px] text-gray-400">{checkedCount}項目選択中</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {cat.items.map(item => {
                            const isAI      = aiDetected.has(item);
                            const isChecked = equipmentChecked.has(item);
                            return (
                              <button
                                key={item}
                                type="button"
                                onClick={() => toggleEquipment(item)}
                                className={`text-[11px] px-2 py-1 rounded border transition-all cursor-pointer select-none ${
                                  isChecked && isAI
                                    ? 'bg-orange-50 border-orange-400 text-orange-800 font-semibold ring-1 ring-orange-300'
                                    : isChecked
                                    ? 'bg-blue-50 border-blue-400 text-blue-800 font-semibold ring-1 ring-blue-300'
                                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700'
                                }`}
                              >
                                {isChecked && <span className="mr-0.5">✓</span>}{item}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* 装備コピーボタン */}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const checkedCount = CARSENSOR_CATEGORIES.flatMap(c => c.items).filter(i => equipmentChecked.has(i)).length;
                        if (checkedCount === 0) return;
                        onCopy(getCheckedEquipmentText(), 'equip-list');
                      }}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        copied === 'equip-list'
                          ? 'bg-green-50 border-green-300 text-green-700'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {copied === 'equip-list' ? '✓ 装備リストをコピー済み' : '選択中の装備をカテゴリ別コピー'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEquipmentChecked(new Set());
                        setAiDetected(new Set());
                      }}
                      className="px-3 py-2 rounded-lg text-xs text-gray-400 border border-gray-200 hover:border-gray-300 hover:text-gray-600 transition-colors cursor-pointer"
                    >
                      リセット
                    </button>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-xs text-amber-700">
                  <span className="font-semibold">【開発中】</span> 写真をアップロードして「解析する」を押すと装備が自動検出されます。
                </div>
              </div>
            ) : isVehicleMode ? (
              <>
                {/* メーカー・車種 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      メーカー <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={maker}
                      onChange={e => { setMaker(e.target.value); setModel(''); setGrade(''); }}
                      style={{ color: maker ? '#111827' : '#9ca3af' }}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white"
                    >
                      <option value="">メーカーを選択</option>
                      {CAR_DATA.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      車種 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={model}
                      onChange={e => { setModel(e.target.value); setGrade(''); }}
                      disabled={!maker}
                      style={{ color: model ? '#111827' : '#9ca3af' }}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white disabled:bg-gray-50 disabled:text-gray-400"
                    >
                      <option value="">車種を選択</option>
                      {currentModels.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* グレード・年式 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">グレード</label>
                    <input
                      type="text"
                      value={grade}
                      onChange={e => setGrade(e.target.value)}
                      list="grade-list"
                      placeholder="グレードを選択または直接入力"
                      disabled={!model}
                      style={{ color: '#111827' }}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
                    />
                    <datalist id="grade-list">
                      {currentGrades.map(g => <option key={g} value={g} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">年式</label>
                    <select
                      value={year}
                      onChange={e => setYear(e.target.value)}
                      style={{ color: year ? '#111827' : '#9ca3af' }}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white"
                    >
                      <option value="">年式を選択</option>
                      {YEARS.map(y => <option key={y} value={`${y}年式`}>{y}年式</option>)}
                    </select>
                  </div>
                </div>

                {/* カラー */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">カラー</label>
                  <select
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    style={{ color: color ? '#111827' : '#9ca3af' }}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white"
                  >
                    <option value="">カラーを選択</option>
                    {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* 乗車定員・車両状態 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">乗車定員</label>
                    <select
                      value={seating}
                      onChange={e => setSeating(e.target.value)}
                      style={{ color: seating ? '#111827' : '#9ca3af' }}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white"
                    >
                      <option value="">選択してください</option>
                      {['2人乗り','4人乗り','5人乗り','6人乗り','7人乗り','8人乗り'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">車両状態</label>
                    <select
                      value={carStatus}
                      onChange={e => setCarStatus(e.target.value)}
                      style={{ color: carStatus ? '#111827' : '#9ca3af' }}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white"
                    >
                      <option value="">選択してください</option>
                      <option value="新車">新車</option>
                      <option value="登録済未使用車">登録済未使用車</option>
                      <option value="中古車">中古車</option>
                    </select>
                  </div>
                </div>

                {/* 装備・特徴チェックボックス */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">装備・特徴</label>
                  <div className="space-y-3">
                    {OPTION_GROUPS.map(group => (
                      <div key={group.label}>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{group.label}</p>
                        <div className="flex flex-wrap gap-2">
                          {group.items.map(item => {
                            const checked = selectedOptions.includes(item);
                            return (
                              <button
                                key={item}
                                type="button"
                                onClick={() => toggleOption(item)}
                                className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer select-none ${
                                  checked
                                    ? 'bg-blue-600 border-blue-600 text-white font-medium'
                                    : 'bg-white border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600'
                                }`}
                              >
                                {checked && '✓ '}{item}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  問い合わせ内容 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={inquiry}
                  onChange={e => setInquiry(e.target.value)}
                  placeholder="お客様からのメール文・LINEメッセージなどをそのまま貼り付けてください"
                  rows={8}
                  style={{ color: '#111827' }}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-y"
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  AIが生成中...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {mode === 'multi'  ? '4媒体分を一括生成する'
                    : mode === 'grade' ? 'グレード補記・アピールを生成する'
                    : mode === 'photo' ? `${photoFiles.length}枚の写真を解析する`
                    : '返信メールを下書きする'}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        <div ref={resultRef}>
          {result && result.mode === 'multi'  && renderMulti(result)}
          {result && result.mode === 'grade'  && renderGrade(result)}
          {result && result.mode === 'reply'  && renderReply(result)}
          {result && result.mode === 'photo'  && renderPhoto(result)}
        </div>

        <p className="text-center text-xs text-gray-400 pb-4">
          松下モータース 社内専用 · 車両情報/マルチAIアシスタント · 利用制限なし
        </p>
      </main>
    </div>
  );
}

function ResultHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shrink-0">
        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-base font-semibold text-gray-900">{label}</h2>
    </div>
  );
}
