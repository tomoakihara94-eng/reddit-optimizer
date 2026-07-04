// 車体シルエット SVGイラスト（7種類）
// viewBox="0 0 320 155"  タイヤ底辺 y=148, ホイール中心 y=126, r=22

export type CarBody =
  | 'hatchback'
  | 'minivan'
  | 'luxury-van'
  | 'suv'
  | 'sedan'
  | 'sports'
  | 'kei';

const W = {
  // 車体色（currentColor から派生）
  body:       'var(--car-body)',
  bodyDark:   'var(--car-body-dark)',
  bodyLight:  'var(--car-body-light)',
  glass:      'rgba(180,220,255,0.55)',
  glassDark:  'rgba(120,180,220,0.4)',
  tire:       '#1a1a2a',
  hub:        '#555',
  headlight:  'rgba(255,250,210,0.9)',
  taillight:  'rgba(255,80,80,0.85)',
  chrome:     'rgba(255,255,255,0.25)',
};

// ── コンパクトハッチバック（アクア・フィット・ルーミー） ─────────────────────
function Hatchback() {
  return (
    <svg viewBox="0 0 320 155" xmlns="http://www.w3.org/2000/svg" className="w-full drop-shadow-sm">
      {/* ボディ下部 */}
      <path d="M22,128 L22,95 L36,78 L58,68 L78,128 Z" fill={W.bodyDark}/>
      {/* メインボディ */}
      <path d="M58,68 L78,42 L218,42 L242,65 L258,90 L258,128 L78,128 Z" fill={W.body}/>
      {/* ルーフ・Aピラー面 */}
      <path d="M78,42 L96,28 L208,28 L218,42 Z" fill={W.bodyLight}/>
      {/* ルーフハイライト */}
      <path d="M98,28 L206,28 L212,38 L92,38 Z" fill={W.chrome}/>
      {/* フロントガラス */}
      <path d="M62,66 L80,42 L96,42 L96,64 Z" fill={W.glass}/>
      {/* サイドウィンドウ */}
      <rect x="101" y="32" width="106" height="28" rx="2" fill={W.glass}/>
      {/* リアウィンドウ */}
      <path d="M212,32 L240,63 L228,70 L212,58 Z" fill={W.glassDark}/>
      {/* ドアライン */}
      <line x1="160" y1="70" x2="160" y2="126" stroke={W.bodyDark} strokeWidth="1" strokeOpacity="0.4"/>
      {/* フロントホイールアーチ */}
      <path d="M58,128 A38 38 0 0 1 134,128 Z" fill={W.bodyDark} fillOpacity="0.5"/>
      {/* リアホイールアーチ */}
      <path d="M178,128 A38 38 0 0 1 254,128 Z" fill={W.bodyDark} fillOpacity="0.5"/>
      {/* フロントタイヤ */}
      <circle cx="96"  cy="128" r="22" fill={W.tire}/>
      <circle cx="96"  cy="128" r="13" fill="#2a2a3a"/>
      <circle cx="96"  cy="128" r="6"  fill={W.hub}/>
      {/* リアタイヤ */}
      <circle cx="216" cy="128" r="22" fill={W.tire}/>
      <circle cx="216" cy="128" r="13" fill="#2a2a3a"/>
      <circle cx="216" cy="128" r="6"  fill={W.hub}/>
      {/* ヘッドライト */}
      <rect x="19" y="88" width="10" height="18" rx="3" fill={W.headlight}/>
      {/* テールランプ */}
      <rect x="255" y="82" width="8" height="22" rx="2" fill={W.taillight}/>
      {/* バンパー */}
      <path d="M18,118 L22,128 L78,128" stroke={W.chrome} strokeWidth="2" fill="none"/>
    </svg>
  );
}

// ── ファミリーミニバン（ヴォクシー・セレナ） ────────────────────────────────
function Minivan() {
  return (
    <svg viewBox="0 0 320 155" xmlns="http://www.w3.org/2000/svg" className="w-full drop-shadow-sm">
      {/* フロントフェイス */}
      <path d="M22,128 L22,72 L36,55 L55,42 L55,128 Z" fill={W.bodyDark}/>
      {/* メインボディ */}
      <path d="M55,42 L68,24 L252,24 L265,42 L268,128 L55,128 Z" fill={W.body}/>
      {/* ルーフ */}
      <path d="M68,24 L76,14 L244,14 L252,24 Z" fill={W.bodyLight}/>
      {/* ルーフハイライト */}
      <path d="M80,14 L240,14 L246,22 L74,22 Z" fill={W.chrome}/>
      {/* フロントガラス */}
      <path d="M58,40 L70,24 L88,24 L88,40 Z" fill={W.glass}/>
      {/* 1列目ウィンドウ */}
      <rect x="94"  y="18" width="58" height="22" rx="2" fill={W.glass}/>
      {/* 2列目ウィンドウ */}
      <rect x="158" y="18" width="58" height="22" rx="2" fill={W.glass}/>
      {/* リアクォーターウィンドウ */}
      <rect x="222" y="18" width="30" height="22" rx="2" fill={W.glassDark}/>
      {/* スライドドアライン */}
      <line x1="152" y1="44" x2="152" y2="126" stroke={W.bodyDark} strokeWidth="1.5" strokeOpacity="0.4"/>
      <line x1="218" y1="44" x2="218" y2="126" stroke={W.bodyDark} strokeWidth="1" strokeOpacity="0.3"/>
      {/* スライドドアハンドル */}
      <rect x="180" y="82" width="18" height="4" rx="2" fill={W.chrome}/>
      {/* フロントホイールアーチ */}
      <path d="M55,128 A38 38 0 0 1 131,128 Z" fill={W.bodyDark} fillOpacity="0.5"/>
      {/* リアホイールアーチ */}
      <path d="M195,128 A38 38 0 0 1 271,128 Z" fill={W.bodyDark} fillOpacity="0.5"/>
      {/* タイヤ */}
      <circle cx="93"  cy="128" r="22" fill={W.tire}/>
      <circle cx="93"  cy="128" r="13" fill="#2a2a3a"/>
      <circle cx="93"  cy="128" r="6"  fill={W.hub}/>
      <circle cx="233" cy="128" r="22" fill={W.tire}/>
      <circle cx="233" cy="128" r="13" fill="#2a2a3a"/>
      <circle cx="233" cy="128" r="6"  fill={W.hub}/>
      {/* ライト類 */}
      <rect x="19" y="80" width="10" height="20" rx="3" fill={W.headlight}/>
      <rect x="265" y="72" width="8" height="24" rx="2" fill={W.taillight}/>
    </svg>
  );
}

// ── プレミアムミニバン（アルファード） ──────────────────────────────────────
function LuxuryVan() {
  return (
    <svg viewBox="0 0 320 155" xmlns="http://www.w3.org/2000/svg" className="w-full drop-shadow-sm">
      {/* フロント */}
      <path d="M18,128 L18,80 L32,62 L52,50 L52,128 Z" fill={W.bodyDark}/>
      {/* ボディ */}
      <path d="M52,50 L62,32 L255,32 L268,50 L272,128 L52,128 Z" fill={W.body}/>
      {/* ルーフ面 */}
      <path d="M62,32 L70,20 L248,20 L255,32 Z" fill={W.bodyLight}/>
      {/* メッキグリル感 */}
      <path d="M18,95 L18,118 L34,118 L34,95 Z" fill="rgba(200,190,160,0.4)"/>
      {/* ヘッドライト（横長） */}
      <rect x="16" y="78" width="14" height="10" rx="2" fill={W.headlight}/>
      <rect x="16" y="92" width="14" height="5"  rx="1" fill="rgba(255,200,100,0.6)"/>
      {/* ウィンドウ */}
      <path d="M56,48 L64,32 L84,32 L84,48 Z" fill={W.glass}/>
      <rect x="90"  y="24" width="55" height="24" rx="2" fill={W.glass}/>
      <rect x="152" y="24" width="55" height="24" rx="2" fill={W.glass}/>
      <rect x="214" y="24" width="38" height="24" rx="2" fill={W.glassDark}/>
      {/* ドアライン */}
      <line x1="145" y1="52" x2="145" y2="126" stroke={W.bodyDark} strokeWidth="1.5" strokeOpacity="0.35"/>
      <line x1="208" y1="52" x2="208" y2="126" stroke={W.bodyDark} strokeWidth="1" strokeOpacity="0.25"/>
      {/* ホイールアーチ */}
      <path d="M52,128 A38 38 0 0 1 128,128 Z" fill={W.bodyDark} fillOpacity="0.5"/>
      <path d="M200,128 A38 38 0 0 1 276,128 Z" fill={W.bodyDark} fillOpacity="0.5"/>
      {/* タイヤ（大径）*/}
      <circle cx="90"  cy="128" r="24" fill={W.tire}/>
      <circle cx="90"  cy="128" r="15" fill="#2a2a3a"/>
      <circle cx="90"  cy="128" r="7"  fill="#888"/>
      <circle cx="238" cy="128" r="24" fill={W.tire}/>
      <circle cx="238" cy="128" r="15" fill="#2a2a3a"/>
      <circle cx="238" cy="128" r="7"  fill="#888"/>
      {/* テール */}
      <rect x="268" y="68" width="8" height="28" rx="2" fill={W.taillight}/>
    </svg>
  );
}

// ── SUV（RAV4・フォレスター・ハリアー） ──────────────────────────────────────
function Suv() {
  return (
    <svg viewBox="0 0 320 155" xmlns="http://www.w3.org/2000/svg" className="w-full drop-shadow-sm">
      {/* フロント */}
      <path d="M20,128 L20,88 L34,70 L54,58 L60,128 Z" fill={W.bodyDark}/>
      {/* ボディ */}
      <path d="M60,58 L74,36 L232,36 L252,56 L268,82 L268,128 L60,128 Z" fill={W.body}/>
      {/* ルーフ */}
      <path d="M74,36 L86,22 L226,22 L238,36 Z" fill={W.bodyLight}/>
      {/* ルーフハイライト */}
      <path d="M90,22 L222,22 L228,32 L84,32 Z" fill={W.chrome}/>
      {/* ウィンドウ */}
      <path d="M64,56 L78,36 L98,36 L98,56 Z" fill={W.glass}/>
      <rect x="104" y="26" width="115" height="26" rx="2" fill={W.glass}/>
      <path d="M224,26 L252,55 L240,60 L224,48 Z" fill={W.glassDark}/>
      {/* ドアライン */}
      <line x1="168" y1="62" x2="168" y2="126" stroke={W.bodyDark} strokeWidth="1.5" strokeOpacity="0.4"/>
      {/* ルーフレール */}
      <rect x="88" y="20" width="138" height="3" rx="1.5" fill={W.bodyDark} fillOpacity="0.5"/>
      {/* ホイールアーチ */}
      <path d="M60,128 A42 42 0 0 1 144,128 Z" fill={W.bodyDark} fillOpacity="0.5"/>
      <path d="M184,128 A42 42 0 0 1 268,128 Z" fill={W.bodyDark} fillOpacity="0.5"/>
      {/* タイヤ（大きめ）*/}
      <circle cx="102" cy="128" r="26" fill={W.tire}/>
      <circle cx="102" cy="128" r="16" fill="#2a2a3a"/>
      <circle cx="102" cy="128" r="7"  fill={W.hub}/>
      <circle cx="226" cy="128" r="26" fill={W.tire}/>
      <circle cx="226" cy="128" r="16" fill="#2a2a3a"/>
      <circle cx="226" cy="128" r="7"  fill={W.hub}/>
      {/* ライト */}
      <rect x="17" y="82" width="10" height="16" rx="2" fill={W.headlight}/>
      <rect x="265" y="76" width="8" height="20" rx="2" fill={W.taillight}/>
    </svg>
  );
}

// ── セダン・ハイブリッド（プリウス・クラウン） ──────────────────────────────
function Sedan() {
  return (
    <svg viewBox="0 0 320 155" xmlns="http://www.w3.org/2000/svg" className="w-full drop-shadow-sm">
      {/* フロント（ロングノーズ） */}
      <path d="M14,128 L14,96 L26,78 L45,68 L60,128 Z" fill={W.bodyDark}/>
      {/* ボンネット */}
      <path d="M45,68 L55,58 L68,54 L68,128 L45,128 Z" fill={W.body}/>
      <path d="M55,58 L68,54 L88,50 L88,128 L68,128 Z" fill={W.body}/>
      {/* ボディ（3ボックス） */}
      <path d="M88,50 L96,34 L210,34 L224,44 L242,56 L268,86 L268,128 L88,128 Z" fill={W.body}/>
      {/* トランクリッド */}
      <path d="M224,44 L245,54 L268,85 L255,80 L242,56 Z" fill={W.bodyLight}/>
      {/* ルーフ */}
      <path d="M96,34 L106,20 L206,20 L212,34 Z" fill={W.bodyLight}/>
      <path d="M108,20 L204,20 L208,30 L104,30 Z" fill={W.chrome}/>
      {/* ウィンドウ */}
      <path d="M92,48 L104,34 L108,34 L108,50 Z" fill={W.glass}/>
      <rect x="112" y="22" width="88" height="26" rx="2" fill={W.glass}/>
      <path d="M204,22 L218,42 L208,50 L204,42 Z" fill={W.glassDark}/>
      {/* ドアライン */}
      <line x1="170" y1="54" x2="170" y2="126" stroke={W.bodyDark} strokeWidth="1.5" strokeOpacity="0.4"/>
      {/* ホイールアーチ */}
      <path d="M58,128 A38 38 0 0 1 134,128 Z" fill={W.bodyDark} fillOpacity="0.5"/>
      <path d="M196,128 A38 38 0 0 1 272,128 Z" fill={W.bodyDark} fillOpacity="0.5"/>
      {/* タイヤ */}
      <circle cx="96"  cy="128" r="22" fill={W.tire}/>
      <circle cx="96"  cy="128" r="13" fill="#2a2a3a"/>
      <circle cx="96"  cy="128" r="6"  fill={W.hub}/>
      <circle cx="234" cy="128" r="22" fill={W.tire}/>
      <circle cx="234" cy="128" r="13" fill="#2a2a3a"/>
      <circle cx="234" cy="128" r="6"  fill={W.hub}/>
      {/* ライト */}
      <rect x="11" y="90" width="10" height="16" rx="2" fill={W.headlight}/>
      <rect x="265" y="82" width="8" height="16" rx="2" fill={W.taillight}/>
    </svg>
  );
}

// ── スポーツカー（GR86） ─────────────────────────────────────────────────────
function Sports() {
  return (
    <svg viewBox="0 0 320 155" xmlns="http://www.w3.org/2000/svg" className="w-full drop-shadow-sm">
      {/* ロングノーズ */}
      <path d="M10,128 L10,105 L20,92 L36,84 L55,80 L55,128 Z" fill={W.bodyDark}/>
      <path d="M55,80 L70,76 L75,128 L55,128 Z" fill={W.bodyDark}/>
      {/* ボンネット（低い） */}
      <path d="M70,76 L82,68 L96,62 L100,128 L75,128 Z" fill={W.body}/>
      <path d="M96,62 L110,58 L110,128 L100,128 Z" fill={W.body}/>
      {/* キャビン（小さい） */}
      <path d="M110,58 L122,38 L198,38 L215,52 L240,78 L240,128 L110,128 Z" fill={W.body}/>
      {/* ルーフ（低い流麗なライン） */}
      <path d="M122,38 L130,26 L192,26 L200,38 Z" fill={W.bodyLight}/>
      <path d="M132,26 L190,26 L194,34 L128,34 Z" fill={W.chrome}/>
      {/* ウィンドウ */}
      <path d="M114,56 L126,38 L136,38 L136,56 Z" fill={W.glass}/>
      <rect x="140" y="28" width="50" height="26" rx="2" fill={W.glass}/>
      <path d="M193,28 L215,52 L200,58 L193,44 Z" fill={W.glassDark}/>
      {/* リアスポイラー */}
      <rect x="228" y="72" width="24" height="5" rx="2" fill={W.bodyDark}/>
      {/* ホイールアーチ */}
      <path d="M55,128 A40 40 0 0 1 135,128 Z" fill={W.bodyDark} fillOpacity="0.5"/>
      <path d="M160,128 A40 40 0 0 1 240,128 Z" fill={W.bodyDark} fillOpacity="0.5"/>
      {/* タイヤ（幅広）*/}
      <circle cx="95"  cy="128" r="25" fill={W.tire}/>
      <circle cx="95"  cy="128" r="15" fill="#2a2a3a"/>
      <circle cx="95"  cy="128" r="7"  fill={W.hub}/>
      <circle cx="200" cy="128" r="25" fill={W.tire}/>
      <circle cx="200" cy="128" r="15" fill="#2a2a3a"/>
      <circle cx="200" cy="128" r="7"  fill={W.hub}/>
      {/* ライト */}
      <rect x="8"  y="100" width="9"  height="14" rx="2" fill={W.headlight}/>
      <rect x="237" y="72" width="7"  height="16" rx="2" fill={W.taillight}/>
      {/* サイドスカート */}
      <rect x="110" y="124" width="130" height="5" rx="2" fill={W.bodyDark} fillOpacity="0.5"/>
    </svg>
  );
}

// ── 軽オフロード（ジムニー） ─────────────────────────────────────────────────
function Kei() {
  return (
    <svg viewBox="0 0 320 155" xmlns="http://www.w3.org/2000/svg" className="w-full drop-shadow-sm">
      {/* フロント（縦のフェイス） */}
      <path d="M55,128 L55,62 L68,50 L68,128 Z" fill={W.bodyDark}/>
      {/* ボディ（箱型） */}
      <path d="M68,50 L80,28 L230,28 L242,50 L248,128 L68,128 Z" fill={W.body}/>
      {/* ルーフ */}
      <path d="M80,28 L86,18 L224,18 L230,28 Z" fill={W.bodyLight}/>
      <path d="M88,18 L222,18 L226,26 L84,26 Z" fill={W.chrome}/>
      {/* 角形ウィンドウ */}
      <rect x="72"  y="32" width="48" height="28" rx="2" fill={W.glass}/>
      <rect x="126" y="22" width="70" height="26" rx="2" fill={W.glass}/>
      <rect x="202" y="22" width="34" height="26" rx="2" fill={W.glassDark}/>
      {/* ドアライン */}
      <line x1="120" y1="54" x2="120" y2="126" stroke={W.bodyDark} strokeWidth="2" strokeOpacity="0.4"/>
      <line x1="196" y1="54" x2="196" y2="126" stroke={W.bodyDark} strokeWidth="1.5" strokeOpacity="0.3"/>
      {/* ルーフラック風 */}
      <rect x="88" y="15" width="136" height="4" rx="2" fill={W.bodyDark} fillOpacity="0.4"/>
      {/* 高いアーチ（オフロード） */}
      <path d="M55,128 A44 44 0 0 1 143,128 Z" fill={W.bodyDark} fillOpacity="0.55"/>
      <path d="M173,128 A44 44 0 0 1 261,128 Z" fill={W.bodyDark} fillOpacity="0.55"/>
      {/* オフロードタイヤ（大径）*/}
      <circle cx="99"  cy="128" r="28" fill={W.tire}/>
      <circle cx="99"  cy="128" r="18" fill="#2a2a3a"/>
      <circle cx="99"  cy="128" r="8"  fill={W.hub}/>
      <circle cx="217" cy="128" r="28" fill={W.tire}/>
      <circle cx="217" cy="128" r="18" fill="#2a2a3a"/>
      <circle cx="217" cy="128" r="8"  fill={W.hub}/>
      {/* ライト（角形） */}
      <rect x="52" y="62" width="12" height="18" rx="2" fill={W.headlight}/>
      <rect x="52" y="82" width="12" height="8"  rx="1" fill="rgba(255,200,100,0.7)"/>
      <rect x="244" y="54" width="8"  height="22" rx="2" fill={W.taillight}/>
    </svg>
  );
}

// ── 外部公開コンポーネント ───────────────────────────────────────────────────
const COMPONENTS: Record<CarBody, () => React.ReactElement> = {
  hatchback:     Hatchback,
  minivan:       Minivan,
  'luxury-van':  LuxuryVan,
  suv:           Suv,
  sedan:         Sedan,
  sports:        Sports,
  kei:           Kei,
};

interface Props {
  body: CarBody;
  primaryColor: string;  // CSS hex or hsl
  className?: string;
}

export function CarIllustration({ body, primaryColor, className = '' }: Props) {
  const Component = COMPONENTS[body];
  // CSS変数でSVG内のcurrentColor相当を制御
  const style = {
    '--car-body':      primaryColor,
    '--car-body-dark': primaryColor + 'cc',
    '--car-body-light': primaryColor + '88',
  } as React.CSSProperties;

  return (
    <div className={className} style={style}>
      <Component />
    </div>
  );
}
