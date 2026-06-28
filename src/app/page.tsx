'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { CAR_DATA, COLORS, OPTION_GROUPS } from '@/lib/car-data';

// ── Types ──────────────────────────────────────────────────────────────
type Mode = 'reply' | 'photo';

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
  instagram: string;
  instagramHashtags: string;
  blogTitle: string;
  blog: string;
}

// OCRフェーズ1の返却型（文章生成前）
interface PhotoOcrResult {
  mode: 'photo_ocr';
  chassisNumber: string;
  modelCode: string;
  colorCode: string;
  trimCode: string;
  year: string;
  grade: string;
  equipment: string[];
  notes: string;
  vehicleDesc: string;
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
    label: '写真を撮るだけ → 全部完結',
    desc: 'カーセンサー/グーネット登録 ＋ Instagram投稿 ＋ ブログ記事をまとめて自動生成',
    icon: '📸',
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

// AI出力テキスト → カーセンサー装備項目 のキーワードマッピング（カーセンサー/グーネット登録スペシャリスト仕様）
const EQUIPMENT_KEYWORDS: Record<string, string[]> = {
  // ── インテリア ──
  'スマートキー':    ['スマートキー', 'インテリジェントキー', 'アドバンスドキー', 'プッシュスタート', 'シームレスエントリー', 'E-Four', 'キーフリー'],
  'キーレス':        ['キーレス', 'キーレスエントリー', 'キーレスオープン'],
  'パワーウインドウ': ['パワーウインドウ', 'パワーウィンドウ', 'ワンタッチウィンドウ'],
  '後席モニター':    ['後席モニター', 'リアモニター', 'フリップダウンモニター', '後席ディスプレイ', 'ヘッドレストモニター', 'リアシートエンターテインメント'],
  'シートヒーター':  ['シートヒーター', 'シートウォーマー', 'ヒーテッドシート'],
  'シートエアコン':  ['シートエアコン', 'シートベンチレーション', '通気シート', 'ベンチレーテッドシート', 'クーリングシート'],
  '本革シート':      ['本革シート', '本革', 'フルレザー', 'ナッパレザー', 'セミアニリンレザー'],
  '3列シート':       ['3列シート', '7人乗り', '8人乗り', '7名乗り', '8名乗り', '3列'],
  'フルフラットシート': ['フルフラットシート', 'フルフラット', 'フラットモード'],
  'ウォークスルー':  ['ウォークスルー', 'ウォークスルーシート'],
  '電動シート':      ['電動シート', 'パワーシート', '電動スライドシート', 'ポジションメモリー', '電動リクライニング'],
  'オットマン':      ['オットマン', 'フットレスト', 'レッグレスト'],
  'ベンチシート':    ['ベンチシート', 'ベンチ型シート'],

  // ── エクステリア ──
  'ヘッドライト：LED': ['ヘッドライト：LED', 'LEDヘッドライト', 'LEDヘッドランプ', 'LED', 'マトリクスLED', 'アダプティブLED', 'BIビームLED'],
  'フロントフォグランプ': ['フォグランプ', 'フォグライト', 'LEDフォグ', 'フロントフォグ'],
  'サンルーフ・ガラスルーフ': ['サンルーフ', 'ガラスルーフ', 'ムーンルーフ', 'ガラスパノラマルーフ', 'パノラマサンルーフ', 'チルトアップガラスルーフ'],
  'ルーフレール':    ['ルーフレール', 'ルーフキャリア', 'ルーフラック'],
  'フルエアロ':      ['フルエアロ', 'エアロパーツ', 'エアロキット', 'モデリスタ', 'TRD', 'ムーンクラフト', 'スポーツパッケージ', 'エアロバンパー'],
  'アルミホイール':  ['アルミホイール', 'アルミ', '純正アルミ', 'アルミスパッタリング'],
  'ローダウン':      ['ローダウン', '車高調', '車高短'],
  'リフトアップ':    ['リフトアップ', 'ハイリフト', '悪路仕様'],
  'スライドドア：両側(電動)': ['スライドドア：両側(電動)', '両側パワースライドドア', '両側電動スライド', 'パワースライドドア両側', '両側電動ドア', 'デュアルパワースライド'],
  '全塗装済':        ['全塗装', 'オールペイント', 'フルペイント'],

  // ── 快適装備 ──
  '過給器設定モデル': ['ターボ', 'スーパーチャージャー', 'ツインターボ', 'TURBO', 'e-TURBO',
                       '過給器', '過給機', 'ターボチャージャー', 'スーパーチャージャー付き'],
  // ※ マイルドハイブリッド・HEV・PHEVは過給器ではないため除外
  'エアコン・クーラー': ['エアコン', 'クーラー', 'オートエアコン', 'フルオートエアコン', 'マニュアルエアコン'],
  'Wエアコン':       ['Wエアコン', 'デュアルエアコン', 'リアエアコン', '後席エアコン', 'ツインエアコン', 'リアクーラー'],
  'カーナビ':        ['カーナビ', 'ナビ', 'ナビゲーション', '純正ナビ', 'SDナビ', 'メモリーナビ', 'HDDナビ', 'T-Connect', 'Honda CONNECT', 'NissanConnect', 'マツダコネクト', 'スターリンク', 'MMCS',
                     '純正カーナビ（7インチ）', '純正カーナビ（8インチ）', '純正カーナビ（9インチ）',
                     '純正カーナビ（10インチ）', '純正カーナビ（11インチ）', '純正カーナビ（12インチ）'],
  'TV':              ['TV', 'テレビ', 'フルセグ', 'ワンセグ', '地デジ', 'テレビチューナー'],
  'ディスプレイオーディオ': ['ディスプレイオーディオ', 'DA', 'Apple CarPlay', 'Android Auto', 'コネクトナビ',
                             'ディスプレイオーディオ（7インチ）', 'ディスプレイオーディオ（8インチ）',
                             'ディスプレイオーディオ（9インチ）', 'ディスプレイオーディオ（10インチ）',
                             'ディスプレイオーディオ（11インチ）', 'ディスプレイオーディオ（12インチ）'],
  'ミュージックプレイヤー接続可': ['USB', 'Bluetooth', 'AUX', 'スマホ連携', 'ミラーリング'],
  'ETC':             ['ETC', 'ETC2.0', 'スマートETC', 'ETC車載器'],
  'ドライブレコーダー': ['ドライブレコーダー', 'ドラレコ', '前後ドラレコ', '360度ドラレコ', '前後録画'],
  'エアサスペンション': ['エアサスペンション', 'エアサス', 'AIRMATIC', 'AIR SUSPENSION'],
  '1500W給電':       ['1500W', '100V電源', 'AC100V', 'コンセント', '給電機能', '外部給電', 'V2H'],
  '寒冷地仕様':      ['寒冷地仕様', '北海道仕様', '寒冷地'],

  // ── 安全装備 ──
  'パワステ':        ['パワーステアリング', 'パワステ', '電動パワステ', 'EPS'],
  'ABS':             ['ABS', 'アンチロックブレーキ'],
  'サポカー':        ['サポカー', 'サポカーS', '安全装備', '予防安全'],
  '衝突被害軽減ブレーキ': ['衝突被害軽減ブレーキ', '衝突軽減', '自動ブレーキ', 'プリクラッシュ', 'AEBS', 'AEB',
                          'Toyota Safety Sense', 'Honda SENSING', 'ProPilot', 'EyeSight',
                          'i-Activsense', 'e-Assist', 'スマートアシスト', 'DCBS', 'デュアルカメラブレーキサポート',
                          'スズキセーフティサポート', 'Forward Emergency Braking', 'プリセーフブレーキ',
                          '衝突軽減ブレーキ', 'LKAS', 'インテリジェントエマージェンシーブレーキ'],
  'アダプティブクルーズコントロール': ['アダプティブクルーズコントロール', 'アダプティブクルーズ', 'レーダークルーズ',
                                       'ACC', '全車速追従', 'ProPilot', 'レーザークルーズ',
                                       'インテリジェントクルーズコントロール', '追従クルーズ', 'ドライビングアシスト'],
  'レーンキープアシスト': ['レーンキープアシスト', 'レーンキープ', 'LKA', 'LKAS', 'LDA', 'レーン逸脱警報',
                           'レーンディパーチャーアラート', 'レーントレーシングアシスト', 'LTA'],
  'パーキングアシスト': ['パーキングアシスト', '自動駐車', 'インテリジェントパーキングアシスト', 'アドバンストパーク',
                         'パーキングサポートブレーキ', 'PKSB'],
  '誤発進防止装置':  ['誤発進防止', '誤発進抑制', 'ペダル踏み間違い', 'パーキングサポートブレーキ', 'PKSB', '発進抑制'],
  '障害物センサー':  ['障害物センサー', 'クリアランスソナー', 'コーナーセンサー', 'パーキングソナー', 'ソナー', 'センサー警告'],
  'エアバッグ：運転席': ['運転席エアバッグ', 'ドライバーエアバッグ', 'SRSエアバッグ'],
  'エアバッグ：助手席': ['助手席エアバッグ', 'フロントエアバッグ', 'パッセンジャーエアバッグ'],
  'エアバッグ：サイド': ['サイドエアバッグ', '前席サイドエアバッグ', 'サイドSRSエアバッグ'],
  'エアバッグ：カーテン': ['カーテンエアバッグ', 'カーテンシールドエアバッグ', 'ロールカーテンエアバッグ', 'サイドカーテン'],
  '頸部衝撃緩和ヘッドレスト': ['頸部衝撃緩和', 'ホイップラッシュ', 'WIL'],
  '全周囲カメラ':    ['全周囲カメラ', 'パノラミックビューモニター', '360度カメラ', '全方位カメラ',
                      'アラウンドビューモニター', 'マルチアラウンドモニター', 'サラウンドビューモニター', 'パノラマモニター'],
  'カメラ：バック':  ['カメラ：バック', 'バックカメラ', 'リアカメラ', 'バックモニター', 'リアビューカメラ', 'バックビューカメラ'],
  'カメラ：フロント': ['カメラ：フロント', 'フロントカメラ', 'フロントビューカメラ', 'ノーズビューカメラ'],
  'カメラ：サイド':  ['カメラ：サイド', 'サイドカメラ', '真横確認カメラ', 'サイドビューカメラ', 'ブラインドスポットビュー'],
  'ブラインドスポットモニター': ['ブラインドスポットモニター', 'ブラインドスポット', 'BSM', 'BSW', '後側方警報', 'サイドモニター警告',
                                 'インテリジェントBSI', 'リアサイドモニター'],
  '横滑り防止装置':  ['横滑り防止装置', '横滑り防止', 'VSC', 'ESC', 'VDC', 'スタビリティコントロール', 'アクティブスタビリティコントロール'],
  'ヒルディセントコントロール': ['ヒルディセントコントロール', 'HDC', 'ダウンヒルアシスト', 'ヒルスタート'],
  'アイドリングストップ': ['アイドリングストップ', 'アイスト', 'エコアイドル', 'S&S', 'ストップ&スタート'],
  '盗難防止装置':    ['盗難防止装置', '盗難防止', 'イモビライザー', 'セキュリティアラーム', 'ブレーキロック'],
  'オートマチックハイビーム': ['オートマチックハイビーム', 'AHB', 'オートハイビーム', 'ハイビームアシスト', 'アダプティブハイビーム'],
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

// C-MATCH bookmarklet: reads window.name (set when opening C-MATCH via DX system button)
const CMATCH_BOOKMARKLET = "javascript:(function(){var raw=window.name||'';var d=null;if(raw.startsWith('cs:')){try{d=JSON.parse(raw.slice(3));}catch(e){}}if(!d){alert('DXシステムの「C-MATCHで開く」ボタンから開いてください。\n（通常のブラウザ操作で開いたページには転記できません）');return;}var M={'パワーウインドウ':'パワーウィンドウ','エアバッグ：運転席':'運転席エアバッグ','エアバッグ：助手席':'助手席エアバッグ','エアバッグ：サイド':'サイドエアバッグ','エアバッグ：カーテン':'カーテンエアバッグ','カメラ：バック':'バックカメラ','カメラ：フロント':'フロントカメラ','カメラ：サイド':'サイドカメラ','サンルーフ・ガラスルーフ':'サンルーフ','スライドドア：両側(電動)':'スライドドア','ヘッドライト：LED':'HID','寒冷地仕様':'寒冷地仕様車','誤発進防止装置':'踏み間違い','アダプティブクルーズコントロール':'クルーズコントロール','カーナビ':'ナビ'};var toCheck=new Set();(d.equipment||[]).forEach(function(e){toCheck.add(M[e]||e);});var n=0;document.querySelectorAll('label').forEach(function(l){var t=l.textContent.trim();toCheck.forEach(function(k){if(t.includes(k)){var inp=document.getElementById(l.htmlFor)||l.querySelector('input[type=checkbox]');if(inp&&inp.type==='checkbox'&&!inp.checked){inp.checked=true;inp.dispatchEvent(new Event('change',{bubbles:true}));n++;}}});});function fill(kw,val){if(!val)return;document.querySelectorAll('label').forEach(function(l){if(!l.textContent.includes(kw))return;var inp=l.htmlFor?document.getElementById(l.htmlFor):null;if(!inp)inp=l.querySelector('input:not([type=checkbox]),textarea');if(!inp){var nx=l.nextElementSibling;if(nx&&/^(INPUT|TEXTAREA)$/.test(nx.tagName))inp=nx;}if(inp){inp.value=val;['input','change'].forEach(function(ev){inp.dispatchEvent(new Event(ev,{bubbles:true}));});}});}fill('車台番号',d.chassisNumber);fill('グレード補記',d.gradeNote);alert('C-MATCH転記完了！\n✓ 装備 '+n+' 件自動チェック\n✓ 車台番号・グレード補記 入力済\n\n手入力が必要な項目：\n・型式指定番号 → 反映（メーカー・車種・グレード自動入力）\n・価格 ・ 走行距離 ・ 車検 ・ 修復歴 ・ 保証');})();";

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
      className={`text-[11px] font-semibold flex items-center gap-1.5 shrink-0 transition-all duration-200 cursor-pointer px-2.5 py-1 rounded-full ${
        done
          ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
          : 'bg-white/80 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 ring-1 ring-gray-200 hover:ring-indigo-200'
      }`}
    >
      {done ? (
        <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>コピー済み</>
      ) : (
        <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>コピー</>
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
    <div className="rounded-2xl overflow-hidden border border-gray-100">
      <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-4 py-2.5 flex items-center justify-between border-b border-gray-100">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
        <CopyBtn text={text} id={id} copied={copied} onCopy={onCopy} />
      </div>
      <div className="bg-white px-4 py-3.5">
        <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
      </div>
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
  const [equipmentChecked, setEquipmentChecked] = useState<Set<string>>(new Set());
  const [aiDetected, setAiDetected]       = useState<Set<string>>(new Set());
  const [goonetChecked, setGoonetChecked] = useState<Set<string>>(new Set());
  const [goonetAiDetected, setGoonetAiDetected] = useState<Set<string>>(new Set());
  const [checklistTab, setChecklistTab]   = useState<'carsensor' | 'goonet'>('carsensor');
  const [photoTab, setPhotoTab]           = useState<'carsensor' | 'instagram' | 'blog'>('carsensor');
  const [regenerating, setRegenerating]   = useState(false);
  const [cmatchSaved, setCmatchSaved]     = useState(false);
  const [loadingPhase, setLoadingPhase]   = useState<'ocr' | 'content' | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const fileInputRef                      = useRef<HTMLInputElement>(null);
  const resultRef                         = useRef<HTMLDivElement>(null);

  const canSubmit =
    mode === 'photo' ? photoFiles.length > 0 :
    inquiry.trim() !== '';

  const currentModels = CAR_DATA.find(m => m.name === maker)?.models ?? [];
  const currentGrades = currentModels.find(m => m.name === model)?.grades ?? [];
  const YEARS = Array.from({ length: 27 }, (_, i) => 2026 - i);

  const saveToCmatch = useCallback(() => {
    if (!editableFields) return;
    const data = {
      chassisNumber: editableFields.chassisNumber,
      modelCode:     editableFields.modelCode,
      year:          editableFields.year,
      grade:         editableFields.grade,
      gradeNote:     (result as PhotoResult | null)?.gradeNote ?? '',
      equipment:     Array.from(equipmentChecked),
    };
    const encoded = 'cs:' + JSON.stringify(data);
    const w = window.open('about:blank', '_blank');
    if (w) {
      w.name = encoded;
      w.location.href = 'https://c-match.carsensor.net/vehicles/registBasicInfo/';
      setCmatchSaved(true);
      setTimeout(() => setCmatchSaved(false), 4000);
    }
  }, [editableFields, result, equipmentChecked]);

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

  // オーディオレス時に除外するカーセンサー項目
  const AUDIOLESS_EXCLUDE_CS = new Set(['カーナビ', 'TV', 'ディスプレイオーディオ', 'ミュージックプレイヤー接続可']);
  // オーディオレス時に除外するグーネット項目
  const AUDIOLESS_EXCLUDE_GN = new Set(['カーナビ', 'TV', 'オーディオ', 'ビジュアル', 'ポータブルナビ']);

  function isAudioless(aiEquipment: string[]): boolean {
    return aiEquipment.some(e => e.includes('オーディオレス') || e.toLowerCase().includes('audio-less') || e.includes('オーディオ無し') || e.includes('ナビレス'));
  }

  function matchEquipmentToChecklist(aiEquipment: string[]): Set<string> {
    const result = new Set<string>();
    const audioless = isAudioless(aiEquipment);
    const allItems = CARSENSOR_CATEGORIES.flatMap(c => c.items);
    for (const detected of aiEquipment) {
      const d = detected.replace('（推測）', '').trim();
      for (const item of allItems) {
        if (audioless && AUDIOLESS_EXCLUDE_CS.has(item)) continue;
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
    const audioless = isAudioless(aiEquipment);
    const allItems = GOONET_CATEGORIES.flatMap(c => c.items);
    for (const detected of aiEquipment) {
      const d = detected.replace('（推測）', '').trim();
      for (const item of allItems) {
        if (audioless && AUDIOLESS_EXCLUDE_GN.has(item)) continue;
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
          className={`text-[11px] px-2.5 py-1 rounded-full border transition-all duration-150 cursor-pointer select-none font-medium ${
            isChecked && isAI
              ? 'bg-amber-500 border-amber-500 text-white shadow-sm shadow-amber-200'
              : isChecked
              ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-200'
              : 'bg-white border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50'
          }`}
        >
          {isChecked ? <span className="mr-0.5 opacity-80">✓</span> : null}{item}
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
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${CAT_COLORS[cat.color] ?? 'bg-gray-600 text-white'}`}>
              {cat.label}
            </span>
            {checkedCount > 0 && (
              <span className="text-[10px] text-indigo-500 font-semibold bg-indigo-50 rounded-full px-1.5 py-0.5">{checkedCount}</span>
            )}
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
    return new Promise((resolve, reject) => {
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
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`画像読み込み失敗: ${file.name}`)); };
      img.src = url;
    });
  }

  function isHeic(file: File): boolean {
    if (file.type === 'image/heic' || file.type === 'image/heif') return true;
    const ext = file.name.split('.').pop()?.toLowerCase();
    return ext === 'heic' || ext === 'heif';
  }

  // HEIC → JPEG 変換（3段階フォールバック）
  async function heicToResizedJpeg(file: File): Promise<{ base64: string; mediaType: string; preview: string }> {
    // ① <img> 経由リサイズ — macOS Safari/Chrome は OS HEIC デコーダーで img.onload が発火する
    try {
      const { base64, mediaType } = await resizeImage(file);
      return { base64, mediaType, preview: URL.createObjectURL(file) };
    } catch { /* 次へ */ }

    // ② createImageBitmap
    try {
      const MAX = 1120;
      const bitmap = await createImageBitmap(file);
      let { width, height } = bitmap;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
        else { width = Math.round(width * MAX / height); height = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height);
      bitmap.close();
      const base64 = canvas.toDataURL('image/jpeg', 0.88).split(',')[1];
      return { base64, mediaType: 'image/jpeg', preview: canvas.toDataURL('image/jpeg', 0.35) };
    } catch { /* 次へ */ }

    // ③ heic2any (WASM — next.config.ts の asyncWebAssembly:true で有効化)
    try {
      const mod = await import('heic2any');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const convert: (o: unknown) => Promise<Blob | Blob[]> = (mod as any).default ?? mod;
      const result = await convert({ blob: file, toType: 'image/jpeg', quality: 0.88 });
      const blob = Array.isArray(result) ? result[0] : result;
      const jpegFile = new File([blob], file.name, { type: 'image/jpeg' });
      const { base64, mediaType } = await resizeImage(jpegFile);
      return { base64, mediaType, preview: URL.createObjectURL(jpegFile) };
    } catch { /* 次へ */ }

    // ④ サーバー側 Sharp 変換 (FormData で送るため base64 膨張なし、4MB以下なら確実)
    if (file.size < 4 * 1024 * 1024) {
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/convert-heic', { method: 'POST', body: fd });
        if (res.ok) {
          const { base64, mediaType } = await res.json() as { base64: string; mediaType: string };
          const preview = `data:image/jpeg;base64,${base64.slice(0, 2000)}`; // 小さいプレビュー
          return { base64, mediaType, preview };
        }
      } catch { /* 次へ */ }
    }

    // 全手段失敗
    throw new Error(`HEICの変換に失敗しました: ${file.name}`);
  }

  async function addPhotoFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter(f =>
      f.type.startsWith('image/') || isHeic(f)
    ).slice(0, 80);

    const results = await Promise.allSettled(arr.map(async file => {
      if (isHeic(file)) {
        const { base64, mediaType, preview } = await heicToResizedJpeg(file);
        return { name: file.name, base64, mediaType, preview };
      }
      const { base64, mediaType } = await resizeImage(file);
      return { name: file.name, base64, mediaType, preview: URL.createObjectURL(file) };
    }));

    const processed = results.flatMap(r => r.status === 'fulfilled' ? [r.value] : []);
    const failed = results.filter(r => r.status === 'rejected').length;
    if (failed > 0) setError(`${failed}枚の読み込みに失敗しました`);
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

  function applyOcrData(data: { chassisNumber: string; modelCode: string; colorCode: string; trimCode: string; year: string; grade: string; equipment: string[] }) {
    const eq = data.equipment;
    const csDetected = matchEquipmentToChecklist(eq);
    const gnDetected = matchEquipmentToGoonetChecklist(eq);
    setAiDetected(csDetected);
    setGoonetAiDetected(gnDetected);
    if (isAudioless(eq)) {
      setEquipmentChecked(() => {
        const next = new Set(csDetected);
        AUDIOLESS_EXCLUDE_CS.forEach(item => next.delete(item));
        return next;
      });
      setGoonetChecked(() => {
        const next = new Set(gnDetected);
        AUDIOLESS_EXCLUDE_GN.forEach(item => next.delete(item));
        return next;
      });
    } else {
      setEquipmentChecked(new Set(csDetected));
      setGoonetChecked(new Set(gnDetected));
    }
    setEditableFields({
      chassisNumber: data.chassisNumber ?? '',
      modelCode:     data.modelCode     ?? '',
      colorCode:     data.colorCode     ?? '',
      trimCode:      data.trimCode      ?? '',
      year:          data.year          ?? '',
      grade:         data.grade         ?? '',
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setResult(null);
    setEditableFields(null);
    setEquipmentChecked(new Set());
    setGoonetChecked(new Set());

    if (mode !== 'photo') {
      // 返信メールは従来どおり
      setLoading(true);
      try {
        const res = await fetch('/api/optimize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode, inquiry }),
          signal: AbortSignal.timeout(90_000),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '生成に失敗しました');
        setResult(data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : '生成に失敗しました';
        setError(msg.includes('timeout') || msg.includes('abort') ? 'タイムアウトしました。もう一度お試しください。' : msg);
      } finally {
        setLoading(false);
      }
      return;
    }

    // ── 写真モード: 2フェーズ ──────────────────────────────────────────
    // フェーズ1: OCR（車両ID・装備）を先に取得して即表示
    setLoading(true);
    setLoadingPhase('ocr');
    let vehicleDesc = '';
    let ocrData: PhotoOcrResult | null = null;

    try {
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'photo', images: photoFiles.map(f => ({ base64: f.base64, mediaType: f.mediaType })), ocr_only: true }),
        signal: AbortSignal.timeout(120_000),
      });
      const rawText = await res.text();
      if (!res.ok) {
        let msg = `サーバーエラー (${res.status})`;
        if (res.status === 413) msg = '画像データが大きすぎます。枚数を減らすか、解像度を下げてください。';
        else { try { msg = (JSON.parse(rawText) as { error: string }).error || msg; } catch { /* use default */ } }
        throw new Error(msg);
      }
      const data = JSON.parse(rawText) as PhotoOcrResult & { vehicleDesc: string };
      ocrData = data;
      vehicleDesc = data.vehicleDesc;

      // OCR結果を即座に表示（仮のPhotoResultとして）
      setResult({
        mode: 'photo',
        chassisNumber:    data.chassisNumber,
        modelCode:        data.modelCode,
        colorCode:        data.colorCode,
        trimCode:         data.trimCode,
        year:             data.year,
        grade:            data.grade,
        equipment:        data.equipment,
        notes:            data.notes,
        gradeNote:        '',
        appealPoints:     [],
        instagram:        '',
        instagramHashtags:'',
        blogTitle:        '',
        blog:             '',
      });
      setPhotoTab('carsensor');
      applyOcrData(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'OCR解析に失敗しました';
      setError(msg.includes('timeout') || msg.includes('abort') ? '解析がタイムアウトしました。写真枚数を減らしてお試しください。' : msg);
      setLoading(false);
      setLoadingPhase(null);
      return;
    } finally {
      setLoading(false);
      setLoadingPhase(null);
    }

    // フェーズ2: 文章生成（バックグラウンドで継続）
    if (!ocrData) return;
    setContentLoading(true);
    try {
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'photo', regenerate: true, vehicleDesc }),
        signal: AbortSignal.timeout(120_000),
      });
      const rawText2 = await res.text();
      if (!res.ok) throw new Error('文章生成に失敗しました');
      const data = JSON.parse(rawText2) as { gradeNote?: string; appealPoints?: string[]; instagram?: string; instagramHashtags?: string; blogTitle?: string; blog?: string };
      setResult(prev => prev && prev.mode === 'photo' ? {
        ...prev,
        gradeNote:         data.gradeNote         ?? '',
        appealPoints:      data.appealPoints       ?? [],
        instagram:         data.instagram          ?? '',
        instagramHashtags: data.instagramHashtags  ?? '',
        blogTitle:         data.blogTitle          ?? '',
        blog:              data.blog               ?? '',
      } : prev);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (!msg.includes('abort')) {
        setError('文章生成に失敗しました。「再生成」ボタンで再試行できます。');
      }
    } finally {
      setContentLoading(false);
    }
  }

  async function handleRegenerate() {
    if (!editableFields || !result || result.mode !== 'photo') return;
    const r = result as PhotoResult;
    setRegenerating(true);
    setError('');
    const ef = editableFields;
    const vehicleDesc = [
      ef.year      ? `年式: ${ef.year}`          : null,
      ef.grade     ? `グレード: ${ef.grade}`      : null,
      ef.modelCode ? `型式: ${ef.modelCode}`      : null,
      ef.colorCode ? `カラーコード: ${ef.colorCode}` : null,
      r.equipment.length > 0 ? `検出装備: ${r.equipment.join('・')}` : null,
    ].filter(Boolean).join('\n') || '（車両情報不明）';
    try {
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'photo', regenerate: true, vehicleDesc }),
      });
      const rawText3 = await res.text();
      if (!res.ok) throw new Error('再生成に失敗しました');
      const data = JSON.parse(rawText3) as {
        gradeNote?: string; appealPoints?: string[];
        instagram?: string; instagramHashtags?: string; blogTitle?: string; blog?: string;
      };
      setResult(prev => prev && prev.mode === 'photo' ? {
        ...prev,
        gradeNote:         data.gradeNote         ?? (prev as PhotoResult).gradeNote,
        appealPoints:      data.appealPoints       ?? (prev as PhotoResult).appealPoints,
        instagram:         data.instagram         ?? (prev as PhotoResult).instagram,
        instagramHashtags: data.instagramHashtags ?? (prev as PhotoResult).instagramHashtags,
        blogTitle:         data.blogTitle         ?? (prev as PhotoResult).blogTitle,
        blog:              data.blog              ?? (prev as PhotoResult).blog,
      } : prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : '再生成に失敗しました');
    } finally {
      setRegenerating(false);
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
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-100/80 p-6 space-y-5 animate-fade-up">

        {/* ── 完了バナー ────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-xl shrink-0">✅</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-base">
                {contentLoading ? 'チェックリスト準備完了 — 文章生成中...' : 'カーセンサー登録シートが完成しました'}
              </p>
              <p className="text-sm text-emerald-100 mt-0.5">
                {contentLoading
                  ? 'チェックリストを確認しながらInstagram・ブログが生成されます'
                  : '下の「登録シート一括コピー」を押してカーセンサーに貼り付けるだけ'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setPhotoFiles([]);
                setEditableFields(null);
                setEquipmentChecked(new Set());
                setGoonetChecked(new Set());
                setAiDetected(new Set());
                setGoonetAiDetected(new Set());
                setError('');
              }}
              className="shrink-0 text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer"
            >
              次の車両
            </button>
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

        {/* ── 再生成ボタン ─────────────────────────────────────── */}
        {ef && (
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={regenerating}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold border-2 border-dashed transition-all cursor-pointer flex items-center justify-center gap-2 ${
              regenerating
                ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                : 'border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400'
            }`}
          >
            {regenerating ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Instagram・ブログ・グレード補記を更新中...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                上記の情報でInstagram・ブログ・グレード補記を再生成
              </>
            )}
          </button>
        )}

        {/* ── 結果タブ ─────────────────────────────────────────── */}
        <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          {/* タブヘッダー */}
          <div className="flex bg-slate-50/80 border-b border-gray-100">
            {([
              { id: 'carsensor', label: 'カーセンサー / グーネット', icon: '🗂️' },
              { id: 'instagram', label: 'Instagram',                 icon: '📱' },
              { id: 'blog',      label: '自社ブログ',                icon: '📝' },
            ] as const).map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPhotoTab(tab.id)}
                className={`flex-1 py-3 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  photoTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-white/60'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split('/')[0].trim()}</span>
              </button>
            ))}
          </div>

          <div className="p-4">

            {/* ── カーセンサー / グーネット タブ ─── */}
            {photoTab === 'carsensor' && (
              <div className="space-y-4">
                {r.equipment.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5">
                    <p className="text-[11px] font-bold text-orange-700 mb-1">✓ AIが検出した装備 {r.equipment.length}件（チェックリストに自動反映済み）</p>
                    <p className="text-xs text-orange-600 leading-relaxed">{r.equipment.join(' ／ ')}</p>
                  </div>
                )}

                {/* 装備チェックリスト */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-gray-700">装備チェック</span>
                    <span className="text-[11px] text-gray-400">{totalChecked}項目選択中</span>
                  </div>
                  {renderChecklistTabHeader(totalCheckedCS, totalCheckedGN, aiDetected.size, goonetAiDetected.size)}
                  <div className="mt-3 space-y-4">
                    {checklistTab === 'carsensor'
                      ? renderCategoryChecklist(CARSENSOR_CATEGORIES, equipmentChecked, aiDetected, toggleEquipment)
                      : renderCategoryChecklist(GOONET_CATEGORIES, goonetChecked, goonetAiDetected, toggleGoonetEquipment)
                    }
                  </div>
                </div>

                {/* グレード補記 */}
                {r.gradeNote && (
                  <div className="rounded-2xl overflow-hidden border border-indigo-100">
                    <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                        <span className="text-[11px] font-bold text-white uppercase tracking-wider">グレード補記（100文字枠）</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold tabular-nums px-2 py-0.5 rounded-full ${r.gradeNote.length > 100 ? 'bg-red-100 text-red-600' : r.gradeNote.length > 85 ? 'bg-yellow-100 text-yellow-700' : 'bg-white/20 text-white'}`}>
                          {r.gradeNote.length}/100
                        </span>
                        <CopyBtn text={r.gradeNote} id="ph-grade-note" copied={copied} onCopy={onCopy} />
                      </div>
                    </div>
                    <div className="bg-indigo-50/50 px-4 py-3.5">
                      <p className="text-gray-900 text-sm leading-relaxed whitespace-pre-wrap font-medium">{r.gradeNote}</p>
                      {r.gradeNote.length > 100 && <p className="text-xs text-red-500 mt-2 flex items-center gap-1"><span>⚠</span> 100文字超。入力時に調整してください。</p>}
                    </div>
                  </div>
                )}

                {/* アピールポイント */}
                {r.appealPoints?.length > 0 && (
                  <div className="rounded-2xl overflow-hidden border border-gray-100">
                    <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                        <span className="text-[11px] font-bold text-white uppercase tracking-wider">アピールポイント</span>
                      </div>
                      <CopyBtn text={r.appealPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')} id="ph-appeals" copied={copied} onCopy={onCopy} />
                    </div>
                    <div className="bg-slate-50/50 px-4 py-3.5">
                      <ul className="space-y-2">
                        {r.appealPoints.map((point, i) => (
                          <li key={i} className="flex gap-2.5 text-sm text-gray-800">
                            <span className="w-5 h-5 bg-gradient-to-br from-slate-600 to-slate-800 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* 登録シート一括コピー */}
                <button
                  onClick={() => onCopy(registrationSheet, 'photo-all')}
                  className={`w-full py-4 rounded-2xl text-sm font-bold border-2 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2.5 ${
                    copied === 'photo-all'
                      ? 'bg-emerald-500 border-emerald-500 text-white glow-emerald'
                      : 'bg-gradient-to-r from-indigo-600 to-blue-600 border-transparent text-white shadow-lg shadow-indigo-500/25 glow-blue hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/30'
                  }`}
                >
                  {copied === 'photo-all' ? (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>コピー完了 — カーセンサーに貼り付けてください</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>登録シートを一括コピー（識別情報 ＋ グレード補記 ＋ アピール ＋ 装備）</>
                  )}
                </button>
                <button
                  onClick={() => onCopy(equipText, 'photo-equip')}
                  className={`w-full py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    copied === 'photo-equip' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {copied === 'photo-equip' ? '✓ コピー済み' : `${checklistTab === 'carsensor' ? 'カーセンサー' : 'グーネット'}装備チェックのみをコピー`}
                </button>

                {/* C-MATCH自動転記ボタン */}
                <div className="border-t border-gray-100 pt-3 mt-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5">C-MATCH連携</span>
                    <span className="text-[10px] text-gray-400">ブックマークレットを事前に設定してください</span>
                  </div>
                  <button
                    type="button"
                    onClick={saveToCmatch}
                    className={`w-full py-3 rounded-xl text-sm font-bold border-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      cmatchSaved
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : 'border-orange-400 text-orange-600 bg-orange-50 hover:bg-orange-100 hover:border-orange-500'
                    }`}
                  >
                    {cmatchSaved ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        C-MATCHを開きました — ブックマークバーの「C-MATCH転記」をクリック
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        C-MATCHで開く（新規物件登録ページへ）
                      </>
                    )}
                  </button>
                  {cmatchSaved && (
                    <p className="text-[11px] text-orange-600 text-center mt-1.5">
                      開いたC-MATCHのページで、ブックマークバーの「C-MATCH転記」をクリックしてください
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ── Instagram タブ ─── */}
            {photoTab === 'instagram' && (
              <div className="space-y-4">
                {r.instagram ? (
                  <>
                    <TextBlock label="Instagram 投稿文" text={r.instagram} id="ph-ig-post" copied={copied} onCopy={onCopy} />
                    <TextBlock label="ハッシュタグ" text={r.instagramHashtags} id="ph-ig-hash" copied={copied} onCopy={onCopy} />
                    <button
                      onClick={() => onCopy(`${r.instagram}\n\n${r.instagramHashtags}`, 'ph-ig-all')}
                      className={`w-full py-2.5 rounded-xl text-sm font-medium border transition-all cursor-pointer ${
                        copied === 'ph-ig-all' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100'
                      }`}
                    >
                      {copied === 'ph-ig-all' ? '✓ コピー済み' : '投稿文 ＋ ハッシュタグをコピー'}
                    </button>
                  </>
                ) : (
                  <div className="space-y-3 py-2">
                    <div className="h-3 bg-gray-100 rounded-full animate-pulse w-1/3" />
                    <div className="space-y-2">
                      {[1,0.9,0.8,0.7,0.6].map((w, i) => (
                        <div key={i} className="h-2.5 bg-gray-100 rounded-full animate-pulse" style={{ width: `${w * 100}%` }} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 text-center pt-1">Instagram投稿文を生成中...</p>
                  </div>
                )}
              </div>
            )}

            {/* ── ブログ タブ ─── */}
            {photoTab === 'blog' && (
              <div className="space-y-4">
                {r.blog ? (
                  <>
                    <TextBlock label="ブログ 記事タイトル" text={r.blogTitle} id="ph-bl-title" copied={copied} onCopy={onCopy} />
                    <TextBlock label="ブログ 本文" text={r.blog} id="ph-bl-body" copied={copied} onCopy={onCopy} />
                    <button
                      onClick={() => onCopy(`${r.blogTitle}\n\n${r.blog}`, 'ph-bl-all')}
                      className={`w-full py-2.5 rounded-xl text-sm font-medium border transition-all cursor-pointer ${
                        copied === 'ph-bl-all' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100'
                      }`}
                    >
                      {copied === 'ph-bl-all' ? '✓ コピー済み' : 'タイトル ＋ 本文をコピー'}
                    </button>
                  </>
                ) : (
                  <div className="space-y-3 py-2">
                    <div className="h-3 bg-gray-100 rounded-full animate-pulse w-1/3" />
                    <div className="space-y-2">
                      {[1,0.85,0.9,0.75,0.8,0.65].map((w, i) => (
                        <div key={i} className="h-2.5 bg-gray-100 rounded-full animate-pulse" style={{ width: `${w * 100}%` }} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 text-center pt-1">ブログ記事を生成中...</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── 備考 ───────────────────────────────────────────── */}
        {r.notes && (
          <div className="bg-slate-50 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-500 leading-relaxed">{r.notes}</p>
          </div>
        )}
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen page-bg">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="header-mesh sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center gap-4">
          {/* Logo mark */}
          <div className="w-10 h-10 rounded-2xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="text-[15px] font-bold text-white tracking-tight">松下モータース</h1>
              <span className="text-[10px] font-semibold bg-indigo-500/40 text-indigo-100 border border-indigo-400/30 rounded-full px-2 py-0.5 tracking-wide">DX SYSTEM</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">写真を撮るだけで登録作業を自動化</p>
          </div>
          <span className="text-[10px] font-semibold text-slate-500 bg-slate-800/60 border border-slate-700/60 rounded-full px-3 py-1 shrink-0">社内専用</span>
        </div>
      </header>

      <main className={`mx-auto px-4 py-7 space-y-5 ${mode === 'photo' ? 'max-w-5xl' : 'max-w-3xl'}`}>
        {/* ── Mode selector ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => selectMode(m.id)}
              className={`text-left p-4 rounded-2xl transition-all duration-200 cursor-pointer flex items-start gap-3.5 group ${
                mode === m.id
                  ? 'bg-gradient-to-br from-indigo-600 to-blue-600 shadow-lg shadow-indigo-500/25 glow-blue ring-1 ring-indigo-400/40'
                  : 'bg-white/80 backdrop-blur-sm border border-gray-200/80 hover:border-indigo-200 hover:shadow-md shadow-sm hover:-translate-y-0.5'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 transition-all ${
                mode === m.id ? 'bg-white/20' : 'bg-indigo-50 group-hover:bg-indigo-100'
              }`}>
                {m.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${mode === m.id ? 'text-white' : 'text-gray-900'}`}>{m.label}</p>
                <p className={`text-xs mt-1 leading-snug ${mode === m.id ? 'text-indigo-100' : 'text-gray-400'}`}>{m.desc}</p>
              </div>
              {mode === m.id && (
                <div className="w-5 h-5 bg-white/30 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Input form */}
        <div className={`bg-white/90 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-100/80 ${mode === 'photo' ? 'p-5' : 'p-6'}`}>
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
                    onDrop={e => {
                      e.preventDefault(); setDragOver(false);
                      // items API のほうが HEIC など非標準 MIME でも確実にファイルを取得できる
                      const files = Array.from(e.dataTransfer.items ?? [])
                        .filter(i => i.kind === 'file')
                        .map(i => i.getAsFile())
                        .filter((f): f is File => f !== null);
                      addPhotoFiles(files.length > 0 ? files : Array.from(e.dataTransfer.files));
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 select-none overflow-hidden ${
                      dragOver
                        ? 'border-indigo-400 bg-indigo-50 scale-[1.01]'
                        : 'border-gray-200 bg-gradient-to-b from-slate-50 to-white hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-inner'
                    }`}
                  >
                    <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden"
                      onChange={e => { if (e.target.files) addPhotoFiles(e.target.files); e.target.value = ''; }} />
                    <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center text-2xl transition-all ${dragOver ? 'bg-indigo-100 scale-110' : 'bg-indigo-50'}`}>📷</div>
                    <p className="text-sm font-bold text-gray-700">タップまたはドラッグして写真を追加</p>
                    <p className="text-xs text-gray-400 mt-1.5">コーションプレート・内装・外観を複数枚 ／ 最大80枚</p>
                    <div className="flex justify-center gap-2 mt-3">
                      {['コーションプレート', '内装', '外観'].map(tag => (
                        <span key={tag} className="text-[10px] bg-white border border-gray-200 text-gray-400 rounded-full px-2 py-0.5">{tag}</span>
                      ))}
                    </div>
                  </div>

                  {/* Photo grid */}
                  {photoFiles.length > 0 && (
                    <div className="max-h-52 overflow-y-auto rounded-xl border border-gray-200 p-2 bg-gray-50">
                      <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
                        {photoFiles.map((f, i) => (
                          <div key={i} className="relative group rounded overflow-hidden border border-gray-200 aspect-square bg-gray-100">
                            {f.preview ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={f.preview} alt={f.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center gap-0.5">
                                <span className="text-lg">📷</span>
                                <span className="text-[8px] text-gray-400 text-center px-0.5 leading-tight break-all">{f.name}</span>
                              </div>
                            )}
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

              </div>
            ) : false ? (
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

            {/* フェーズ別ローディング表示 */}
            {(loading || contentLoading) && mode === 'photo' && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span className="text-sm font-semibold text-blue-700">
                    {loadingPhase === 'ocr' ? '写真を解析中...' : 'Instagram・ブログ・グレード補記を生成中...'}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {[
                    { label: '写真解析', done: !loading && !!result },
                    { label: '文章生成', done: !contentLoading && !!(result as PhotoResult | null)?.instagram },
                  ].map((step, i) => (
                    <div key={i} className={`flex-1 rounded-full h-1.5 transition-all duration-700 ${step.done ? 'bg-emerald-400' : i === 0 && loading ? 'bg-blue-400 animate-pulse' : i === 1 && contentLoading ? 'bg-blue-400 animate-pulse' : 'bg-blue-100'}`} />
                  ))}
                </div>
                <p className="text-xs text-blue-500">
                  {loadingPhase === 'ocr'
                    ? '車台番号・装備・グレードを読み取っています（15〜20秒）'
                    : 'チェックリストを確認しながらお待ちください（10〜20秒）'}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || contentLoading || !canSubmit}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 text-white font-semibold py-3.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 disabled:shadow-none disabled:translate-y-0"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  写真解析中...
                </>
              ) : contentLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  文章生成中...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {mode === 'photo'
                    ? `${photoFiles.length}枚を解析 → カーセンサー登録 ＋ Instagram ＋ ブログを一括生成`
                    : '返信メールを下書きする'}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        <div ref={resultRef}>
          {result && result.mode === 'reply'  && renderReply(result)}
          {result && result.mode === 'photo'  && renderPhoto(result)}
        </div>

        {/* ── C-MATCHブックマークレット設置ガイド ── */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-200 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold bg-orange-500 text-white rounded-full px-2.5 py-0.5">C-MATCH連携 設定</span>
            <span className="text-xs font-semibold text-gray-700">ブックマークレットを一度だけ登録してください</span>
          </div>
          <ol className="text-xs text-gray-600 space-y-1.5 pl-1">
            <li className="flex gap-2"><span className="w-4 h-4 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">1</span><span>下のリンクをブラウザの<b>ブックマークバー</b>にドラッグ＆ドロップ（初回のみ）</span></li>
            <li className="flex gap-2"><span className="w-4 h-4 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">2</span><span>写真解析後、「<b>C-MATCHで開く</b>」ボタンを押す → 新しいタブでC-MATCHが自動で開く</span></li>
            <li className="flex gap-2"><span className="w-4 h-4 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">3</span><span>開いたC-MATCHのページで、ブックマークバーの「<b>C-MATCH転記</b>」をクリック</span></li>
          </ol>
          <div className="flex items-center gap-3 pt-1">
            <a
              href={CMATCH_BOOKMARKLET}
              onClick={e => e.preventDefault()}
              draggable
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm shadow-orange-300 transition-colors cursor-grab active:cursor-grabbing select-none"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
              C-MATCH転記
            </a>
            <span className="text-[11px] text-gray-400">← このボタンをブックマークバーにドラッグ</span>
          </div>
          <p className="text-[10px] text-gray-400">※ 自動入力される項目：車台番号・グレード補記・装備チェック50項目。価格・走行距離・車検・修復歴は手入力が必要です。</p>
        </div>

        <p className="text-center text-[11px] text-gray-400 pb-8 pt-2 flex items-center justify-center gap-2">
          <span className="w-1 h-1 bg-gray-300 rounded-full" />
          松下モータース 社内専用ツール
          <span className="w-1 h-1 bg-gray-300 rounded-full" />
          Powered by Claude AI
          <span className="w-1 h-1 bg-gray-300 rounded-full" />
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
