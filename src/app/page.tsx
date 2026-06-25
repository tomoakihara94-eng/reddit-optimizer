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
  gradeNote: string;
  appealPoints: string[];
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
    id: 'photo',
    label: '写真を撮るだけ → カーセンサー / グーネット 登録まで一括完結',
    desc: 'コーションプレート・内装・外観を撮るだけ。AI が全項目を自動入力し、その場でコピーして登録完了',
    icon: '📸',
  },
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

// ── グーネット 装備チェック項目 ─────────────────────────────────────────────
const GOONET_CATEGORIES = [
  {
    id: 'gn-equipment',
    label: '装備',
    color: 'red',
    items: [
      'エアバッグ：運転席/助手席/サイド', 'スライドドア', 'サンルーフ',
      'ABS', 'エアコン', 'Wエアコン', 'リフトアップ', 'ダウンヒルアシストコントロール',
      'パワーステアリング', 'パワーウィンドウ', '盗難防止システム', 'アイドリングストップ',
      'ドライブレコーダー', 'USB入力端子', 'Bluetooth接続', '100V電源',
      'クリーンディーゼル', 'センターデフロック', 'レンタカーアップ', '展示・試乗車', '電動格納ミラー',
    ],
  },
  {
    id: 'gn-adas',
    label: '運転支援',
    color: 'orange',
    items: [
      'オートクルーズコントロール', 'レーンアシスト', '自動駐車システム', 'パークアシスト',
    ],
  },
  {
    id: 'gn-safety',
    label: '安全装備エリア',
    color: 'rose',
    items: [
      '横滑り防止装置', '衝突安全ボディ', '衝突被害軽減システム', 'クリアランスソナー',
      'オートマチックハイビーム', '頸部衝撃緩和ヘッドレスト', 'オートライト',
    ],
  },
  {
    id: 'gn-exterior',
    label: '外装・内装',
    color: 'teal',
    items: [
      'カーナビ', 'TV', 'オーディオ', 'ビジュアル', 'アルミホイール', 'ヘッドライトウォッシャー',
      '革シート', 'ハーフレザーシート', 'キーレス', 'LEDヘッドランプ', 'HID(キセノンライト)',
      'ポータブルナビ', 'バックカメラ', 'ETC', 'エアロ', 'スマートキー', 'ローダウン',
      'ランフラットタイヤ', 'パワーシート', '3列シート', 'ベンチシート', 'フルフラットシート',
      'チップアップシート', 'オットマン', '電動格納サードシート', 'シートヒーター', 'ウォークスルー',
      '後席モニター', '電動リアゲート', 'フロントカメラ', 'シートエアコン',
      '全周囲カメラ', 'サイドカメラ', 'ルーフレール', 'エアサスペンション',
    ],
  },
] as const;

const GOONET_KEYWORDS: Record<string, string[]> = {
  'エアバッグ：運転席/助手席/サイド': ['エアバッグ', 'airbag'],
  'スライドドア':                     ['スライドドア', '電動スライド'],
  'サンルーフ':                       ['サンルーフ', 'ガラスルーフ', 'ムーンルーフ'],
  'ABS':                              ['ABS'],
  'エアコン':                         ['エアコン', 'クーラー'],
  'Wエアコン':                        ['Wエアコン', 'デュアルエアコン', 'リアエアコン'],
  'ダウンヒルアシストコントロール':    ['ヒルディセント', 'ダウンヒル'],
  'パワーステアリング':               ['パワーステアリング', 'パワステ', '電動パワステ'],
  'パワーウィンドウ':                 ['パワーウインドウ', 'パワーウィンドウ'],
  '盗難防止システム':                 ['盗難防止', 'イモビライザー', 'セキュリティ'],
  'アイドリングストップ':             ['アイドリングストップ', 'アイスト'],
  'ドライブレコーダー':               ['ドライブレコーダー', 'ドラレコ'],
  'USB入力端子':                      ['USB'],
  'Bluetooth接続':                    ['Bluetooth', 'ブルートゥース'],
  '100V電源':                         ['100V', '1500W', 'コンセント'],
  'オートクルーズコントロール':       ['クルーズコントロール', 'ACC', 'アダプティブクルーズ'],
  'レーンアシスト':                   ['レーンキープ', 'レーンアシスト', 'LKA', 'レーン逸脱'],
  '横滑り防止装置':                   ['横滑り防止', 'VSC', 'ESC', 'スタビリティ'],
  '衝突被害軽減システム':             ['衝突軽減', '自動ブレーキ', 'プリクラッシュ', 'AEBS'],
  'クリアランスソナー':               ['クリアランスソナー', 'コーナーセンサー', '障害物センサー', 'ソナー'],
  'オートマチックハイビーム':         ['オートハイビーム', 'AHB'],
  '頸部衝撃緩和ヘッドレスト':        ['頸部衝撃', 'ヘッドレスト'],
  'オートライト':                     ['オートライト', '自動点灯'],
  'カーナビ':                         ['カーナビ', 'ナビ', 'ナビゲーション'],
  'TV':                               ['TV', 'テレビ', 'フルセグ'],
  'アルミホイール':                   ['アルミホイール', 'アルミ'],
  '革シート':                         ['本革', 'レザーシート', '革シート'],
  'ハーフレザーシート':               ['ハーフレザー'],
  'キーレス':                         ['キーレス'],
  'LEDヘッドランプ':                  ['LED', 'LEDヘッドライト', 'LEDヘッドランプ'],
  'バックカメラ':                     ['バックカメラ', 'リアカメラ', 'バックモニター'],
  'ETC':                              ['ETC'],
  'エアロ':                           ['エアロ', 'フルエアロ'],
  'スマートキー':                     ['スマートキー', 'インテリジェントキー', 'プッシュスタート'],
  'パワーシート':                     ['電動シート', 'パワーシート'],
  '3列シート':                        ['3列シート', '7人乗り', '8人乗り'],
  'フルフラットシート':               ['フルフラット'],
  'シートヒーター':                   ['シートヒーター', 'シートウォーマー'],
  'ウォークスルー':                   ['ウォークスルー'],
  '後席モニター':                     ['後席モニター', 'リアモニター'],
  '電動リアゲート':                   ['電動リアゲート', 'パワーバックドア'],
  'フロントカメラ':                   ['フロントカメラ'],
  'シートエアコン':                   ['シートエアコン', 'シートベンチレーション'],
  '全周囲カメラ':                     ['全周囲カメラ', 'パノラミックビュー', '360度カメラ', '全方位カメラ'],
  'サイドカメラ':                     ['サイドカメラ'],
  'ルーフレール':                     ['ルーフレール'],
  'エアサスペンション':               ['エアサスペンション'],
};

const GOONET_DEMO_DETECTED = new Set([
  'スマートキー', 'パワーウィンドウ', 'シートヒーター', '3列シート',
  'LEDヘッドランプ', 'アルミホイール',
  'エアコン', 'ETC', 'ドライブレコーダー',
  'ABS', '衝突被害軽減システム', 'オートクルーズコントロール', 'レーンアシスト',
  '全周囲カメラ', 'バックカメラ', '横滑り防止装置',
  'アイドリングストップ', '盗難防止システム', 'パワーステアリング',
  'エアバッグ：運転席/助手席/サイド',
]);

const CAT_COLORS: Record<string, string> = {
  blue:   'bg-blue-600 text-white',
  green:  'bg-green-600 text-white',
  purple: 'bg-purple-600 text-white',
  red:    'bg-red-600 text-white',
  orange: 'bg-orange-500 text-white',
  rose:   'bg-rose-700 text-white',
  teal:   'bg-teal-600 text-white',
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
      className={`text-xs font-medium flex items-center gap-1.5 shrink-0 transition-all cursor-pointer px-2.5 py-1 rounded-full ${
        done
          ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200'
          : 'bg-blue-50 text-blue-600 hover:bg-blue-100 ring-1 ring-blue-100'
      }`}
    >
      {done ? (
        <>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          コピー済み
        </>
      ) : (
        <>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <div className="bg-slate-50 rounded-xl p-4 border-l-4 border-blue-500">
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">{label}</span>
        <CopyBtn text={text} id={id} copied={copied} onCopy={onCopy} />
      </div>
      <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────
export default function Home() {
  const [mode, setMode]         = useState<Mode>('photo');
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
  const [editableFields, setEditableFields] = useState<{
    chassisNumber: string; modelCode: string; colorCode: string;
    trimCode: string; year: string; grade: string;
  } | null>(null);
  const [equipmentChecked, setEquipmentChecked] = useState<Set<string>>(new Set(DEMO_DETECTED));
  const [aiDetected, setAiDetected]       = useState<Set<string>>(new Set(DEMO_DETECTED));
  const [goonetChecked, setGoonetChecked] = useState<Set<string>>(new Set(GOONET_DEMO_DETECTED));
  const [goonetAiDetected, setGoonetAiDetected] = useState<Set<string>>(new Set(GOONET_DEMO_DETECTED));
  const [checklistTab, setChecklistTab]   = useState<'carsensor' | 'goonet'>('carsensor');
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

  function matchEquipmentToGoonetChecklist(aiEquipment: string[]): Set<string> {
    const result = new Set<string>();
    const allItems = GOONET_CATEGORIES.flatMap(c => c.items);
    for (const detected of aiEquipment) {
      const d = detected.replace('（推測）', '').trim();
      for (const item of allItems) {
        const keywords = GOONET_KEYWORDS[item] ?? [item];
        if (keywords.some(kw => d.includes(kw) || kw.includes(d))) {
          result.add(item);
        }
      }
    }
    return result;
  }

  function toggleGoonetEquipment(item: string) {
    setGoonetChecked(prev => {
      const next = new Set(prev);
      next.has(item) ? next.delete(item) : next.add(item);
      return next;
    });
  }

  function getGoonetCheckedEquipmentText(): string {
    return GOONET_CATEGORIES.map(cat => {
      const checked = cat.items.filter(i => goonetChecked.has(i));
      if (checked.length === 0) return null;
      return `【${cat.label}】\n${checked.map(i => `・${i}`).join('\n')}`;
    }).filter(Boolean).join('\n\n');
  }

  // チップ共通レンダラー（カーセンサー/グーネット両用）
  function renderChips(
    items: readonly string[],
    checked: Set<string>,
    ai: Set<string>,
    onToggle: (item: string) => void,
  ) {
    return items.map(item => {
      const isAI      = ai.has(item);
      const isChecked = checked.has(item);
      return (
        <button
          key={item}
          type="button"
          onClick={() => onToggle(item)}
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
    });
  }

  function renderCategoryChecklist(
    categories: readonly { id: string; label: string; color: string; items: readonly string[] }[],
    checked: Set<string>,
    ai: Set<string>,
    onToggle: (item: string) => void,
  ) {
    return categories.map(cat => {
      const checkedCount = cat.items.filter(i => checked.has(i)).length;
      return (
        <div key={cat.id}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${CAT_COLORS[cat.color] ?? 'bg-gray-600 text-white'}`}>
              {cat.label}
            </span>
            {checkedCount > 0 && <span className="text-[10px] text-gray-400">{checkedCount}項目</span>}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {renderChips(cat.items, checked, ai, onToggle)}
          </div>
        </div>
      );
    });
  }

  // タブヘッダー共通レンダラー
  function renderChecklistTabHeader(
    totalCheckedCS: number,
    totalCheckedGN: number,
    aiCS: number,
    aiGN: number,
  ) {
    return (
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-semibold">
          <button
            type="button"
            onClick={() => setChecklistTab('carsensor')}
            className={`px-3 py-1.5 transition-colors cursor-pointer ${
              checklistTab === 'carsensor'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            カーセンサー {totalCheckedCS > 0 && <span className="ml-1 opacity-80">{totalCheckedCS}</span>}
          </button>
          <button
            type="button"
            onClick={() => setChecklistTab('goonet')}
            className={`px-3 py-1.5 transition-colors cursor-pointer border-l border-gray-200 ${
              checklistTab === 'goonet'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            グーネット {totalCheckedGN > 0 && <span className="ml-1 opacity-80">{totalCheckedGN}</span>}
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          {(checklistTab === 'carsensor' ? aiCS : aiGN) > 0 && (
            <span className="text-[10px] bg-orange-100 text-orange-700 border border-orange-300 rounded px-1.5 py-0.5 font-medium">
              AI {checklistTab === 'carsensor' ? aiCS : aiGN}件検出
            </span>
          )}
          <span className="text-[10px] bg-orange-50 text-orange-700 border border-orange-300 rounded px-1.5 py-0.5">■ AI</span>
          <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-300 rounded px-1.5 py-0.5">■ 手動</span>
        </div>
      </div>
    );
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
        const eq = data.equipment as string[];
        const csDetected = matchEquipmentToChecklist(eq);
        const gnDetected = matchEquipmentToGoonetChecklist(eq);
        setAiDetected(csDetected);
        setEquipmentChecked(prev => new Set([...prev, ...csDetected]));
        setGoonetAiDetected(gnDetected);
        setGoonetChecked(prev => new Set([...prev, ...gnDetected]));
        setEditableFields({
          chassisNumber: data.chassisNumber as string ?? '',
          modelCode:     data.modelCode     as string ?? '',
          colorCode:     data.colorCode     as string ?? '',
          trimCode:      data.trimCode      as string ?? '',
          year:          data.year          as string ?? '',
          grade:         data.grade         as string ?? '',
        });
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
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-slate-50/50">
          {MULTI_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3.5 text-sm font-semibold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-white/60'
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
            className={`w-full py-2.5 rounded-xl text-sm font-medium border transition-all cursor-pointer ${
              copied === `${activeTab}-all`
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100'
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
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 space-y-4">
        <ResultHeader label="グレード補記・アピール提案" />
        <div className="bg-slate-50 rounded-xl p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">グレード補記（カーセンサー）</span>
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
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">アピールポイント</span>
            <CopyBtn text={appealsText} id="appeal" copied={copied} onCopy={onCopy} />
          </div>
          <ul className="space-y-2">
            {r.appealPoints.map((point, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-gray-800">
                <span className="w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
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
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 space-y-4">
        <ResultHeader label="返信メール下書き" />
        <TextBlock label="件名" text={r.subject} id="reply-subject" copied={copied} onCopy={onCopy} />
        <TextBlock label="本文" text={r.body}    id="reply-body"    copied={copied} onCopy={onCopy} />
        <button
          onClick={() => onCopy(allText, 'reply-all')}
          className={`w-full py-2.5 rounded-xl text-sm font-medium border transition-all cursor-pointer ${
            copied === 'reply-all'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100'
          }`}
        >
          {copied === 'reply-all' ? '✓ 件名＋本文をすべてコピー済み' : '件名＋本文をすべてコピー'}
        </button>
      </div>
    );
  }

  function renderPhoto(r: PhotoResult) {
    type EFKey = 'chassisNumber' | 'modelCode' | 'colorCode' | 'trimCode' | 'year' | 'grade';
    const ef = editableFields;
    const idFieldDefs: { label: string; key: EFKey }[] = [
      { label: '車台番号',     key: 'chassisNumber' },
      { label: '型式',         key: 'modelCode'     },
      { label: 'カラーコード', key: 'colorCode'     },
      { label: 'トリムコード', key: 'trimCode'      },
      { label: '年式',         key: 'year'          },
      { label: 'グレード',     key: 'grade'         },
    ];
    const filledIdDefs = ef ? idFieldDefs.filter(d => ef[d.key]) : [];
    const idText = filledIdDefs.map(d => `■ ${d.label}: ${ef![d.key]}`).join('\n');

    const gradeSection   = r.gradeNote ? `\n■ グレード補記（100字枠）:\n${r.gradeNote}` : '';
    const appealsSection = r.appealPoints?.length
      ? `\n■ アピールポイント:\n${r.appealPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}`
      : '';
    const equipText      = checklistTab === 'carsensor' ? getCheckedEquipmentText() : getGoonetCheckedEquipmentText();
    const equipHeader    = checklistTab === 'carsensor' ? '\n■ カーセンサー装備チェック:' : '\n■ グーネット装備チェック:';
    const totalCheckedCS = CARSENSOR_CATEGORIES.flatMap(c => c.items).filter(i => equipmentChecked.has(i)).length;
    const totalCheckedGN = GOONET_CATEGORIES.flatMap(c => c.items).filter(i => goonetChecked.has(i)).length;
    const totalChecked   = checklistTab === 'carsensor' ? totalCheckedCS : totalCheckedGN;

    const registrationSheet = [
      '━━━━ カーセンサー登録シート ━━━━',
      idText,
      gradeSection,
      appealsSection,
      equipText ? `${equipHeader}\n${equipText}` : '',
    ].filter(Boolean).join('\n');

    return (
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 space-y-5">

        {/* ── 完了バナー ────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-xl shrink-0">✅</div>
            <div>
              <p className="font-bold text-base">カーセンサー登録シートが完成しました</p>
              <p className="text-sm text-emerald-100 mt-0.5">下の「登録シート一括コピー」を押してカーセンサーに貼り付けるだけ</p>
            </div>
          </div>
        </div>

        {/* ── 識別情報（編集可） ─────────────────────────────────── */}
        {ef ? (
          <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">車両識別情報</p>
              <span className="text-[10px] text-gray-400 bg-white border border-gray-200 rounded-full px-2 py-0.5">クリックして修正できます</span>
            </div>
            {idFieldDefs.map(d => (
              <div key={d.key} className="flex items-center gap-2.5">
                <span className="text-xs text-gray-400 w-24 shrink-0">{d.label}</span>
                <input
                  type="text"
                  value={ef[d.key]}
                  onChange={e => setEditableFields(prev => prev ? { ...prev, [d.key]: e.target.value } : prev)}
                  placeholder="—"
                  className="flex-1 text-sm font-mono font-semibold text-gray-900 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
                />
                {ef[d.key] && <CopyBtn text={ef[d.key]} id={`ph-${d.key}`} copied={copied} onCopy={onCopy} />}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 text-center py-3 bg-gray-50 rounded-xl">
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
        <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-slate-50 px-4 py-3 border-b border-gray-100 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-gray-900">装備チェック（AI更新済み）</span>
              <span className="text-[11px] text-gray-400">{totalChecked}項目選択中</span>
            </div>
            {renderChecklistTabHeader(totalCheckedCS, totalCheckedGN, aiDetected.size, goonetAiDetected.size)}
          </div>

          <div className="p-4 space-y-4">
            {checklistTab === 'carsensor'
              ? renderCategoryChecklist(CARSENSOR_CATEGORIES, equipmentChecked, aiDetected, toggleEquipment)
              : renderCategoryChecklist(GOONET_CATEGORIES, goonetChecked, goonetAiDetected, toggleGoonetEquipment)
            }
          </div>
        </div>

        {/* ── グレード補記 ──────────────────────────────────── */}
        {r.gradeNote && (
          <div className="bg-slate-50 rounded-xl p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">グレード補記（カーセンサー 100文字枠）</span>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium tabular-nums ${
                  r.gradeNote.length > 100 ? 'text-red-500' :
                  r.gradeNote.length > 85  ? 'text-yellow-600' : 'text-gray-400'
                }`}>{r.gradeNote.length}/100文字</span>
                <CopyBtn text={r.gradeNote} id="ph-grade-note" copied={copied} onCopy={onCopy} />
              </div>
            </div>
            <p className="text-gray-900 text-sm leading-relaxed whitespace-pre-wrap">{r.gradeNote}</p>
            {r.gradeNote.length > 100 && (
              <p className="text-xs text-red-500 mt-2">⚠ 100文字を超えています。入力時は調整してください。</p>
            )}
          </div>
        )}

        {/* ── アピール提案 ───────────────────────────────────── */}
        {r.appealPoints && r.appealPoints.length > 0 && (
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">アピールポイント</span>
              <CopyBtn
                text={r.appealPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}
                id="ph-appeals"
                copied={copied}
                onCopy={onCopy}
              />
            </div>
            <ul className="space-y-2">
              {r.appealPoints.map((point, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-gray-800">
                  <span className="w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── 備考 ───────────────────────────────────────────── */}
        {r.notes && (
          <div className="bg-slate-50 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-500 leading-relaxed">{r.notes}</p>
          </div>
        )}

        {/* ── コピーボタン ──────────────────────────────────── */}
        <div className="space-y-2">
          {/* 主アクション: 登録シート一括コピー */}
          <button
            onClick={() => onCopy(registrationSheet, 'photo-all')}
            className={`w-full py-4 rounded-2xl text-sm font-bold border-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
              copied === 'photo-all'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 border-transparent text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5'
            }`}
          >
            {copied === 'photo-all' ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                登録シートをコピーしました — カーセンサーに貼り付けてください
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                登録シートを一括コピー（識別情報 ＋ グレード補記 ＋ アピール ＋ 装備）
              </>
            )}
          </button>
          {/* サブ: 装備のみ */}
          <button
            onClick={() => onCopy(equipText, 'photo-equip')}
            className={`w-full py-2.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
              copied === 'photo-equip'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            {copied === 'photo-equip'
              ? '✓ 装備リストをコピー済み'
              : `${checklistTab === 'carsensor' ? 'カーセンサー' : 'グーネット'}装備チェックのみをコピー`}
          </button>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 sticky top-0 z-10 shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shrink-0 ring-1 ring-white/30">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">
              松下モータース DX投稿・業務効率化システム
            </h1>
            <p className="text-xs text-blue-100">社内専用 — 車両情報 / マルチAIアシスタント</p>
          </div>
          <div className="ml-auto">
            <span className="text-[11px] bg-white/20 text-white border border-white/30 rounded-full px-3 py-1 font-medium">社内専用</span>
          </div>
        </div>
      </header>

      <main className={`mx-auto px-4 py-8 space-y-6 ${mode === 'photo' ? 'max-w-5xl' : 'max-w-3xl'}`}>
        {/* Mode selector */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">業務モードを選択</p>
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => selectMode(m.id)}
              className={`w-full text-left p-4 rounded-2xl transition-all duration-150 cursor-pointer flex items-start gap-3.5 ${
                mode === m.id
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20'
                  : 'bg-white border border-gray-100 hover:border-blue-200 hover:shadow-md shadow-sm'
              }`}
            >
              <span className="text-xl shrink-0 mt-0.5">{m.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${mode === m.id ? 'text-white' : 'text-gray-900'}`}>
                  {m.label}
                </p>
                <p className={`text-xs mt-0.5 ${mode === m.id ? 'text-blue-100' : 'text-gray-500'}`}>{m.desc}</p>
              </div>
              {mode === m.id && (
                <div className="shrink-0 w-5 h-5 bg-white/25 rounded-full flex items-center justify-center mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Input form */}
        <div className={`bg-white rounded-2xl shadow-md border border-gray-100 ${mode === 'photo' ? 'p-5' : 'p-6'}`}>
          {mode !== 'photo' && (
            <h2 className="text-base font-semibold text-gray-900 mb-5">
              {mode === 'reply' ? 'お客様の問い合わせ内容を入力' : '車両情報を入力'}
            </h2>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'photo' ? (
              <div className="space-y-5">

                {/* ── ステップ表示 ──────────────────────────────────── */}
                <div className="flex items-center gap-1 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-[11px] shadow-sm">1</span>
                    <span className="font-semibold text-gray-700">写真アップロード</span>
                  </div>
                  <div className="flex-1 h-px bg-gray-200 mx-1" />
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center font-bold text-[11px]">2</span>
                    <span className="text-gray-400">AI 解析</span>
                  </div>
                  <div className="flex-1 h-px bg-gray-200 mx-1" />
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center font-bold text-[11px]">3</span>
                    <span className="text-gray-400">確認・コピーして登録</span>
                  </div>
                </div>

                {/* ── 写真アップロード ─────────────────────────────── */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-gray-900">車両写真</h2>
                    <span className="text-xs text-gray-400">{photoFiles.length} / 80枚</span>
                  </div>

                  {/* Drop zone */}
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); addPhotoFiles(e.dataTransfer.files); }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all select-none ${
                      dragOver ? 'border-blue-400 bg-blue-50 shadow-inner' : 'border-gray-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm'
                    }`}
                  >
                    <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden"
                      onChange={e => { if (e.target.files) addPhotoFiles(e.target.files); e.target.value = ''; }} />
                    <div className="text-2xl mb-1.5">📷</div>
                    <p className="text-sm font-semibold text-gray-700">ドラッグ＆ドロップ、またはクリックして選択</p>
                    <p className="text-xs text-gray-400 mt-1">コーションプレート・内装・外観 — 最大80枚 / JPG・PNG</p>
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

                {/* ── 装備チェックリスト（カーセンサー / グーネット タブ）── */}
                <div className="border-t border-gray-100 pt-5 space-y-4">
                  <h2 className="text-sm font-bold text-gray-900">装備チェック</h2>

                  {renderChecklistTabHeader(
                    CARSENSOR_CATEGORIES.flatMap(c => c.items).filter(i => equipmentChecked.has(i)).length,
                    GOONET_CATEGORIES.flatMap(c => c.items).filter(i => goonetChecked.has(i)).length,
                    aiDetected.size,
                    goonetAiDetected.size,
                  )}

                  {checklistTab === 'carsensor'
                    ? renderCategoryChecklist(CARSENSOR_CATEGORIES, equipmentChecked, aiDetected, toggleEquipment)
                    : renderCategoryChecklist(GOONET_CATEGORIES, goonetChecked, goonetAiDetected, toggleGoonetEquipment)
                  }

                  {/* コピー＆リセット */}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onCopy(
                        checklistTab === 'carsensor' ? getCheckedEquipmentText() : getGoonetCheckedEquipmentText(),
                        'equip-list',
                      )}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        copied === 'equip-list'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100'
                      }`}
                    >
                      {copied === 'equip-list' ? '✓ コピー済み' : `${checklistTab === 'carsensor' ? 'カーセンサー' : 'グーネット'}装備をコピー`}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (checklistTab === 'carsensor') { setEquipmentChecked(new Set()); setAiDetected(new Set()); }
                        else { setGoonetChecked(new Set()); setGoonetAiDetected(new Set()); }
                      }}
                      className="px-3 py-2 rounded-xl text-xs text-gray-400 border border-gray-200 hover:border-gray-300 hover:text-gray-600 transition-all cursor-pointer"
                    >
                      リセット
                    </button>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-700">
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
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white transition-colors"
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
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white disabled:bg-gray-50 disabled:text-gray-400 transition-colors"
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
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 disabled:bg-gray-50 disabled:text-gray-400 transition-colors"
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
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white transition-colors"
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
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white transition-colors"
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
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white transition-colors"
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
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white transition-colors"
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
                                className={`text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer select-none ${
                                  checked
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-600 text-white font-medium shadow-sm'
                                    : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50'
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
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-y transition-colors"
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 text-white font-semibold py-3.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 disabled:shadow-none disabled:translate-y-0"
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
                    : mode === 'photo' ? `${photoFiles.length}枚を解析して登録シートを作成する`
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

        <p className="text-center text-xs text-gray-400 pb-6 pt-2">
          松下モータース 社内専用 &nbsp;·&nbsp; 車両情報/マルチAIアシスタント &nbsp;·&nbsp; 利用制限なし
        </p>
      </main>
    </div>
  );
}

function ResultHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/30">
        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-base font-bold text-gray-900">{label}</h2>
    </div>
  );
}
