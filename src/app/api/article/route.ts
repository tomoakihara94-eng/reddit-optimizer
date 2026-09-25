import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 300;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-opus-5';

type Topic = 'regret' | 'minorchange';

// クライアントへは1行1イベントの NDJSON で流す
export type ArticleEvent =
  | { type: 'status'; text: string }
  | { type: 'facts'; text: string; imageHint: string }
  | { type: 'delta'; text: string }
  | { type: 'error'; text: string };

const CHANGE_TERMS = `## モデルチェンジ用語の定義（厳守）
- フルモデルチェンジ: 世代が変わること。車台・ボディ・内外装が一新され、型式（例: 30系→40系、B34A→別の型式）が変わる。「新型」「◯代目」はこれを指す
- マイナーチェンジ（ビッグマイナーチェンジを含む）: 同じ世代の中での中規模の改良。フロントまわりのデザイン変更、装備・安全装備・パワートレインの変更など。世代は変わらず、型式の基本部分は同じ。変更前を「前期」、変更後を「後期」と呼ぶ
- 一部改良・年次改良・特別仕様車の追加: マイナーチェンジより小さな変更。マイナーチェンジと呼ばない
- メーカーやメディアが「一部改良」と呼んでいるものを勝手に「マイナーチェンジ」と言い換えない。逆も同様
- フルモデルチェンジで別の世代になったものを「マイナーチェンジで変わった」「前期・後期」と書かない`;

// ── ステップ1: Web検索で事実を調べ、ファクトシートを作る ──────────────
const RESEARCH_SYSTEM = `あなたは自動車の事実調査担当です。ブログ記事の執筆前に、指定された車種について正確な事実だけを集めたファクトシートを作ります。

${CHANGE_TERMS}

## 調査のルール
- 必ずWeb検索で確認する。記憶だけで書かない
- 情報源の優先順位: メーカー公式サイト・公式プレスリリース > 大手自動車メディア（Response、webCG、カービュー、ベストカー、MOTA、くるまのニュース等）> 中古車情報サイト（カーセンサー、グーネット）
- 年月・型式・変更内容・数値は、情報源で確認できたものだけ書く。確認できなかったことは「未確認」と書く。推測で埋めない
- 型式・世代の指定がある場合は、その世代について詳しく調べる。指定がない場合は、現行（最新）世代を対象にし、そのことを明記する
- 世代ごとの変更の種類（フルモデルチェンジ／マイナーチェンジ／一部改良）は、情報源での呼び方に従う

## 出力形式（マークダウン。前置き不要）
### 対象
（車種名・対象世代・型式・販売期間）
### 世代の歴史
（全世代を1行ずつ: ◯代目／型式／発売年月／フルモデルチェンジかどうか）
### 対象世代の変更履歴
（発売以降の変更を時系列で1行ずつ: 年月／種類（マイナーチェンジ・一部改良など）／主な変更内容。マイナーチェンジが無い場合は「マイナーチェンジは未実施」と明記）
### 前期・後期の違い
（対象世代にマイナーチェンジがある場合のみ。外装・内装・装備・安全装備・パワートレインの違い）
### 主要スペック・価格
（グレード構成、エンジン・駆動方式、WLTC燃費、新車価格帯。中古相場は分かる範囲で「目安」として）
### 評判・よく言われる長所と短所
（オーナーレビューやメディア評価で多く見られるもの）
### 情報源
（参照したURLを箇条書き）

最後に1行だけ、次の形式で画像生成用のヒントを書く:
IMAGE_HINT: （英語。対象世代の年式範囲と、見分けるための外観の特徴。例: "2023-2025 first-generation Mitsubishi Delica Mini (B34A), boxy kei super-height wagon with Delica-style front grille and semicircular LED daytime running lights"）`;

// ── ステップ2: ファクトシートと独自の視点から記事を書く ────────────────
const WRITER_SYSTEM = `あなたは中古車販売店「松下モータース」の販売スタッフ兼ブログ編集者です。
自社サイトに掲載する、車種別のSEO記事を書きます。

## 記事の基本スタンス
- 販売店の現場目線で、購入検討者の「本当に自分に合うのか」という不安に正直に答える記事にする
- 良いところだけでなく、向いていない人もはっきり書く。そのうえで「逆にこういう人には最高」と前向きに締める
- 文体は「です・ます」。読者に語りかける疑問形（「〜なのでしょうか？」）を適度に使う
- 「少し極端な言い方になりますが」のような、正直さが伝わる言い回しを自然に入れる
- 一文を短めにし、1段落は2〜4文。スマホで読みやすくする

## 事実の扱い（最重要）
- 年月・型式・世代・変更内容・装備・数値・価格は、ファクトシートに書かれたものだけを使う。ファクトシートに無い事実は書かない。「未確認」の項目には触れない
- 自分の記憶の知識で、ファクトシートの内容を補ったり上書きしたりしない
- 新車価格や中古相場は「目安」「時期や状態で変わります」と添える
- 燃費は「WLTCモードで約◯km/L」のように、ファクトシートにある条件つきで書く

${CHANGE_TERMS}

## 独自の視点の扱い
- 「松下モータースの独自の視点」が与えられたら、それを記事の軸にする。複数のセクションで「当店では」「実際にお客様から」という形で具体的に織り込む
- 独自の視点から、他の記事にはない切り口の見出しを最低1つ立てる（例：「雪が少ない静岡でも4WDが売れる理由」のような、現場ならではの逆説や発見）
- 独自の視点に書かれていない販売台数・割合・お客様の発言・店舗エピソードを創作しない。店の実績として書いてよい数字は、独自の視点に書かれたものだけ
- 「当店では〜という方を何度も見てきました」「〜とよく相談されます」のような、ぼかした体験談も創作に当たるので書かない。「当店」「お客様」を主語にする文は、独自の視点の内容を言い換えたものに限る
- 独自の視点が空の場合は、店の体験談を捏造せず、一般的な傾向として書く

## 出力形式（マークダウン）
- 1行目: 「# 」で始まる記事タイトル（32〜45文字。車種名と「後悔」「評判」「違い」など検索されやすい語を含める）
- 次に、見出しなしのリード文（3〜5文）。読者の悩みへの共感 → この記事で分かること、の順
- 本文の見出しは「## 」、必要なら小見出し「### 」
- 箇条書き（- ）や太字（**）で要点を見やすくする。比較が有効な箇所では表（| 区切り）を使ってよい
- 本文の最後は「## まとめ」。締めの一文で、実車を見に来店してほしいことを押し付けがましくなく伝える
- 画像を入れる位置に、次の形式の行を単独で置く（前後は空行）。必ずちょうど5行（4枚以下は不可）。1枚目はリード文の直後（アイキャッチ）、残りは内容と関係の深いセクションの本文中に分散させる
  [[IMAGE: 日本語の説明（ブログのalt属性になる。20〜40字） | English scene description for an image generator (30-50 words)]]
- 英語の説明には、その画像で見せたいもの（外観の角度・内装の部位・荷室・走行シーン・利用シーンなど）と背景・天候・時間帯を具体的に書く。ボディカラーを指定する場合は、その世代に実在する色にする。5枚で構図が重ならないようにする
- まとめの後に、空行を1つ挟んで「META: 」で始まる1行（検索結果用のメタディスクリプション、100〜120文字）を出力する
- 前置きや説明、コードブロック、情報源のURLは出力しない。記事本文だけを出力する`;

function carLabel(carName: string, carType: string): string {
  return carType ? `${carName}（${carType}）` : carName;
}

function buildResearchPrompt(topic: Topic, carName: string, carType: string): string {
  const focus = topic === 'minorchange'
    ? '特に、対象世代のマイナーチェンジ・一部改良の履歴と、前期・後期の具体的な違いを重点的に調べてください。対象世代にマイナーチェンジが実施されていない場合は、そのことをはっきり書いてください。'
    : '特に、評判（オーナーレビュー・メディア評価）、長所と短所、グレード構成、燃費、価格帯を重点的に調べてください。';
  return `車種: ${carLabel(carName, carType)}\n\n${focus}`;
}

function buildWriterPrompt(topic: Topic, carName: string, carType: string, ownPerspective: string, facts: string): string {
  const structure = topic === 'regret'
    ? `## テーマ
「${carName}で後悔しないために — 評判とレビュー、購入前に知っておきたい注意点」

## 構成（この流れを基本に、車種に合わせて調整）
1. 「## ${carName}とはどんな車？」— クラス・ライバル車との位置付け、コンセプト、対象世代の特徴（350字程度）
2. この車の「売れ方」や「選ばれ方」の特徴 — スペック比較で選ばれる車か、デザインや世界観で選ばれる車か、など（300字程度）
3. 「## 後悔する人① 〜」から「## 後悔する人⑤ 〜」まで、後悔しやすい人のタイプを5つ。それぞれ、なぜ後悔するか → 分かれ目になる判断基準、の順で具体的に（各200字程度）
4. 松下モータースの独自の視点から立てた、現場ならではの見出し（1〜2セクション）
5. 「## 逆に${carName}がおすすめな人」— 箇条書きで4〜6項目
6. 「## まとめ」— 後悔しやすい人／満足度が高い人を短く整理し直す

## SEOキーワード（見出しと本文に自然に含める）
「${carName} 後悔」「${carName} 評判」「${carName} デメリット」「${carName} 中古」`
    : `## テーマ
「${carName}はマイナーチェンジでどう変わった？ 前期・後期の違いと、どちらを買うべきか」

## 構成（この流れを基本に、ファクトシートに合わせて調整）
1. 「## ${carName}とはどんな車？」— 対象世代の概要と発売時期（300字程度）
2. 「## マイナーチェンジはいつ？何が変わった？」— 時期と変更の全体像。前期・後期の比較表を入れる。一部改良は一部改良として分けて書く
3. エクステリアの違い / インテリア・装備の違い / 安全装備の違い / 走り・燃費の違い、をそれぞれ見出しで（ファクトシートに変更が無い項目は省略する）
4. 「## 中古車で選ぶなら前期と後期どっち？」— 価格差の考え方と、用途別のおすすめ
5. 松下モータースの独自の視点から立てた、現場ならではの見出し（1〜2セクション）
6. 「## まとめ」— 前期が向いている人／後期が向いている人を箇条書きで

## ファクトシートで対象世代にマイナーチェンジが無い場合
「マイナーチェンジ」の記事にせず、「年式による違い（一部改良の履歴）」の記事に切り替える。タイトル・見出しでもマイナーチェンジという言葉を使わない。前期・後期という言葉も使わない

## SEOキーワード（見出しと本文に自然に含める）
「${carName} マイナーチェンジ」「${carName} 前期 後期 違い」「${carName} 変更点」「${carName} 中古」`;

  return `次の車種の記事を書いてください。

## 車種
${carLabel(carName, carType)}

## ファクトシート（事実はここに書かれたものだけを使う）
${facts}

## 松下モータースの独自の視点
${ownPerspective || '（なし）'}

${structure}

## 分量
本文は全体で3000〜4000字程度。`;
}

// Web検索つきで調査する。サーバー側ツールの上限で pause_turn になったら続きを依頼する
async function research(topic: Topic, carName: string, carType: string, onSearch: (query: string) => void): Promise<string> {
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: buildResearchPrompt(topic, carName, carType) }];
  for (let turn = 0; turn < 4; turn++) {
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 16000,
      output_config: { effort: 'medium' },
      system: RESEARCH_SYSTEM,
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 8 }],
      messages,
    });
    stream.on('contentBlock', (block) => {
      if (block.type === 'server_tool_use' && block.name === 'web_search') {
        const q = (block.input as { query?: string } | null)?.query;
        if (q) onSearch(q);
      }
    });
    const msg = await stream.finalMessage();
    if (msg.stop_reason === 'pause_turn') {
      messages.push({ role: 'assistant', content: msg.content });
      continue;
    }
    if (msg.stop_reason === 'refusal') throw new Error('調査を実行できませんでした');
    // 検索の合間に出る独り言を除き、最後のテキストブロック以降をファクトシートとして使う
    const texts = msg.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map(b => b.text);
    const joined = texts.join('');
    const start = joined.indexOf('### 対象');
    return (start >= 0 ? joined.slice(start) : joined).trim();
  }
  throw new Error('調査が終わりませんでした。もう一度お試しください');
}

// 調査と執筆はそれぞれ時間がかかるため、関数の実行時間上限に収まるよう別リクエストに分ける
//   phase: 'research' → status / facts を返す
//   phase: 'write'    → facts を受け取り、delta（記事本文）を返す
export async function POST(req: NextRequest) {
  let body: { phase?: 'research' | 'write'; carName?: string; carType?: string; ownPerspective?: string; topic?: Topic; facts?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'リクエストの形式が不正です' }, { status: 400 });
  }

  const phase = body.phase;
  const carName = body.carName?.trim() ?? '';
  const carType = body.carType?.trim() ?? '';
  const ownPerspective = body.ownPerspective?.trim() ?? '';
  const facts = body.facts?.trim() ?? '';
  const topic = body.topic;

  if (!carName) {
    return NextResponse.json({ error: '車種名を入力してください' }, { status: 400 });
  }
  if (topic !== 'regret' && topic !== 'minorchange') {
    return NextResponse.json({ error: '記事テーマを選択してください' }, { status: 400 });
  }
  if (phase !== 'research' && phase !== 'write') {
    return NextResponse.json({ error: 'phase が不正です' }, { status: 400 });
  }
  if (phase === 'write' && !facts) {
    return NextResponse.json({ error: '調査結果がありません' }, { status: 400 });
  }

  const encoder = new TextEncoder();
  let active: { abort(): void } | null = null;
  let cancelled = false;

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: ArticleEvent) => {
        if (!cancelled) controller.enqueue(encoder.encode(JSON.stringify(e) + '\n'));
      };
      try {
        if (phase === 'research') {
          send({ type: 'status', text: `${carLabel(carName, carType)} の情報を調べています…` });
          const factsRaw = await research(topic, carName, carType, (q) => send({ type: 'status', text: `検索中: ${q}` }));
          const hintMatch = factsRaw.match(/\n?IMAGE_HINT[:：]\s*(.+)\s*$/);
          const imageHint = hintMatch?.[1].trim().replace(/^"|"$/g, '') ?? '';
          send({ type: 'facts', text: hintMatch ? factsRaw.slice(0, hintMatch.index).trim() : factsRaw, imageHint });
          return;
        }

        const stream = client.messages.stream({
          model: MODEL,
          max_tokens: 32000,
          output_config: { effort: 'medium' },
          system: WRITER_SYSTEM,
          messages: [{ role: 'user', content: buildWriterPrompt(topic, carName, carType, ownPerspective, facts) }],
        });
        active = stream;
        stream.on('text', (delta) => send({ type: 'delta', text: delta }));
        const final = await stream.finalMessage();
        if (final.stop_reason === 'max_tokens') {
          send({ type: 'error', text: '記事が長すぎて途中で切れました。もう一度お試しください。' });
        } else if (final.stop_reason === 'refusal') {
          send({ type: 'error', text: 'この内容では記事を生成できませんでした。入力を見直してください。' });
        }
      } catch (err) {
        if (cancelled) return;
        console.error(`[article:${phase}]`, err);
        const msg = err instanceof Anthropic.APIError
          ? `AIの呼び出しに失敗しました（${err.status ?? '接続エラー'}）`
          : err instanceof Error ? err.message : '生成に失敗しました';
        send({ type: 'error', text: msg });
      } finally {
        if (!cancelled) controller.close();
      }
    },
    cancel() {
      cancelled = true;
      active?.abort();
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
