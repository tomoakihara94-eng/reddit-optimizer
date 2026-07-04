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

export type PassengerType = 'none' | 'solo' | 'couple' | 'family' | 'vip';

const W = {
  body:      'var(--car-body)',
  bodyDark:  'var(--car-body-dark)',
  bodyLight: 'var(--car-body-light)',
  glass:     'rgba(180,220,255,0.55)',
  glassDark: 'rgba(120,180,220,0.4)',
  tire:      '#1a1a2a',
  hub:       '#555',
  headlight: 'rgba(255,250,210,0.9)',
  taillight: 'rgba(255,80,80,0.85)',
  chrome:    'rgba(255,255,255,0.25)',
  person:    'rgba(0,0,0,0.22)',
  vipPerson: 'rgba(210,170,60,0.70)',
  vipTint:   'rgba(8,6,2,0.52)',
  vipGold:   'rgba(230,190,80,0.55)',
};

// ── 人物シルエット ──────────────────────────────────────────────────────────
// cx: 中心X  wy: 窓上端Y  wh: 窓高さ  fill: 色  s: スケール(子ども=0.75)
function Pax({ cx, wy, wh, fill, s = 1 }: { cx: number; wy: number; wh: number; fill: string; s?: number }) {
  const hr  = 4.4 * s;
  const hcy = wy + hr + 2;
  const bw  = hr * 1.75;
  const bh  = hr * 1.9;
  const by  = hcy + hr * 0.92;
  return (
    <g>
      <circle cx={cx} cy={hcy} r={hr} fill={fill} />
      <path
        d={`M${cx-bw*0.55},${by} Q${cx-bw},${by+bh} ${cx-bw*0.3},${by+bh} L${cx+bw*0.3},${by+bh} Q${cx+bw},${by+bh} ${cx+bw*0.55},${by}Z`}
        fill={fill}
      />
    </g>
  );
}

interface BodyProps { passengers: PassengerType }

// ── コンパクトハッチバック ──────────────────────────────────────────────────
// サイドウィンドウ: x=101-207  y=32  h=28
function Hatchback({ passengers }: BodyProps) {
  const p = W.person;
  const wy = 32; const wh = 28;
  return (
    <svg viewBox="0 0 320 155" xmlns="http://www.w3.org/2000/svg" className="w-full drop-shadow-sm">
      <path d="M22,128 L22,95 L36,78 L58,68 L78,128 Z" fill={W.bodyDark}/>
      <path d="M58,68 L78,42 L218,42 L242,65 L258,90 L258,128 L78,128 Z" fill={W.body}/>
      <path d="M78,42 L96,28 L208,28 L218,42 Z" fill={W.bodyLight}/>
      <path d="M98,28 L206,28 L212,38 L92,38 Z" fill={W.chrome}/>
      <path d="M62,66 L80,42 L96,42 L96,64 Z" fill={W.glass}/>
      <rect x="101" y="32" width="106" height="28" rx="2" fill={W.glass}/>
      <path d="M212,32 L240,63 L228,70 L212,58 Z" fill={W.glassDark}/>
      {/* 人物 */}
      {passengers === 'solo'   && <Pax cx={130} wy={wy} wh={wh} fill={p} />}
      {passengers === 'couple' && <><Pax cx={122} wy={wy} wh={wh} fill={p} /><Pax cx={162} wy={wy} wh={wh} fill={p} /></>}
      {passengers === 'family' && <>
        <Pax cx={117} wy={wy} wh={wh} fill={p} />
        <Pax cx={148} wy={wy} wh={wh} fill={p} />
        <Pax cx={175} wy={wy} wh={wh} fill={p} s={0.76} />
        <Pax cx={198} wy={wy} wh={wh} fill={p} s={0.72} />
      </>}
      <line x1="160" y1="70" x2="160" y2="126" stroke={W.bodyDark} strokeWidth="1" strokeOpacity="0.4"/>
      <path d="M58,128 A38 38 0 0 1 134,128 Z" fill={W.bodyDark} fillOpacity="0.5"/>
      <path d="M178,128 A38 38 0 0 1 254,128 Z" fill={W.bodyDark} fillOpacity="0.5"/>
      <circle cx="96"  cy="128" r="22" fill={W.tire}/>
      <circle cx="96"  cy="128" r="13" fill="#2a2a3a"/>
      <circle cx="96"  cy="128" r="6"  fill={W.hub}/>
      <circle cx="216" cy="128" r="22" fill={W.tire}/>
      <circle cx="216" cy="128" r="13" fill="#2a2a3a"/>
      <circle cx="216" cy="128" r="6"  fill={W.hub}/>
      <rect x="19" y="88" width="10" height="18" rx="3" fill={W.headlight}/>
      <rect x="255" y="82" width="8"  height="22" rx="2" fill={W.taillight}/>
      <path d="M18,118 L22,128 L78,128" stroke={W.chrome} strokeWidth="2" fill="none"/>
    </svg>
  );
}

// ── ファミリーミニバン ──────────────────────────────────────────────────────
// 1列目: x=94-152  y=18  h=22    2列目: x=158-216  y=18  h=22    クォーター: x=222-252
function Minivan({ passengers }: BodyProps) {
  const p = W.person;
  const wy = 18; const wh = 22;
  return (
    <svg viewBox="0 0 320 155" xmlns="http://www.w3.org/2000/svg" className="w-full drop-shadow-sm">
      <path d="M22,128 L22,72 L36,55 L55,42 L55,128 Z" fill={W.bodyDark}/>
      <path d="M55,42 L68,24 L252,24 L265,42 L268,128 L55,128 Z" fill={W.body}/>
      <path d="M68,24 L76,14 L244,14 L252,24 Z" fill={W.bodyLight}/>
      <path d="M80,14 L240,14 L246,22 L74,22 Z" fill={W.chrome}/>
      <path d="M58,40 L70,24 L88,24 L88,40 Z" fill={W.glass}/>
      <rect x="94"  y="18" width="58" height="22" rx="2" fill={W.glass}/>
      <rect x="158" y="18" width="58" height="22" rx="2" fill={W.glass}/>
      <rect x="222" y="18" width="30" height="22" rx="2" fill={W.glassDark}/>
      {/* 人物 */}
      {passengers === 'solo'   && <Pax cx={116} wy={wy} wh={wh} fill={p} />}
      {passengers === 'couple' && <><Pax cx={112} wy={wy} wh={wh} fill={p} /><Pax cx={138} wy={wy} wh={wh} fill={p} /></>}
      {passengers === 'family' && <>
        <Pax cx={109} wy={wy} wh={wh} fill={p} />
        <Pax cx={135} wy={wy} wh={wh} fill={p} />
        <Pax cx={170} wy={wy} wh={wh} fill={p} s={0.80} />
        <Pax cx={194} wy={wy} wh={wh} fill={p} s={0.78} />
        <Pax cx={235} wy={wy} wh={wh} fill={p} s={0.70} />
      </>}
      <line x1="152" y1="44" x2="152" y2="126" stroke={W.bodyDark} strokeWidth="1.5" strokeOpacity="0.4"/>
      <line x1="218" y1="44" x2="218" y2="126" stroke={W.bodyDark} strokeWidth="1"   strokeOpacity="0.3"/>
      <rect x="180" y="82" width="18" height="4" rx="2" fill={W.chrome}/>
      <path d="M55,128 A38 38 0 0 1 131,128 Z" fill={W.bodyDark} fillOpacity="0.5"/>
      <path d="M195,128 A38 38 0 0 1 271,128 Z" fill={W.bodyDark} fillOpacity="0.5"/>
      <circle cx="93"  cy="128" r="22" fill={W.tire}/>
      <circle cx="93"  cy="128" r="13" fill="#2a2a3a"/>
      <circle cx="93"  cy="128" r="6"  fill={W.hub}/>
      <circle cx="233" cy="128" r="22" fill={W.tire}/>
      <circle cx="233" cy="128" r="13" fill="#2a2a3a"/>
      <circle cx="233" cy="128" r="6"  fill={W.hub}/>
      <rect x="19" y="80" width="10" height="20" rx="3" fill={W.headlight}/>
      <rect x="265" y="72" width="8"  height="24" rx="2" fill={W.taillight}/>
    </svg>
  );
}

// ── プレミアムミニバン（VIP仕様）──────────────────────────────────────────
// 1列目: x=90-145  y=24  h=24    2列目: x=152-207  y=24  h=24    クォーター: x=214-252
function LuxuryVan({ passengers }: BodyProps) {
  const isVip = passengers === 'vip';
  const pFill = isVip ? W.vipPerson : W.person;
  const wy = 24; const wh = 24;
  return (
    <svg viewBox="0 0 320 155" xmlns="http://www.w3.org/2000/svg" className="w-full drop-shadow-sm">
      <path d="M18,128 L18,80 L32,62 L52,50 L52,128 Z" fill={W.bodyDark}/>
      <path d="M52,50 L62,32 L255,32 L268,50 L272,128 L52,128 Z" fill={W.body}/>
      <path d="M62,32 L70,20 L248,20 L255,32 Z" fill={W.bodyLight}/>
      {/* VIP グリル・メッキ感 */}
      <path d="M18,95 L18,118 L34,118 L34,95 Z" fill={isVip ? 'rgba(220,190,80,0.45)' : 'rgba(200,190,160,0.4)'}/>
      {isVip && <rect x="20" y="92" width="14" height="2" rx="1" fill={W.vipGold}/>}
      {isVip && <rect x="20" y="97" width="14" height="1.5" rx="0.75" fill={W.vipGold}/>}
      {isVip && <rect x="20" y="102" width="14" height="1.5" rx="0.75" fill={W.vipGold}/>}
      <rect x="16" y="78" width="14" height="10" rx="2" fill={W.headlight}/>
      <rect x="16" y="92" width="14" height="5"  rx="1" fill="rgba(255,200,100,0.6)"/>
      {/* ウィンドウ */}
      <path d="M56,48 L64,32 L84,32 L84,48 Z" fill={W.glass}/>
      <rect x="90"  y="24" width="55" height="24" rx="2" fill={W.glass}/>
      <rect x="152" y="24" width="55" height="24" rx="2" fill={W.glass}/>
      <rect x="214" y="24" width="38" height="24" rx="2" fill={W.glassDark}/>
      {/* VIP ウィンドウティント */}
      {isVip && <>
        <rect x="90"  y="24" width="55" height="24" rx="2" fill={W.vipTint}/>
        <rect x="152" y="24" width="55" height="24" rx="2" fill={W.vipTint}/>
        <rect x="214" y="24" width="38" height="24" rx="2" fill={W.vipTint}/>
      </>}
      {/* 人物 */}
      {passengers === 'couple' && <><Pax cx={110} wy={wy} wh={wh} fill={W.person}/><Pax cx={134} wy={wy} wh={wh} fill={W.person}/></>}
      {passengers === 'family' && <>
        <Pax cx={108} wy={wy} wh={wh} fill={W.person} />
        <Pax cx={132} wy={wy} wh={wh} fill={W.person} />
        <Pax cx={170} wy={wy} wh={wh} fill={W.person} s={0.80} />
        <Pax cx={193} wy={wy} wh={wh} fill={W.person} s={0.78} />
      </>}
      {isVip && <>
        {/* VIP: ティントの奥にゴールドシルエット */}
        <Pax cx={112} wy={wy} wh={wh} fill={pFill} />
        <Pax cx={172} wy={wy} wh={wh} fill={pFill} />
        <Pax cx={197} wy={wy} wh={wh} fill={pFill} />
        {/* ゴールドラインアクセント */}
        <line x1="52" y1="90" x2="272" y2="90" stroke={W.vipGold} strokeWidth="1.2"/>
      </>}
      {/* VIP 車体ゴールドモール */}
      {isVip && <rect x="52" y="70" width="220" height="2" rx="1" fill="rgba(230,190,70,0.4)"/>}
      <line x1="145" y1="52" x2="145" y2="126" stroke={W.bodyDark} strokeWidth="1.5" strokeOpacity="0.35"/>
      <line x1="208" y1="52" x2="208" y2="126" stroke={W.bodyDark} strokeWidth="1"   strokeOpacity="0.25"/>
      <path d="M52,128 A38 38 0 0 1 128,128 Z" fill={W.bodyDark} fillOpacity="0.5"/>
      <path d="M200,128 A38 38 0 0 1 276,128 Z" fill={W.bodyDark} fillOpacity="0.5"/>
      <circle cx="90"  cy="128" r="24" fill={W.tire}/>
      <circle cx="90"  cy="128" r="15" fill="#2a2a3a"/>
      <circle cx="90"  cy="128" r="7"  fill={isVip ? '#aaa' : '#888'}/>
      <circle cx="238" cy="128" r="24" fill={W.tire}/>
      <circle cx="238" cy="128" r="15" fill="#2a2a3a"/>
      <circle cx="238" cy="128" r="7"  fill={isVip ? '#aaa' : '#888'}/>
      <rect x="268" y="68" width="8" height="28" rx="2" fill={W.taillight}/>
    </svg>
  );
}

// ── SUV ────────────────────────────────────────────────────────────────────
// サイドウィンドウ: x=104-219  y=26  h=26
function Suv({ passengers }: BodyProps) {
  const p = W.person;
  const wy = 26; const wh = 26;
  return (
    <svg viewBox="0 0 320 155" xmlns="http://www.w3.org/2000/svg" className="w-full drop-shadow-sm">
      <path d="M20,128 L20,88 L34,70 L54,58 L60,128 Z" fill={W.bodyDark}/>
      <path d="M60,58 L74,36 L232,36 L252,56 L268,82 L268,128 L60,128 Z" fill={W.body}/>
      <path d="M74,36 L86,22 L226,22 L238,36 Z" fill={W.bodyLight}/>
      <path d="M90,22 L222,22 L228,32 L84,32 Z" fill={W.chrome}/>
      <path d="M64,56 L78,36 L98,36 L98,56 Z" fill={W.glass}/>
      <rect x="104" y="26" width="115" height="26" rx="2" fill={W.glass}/>
      <path d="M224,26 L252,55 L240,60 L224,48 Z" fill={W.glassDark}/>
      {/* 人物 */}
      {passengers === 'solo'   && <Pax cx={132} wy={wy} wh={wh} fill={p} />}
      {passengers === 'couple' && <><Pax cx={126} wy={wy} wh={wh} fill={p} /><Pax cx={164} wy={wy} wh={wh} fill={p} /></>}
      {passengers === 'family' && <>
        <Pax cx={120} wy={wy} wh={wh} fill={p} />
        <Pax cx={152} wy={wy} wh={wh} fill={p} />
        <Pax cx={183} wy={wy} wh={wh} fill={p} s={0.78} />
        <Pax cx={207} wy={wy} wh={wh} fill={p} s={0.74} />
      </>}
      <line x1="168" y1="62" x2="168" y2="126" stroke={W.bodyDark} strokeWidth="1.5" strokeOpacity="0.4"/>
      <rect x="88" y="20" width="138" height="3" rx="1.5" fill={W.bodyDark} fillOpacity="0.5"/>
      <path d="M60,128 A42 42 0 0 1 144,128 Z" fill={W.bodyDark} fillOpacity="0.5"/>
      <path d="M184,128 A42 42 0 0 1 268,128 Z" fill={W.bodyDark} fillOpacity="0.5"/>
      <circle cx="102" cy="128" r="26" fill={W.tire}/>
      <circle cx="102" cy="128" r="16" fill="#2a2a3a"/>
      <circle cx="102" cy="128" r="7"  fill={W.hub}/>
      <circle cx="226" cy="128" r="26" fill={W.tire}/>
      <circle cx="226" cy="128" r="16" fill="#2a2a3a"/>
      <circle cx="226" cy="128" r="7"  fill={W.hub}/>
      <rect x="17" y="82" width="10" height="16" rx="2" fill={W.headlight}/>
      <rect x="265" y="76" width="8"  height="20" rx="2" fill={W.taillight}/>
    </svg>
  );
}

// ── セダン ─────────────────────────────────────────────────────────────────
// サイドウィンドウ: x=112-200  y=22  h=26
function Sedan({ passengers }: BodyProps) {
  const p = W.person;
  const wy = 22; const wh = 26;
  return (
    <svg viewBox="0 0 320 155" xmlns="http://www.w3.org/2000/svg" className="w-full drop-shadow-sm">
      <path d="M14,128 L14,96 L26,78 L45,68 L60,128 Z" fill={W.bodyDark}/>
      <path d="M45,68 L55,58 L68,54 L68,128 L45,128 Z" fill={W.body}/>
      <path d="M55,58 L68,54 L88,50 L88,128 L68,128 Z" fill={W.body}/>
      <path d="M88,50 L96,34 L210,34 L224,44 L242,56 L268,86 L268,128 L88,128 Z" fill={W.body}/>
      <path d="M224,44 L245,54 L268,85 L255,80 L242,56 Z" fill={W.bodyLight}/>
      <path d="M96,34 L106,20 L206,20 L212,34 Z" fill={W.bodyLight}/>
      <path d="M108,20 L204,20 L208,30 L104,30 Z" fill={W.chrome}/>
      <path d="M92,48 L104,34 L108,34 L108,50 Z" fill={W.glass}/>
      <rect x="112" y="22" width="88" height="26" rx="2" fill={W.glass}/>
      <path d="M204,22 L218,42 L208,50 L204,42 Z" fill={W.glassDark}/>
      {/* 人物 */}
      {passengers === 'solo'   && <Pax cx={136} wy={wy} wh={wh} fill={p} />}
      {passengers === 'couple' && <><Pax cx={130} wy={wy} wh={wh} fill={p} /><Pax cx={168} wy={wy} wh={wh} fill={p} /></>}
      {passengers === 'family' && <>
        <Pax cx={126} wy={wy} wh={wh} fill={p} />
        <Pax cx={158} wy={wy} wh={wh} fill={p} />
        <Pax cx={184} wy={wy} wh={wh} fill={p} s={0.78} />
      </>}
      <line x1="170" y1="54" x2="170" y2="126" stroke={W.bodyDark} strokeWidth="1.5" strokeOpacity="0.4"/>
      <path d="M58,128 A38 38 0 0 1 134,128 Z" fill={W.bodyDark} fillOpacity="0.5"/>
      <path d="M196,128 A38 38 0 0 1 272,128 Z" fill={W.bodyDark} fillOpacity="0.5"/>
      <circle cx="96"  cy="128" r="22" fill={W.tire}/>
      <circle cx="96"  cy="128" r="13" fill="#2a2a3a"/>
      <circle cx="96"  cy="128" r="6"  fill={W.hub}/>
      <circle cx="234" cy="128" r="22" fill={W.tire}/>
      <circle cx="234" cy="128" r="13" fill="#2a2a3a"/>
      <circle cx="234" cy="128" r="6"  fill={W.hub}/>
      <rect x="11" y="90" width="10" height="16" rx="2" fill={W.headlight}/>
      <rect x="265" y="82" width="8"  height="16" rx="2" fill={W.taillight}/>
    </svg>
  );
}

// ── スポーツカー ────────────────────────────────────────────────────────────
// サイドウィンドウ: x=140-190  y=28  h=26
function Sports({ passengers }: BodyProps) {
  const p = W.person;
  const wy = 28; const wh = 26;
  return (
    <svg viewBox="0 0 320 155" xmlns="http://www.w3.org/2000/svg" className="w-full drop-shadow-sm">
      <path d="M10,128 L10,105 L20,92 L36,84 L55,80 L55,128 Z" fill={W.bodyDark}/>
      <path d="M55,80 L70,76 L75,128 L55,128 Z" fill={W.bodyDark}/>
      <path d="M70,76 L82,68 L96,62 L100,128 L75,128 Z" fill={W.body}/>
      <path d="M96,62 L110,58 L110,128 L100,128 Z" fill={W.body}/>
      <path d="M110,58 L122,38 L198,38 L215,52 L240,78 L240,128 L110,128 Z" fill={W.body}/>
      <path d="M122,38 L130,26 L192,26 L200,38 Z" fill={W.bodyLight}/>
      <path d="M132,26 L190,26 L194,34 L128,34 Z" fill={W.chrome}/>
      <path d="M114,56 L126,38 L136,38 L136,56 Z" fill={W.glass}/>
      <rect x="140" y="28" width="50" height="26" rx="2" fill={W.glass}/>
      <path d="M193,28 L215,52 L200,58 L193,44 Z" fill={W.glassDark}/>
      {/* 人物（スポーツ=ドライバーのみ） */}
      {(passengers === 'solo' || passengers === 'couple' || passengers === 'family') &&
        <Pax cx={158} wy={wy} wh={wh} fill={p} />
      }
      {passengers === 'couple' && <Pax cx={178} wy={wy} wh={wh} fill={p} />}
      <rect x="228" y="72" width="24" height="5" rx="2" fill={W.bodyDark}/>
      <path d="M55,128 A40 40 0 0 1 135,128 Z" fill={W.bodyDark} fillOpacity="0.5"/>
      <path d="M160,128 A40 40 0 0 1 240,128 Z" fill={W.bodyDark} fillOpacity="0.5"/>
      <circle cx="95"  cy="128" r="25" fill={W.tire}/>
      <circle cx="95"  cy="128" r="15" fill="#2a2a3a"/>
      <circle cx="95"  cy="128" r="7"  fill={W.hub}/>
      <circle cx="200" cy="128" r="25" fill={W.tire}/>
      <circle cx="200" cy="128" r="15" fill="#2a2a3a"/>
      <circle cx="200" cy="128" r="7"  fill={W.hub}/>
      <rect x="8"   y="100" width="9"  height="14" rx="2" fill={W.headlight}/>
      <rect x="237" y="72"  width="7"  height="16" rx="2" fill={W.taillight}/>
      <rect x="110" y="124" width="130" height="5" rx="2" fill={W.bodyDark} fillOpacity="0.5"/>
    </svg>
  );
}

// ── 軽オフロード（ジムニー） ────────────────────────────────────────────────
// フロント窓: x=72-120  y=32  h=28    サイド窓: x=126-196  y=22  h=26
function Kei({ passengers }: BodyProps) {
  const p = W.person;
  return (
    <svg viewBox="0 0 320 155" xmlns="http://www.w3.org/2000/svg" className="w-full drop-shadow-sm">
      <path d="M55,128 L55,62 L68,50 L68,128 Z" fill={W.bodyDark}/>
      <path d="M68,50 L80,28 L230,28 L242,50 L248,128 L68,128 Z" fill={W.body}/>
      <path d="M80,28 L86,18 L224,18 L230,28 Z" fill={W.bodyLight}/>
      <path d="M88,18 L222,18 L226,26 L84,26 Z" fill={W.chrome}/>
      <rect x="72"  y="32" width="48" height="28" rx="2" fill={W.glass}/>
      <rect x="126" y="22" width="70" height="26" rx="2" fill={W.glass}/>
      <rect x="202" y="22" width="34" height="26" rx="2" fill={W.glassDark}/>
      {/* 人物 */}
      {passengers === 'solo'   && <Pax cx={88}  wy={32} wh={28} fill={p} />}
      {passengers === 'couple' && <><Pax cx={84} wy={32} wh={28} fill={p} /><Pax cx={108} wy={32} wh={28} fill={p} /></>}
      {passengers === 'family' && <>
        <Pax cx={82}  wy={32} wh={28} fill={p} />
        <Pax cx={106} wy={32} wh={28} fill={p} />
        <Pax cx={148} wy={22} wh={26} fill={p} s={0.78} />
        <Pax cx={172} wy={22} wh={26} fill={p} s={0.76} />
      </>}
      <line x1="120" y1="54" x2="120" y2="126" stroke={W.bodyDark} strokeWidth="2"   strokeOpacity="0.4"/>
      <line x1="196" y1="54" x2="196" y2="126" stroke={W.bodyDark} strokeWidth="1.5" strokeOpacity="0.3"/>
      <rect x="88" y="15" width="136" height="4" rx="2" fill={W.bodyDark} fillOpacity="0.4"/>
      <path d="M55,128 A44 44 0 0 1 143,128 Z" fill={W.bodyDark} fillOpacity="0.55"/>
      <path d="M173,128 A44 44 0 0 1 261,128 Z" fill={W.bodyDark} fillOpacity="0.55"/>
      <circle cx="99"  cy="128" r="28" fill={W.tire}/>
      <circle cx="99"  cy="128" r="18" fill="#2a2a3a"/>
      <circle cx="99"  cy="128" r="8"  fill={W.hub}/>
      <circle cx="217" cy="128" r="28" fill={W.tire}/>
      <circle cx="217" cy="128" r="18" fill="#2a2a3a"/>
      <circle cx="217" cy="128" r="8"  fill={W.hub}/>
      <rect x="52" y="62" width="12" height="18" rx="2" fill={W.headlight}/>
      <rect x="52" y="82" width="12" height="8"  rx="1" fill="rgba(255,200,100,0.7)"/>
      <rect x="244" y="54" width="8"  height="22" rx="2" fill={W.taillight}/>
    </svg>
  );
}

// ── 外部公開コンポーネント ───────────────────────────────────────────────────
const COMPONENTS: Record<CarBody, React.ComponentType<BodyProps>> = {
  hatchback:    Hatchback,
  minivan:      Minivan,
  'luxury-van': LuxuryVan,
  suv:          Suv,
  sedan:        Sedan,
  sports:       Sports,
  kei:          Kei,
};

interface Props {
  body: CarBody;
  primaryColor: string;
  passengers?: PassengerType;
  className?: string;
}

export function CarIllustration({ body, primaryColor, passengers = 'none', className = '' }: Props) {
  const Component = COMPONENTS[body];
  const style = {
    '--car-body':       primaryColor,
    '--car-body-dark':  primaryColor + 'cc',
    '--car-body-light': primaryColor + '88',
  } as React.CSSProperties;

  return (
    <div className={className} style={style}>
      <Component passengers={passengers} />
    </div>
  );
}
