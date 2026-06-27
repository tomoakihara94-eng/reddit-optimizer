/**
 * 型式（車体形式コード）→ 車種名マッピング
 *
 * 型式例: "3BA-MXPK10"  →  ハイフン以降 "MXPK10" が車体形式コード
 * 前方一致で照合するため、長いコードを先に並べること
 */

export interface ModelEntry {
  vehicleName: string;    // vehicle-grades.ts の names[0] に一致させること
  maker: string;
  bodyCodes: string[];    // 型式のハイフン以降（前方一致）
  generation: string;
}

export const MODEL_CODE_DB: ModelEntry[] = [

  // ━━ スズキ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { vehicleName: 'ジムニー',      maker: 'スズキ', generation: '2018〜',
    bodyCodes: ['JB64'] },
  { vehicleName: 'ジムニーシエラ', maker: 'スズキ', generation: '2018〜',
    bodyCodes: ['JB74'] },
  { vehicleName: 'ハスラー',      maker: 'スズキ', generation: '2020〜',
    bodyCodes: ['MR92S', 'MR52S'] },
  { vehicleName: 'スペーシアギア', maker: 'スズキ', generation: '2023〜',
    bodyCodes: ['MK94S'] },
  { vehicleName: 'スペーシア',    maker: 'スズキ', generation: '2023〜',
    bodyCodes: ['MK94S', 'MK54S'] },  // MK94Sはスペーシアギアも兼ねる
  { vehicleName: 'ワゴンRスマイル', maker: 'スズキ', generation: '2021〜',
    bodyCodes: ['MX91S', 'MX81S'] },
  { vehicleName: 'ワゴンR',       maker: 'スズキ', generation: '2022〜',
    bodyCodes: ['MH95S', 'MH55S', 'MH85S'] },
  { vehicleName: 'スイフト',      maker: 'スズキ', generation: '2023〜',
    bodyCodes: ['ZC53S', 'ZD53S', 'ZC83S', 'ZD83S'] },
  { vehicleName: 'ソリオ',        maker: 'スズキ', generation: '2020〜',
    bodyCodes: ['MA37S', 'MA27S'] },
  { vehicleName: 'クロスビー',    maker: 'スズキ', generation: '2021〜',
    bodyCodes: ['MN71S'] },
  { vehicleName: 'エブリイワゴン', maker: 'スズキ', generation: '2015〜',
    bodyCodes: ['DA17W'] },
  { vehicleName: 'エブリイ',      maker: 'スズキ', generation: '2015〜',
    bodyCodes: ['DA17V'] },

  // ━━ ダイハツ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { vehicleName: 'タントファンクロス', maker: 'ダイハツ', generation: '2022〜',
    bodyCodes: ['LA650S', 'LA660S'] },  // ファンクロスを先に（タントと同コード）
  { vehicleName: 'タント',         maker: 'ダイハツ', generation: '2019〜',
    bodyCodes: ['LA650S', 'LA660S'] },
  { vehicleName: 'ムーヴキャンバス', maker: 'ダイハツ', generation: '2022〜',
    bodyCodes: ['LA850S', 'LA860S'] },
  { vehicleName: 'ムーヴ',         maker: 'ダイハツ', generation: '2023〜',
    bodyCodes: ['LA160S', 'LA150S'] },
  { vehicleName: 'ロッキー',       maker: 'ダイハツ', generation: '2021〜',
    bodyCodes: ['A200S', 'A210S'] },
  { vehicleName: 'トール',         maker: 'ダイハツ', generation: '2020〜',
    bodyCodes: ['M900S', 'M910S'] },
  { vehicleName: 'ウェイク',       maker: 'ダイハツ', generation: '2014〜',
    bodyCodes: ['LA700S', 'LA710S'] },
  { vehicleName: 'コペン',         maker: 'ダイハツ', generation: '2014〜',
    bodyCodes: ['LA400K'] },

  // ━━ ホンダ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { vehicleName: 'N-BOX',         maker: 'ホンダ', generation: '2023〜',
    bodyCodes: ['JF5', 'JF6'] },
  { vehicleName: 'N-WGN',         maker: 'ホンダ', generation: '2019〜',
    bodyCodes: ['JH3', 'JH4'] },
  { vehicleName: 'N-ONE',         maker: 'ホンダ', generation: '2020〜',
    bodyCodes: ['JG3', 'JG4'] },
  { vehicleName: 'フリード',       maker: 'ホンダ', generation: '2024〜',
    bodyCodes: ['GB5', 'GB6', 'GB7', 'GB8'] },
  { vehicleName: 'ステップワゴン', maker: 'ホンダ', generation: '2022〜',
    bodyCodes: ['RP6', 'RP7', 'RP8'] },
  { vehicleName: 'フィット',       maker: 'ホンダ', generation: '2020〜',
    bodyCodes: ['GR1', 'GR2', 'GR3', 'GR4', 'GR5', 'GR6', 'GR7', 'GR8'] },
  { vehicleName: 'ヴェゼル',       maker: 'ホンダ', generation: '2021〜',
    bodyCodes: ['RV3', 'RV4', 'RV5', 'RV6'] },
  { vehicleName: 'ZR-V',          maker: 'ホンダ', generation: '2023〜',
    bodyCodes: ['RZ3', 'RZ4'] },
  { vehicleName: 'CR-V',          maker: 'ホンダ', generation: '2022〜',
    bodyCodes: ['RT5', 'RT6'] },

  // ━━ 日産 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { vehicleName: 'ノートオーラ',   maker: '日産', generation: '2021〜',
    bodyCodes: ['FE13'] },
  { vehicleName: 'ノート',         maker: '日産', generation: '2020〜',
    bodyCodes: ['E13'] },
  { vehicleName: 'セレナ',         maker: '日産', generation: '2022〜',
    bodyCodes: ['C28', 'GFC28', 'GC28'] },
  { vehicleName: 'エクストレイル', maker: '日産', generation: '2022〜',
    bodyCodes: ['SNT33', 'T33'] },
  { vehicleName: 'ルークス',       maker: '日産', generation: '2020〜',
    bodyCodes: ['B44A', 'B45A', 'B47A', 'B48A'] },
  { vehicleName: 'デイズ',         maker: '日産', generation: '2019〜',
    bodyCodes: ['B43W', 'B46W', 'B47W', 'B48W'] },
  { vehicleName: 'キックス',       maker: '日産', generation: '2020〜',
    bodyCodes: ['P15'] },
  { vehicleName: 'アリア',         maker: '日産', generation: '2022〜',
    bodyCodes: ['FE0'] },
  { vehicleName: 'サクラ',         maker: '日産', generation: '2022〜',
    bodyCodes: ['B6AW', 'B6BW'] },

  // ━━ トヨタ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { vehicleName: 'シエンタ',       maker: 'トヨタ', generation: '2022〜',
    bodyCodes: ['MXPC10', 'MXPC11', 'MXPL10', 'MXPL15', 'MXPC'] },
  { vehicleName: 'ノア',           maker: 'トヨタ', generation: '2022〜',
    bodyCodes: ['MXPK10', 'MXPK15'] },
  { vehicleName: 'ヴォクシー',     maker: 'トヨタ', generation: '2022〜',
    bodyCodes: ['MXPW10', 'MXPW15'] },
  { vehicleName: 'アルファード',   maker: 'トヨタ', generation: '2023〜',
    bodyCodes: ['AGH40W', 'AAHH40W', 'AAHH45W'] },
  { vehicleName: 'ヴェルファイア', maker: 'トヨタ', generation: '2023〜',
    bodyCodes: ['AGH40W', 'AAHH40W'] },
  { vehicleName: 'ハリアー',       maker: 'トヨタ', generation: '2020〜',
    bodyCodes: ['MXUA80', 'MXUA85', 'AXUH80', 'AXUH85'] },
  { vehicleName: 'RAV4',           maker: 'トヨタ', generation: '2019〜',
    bodyCodes: ['MXAA52', 'MXAA54', 'AXAH52', 'AXAH54', 'AXAP54'] },
  { vehicleName: 'カローラクロス', maker: 'トヨタ', generation: '2021〜',
    bodyCodes: ['MXGA10', 'MXGA15', 'ZVW75'] },
  { vehicleName: 'ヤリスクロス',   maker: 'トヨタ', generation: '2020〜',
    bodyCodes: ['MXPB10', 'MXPB15', 'MXPJ10', 'MXPJ15'] },
  { vehicleName: 'ライズ',         maker: 'トヨタ', generation: '2021〜',
    bodyCodes: ['A200A', 'A201A', 'A202A', 'A210A'] },
  { vehicleName: 'プリウス',       maker: 'トヨタ', generation: '2023〜',
    bodyCodes: ['ZVZW60', 'ZVZW65'] },
  { vehicleName: 'ヤリス',         maker: 'トヨタ', generation: '2020〜',
    bodyCodes: ['MXPA10', 'MXPA15', 'KSP210'] },
  { vehicleName: 'カローラ',       maker: 'トヨタ', generation: '2019〜',
    bodyCodes: ['ZRE212', 'ZWE211', 'ZWE219', 'ZRE214', 'MZEA12'] },
  { vehicleName: 'ルーミー',       maker: 'トヨタ', generation: '2020〜',
    bodyCodes: ['M900A', 'M910A'] },
  { vehicleName: 'ランドクルーザー', maker: 'トヨタ', generation: '2021〜',
    bodyCodes: ['FJA300W', 'VJA300W', 'FZJ', 'GRJ7', 'URJ2'] },
  { vehicleName: 'ランドクルーザープラド', maker: 'トヨタ', generation: '2009〜',
    bodyCodes: ['TRJ150', 'GRJ150', 'GDJ150', 'GRJ151'] },
  { vehicleName: 'ヴォクシー（旧）', maker: 'トヨタ', generation: '2014〜2021',
    bodyCodes: ['ZRR85', 'ZWR80G', 'ZRR80'] },  // 旧型はZRR85/ZRR80共有(グレードで判別)
  { vehicleName: 'ノア（旧）',     maker: 'トヨタ', generation: '2014〜2021',
    bodyCodes: ['ZRR80W', 'ZRR85G', 'ZWR80'] },
  { vehicleName: 'クラウン',       maker: 'トヨタ', generation: '2022〜',
    bodyCodes: ['AZSH35', 'AZSH36', 'TZSH35', 'MXZ10', 'MXZ15'] },
  { vehicleName: 'カムリ',         maker: 'トヨタ', generation: '2017〜',
    bodyCodes: ['AXVH70', 'AXVH71', 'AXVH75'] },

  // ━━ スバル ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { vehicleName: 'フォレスター',   maker: 'スバル', generation: '2022〜',
    bodyCodes: ['SK9', 'SKE'] },
  { vehicleName: 'レヴォーグ',     maker: 'スバル', generation: '2020〜',
    bodyCodes: ['VN5'] },
  { vehicleName: 'アウトバック',   maker: 'スバル', generation: '2021〜',
    bodyCodes: ['BT5'] },
  { vehicleName: 'クロストレック', maker: 'スバル', generation: '2022〜',
    bodyCodes: ['GU3', 'GU6'] },
  { vehicleName: 'インプレッサ',   maker: 'スバル', generation: '2023〜',
    bodyCodes: ['GP7', 'GRT', 'GRF'] },
  { vehicleName: 'WRX',            maker: 'スバル', generation: '2021〜',
    bodyCodes: ['VB'] },

  // ━━ マツダ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { vehicleName: 'CX-5',           maker: 'マツダ', generation: '2022〜',
    bodyCodes: ['KF2P', 'KF5P', 'KFEP'] },
  { vehicleName: 'CX-60',          maker: 'マツダ', generation: '2022〜',
    bodyCodes: ['KH3P', 'KH5P'] },
  { vehicleName: 'CX-8',           maker: 'マツダ', generation: '2017〜',
    bodyCodes: ['KG2P', 'KG5P'] },
  { vehicleName: 'CX-30',          maker: 'マツダ', generation: '2019〜',
    bodyCodes: ['DM8P', 'DMEP', 'DM6P'] },
  { vehicleName: 'MAZDA2',         maker: 'マツダ', generation: '2019〜',
    bodyCodes: ['DJ3FS', 'DJ5FS', 'DJLFS', 'DJ3AS'] },
  { vehicleName: 'MAZDA3',         maker: 'マツダ', generation: '2019〜',
    bodyCodes: ['BP8P', 'BP5P', 'BPFP', 'BPEP'] },
  { vehicleName: 'MX-5',           maker: 'マツダ', generation: '2015〜',
    bodyCodes: ['ND5RC', 'NDERC'] },

  // ━━ 三菱 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { vehicleName: 'デリカD:5',      maker: '三菱', generation: '2007〜',
    bodyCodes: ['CV5W', 'CV4W', 'CV1W'] },
  { vehicleName: 'アウトランダー',  maker: '三菱', generation: '2021〜',
    bodyCodes: ['GN0W', 'GF7W', 'GG2W'] },
  { vehicleName: 'エクリプスクロス', maker: '三菱', generation: '2021〜',
    bodyCodes: ['GK0W', 'GL3W', 'GK1W'] },
  { vehicleName: 'ekクロス',        maker: '三菱', generation: '2019〜',
    bodyCodes: ['B33W', 'B36W', 'B37W', 'B38W'] },
  { vehicleName: 'ekワゴン',        maker: '三菱', generation: '2019〜',
    bodyCodes: ['B33W', 'B36W'] },
];

// ── 型式から車種を検索 ───────────────────────────────────────────────────────

/**
 * 型式文字列から車種エントリを返す
 * 入力例: "3BA-MXPK10" / "MXPK10" / "mxpk10"
 * ハイフン以降の車体形式で前方一致検索
 */
export function findVehicleByModelCode(modelCode: string): ModelEntry | null {
  if (!modelCode) return null;

  // ハイフンがあれば車体形式部分のみ抽出
  const bodyCode = modelCode.includes('-')
    ? modelCode.split('-').slice(1).join('-').toUpperCase()
    : modelCode.toUpperCase();

  // 長いコードを優先して完全一致→前方一致で検索
  for (const entry of MODEL_CODE_DB) {
    for (const code of entry.bodyCodes) {
      if (bodyCode === code.toUpperCase()) return entry;
    }
  }
  for (const entry of MODEL_CODE_DB) {
    for (const code of entry.bodyCodes) {
      if (bodyCode.startsWith(code.toUpperCase())) return entry;
    }
  }
  return null;
}

/**
 * OCRプロンプト埋め込み用の型式→車名テーブル（コンパクト版）
 */
export function buildModelCodeTable(): string {
  const lines: string[] = ['【型式→車名 照合テーブル（型式が読めた場合は必ず確認して車名・メーカーを補正すること）】'];
  const seen = new Set<string>();
  for (const e of MODEL_CODE_DB) {
    const key = e.vehicleName;
    if (seen.has(key)) continue;
    seen.add(key);
    const allCodes = MODEL_CODE_DB
      .filter(x => x.vehicleName === e.vehicleName)
      .flatMap(x => x.bodyCodes);
    const uniqueCodes = [...new Set(allCodes)];
    lines.push(`${uniqueCodes.join('/')} → ${e.maker} ${e.vehicleName}`);
  }
  return lines.join('\n');
}
