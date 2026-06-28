// 車種・グレード別オプションデータベース
// キー: モデルコードの型式部分（例: "A202A-GBSH"）または trimCode
// 追加したい車種はここに追記するだけでOK

export interface GradeOptionData {
  gradeName: string;           // グレード名（確認用）
  standardEquipment: string[]; // 標準装備（possibleOptionsから除外）
  makerOptions: string[];      // メーカーオプション（有償追加）
  dealerOptions: string[];     // ディーラーオプション（販社追加）
}

// キー: modelCodeの末尾グレードコード部分、または trimCode で引く
const VEHICLE_GRADE_DB: Record<string, GradeOptionData> = {

  // ── トヨタ ライズ ハイブリッド Z (5AA-A202A-GBSH) ──────────────────────
  'A202A-GBSH': {
    gradeName: 'ライズ ハイブリッド Z',
    standardEquipment: [
      'フロントフォグランプ', 'ヘッドライト：LED', 'アルミホイール',
      'スマートキー', 'キーレス', 'パワーウインドウ', 'パワステ',
      'エアコン・クーラー', 'ABS', '横滑り防止装置', 'サポカー',
      'エアバッグ：運転席', 'エアバッグ：助手席', 'エアバッグ：サイド', 'エアバッグ：カーテン',
      '衝突被害軽減ブレーキ', 'レーンキープアシスト', 'アダプティブクルーズコントロール',
      'オートマチックハイビーム', '誤発進防止装置', '障害物センサー',
      'ディスプレイオーディオ', 'TV', 'ミュージックプレイヤー接続可',
      'カメラ：バック', 'アイドリングストップ',
    ],
    makerOptions: [
      'パノラマモニター（全周囲カメラ）',
      'ブラインドスポットモニター',
      'シートエアコン（ベンチレーション）',
      'ワイヤレス充電',
      'コーナリングランプ',
    ],
    dealerOptions: [
      'ETC2.0',
      'ドライブレコーダー（前後）',
      'カーナビ',
    ],
  },

  // ── トヨタ ライズ Z (3BA-A200A-GBSH / 5BA-A210A-GBSH など) ────────────
  'A200A-GBSH': {
    gradeName: 'ライズ Z（ガソリン）',
    standardEquipment: [
      'フロントフォグランプ', 'ヘッドライト：LED', 'アルミホイール',
      'スマートキー', 'キーレス', 'パワーウインドウ', 'パワステ',
      'エアコン・クーラー', 'ABS', '横滑り防止装置', 'サポカー',
      'エアバッグ：運転席', 'エアバッグ：助手席', 'エアバッグ：サイド', 'エアバッグ：カーテン',
      '衝突被害軽減ブレーキ', 'レーンキープアシスト', 'アダプティブクルーズコントロール',
      'オートマチックハイビーム', 'ディスプレイオーディオ', 'TV', 'ミュージックプレイヤー接続可',
      'カメラ：バック',
    ],
    makerOptions: [
      'パノラマモニター（全周囲カメラ）',
      'ブラインドスポットモニター',
      'シートエアコン（ベンチレーション）',
      'ワイヤレス充電',
      'コーナリングランプ',
    ],
    dealerOptions: [
      'ETC2.0',
      'ドライブレコーダー（前後）',
      'カーナビ',
    ],
  },

  // ── 追加例: トヨタ アクア Z (6AA-MXPK11-GBSH) ─────────────────────────
  // 'MXPK11-GBSH': {
  //   gradeName: 'アクア Z',
  //   standardEquipment: [...],
  //   makerOptions: [...],
  //   dealerOptions: [...],
  // },

};

// modelCode から DB エントリを検索
// "5AA-A202A-GBSH" → "A202A-GBSH" のようにプレフィックスを除いて照合
export function lookupGradeOptions(modelCode: string, trimCode?: string): GradeOptionData | null {
  if (!modelCode && !trimCode) return null;

  // trimCode で直接引く
  if (trimCode && VEHICLE_GRADE_DB[trimCode]) return VEHICLE_GRADE_DB[trimCode];

  // modelCode から排ガス規制プレフィックス（3BA-, 5AA- 等）を除いたキーで引く
  const key = modelCode.replace(/^[0-9][A-Z]{2}-/, '');
  if (VEHICLE_GRADE_DB[key]) return VEHICLE_GRADE_DB[key];

  // 部分一致: 例 "A202A" がキーに含まれる場合
  for (const k of Object.keys(VEHICLE_GRADE_DB)) {
    if (key.startsWith(k) || k.startsWith(key.split('-')[0])) {
      return VEHICLE_GRADE_DB[k];
    }
  }

  return null;
}
