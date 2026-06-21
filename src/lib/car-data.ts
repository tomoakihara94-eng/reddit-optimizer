export interface CarModel {
  name: string;
  grades: string[];
}

export interface CarMaker {
  name: string;
  models: CarModel[];
}

export const CAR_DATA: CarMaker[] = [
  {
    name: 'トヨタ',
    models: [
      { name: 'アルファード', grades: ['2.5X', '2.5S', '2.5S Aパッケージ', '2.5S Cパッケージ', '3.5エグゼクティブラウンジ', '3.5エグゼクティブラウンジS', '2.5G', '2.5Z', '2.5Z Aエディション'] },
      { name: 'ヴェルファイア', grades: ['2.5X', '2.5V', '2.5Z', '2.5Z Gエディション', '3.5V', '3.5Z', '3.5エグゼクティブラウンジ', '3.5エグゼクティブラウンジS'] },
      { name: 'ノア', grades: ['X', 'G', 'Si', 'Si W×B', 'Si W×B II', 'Si W×B III', 'G-T', 'S-G', 'S-Z', 'Si ダブルバイビー'] },
      { name: 'ヴォクシー', grades: ['X', 'V', 'ZS', 'ZS 煌', 'ZS 煌 II', 'ZS 煌 III', 'ZS 煌 Night', 'S-G', 'S-Z'] },
      { name: 'エスクァイア', grades: ['Xi', 'Gi', 'Gi プレミアムパッケージ', 'Gi ブラックテーラード'] },
      { name: 'ハリアー', grades: ['S', 'S GRスポーツ', 'G', 'G レザーパッケージ', 'Z', 'Z レザーパッケージ', 'PHEV G', 'PHEV Z', 'Z 4WD'] },
      { name: 'RAV4', grades: ['X', 'G', 'Adventure', 'G Zパッケージ', 'PHV G', 'PHV Z', 'HYBRID X', 'HYBRID G', 'HYBRID Adventure', 'HYBRID G-Z'] },
      { name: 'ランドクルーザー', grades: ['GX', 'AX', 'AX Gセレクション', 'VX-R', 'VX', 'ZX', 'GR SPORT'] },
      { name: 'ランドクルーザープラド', grades: ['TX', 'TX Lパッケージ', 'TZ', 'TZ-G', 'TX Lパッケージ ブラックエディション'] },
      { name: 'ランドクルーザー250', grades: ['GX', 'VX', 'ZX', 'GR SPORT'] },
      { name: 'クラウン', grades: ['B', 'X', 'S', 'G', 'RS', 'G-Executive', 'S-Executive', 'RS アドバンス'] },
      { name: 'クラウンクロスオーバー', grades: ['X', 'S', 'G', 'G Advanced', 'RS', 'RS Advanced'] },
      { name: 'カムリ', grades: ['X', 'G', 'G パッケージ', 'WS', 'WS レザーパッケージ', 'HYBRID X', 'HYBRID G', 'HYBRID WS', 'HYBRID Gパッケージ'] },
      { name: 'プリウス', grades: ['E', 'S', 'A', 'A プレミアム', 'S GRスポーツ', 'A プレミアム ツーリングセレクション', 'PHV S', 'PHV A', 'PHV A プレミアム', 'Z', 'G'] },
      { name: 'アクア', grades: ['B', 'X', 'G', 'G クロスバイク', 'Z', 'GR SPORT', 'X 4WD', 'G 4WD'] },
      { name: 'ヤリス', grades: ['B', 'X', 'G', 'Z', 'GR ヤリス G', 'GR ヤリス RS', 'GR ヤリス RZ', 'HYBRID X', 'HYBRID G', 'HYBRID Z'] },
      { name: 'ヤリスクロス', grades: ['X', 'G', 'Z', 'Z レザーパッケージ', 'G-T', 'Z-T', 'GR SPORT', 'HYBRID X', 'HYBRID G', 'HYBRID Z'] },
      { name: 'シエンタ', grades: ['X', 'G', 'Z', 'FUNBASE X', 'FUNBASE G', 'FUNBASE Z', 'HYBRID X', 'HYBRID G', 'HYBRID Z'] },
      { name: 'ライズ', grades: ['B', 'X', 'G', 'Z', 'G-T', 'Z-T', 'HYBRID X', 'HYBRID G', 'HYBRID Z'] },
      { name: 'カローラ', grades: ['B', 'X', 'S', 'G', 'WxB', 'GT', 'HYBRID G', 'HYBRID S'] },
      { name: 'カローラクロス', grades: ['X', 'G', 'Z', 'HYBRID X', 'HYBRID G', 'HYBRID Z'] },
      { name: 'カローラツーリング', grades: ['B', 'X', 'S', 'G', 'WxB', 'GT', 'HYBRID G', 'HYBRID S', 'HYBRID WxB'] },
      { name: 'カローラスポーツ', grades: ['G X', 'G Z', 'G-X GR SPORT', 'HYBRID G X', 'HYBRID G Z'] },
      { name: 'C-HR', grades: ['S', 'S-T', 'G', 'G-T', 'GR SPORT', 'HYBRID S', 'HYBRID G', 'HYBRID GR SPORT'] },
      { name: 'GR86', grades: ['RC', 'G', 'SZ'] },
      { name: 'スープラ', grades: ['SZ', 'SZ-R', 'RZ', 'GR'] },
      { name: 'bZ4X', grades: ['X FWD', 'Z FWD', 'X E-Four', 'Z E-Four'] },
      { name: 'ルーミー', grades: ['X', 'X Sパッケージ', 'G', 'G-T', 'カスタムG', 'カスタムG-T', 'カスタムG Sパッケージ'] },
      { name: 'タンク', grades: ['X', 'X Sパッケージ', 'G', 'G-T', 'カスタムG', 'カスタムG-T'] },
      { name: 'エスティマ', grades: ['X', 'G', 'アエラス', 'アエラスプレミアム', 'アエラスG', 'アエラスプレミアムG', 'ハイブリッドG', 'ハイブリッドアエラス'] },
      { name: 'ウィッシュ', grades: ['1.8X', '1.8G', '2.0Z', '2.0Z Gエディション', '1.8S'] },
      { name: 'マークX', grades: ['250G', '250RDS', '250S', '350S', '350RDS', '350G プレミアムエディション', 'GRMN'] },
      { name: 'ヴィッツ', grades: ['F', 'U', 'RS', 'GR SPORT'] },
      { name: 'パッソ', grades: ['X', 'G', 'MODA S', 'MODA G'] },
      { name: 'ポルテ', grades: ['X', 'F', 'G'] },
      { name: 'スペイド', grades: ['F', 'G', 'GX', 'GL'] },
    ],
  },
  {
    name: '日産',
    models: [
      { name: 'ノート', grades: ['e-POWER X', 'e-POWER MEDALIST', 'e-POWER NISMO', 'e-POWER S', 'X', 'X DIG-S', 'AUTECH', 'AUTECH CROSSOVER'] },
      { name: 'ノートオーラ', grades: ['X', 'G', 'G FOUR', 'NISMO'] },
      { name: 'セレナ', grades: ['X', 'XV', 'ハイウェイスター', 'ハイウェイスター V', 'ハイウェイスター G', 'e-POWER X', 'e-POWER ハイウェイスター V', 'e-POWER AUTECH', 'AUTECH', 'AUTECH SPORTS SPEC'] },
      { name: 'エクストレイル', grades: ['X', 'S', 'G', 'G プロパイロットエディション', 'AUTECH', 'e-4ORCE', 'G e-4ORCE'] },
      { name: 'エルグランド', grades: ['250ハイウェイスター', '250ハイウェイスター アーバンクロム', '350ハイウェイスター', '350ライダー', '350 Rider Black Line'] },
      { name: 'アリア', grades: ['B6', 'B6 e-4ORCE', 'B9', 'B9 e-4ORCE', 'B9 NISMO e-4ORCE'] },
      { name: 'スカイライン', grades: ['200GT-t', '200GT-t Vセレクション', '400R', 'NISMO'] },
      { name: 'フェアレディZ', grades: ['Version S', 'Version ST', 'Version NISMO', 'Proto Spec'] },
      { name: 'GT-R', grades: ['Premium edition', 'Track edition engineered by NISMO', 'NISMO'] },
      { name: 'キックス', grades: ['X', 'S', 'G', 'e-POWER X', 'e-POWER S', 'e-POWER G'] },
      { name: 'ルークス', grades: ['B', 'X', 'G', 'ハイウェイスター X', 'ハイウェイスター G', 'ハイウェイスター G ターボ'] },
      { name: 'デイズ', grades: ['B', 'X', 'X リミテッド', 'ハイウェイスター X', 'ハイウェイスター G', 'ハイウェイスター G ターボ', 'BOLERO'] },
      { name: 'リーフ', grades: ['S', 'X', 'G', 'e+X', 'e+G', 'AUTECH'] },
      { name: 'サクラ', grades: ['S', 'X', 'G', 'G レザーエディション'] },
      { name: 'ジューク', grades: ['XV', 'RX', '15RX Vセレクション', '15RS', 'NISMO'] },
      { name: 'マーチ', grades: ['12X', '12G', '12SR', 'NISMO', 'NISMO S'] },
    ],
  },
  {
    name: 'ホンダ',
    models: [
      { name: 'N-BOX', grades: ['G', 'G・L', 'G・L ターボ', 'G EX', 'G EX ターボ', 'カスタムG', 'カスタムG・L', 'カスタムG・L ターボ', 'カスタムG EX ターボ'] },
      { name: 'N-WGN', grades: ['G', 'L', 'L ターボ', 'カスタムL', 'カスタムL ターボ'] },
      { name: 'N-ONE', grades: ['Original', 'Premium', 'RS', 'RS 6MT'] },
      { name: 'N-VAN', grades: ['+スタイル Fun', '+スタイル Cool', 'G', 'L ターボ'] },
      { name: 'フィット', grades: ['Basic', 'Home', 'Ness', 'Cross', 'Luxe', 'e:HEV Basic', 'e:HEV Home', 'e:HEV Ness', 'e:HEV Cross', 'e:HEV Luxe', 'HYBRID S', 'HYBRID S Honda SENSING'] },
      { name: 'ヴェゼル', grades: ['G', 'e:HEV X', 'e:HEV HOME', 'e:HEV Z', 'e:HEV PLaY', 'HYBRID X', 'HYBRID Z'] },
      { name: 'ZR-V', grades: ['X', 'Z', 'e:HEV X', 'e:HEV Z'] },
      { name: 'CR-V', grades: ['X', 'EX', 'EX マスターピース', 'e:PHEV X', 'e:PHEV Z', 'HYBRID X', 'HYBRID EX'] },
      { name: 'フリード', grades: ['B', 'G', 'G EX', 'CROSSTAR', 'e:HEV B', 'e:HEV G', 'e:HEV CROSSTAR', 'HYBRID G Honda SENSING', 'HYBRID G EX Honda SENSING'] },
      { name: 'ステップワゴン', grades: ['B', 'AIR', 'SPADA', 'SPADA プレミアムライン', 'e:HEV AIR', 'e:HEV SPADA', 'e:HEV SPADA プレミアムライン', 'スパーダ ホンダセンシング'] },
      { name: 'シビック', grades: ['LX', 'EX', 'TYPE R', 'FL5 TYPE R'] },
      { name: 'アコード', grades: ['EX', 'e:PHEV EX', 'e:PHEV EX マスターピース', 'EX Honda SENSING'] },
      { name: 'オデッセイ', grades: ['B', 'G', 'アブソルート', 'アブソルート Honda SENSING', 'HYBRID アブソルート'] },
      { name: 'レジェンド', grades: ['EX', 'HYBRID EX Honda SENSING'] },
    ],
  },
  {
    name: 'マツダ',
    models: [
      { name: 'CX-5', grades: ['S', 'S Package', 'S L Package', 'XD', 'XD Proactive', 'XD L Package', 'XD Exclusive Mode', '25S', '25S L Package', '25S Proactive', 'XD SPORTS APPEARANCE'] },
      { name: 'CX-8', grades: ['S', 'S Proactive', 'S L Package', 'XD Proactive', 'XD L Package', 'XD Exclusive Mode', '25S', '25S Proactive', '25S L Package'] },
      { name: 'CX-30', grades: ['S', 'X', 'X Proactive', 'XD', 'XD Proactive', 'SKYACTIV X', 'Retro Sports Edition'] },
      { name: 'CX-3', grades: ['15C', '15S', '15S Proactive', 'XD', 'XD Proactive', 'XD Touring', '20S PROACTIVE', 'XD TOURING Lパッケージ'] },
      { name: 'CX-60', grades: ['XD', 'XD MHEV Premium Sports', 'PHEV Premium Sports', 'PHEV Premium Modern', 'e-SKYACTIV D'] },
      { name: 'CX-90', grades: ['S e-SKYACTIV', 'PHEV Premium Sports', 'PHEV Premium Modern'] },
      { name: 'マツダ3', grades: ['FASTBACK 15C', 'FASTBACK 20S', 'FASTBACK XD Touring', 'SEDAN 15C', 'SEDAN 20S', 'SEDAN XD Touring', 'FASTBACK SKYACTIV X'] },
      { name: 'マツダ6', grades: ['セダン 25S', 'セダン 25S Lパッケージ', 'ワゴン 25S', 'ワゴン 25S Lパッケージ', 'ワゴン XD Lパッケージ'] },
      { name: 'ロードスター', grades: ['S', 'S Special Package', 'RS', 'NR-A', 'VS', 'RF VS', 'RF VS Racing Orange'] },
      { name: 'MX-30', grades: ['e-SKYACTIV EV', 'e-SKYACTIV R-EV', 'XD Hybrid'] },
    ],
  },
  {
    name: 'スバル',
    models: [
      { name: 'フォレスター', grades: ['TOURING', 'X-BREAK', 'Advance', 'STI Sport', 'e-BOXER X-BREAK', 'e-BOXER SPORT', 'e-BOXER Advance', 'Premium'] },
      { name: 'アウトバック', grades: ['Base Grade', 'Limited', 'X-BREAK', 'Limited EyeSight'] },
      { name: 'インプレッサ', grades: ['S-GT', 'G4 1.6i', 'G4 2.0i-S EyeSight', 'SPORT 2.0i-S EyeSight', 'G4 2.0i-L EyeSight', 'SPORT HYBRID 2.0iS'] },
      { name: 'WRX', grades: ['S4 2.0GT-S EyeSight', 'S4 2.0GT EyeSight', 'STI', 'STI Type S', 'STI Type RA', 'STI Type RA-R', 'S208', 'S209'] },
      { name: 'クロストレック', grades: ['Touring', 'Advance', 'HYBRID Advance', 'Limited'] },
      { name: 'レヴォーグ', grades: ['GT-H', 'GT-H EX', 'STI Sport', 'STI Sport R', 'STI Sport EX', 'GT-H Lパッケージ'] },
      { name: 'BRZ', grades: ['R', 'S', 'tS', 'RA-R'] },
      { name: 'レガシィ', grades: ['B4 2.5i', 'B4 2.5i Limited EyeSight', 'ツーリングワゴン 2.5i', 'ツーリングワゴン 2.5i Lパッケージ'] },
    ],
  },
  {
    name: 'スズキ',
    models: [
      { name: 'ジムニー', grades: ['XG', 'XL', 'XC', 'LAND VENTURE', 'XC 特別仕様車', 'XL 特別仕様車'] },
      { name: 'ジムニーシエラ', grades: ['JC', 'JL', 'JX', 'LAND VENTURE', 'JC Lパッケージ'] },
      { name: 'スペーシア', grades: ['G', 'ハイブリッドG', 'ハイブリッドGS', 'カスタムG', 'カスタムHYBRID G', 'カスタムZターボ', 'カスタムHYBRID ZS ターボ', 'GEAR'] },
      { name: 'ワゴンR', grades: ['FA', 'FX', 'FX リミテッド', 'STINGRAY X', 'STINGRAY Z', 'STINGRAY HYBRID X', 'STINGRAY HYBRID Z'] },
      { name: 'ハスラー', grades: ['A', 'G', 'J-style', 'X', 'Jスタイルターボ', 'HYBRID X', 'HYBRID G', 'HYBRID G ブラックリミテッド', 'BIGFOOT'] },
      { name: 'ソリオ', grades: ['G', 'MX', 'BANDIT', 'HYBRID GX', 'HYBRID MX', 'HYBRID SX', 'HYBRID MX ターボ'] },
      { name: 'スイフト', grades: ['XG', 'XL', 'RSt', 'XGリミテッド', 'SPORT', 'SPORT 6MT', 'HEV XS', 'HEV RS'] },
      { name: 'クロスビー', grades: ['G', 'MX', 'HYBRID GX', 'HYBRID MX', 'HYBRID SX', 'HYBRID MX ターボ'] },
      { name: 'エブリイ', grades: ['PA', 'PA リミテッド', 'PC', 'PU', 'DA エブリイ'] },
      { name: 'エブリイワゴン', grades: ['JP', 'JPターボ', 'PZターボ', 'PZターボ スペシャル', 'PZターボ スペシャル ハイルーフ'] },
      { name: 'アルト', grades: ['L', 'F', 'S', 'TURBO RS', 'WORKS', 'Xリミテッド'] },
      { name: 'アルトラパン', grades: ['L', 'X', 'G', 'X ターボ', 'CHOCOLATE', 'CHOCOLATE LIMITED'] },
    ],
  },
  {
    name: 'ダイハツ',
    models: [
      { name: 'タント', grades: ['L', 'X', 'X SA III', 'カスタムX', 'カスタムX SA III', 'カスタムRS SA III', 'カスタムRS', 'FUNBASE X', 'FUNBASE カスタムX', 'カスタムX トップエディション SA III'] },
      { name: 'ムーヴ', grades: ['L', 'X', 'L SA II', 'X SA II', 'カスタムX SA II', 'カスタムRS SA II', 'カスタムX SA III', 'カスタムRS SA III'] },
      { name: 'ムーヴキャンバス', grades: ['G "MAKE\'S"', 'G ブラックアクセントVS SA III', 'G "SA III"', 'X "SA III"', 'STROLL G', 'STROLL X'] },
      { name: 'コペン', grades: ['CERO', 'ROBE', 'GR SPORT', 'XPLAY', 'XPLAY 特別仕様車'] },
      { name: 'ミライース', grades: ['L', 'L SA III', 'X', 'X SA III', 'G', 'G SA III', 'X リミテッド SAIII'] },
      { name: 'キャスト', grades: ['STYLE G SA II', 'STYLE G SA III', 'ACTIVA G SA II', 'ACTIVA G SA III', 'SPORT R SA II'] },
      { name: 'ロッキー', grades: ['L', 'X', 'G', 'プレミアム', 'プレミアム G', 'HYBRID X', 'HYBRID G', 'HYBRID プレミアム'] },
      { name: 'ウェイク', grades: ['G SA III', 'G レジャーエディション SA III', 'L SA III', 'D SA III', 'G ターボ SA III'] },
      { name: 'アトレー', grades: ['S321G 標準', 'RS', 'CARGO', 'WAGON'] },
      { name: 'ハイゼットカーゴ', grades: ['クルーズターボ SA III', 'クルーズ SA III', 'デラックス', 'スペシャル'] },
      { name: 'ハイゼットトラック', grades: ['スタンダード', 'エクストラ SA3t', 'ジャンボ エクストラ SA3t', 'スタンダード 4WD'] },
    ],
  },
  {
    name: '三菱',
    models: [
      { name: 'アウトランダー', grades: ['G', 'S', 'PHEV S', 'PHEV G', 'PHEV SE Package', 'PHEV P', 'PHEV Gナビパッケージ', 'PHEV M', 'PHEV P 三菱100周年特別仕様車'] },
      { name: 'アウトランダーPHEV', grades: ['S', 'G', 'P'] },
      { name: 'エクリプスクロス', grades: ['M', 'G', 'G Plus Package', 'GR', 'PHEV G', 'PHEV M', 'PHEV P'] },
      { name: 'デリカD:5', grades: ['G Power Package', 'D Power Package', 'シャモニー', 'アクティブギア', 'Urban Gear', 'G Premium Package', 'HYBRID City Wave'] },
      { name: 'デリカミニ', grades: ['G', 'G プレミアム', 'T プレミアム'] },
      { name: 'ekスペース', grades: ['M', 'G', 'T', 'カスタムT', 'カスタムG'] },
      { name: 'ekクロス', grades: ['M', 'G', 'T', 'GR', 'T GR'] },
      { name: 'ekクロス スペース', grades: ['G', 'T', 'カスタムT', 'カスタムG'] },
      { name: 'パジェロ', grades: ['GLS', 'VR-I', 'VR-II', 'ロング GL', 'LONG EXCEED'] },
      { name: 'RVR', grades: ['G', 'S', 'M', '4WD G Premium Package', 'ブラックエディション'] },
    ],
  },
  {
    name: 'レクサス',
    models: [
      { name: 'LX', grades: ['LX570', 'LX600', 'LX600 OVERTRAIL', 'LX600 VIP'] },
      { name: 'GX', grades: ['GX460', 'GX460 Premium', 'GX460 4WD'] },
      { name: 'RX', grades: ['RX200t', 'RX300', 'RX350', 'RX350h', 'RX350 F SPORT', 'RX450h', 'RX450h F SPORT', 'RX500h F SPORT Performance', 'RX550h F SPORT Performance'] },
      { name: 'NX', grades: ['NX200t', 'NX300', 'NX300h', 'NX350', 'NX350h', 'NX450h+', 'NX350 F SPORT', 'NX350h F SPORT', 'NX450h+ F SPORT'] },
      { name: 'UX', grades: ['UX200', 'UX250h', 'UX250h F SPORT', 'UX300e'] },
      { name: 'IS', grades: ['IS200t', 'IS250', 'IS300', 'IS300h', 'IS300h F SPORT', 'IS350', 'IS350 F SPORT', 'IS500 F SPORT Performance'] },
      { name: 'ES', grades: ['ES250', 'ES300h', 'ES300h F SPORT', 'ES300h Fスポーツ'] },
      { name: 'GS', grades: ['GS200t', 'GS250', 'GS300h', 'GS350', 'GS350 F SPORT', 'GS450h', 'GS450h F SPORT'] },
      { name: 'LS', grades: ['LS350', 'LS460', 'LS460 L', 'LS500', 'LS500h', 'LS500h Executive'] },
      { name: 'LC', grades: ['LC500', 'LC500 Convertible', 'LC500h'] },
      { name: 'RC', grades: ['RC200t', 'RC300', 'RC300h', 'RC350', 'RC350 F SPORT', 'RCF', 'RCF Carbon Exterior Package'] },
      { name: 'CT', grades: ['CT200h', 'CT200h Version L', 'CT200h F SPORT'] },
    ],
  },
  {
    name: 'スバル（軽）',
    models: [
      { name: 'サンバー', grades: ['TC', 'TB', 'VC', 'VB', 'VCトランスポーター', 'クラシック'] },
      { name: 'ステラ', grades: ['L', 'G', 'R'] },
      { name: 'R2', grades: ['i', 'S', 'R'] },
    ],
  },
  {
    name: 'その他・輸入車',
    models: [
      { name: 'その他（自由入力）', grades: [] },
    ],
  },
];

export const COLORS: string[] = [
  'ホワイトパール（白）',
  'ブリリアントホワイトパール（白）',
  'ホワイト（白）',
  'スーパーホワイト（白）',
  'ブラック（黒）',
  'アティチュードブラックマイカ（黒）',
  'ブラックマイカ（黒）',
  'シルバー（銀）',
  'シルバーメタリック（銀）',
  'グレー（灰）',
  'グレーメタリック（灰）',
  'ブルー（青）',
  'ネイビー（紺）',
  'ダークブルー（紺）',
  'レッド（赤）',
  'ワインレッド（赤）',
  'ブラウン（茶）',
  'ベージュ（ベージュ）',
  'ゴールド（金）',
  'グリーン（緑）',
  'オレンジ（橙）',
  'その他',
];

export interface OptionGroup {
  label: string;
  items: string[];
}

export const OPTION_GROUPS: OptionGroup[] = [
  {
    label: '車両状態',
    items: ['ワンオーナー', '禁煙車', '記録簿完備', '修復歴なし', '新車未使用'],
  },
  {
    label: '安全装備',
    items: ['衝突軽減ブレーキ', 'レーダークルーズコントロール', '車線逸脱警告', 'BSM（ブラインドスポット）', 'コーナーセンサー', '後側方警戒（RCTA）'],
  },
  {
    label: 'カーナビ・AV',
    items: ['純正ナビ', '社外ナビ', 'フルセグTV', 'バックカメラ', '全周囲カメラ（360°）', 'ETC', 'ETC2.0', 'ドライブレコーダー', 'フリップダウンモニター', 'HUD（ヘッドアップディスプレイ）'],
  },
  {
    label: 'インテリア',
    items: ['革シート（レザーシート）', 'シートヒーター', 'シートベンチレーション', 'パワーシート（電動）', 'サンルーフ', 'パノラマルーフ'],
  },
  {
    label: 'ドア・エクステリア',
    items: ['両側パワースライドドア', '片側パワースライドドア', 'パワーバックドア', '純正アルミホイール', '社外アルミホイール', 'LEDヘッドライト', 'スマートキー'],
  },
];
