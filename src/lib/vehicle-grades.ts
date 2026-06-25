// 国産主要車種のグレード別装備データベース
// 出典: 各メーカー公式カタログ仕様（最新モデルチェンジ世代）
// ※ メーカーオプション・ディーラーオプションは含まない
// ※ モデルチェンジ時は下記データを更新すること

export interface GradeSpec {
  slidingDoor?: string;
  display?: string;
  seatMaterial?: string;
  seatHeater?: boolean;
  sunroof?: boolean;
  included?: string[];   // このグレードに必ず含まれる装備
  excluded?: string[];   // このグレードには含まれない装備（識別の決め手）
  notes?: string;
}

export interface VehicleModel {
  names: string[];       // 表記ゆれ対応
  generation: string;   // 対応世代（年式）
  grades: Record<string, GradeSpec>;
}

export const VEHICLE_GRADE_DB: VehicleModel[] = [

  // ══════════════════════════════════════════════
  // 軽自動車
  // ══════════════════════════════════════════════

  {
    names: ['ハスラー', 'Hustler', 'HUSTLER'],
    generation: '2020〜現行 MR92S/MR52S',
    grades: {
      'J':      { display: 'オーディオレス', seatHeater: false, excluded: ['スマートキー', 'シートヒーター', 'アルミホイール'] },
      'G':      { display: 'オーディオレス(8インチDAオプション)', seatHeater: false, included: ['スマートキー'], excluded: ['シートヒーター'] },
      'X':      { display: 'オーディオレス(8インチDAオプション)', seatHeater: true,  included: ['スマートキー', 'シートヒーター(フロント)', 'オートエアコン', 'アルミホイール'] },
      'Gターボ': { display: 'オーディオレス(8インチDAオプション)', seatHeater: false, included: ['スマートキー', 'ターボ'], excluded: ['シートヒーター'] },
      'Xターボ': { display: 'オーディオレス(8インチDAオプション)', seatHeater: true,  included: ['スマートキー', 'シートヒーター(フロント)', 'ターボ', 'アルミホイール'] },
    },
  },

  {
    names: ['スペーシア', 'Spacia', 'SPACIA'],
    generation: '2023〜現行 MK94S/MK54S',
    grades: {
      'G':          { slidingDoor: '片側電動(助手席)', display: '9インチDAオプション', seatHeater: false, excluded: ['両側電動スライドドア', 'シートヒーター'] },
      'X':          { slidingDoor: '両側電動',         display: '9インチDAオプション', seatHeater: true,  included: ['両側電動スライドドア', 'シートヒーター(フロント)'] },
      'カスタム XS':   { slidingDoor: '両側電動',         display: '9インチDAオプション', seatHeater: true,  included: ['両側電動スライドドア', 'ターボ', 'シートヒーター', '専用エアロ'] },
    },
  },

  {
    names: ['スペーシアギア', 'Spacia GEAR', 'SPACIA GEAR'],
    generation: '2023〜現行 MK94S',
    grades: {
      'GEAR':      { slidingDoor: '両側電動', seatHeater: true, included: ['両側電動スライドドア', 'ルーフレール', 'シートヒーター'] },
      'GEARターボ': { slidingDoor: '両側電動', seatHeater: true, included: ['両側電動スライドドア', 'ルーフレール', 'ターボ', 'シートヒーター'] },
    },
  },

  {
    names: ['ワゴンR', 'WagonR', 'Wagon R', 'WAGON R'],
    generation: '2022〜現行 MH95S/MH55S',
    grades: {
      'HYBRID FX': { display: 'オーディオレス(8インチDAオプション)', seatHeater: false, excluded: ['シートヒーター', 'アルミホイール'] },
      'HYBRID FZ': { display: 'オーディオレス(8インチDAオプション)', seatHeater: true,  included: ['シートヒーター(フロント)', 'アルミホイール'] },
    },
  },

  {
    names: ['ワゴンRスマイル', 'WagonR Smile', 'WAGON R SMILE'],
    generation: '2021〜現行 MX91S/MX81S',
    grades: {
      'G':      { slidingDoor: '両側手動', display: 'オーディオレス(9インチDAオプション)', seatHeater: false, excluded: ['電動スライドドア', 'シートヒーター'] },
      'HYBRID S': { slidingDoor: '片側電動(助手席)', display: 'オーディオレス(9インチDAオプション)', seatHeater: false, excluded: ['両側電動スライドドア'] },
      'HYBRID X': { slidingDoor: '両側電動',         display: 'オーディオレス(9インチDAオプション)', seatHeater: true,  included: ['両側電動スライドドア', 'シートヒーター'] },
    },
  },

  {
    names: ['ジムニー', 'Jimny', 'JIMNY'],
    generation: '2018〜現行 JB64W',
    grades: {
      'XG': { display: 'オーディオレス', excluded: ['スマートキー', 'アルミホイール'] },
      'XL': { display: 'オーディオレス(8インチDAオプション)', included: ['スマートキー'] },
      'XC': { display: 'オーディオレス(8インチDAオプション)', included: ['スマートキー', 'アルミホイール', 'クルーズコントロール'] },
    },
  },

  {
    names: ['ジムニーシエラ', 'Jimny Sierra', 'JIMNY SIERRA'],
    generation: '2018〜現行 JB74W',
    grades: {
      'JL': { display: 'オーディオレス(8インチDAオプション)', included: ['スマートキー'] },
      'JC': { display: 'オーディオレス(8インチDAオプション)', included: ['スマートキー', 'アルミホイール', 'クルーズコントロール'] },
    },
  },

  {
    names: ['タント', 'Tanto', 'TANTO'],
    generation: '2019〜現行 LA650S/LA660S',
    grades: {
      'L':         { slidingDoor: '両側手動',         display: 'オーディオレス(9インチDAオプション)', seatHeater: false, excluded: ['電動スライドドア', 'シートヒーター'] },
      'X':         { slidingDoor: '片側電動(助手席)', display: 'オーディオレス(9インチDAオプション)', seatHeater: false, excluded: ['両側電動スライドドア', 'シートヒーター'] },
      'G':         { slidingDoor: '両側電動',         display: 'オーディオレス(9インチDAオプション)', seatHeater: true,  included: ['両側電動スライドドア', 'シートヒーター(フロント)'] },
      'カスタム X': { slidingDoor: '両側電動',         display: 'オーディオレス(9インチDAオプション)', seatHeater: false, included: ['両側電動スライドドア', '専用フロントフェイス'] },
      'カスタム RS': { slidingDoor: '両側電動',         display: 'オーディオレス(9インチDAオプション)', seatHeater: true,  included: ['両側電動スライドドア', 'ターボ', '専用フロントフェイス', 'シートヒーター'] },
    },
  },

  {
    names: ['タントファンクロス', 'Tanto Fun Cross', 'TANTO FUN CROSS'],
    generation: '2022〜現行 LA650S',
    grades: {
      'タントファンクロス':       { slidingDoor: '両側電動', display: 'オーディオレス(9インチDAオプション)', included: ['両側電動スライドドア', 'ルーフレール', 'シートヒーター(フロント)'] },
      'タントファンクロスターボ': { slidingDoor: '両側電動', display: 'オーディオレス(9インチDAオプション)', included: ['両側電動スライドドア', 'ルーフレール', 'ターボ', 'シートヒーター'] },
    },
  },

  {
    names: ['ムーヴキャンバス', 'Move Canvas', 'MOVE CANVAS'],
    generation: '2022〜現行 LA850S/LA860S',
    grades: {
      'STREGA G': { slidingDoor: '両側電動', display: '9インチDAオプション', seatHeater: false, excluded: ['シートヒーター'] },
      'STREGA X': { slidingDoor: '両側電動', display: '9インチDAオプション', seatHeater: true,  included: ['シートヒーター(フロント)'] },
    },
  },

  {
    names: ['N-BOX', 'NBOX', 'N BOX', 'エヌボックス'],
    generation: '2023〜現行 JF5/JF6',
    grades: {
      'G':          { slidingDoor: '両側手動',         display: '8インチDA', seatHeater: false, excluded: ['電動スライドドア', 'シートヒーター'] },
      'L':          { slidingDoor: '両側手動',         display: '9インチDA', seatHeater: false, excluded: ['電動スライドドア'] },
      'EX':         { slidingDoor: '両側電動',         display: '9インチDA', seatHeater: true,  included: ['両側電動スライドドア', 'シートヒーター', 'プレミアムシート'] },
      'カスタム G':  { slidingDoor: '両側電動',         display: '9インチDA', seatHeater: false, included: ['両側電動スライドドア', '専用エクステリア'], excluded: ['シートヒーター'] },
      'カスタム L':  { slidingDoor: '両側電動',         display: '9インチDA', seatHeater: true,  included: ['両側電動スライドドア', '専用エクステリア', 'シートヒーター'] },
      'カスタム EX': { slidingDoor: '両側電動',         display: '9インチDA', seatHeater: true,  included: ['両側電動スライドドア', '専用エクステリア', 'シートヒーター', 'プレミアムシート'] },
    },
  },

  {
    names: ['N-WGN', 'NWGN', 'N WGN', 'エヌワゴン'],
    generation: '2019〜現行 JH3/JH4',
    grades: {
      'G':   { display: '8インチDAオプション', excluded: ['本革シート', 'シートヒーター'] },
      'L':   { display: '8インチDAオプション', seatHeater: false },
      'L・ターボ Honda SENSING': { display: '8インチDAオプション', included: ['ターボ'] },
      'カスタム G':          { display: '8インチDAオプション', included: ['専用エクステリア'] },
      'カスタム G・ターボ':    { display: '8インチDAオプション', included: ['専用エクステリア', 'ターボ'] },
    },
  },

  // ══════════════════════════════════════════════
  // ミニバン
  // ══════════════════════════════════════════════

  {
    names: ['シエンタ', 'Sienta', 'SIENTA'],
    generation: '2022〜現行 MXPC10/MXPL10/MXPL15',
    grades: {
      'X': {
        slidingDoor: '片側電動(助手席側のみ)',
        display: '8インチDA',
        seatMaterial: 'ファブリック',
        seatHeater: false,
        excluded: ['両側電動スライドドア', '本革シート', 'シートヒーター'],
        notes: 'X = 助手席側のみ電動。両側電動はG以上',
      },
      'G': {
        slidingDoor: '両側電動',
        display: '8インチDA',
        seatMaterial: 'ファブリック',
        seatHeater: true,
        included: ['両側電動スライドドア', 'シートヒーター(フロント)'],
        excluded: ['本革シート'],
      },
      'Z': {
        slidingDoor: '両側電動',
        display: '9インチDA',
        seatMaterial: 'ファブリック',
        seatHeater: true,
        included: ['両側電動スライドドア', 'シートヒーター', '9インチDA'],
      },
    },
  },

  {
    names: ['ノア', 'Noah', 'NOAH'],
    generation: '2022〜現行 MXPK10/MXPK15',
    grades: {
      'X': {
        slidingDoor: '片側電動(助手席)',
        display: '9インチDA',
        seatMaterial: 'ファブリック',
        seatHeater: false,
        excluded: ['両側電動スライドドア', '本革シート', 'シートヒーター'],
        notes: 'X = 助手席側のみ電動',
      },
      'S-G': {
        slidingDoor: '両側電動',
        display: '9インチDA',
        seatMaterial: 'ファブリック',
        included: ['両側電動スライドドア'],
        excluded: ['本革シート'],
      },
      'S-Z': {
        slidingDoor: '両側電動',
        display: '11インチDA',
        seatMaterial: 'ファブリック',
        seatHeater: true,
        included: ['両側電動スライドドア', '11インチDA', 'シートヒーター'],
      },
    },
  },

  {
    names: ['ヴォクシー', 'Voxy', 'VOXY'],
    generation: '2022〜現行 MXPK10/MXPK15',
    grades: {
      'S-G': {
        slidingDoor: '両側電動',
        display: '9インチDA',
        seatMaterial: 'ファブリック',
        included: ['両側電動スライドドア'],
        excluded: ['本革シート', '11インチDA'],
      },
      'S-Z': {
        slidingDoor: '両側電動',
        display: '11インチDA',
        seatMaterial: 'ファブリック',
        seatHeater: true,
        included: ['両側電動スライドドア', '11インチDA', 'シートヒーター'],
      },
    },
  },

  {
    names: ['アルファード', 'Alphard', 'ALPHARD'],
    generation: '2023〜現行 AGH40W/AAHH40W',
    grades: {
      'X': {
        slidingDoor: '両側電動',
        display: '9インチDA',
        seatMaterial: 'ファブリック',
        excluded: ['本革シート', '電動シート'],
      },
      'Z': {
        slidingDoor: '両側電動',
        display: '14インチDA',
        seatMaterial: '本革',
        seatHeater: true,
        included: ['本革シート', 'シートヒーター', '14インチDA', '電動シート'],
      },
      'Executive Lounge': {
        slidingDoor: '両側電動',
        display: '14インチDA',
        seatMaterial: '本革',
        seatHeater: true,
        included: ['電動フルフラットシート', 'オットマン', '4座配列', '本革シート'],
        notes: '2列目はエグゼクティブパワーシート+オットマン',
      },
    },
  },

  {
    names: ['ヴェルファイア', 'Vellfire', 'VELLFIRE'],
    generation: '2023〜現行 AGH40W/AAHH40W',
    grades: {
      'Z': {
        slidingDoor: '両側電動',
        display: '14インチDA',
        seatMaterial: '本革',
        seatHeater: true,
        included: ['本革シート', 'シートヒーター', '14インチDA'],
      },
      'Executive Lounge': {
        slidingDoor: '両側電動',
        display: '14インチDA',
        seatMaterial: '本革',
        seatHeater: true,
        included: ['電動フルフラットシート', 'オットマン', '4座配列', '本革シート'],
      },
    },
  },

  {
    names: ['フリード', 'Freed', 'FREED'],
    generation: '2024〜現行 GB5/GB6/GB7/GB8',
    grades: {
      'AIR':      { slidingDoor: '両側電動', display: '9インチDA', seatMaterial: 'ファブリック', excluded: ['本革シート'] },
      'CROSSTAR': { slidingDoor: '両側電動', display: '9インチDA', seatMaterial: 'ファブリック', included: ['専用エクステリア', 'ルーフレール'] },
    },
  },

  {
    names: ['ステップワゴン', 'StepWgn', 'STEPWGN', 'Step WGN'],
    generation: '2022〜現行 RP6/RP7/RP8',
    grades: {
      'AIR':   { slidingDoor: '両側電動', display: '9インチDA',  seatMaterial: 'ファブリック', excluded: ['本革シート'] },
      'SPADA': { slidingDoor: '両側電動', display: '11インチDA', seatMaterial: 'ファブリック', seatHeater: true, included: ['11インチDA', 'シートヒーター', '専用エクステリア'] },
    },
  },

  {
    names: ['セレナ', 'Serena', 'SERENA'],
    generation: '2022〜現行 C28',
    grades: {
      'X':             { slidingDoor: '両側電動', display: '9インチDA', seatMaterial: 'ファブリック', excluded: ['本革シート', 'シートヒーター'] },
      'Highway Star':  { slidingDoor: '両側電動', display: '9インチDA', seatMaterial: 'ファブリック', included: ['専用エクステリア'], excluded: ['本革シート'] },
      'LUXION':        { slidingDoor: '両側電動', display: '9インチDA', seatMaterial: '本革', seatHeater: true, included: ['本革シート', 'シートヒーター', '電動シート'] },
    },
  },

  // ══════════════════════════════════════════════
  // SUV / クロスオーバー
  // ══════════════════════════════════════════════

  {
    names: ['ヤリスクロス', 'YARIS CROSS', 'Yaris Cross'],
    generation: '2020〜現行 MXPB10/MXPB15',
    grades: {
      'X': { display: '8インチDA', seatMaterial: 'ファブリック', seatHeater: false, excluded: ['本革シート', 'シートヒーター', '10.5インチDA'] },
      'G': { display: '8インチDA', seatMaterial: 'ファブリック', seatHeater: true,  included: ['シートヒーター(フロント)'], excluded: ['本革シート'] },
      'Z': { display: '10.5インチDA', seatMaterial: '本革',      seatHeater: true,  included: ['本革シート', 'シートヒーター', '10.5インチDA', 'パノラミックビューモニター'] },
      'GR SPORT': { display: '10.5インチDA', seatMaterial: '本革', seatHeater: true, included: ['GRエンブレム', '専用サスペンション', '本革シート'] },
    },
  },

  {
    names: ['ライズ', 'RAIZE', 'Raize'],
    generation: '2021〜現行 A200A/A210A',
    grades: {
      'X': { display: '8インチDA', seatMaterial: 'ファブリック', excluded: ['本革シート', 'シートヒーター'] },
      'G': { display: '9インチDA', seatMaterial: 'ファブリック', seatHeater: false, excluded: ['本革シート'] },
      'Z': { display: '9インチDA', seatMaterial: '本革',          seatHeater: true,  included: ['シートヒーター', 'パノラミックビューモニター'] },
    },
  },

  {
    names: ['ロッキー', 'ROCKY', 'Rocky'],
    generation: '2021〜現行 A200S/A210S',
    grades: {
      'X':   { display: '9インチDA', seatMaterial: 'ファブリック', excluded: ['本革シート', 'シートヒーター'] },
      'G':   { display: '9インチDA', seatMaterial: 'ファブリック', seatHeater: false },
      'Z':   { display: '9インチDA', seatMaterial: '本革',         seatHeater: true, included: ['本革シート', 'シートヒーター'] },
      'プレミアム': { display: '9インチDA', seatMaterial: '本革', seatHeater: true, included: ['本革シート', 'シートヒーター', 'パノラマサンルーフ'] },
    },
  },

  {
    names: ['ハリアー', 'HARRIER', 'Harrier'],
    generation: '2020〜現行 MXUA80/MXUA85',
    grades: {
      'S': { display: '8インチDA',    seatMaterial: 'ファブリック', seatHeater: false, excluded: ['本革シート', 'パノラマサンルーフ', 'シートヒーター'] },
      'G': { display: '9インチDA',    seatMaterial: 'ファブリック', seatHeater: true,  included: ['シートヒーター'], excluded: ['本革シート', 'パノラマサンルーフ'] },
      'Z': { display: '12.3インチDA', seatMaterial: '本革',         seatHeater: true,  sunroof: true, included: ['12.3インチDA', '本革シート', 'シートヒーター', 'パノラマサンルーフ'] },
      'Z Leather Package': { display: '12.3インチDA', seatMaterial: '本革', seatHeater: true, sunroof: true, included: ['12.3インチDA', '本革シート', 'シートヒーター', 'パノラマサンルーフ', '電動シート'] },
    },
  },

  {
    names: ['RAV4', 'rav4'],
    generation: '2019〜現行 AXAH52/AXAH54/MXAA52',
    grades: {
      'X':         { display: '8インチDA', seatMaterial: 'ファブリック', excluded: ['本革シート', 'シートヒーター'] },
      'G':         { display: '9インチDA', seatMaterial: 'ファブリック', seatHeater: true, included: ['シートヒーター'], excluded: ['本革シート'] },
      'Adventure': { display: '9インチDA', seatMaterial: 'ファブリック', seatHeater: true, included: ['専用エクステリア', 'ルーフレール', 'シートヒーター'] },
      'G Z Package': { display: '9インチDA', seatMaterial: '本革', seatHeater: true, included: ['本革シート', 'シートヒーター', '電動シート'] },
    },
  },

  {
    names: ['カローラクロス', 'Corolla Cross', 'COROLLA CROSS'],
    generation: '2021〜現行 MXGA10/ZVW75',
    grades: {
      'S': { display: '8インチDA',    seatMaterial: 'ファブリック', excluded: ['本革シート', 'シートヒーター'] },
      'G': { display: '8インチDA',    seatMaterial: 'ファブリック', seatHeater: true, included: ['シートヒーター'], excluded: ['本革シート'] },
      'Z': { display: '10.5インチDA', seatMaterial: '本革',         seatHeater: true, included: ['本革シート', 'シートヒーター', '10.5インチDA'] },
    },
  },

  {
    names: ['フォレスター', 'Forester', 'FORESTER'],
    generation: '2022〜現行 SK9/SKE',
    grades: {
      'BASIC S': { display: '8インチDA', seatMaterial: 'ファブリック', excluded: ['本革シート', 'シートヒーター'] },
      'PREMIUM':   { display: '8インチDA', seatMaterial: 'ファブリック', seatHeater: true,  included: ['シートヒーター'] },
      'SPORT':     { display: '8インチDA', seatMaterial: '本革',         seatHeater: true,  included: ['本革シート', 'シートヒーター', '専用サスペンション'] },
      'Advance':   { display: '11.6インチDA', seatMaterial: '本革',      seatHeater: true,  included: ['本革シート', 'シートヒーター', '11.6インチDA', 'パノラマサンルーフ'] },
    },
  },

  {
    names: ['CX-5', 'CX5'],
    generation: '2022〜現行 KF系',
    grades: {
      'X L Package':     { display: '10.25インチDA', seatMaterial: 'ファブリック', excluded: ['本革シート'] },
      'XD L Package':    { display: '10.25インチDA', seatMaterial: 'ファブリック' },
      'Exclusive Mode':  { display: '10.25インチDA', seatMaterial: '本革', seatHeater: true, included: ['本革シート', 'シートヒーター', 'ベンチレーション'] },
      'Field Journey':   { display: '10.25インチDA', seatMaterial: '本革', seatHeater: true, included: ['本革シート', 'シートヒーター', 'ルーフレール', '専用カラー'] },
    },
  },

  // ══════════════════════════════════════════════
  // コンパクト / セダン / ハッチバック
  // ══════════════════════════════════════════════

  {
    names: ['プリウス', 'Prius', 'PRIUS'],
    generation: '2023〜現行 ZVZW60/ZVZW65',
    grades: {
      'U': { display: '8インチDA', seatMaterial: 'ファブリック', seatHeater: false, excluded: ['本革シート', 'シートヒーター', '12.3インチDA'] },
      'X': { display: '8インチDA', seatMaterial: 'ファブリック', seatHeater: false, excluded: ['本革シート', 'シートヒーター', '12.3インチDA'] },
      'G': { display: '8インチDA', seatMaterial: 'ファブリック', seatHeater: true,  included: ['シートヒーター(フロント)'], excluded: ['本革シート'] },
      'Z': { display: '12.3インチDA', seatMaterial: '本革',      seatHeater: true,  included: ['12.3インチDA', '本革シート', 'シートヒーター'] },
    },
  },

  {
    names: ['ヤリス', 'YARIS', 'Yaris'],
    generation: '2020〜現行 MXPA10/KSP210',
    grades: {
      'X': { display: '7インチDAオプション', seatMaterial: 'ファブリック', excluded: ['本革シート', 'シートヒーター'] },
      'G': { display: '8インチDA',           seatMaterial: 'ファブリック', seatHeater: false },
      'Z': { display: '8インチDA',           seatMaterial: 'ファブリック', seatHeater: true,  included: ['シートヒーター(フロント)', 'パノラミックビューモニター'] },
      'GR SPORT': { display: '8インチDA', seatMaterial: '合皮', included: ['GRエンブレム', '専用サスペンション'] },
    },
  },

  {
    names: ['カローラ', 'Corolla', 'COROLLA'],
    generation: '2019〜現行 ZRE212/ZWE211',
    grades: {
      'X':   { display: '8インチDA', seatMaterial: 'ファブリック', excluded: ['本革シート', 'シートヒーター'] },
      'G':   { display: '8インチDA', seatMaterial: 'ファブリック', seatHeater: false },
      'W×B': { display: '9インチDA', seatMaterial: '本革',         seatHeater: true,  included: ['本革シート', 'シートヒーター', 'スポーツサスペンション'] },
    },
  },

  {
    names: ['フィット', 'Fit', 'FIT'],
    generation: '2020〜現行 GR1/GR3/GR5/GR8',
    grades: {
      'BASIC': { display: '8インチDA', seatMaterial: 'ファブリック', excluded: ['本革シート', 'シートヒーター'] },
      'HOME':  { display: '8インチDA', seatMaterial: 'ファブリック', excluded: ['本革シート'] },
      'NESS':  { display: '8インチDA', seatMaterial: 'ファブリック', included: ['専用エクステリア'] },
      'CROSS': { display: '8インチDA', seatMaterial: 'ファブリック', included: ['専用サスペンション', 'ルーフレール'] },
      'LUXE':  { display: '9インチDA', seatMaterial: '本革',         seatHeater: true, included: ['本革シート', 'シートヒーター'] },
    },
  },

  {
    names: ['ノート', 'Note', 'NOTE'],
    generation: '2020〜現行 E13',
    grades: {
      'S': { display: '8インチDA', seatMaterial: 'ファブリック', excluded: ['本革シート', 'シートヒーター'] },
      'X': { display: '8インチDA', seatMaterial: 'ファブリック', excluded: ['本革シート', 'シートヒーター'] },
      'G': { display: '9インチDA', seatMaterial: 'ファブリック', seatHeater: true, included: ['シートヒーター', 'プロパイロット'] },
    },
  },

  {
    names: ['ノートオーラ', 'Note AURA', 'NOTE AURA', 'AURA'],
    generation: '2021〜現行 FE13',
    grades: {
      'G':       { display: '9インチDA',    seatMaterial: 'ファブリック', seatHeater: true, included: ['シートヒーター'] },
      'G Four':  { display: '9インチDA',    seatMaterial: 'ファブリック', seatHeater: true, included: ['4WD', 'シートヒーター'] },
      'NISMO':   { display: '12.3インチDA', seatMaterial: '本革',         seatHeater: true, included: ['12.3インチDA', '本革シート', 'シートヒーター', 'NISMOエンブレム'] },
    },
  },
];

/**
 * OCRプロンプト用グレードリファレンステキスト生成
 * トークン効率を優先したコンパクト形式
 */
export function buildGradeReferenceText(): string {
  const sections = [
    { label: '軽自動車', keys: ['ハスラー', 'スペーシア', 'スペーシアギア', 'ワゴンR', 'ワゴンRスマイル', 'ジムニー', 'ジムニーシエラ', 'タント', 'タントファンクロス', 'ムーヴキャンバス', 'N-BOX', 'N-WGN'] },
    { label: 'ミニバン', keys: ['シエンタ', 'ノア', 'ヴォクシー', 'アルファード', 'ヴェルファイア', 'フリード', 'ステップワゴン', 'セレナ'] },
    { label: 'SUV/クロスオーバー', keys: ['ヤリスクロス', 'ライズ', 'ロッキー', 'ハリアー', 'RAV4', 'カローラクロス', 'フォレスター', 'CX-5'] },
    { label: 'コンパクト/セダン', keys: ['プリウス', 'ヤリス', 'カローラ', 'フィット', 'ノート', 'ノートオーラ'] },
  ];

  const lines = ['【車種別グレード×装備リファレンス — 矛盾チェックに使用すること】'];

  for (const section of sections) {
    lines.push(`\n▍${section.label}`);
    const vehicles = VEHICLE_GRADE_DB.filter(v => section.keys.some(k => v.names[0].includes(k)));
    for (const v of vehicles) {
      lines.push(`${v.names[0]}(${v.generation})`);
      for (const [name, spec] of Object.entries(v.grades)) {
        const parts: string[] = [];
        if (spec.slidingDoor)             parts.push(`スライド:${spec.slidingDoor}`);
        if (spec.display)                 parts.push(`画面:${spec.display}`);
        if (spec.seatMaterial)            parts.push(`シート:${spec.seatMaterial}`);
        if (spec.seatHeater !== undefined) parts.push(spec.seatHeater ? 'ヒーター:あり' : 'ヒーター:なし');
        if (spec.sunroof)                 parts.push('サンルーフ:あり');
        if (spec.excluded?.length)        parts.push(`✗含まず:${spec.excluded.join('/')}`);
        if (spec.notes)                   parts.push(`※${spec.notes}`);
        lines.push(`  ${name}: ${parts.join(' | ')}`);
      }
    }
  }

  lines.push('\n装備とグレードが矛盾する場合は装備側を優先してグレードを上位に修正すること。');
  return lines.join('\n');
}
