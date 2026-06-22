import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function callClaude(prompt: string, maxTokens = 2048): Promise<string> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });
  const content = message.content[0];
  if (content.type !== 'text') throw new Error('AIからの応答が不正です');
  return content.text.trim();
}

async function callClaudeVision(
  images: { base64: string; mediaType: string }[],
  prompt: string,
  maxTokens = 2048,
): Promise<string> {
  const content: Anthropic.MessageParam['content'] = [
    ...images.map(img => ({
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: img.mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
        data: img.base64,
      },
    })),
    { type: 'text' as const, text: prompt },
  ];
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content }],
  });
  const res = message.content[0];
  if (res.type !== 'text') throw new Error('AIからの応答が不正です');
  return res.text.trim();
}

function parseJSON(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('AIレスポンスの解析に失敗しました');
  }
}

function buildVehicleInfo(body: Record<string, string>): string {
  return [
    `車種名: ${body.carName}`,
    body.grade     ? `グレード: ${body.grade}`       : null,
    body.year      ? `年式: ${body.year}`             : null,
    body.seating   ? `乗車定員: ${body.seating}`      : null,
    body.carStatus ? `車両状態: ${body.carStatus}`    : null,
    body.equipment ? `カラー/装備: ${body.equipment}` : null,
  ].filter(Boolean).join('\n');
}

// ── Mode handlers ──────────────────────────────────────────────────────

async function handleMulti(body: Record<string, string>) {
  if (!body.carName?.trim()) {
    return NextResponse.json({ error: '車種名は必須です' }, { status: 400 });
  }

  const vehicleInfo = buildVehicleInfo(body);

  const prompt = `あなたは中古車・未使用車販売店「松下モータース」のDXサポートAIです。
以下の車両情報をもとに、4つの掲載媒体それぞれに最適な文章を生成してください。

【車両情報】
${vehicleInfo}

【各媒体の出力要件】
- カーセンサー: グレード補記＋アピールポイントを含む掲載文（150〜200文字）。検索ヒットしやすいキーワードを必ず含める
- グーネット: 車両状態と魅力を伝える掲載文（150〜200文字）。購入を後押しするひとことコメントを末尾に
- Instagram投稿文: 絵文字を適度に使った親しみやすい投稿文（120〜180文字）
- Instagramハッシュタグ: 関連ハッシュタグ10〜15個（#中古車 #松下モータース #大阪中古車 等を含める）
- 自社ブログ記事タイトル: SEOを意識した検索されやすいタイトル
- 自社ブログ本文: 車両の魅力を伝えるブログ記事本文（400〜600文字、見出しや改行で読みやすく）

以下のJSON形式のみで回答してください（マークダウン・コードブロック不使用）：
{
  "mode": "multi",
  "carsensor": "カーセンサー掲載文",
  "goonet": "グーネット掲載文",
  "instagram": "Instagram投稿文",
  "instagramHashtags": "#ハッシュタグ #リスト",
  "blogTitle": "ブログ記事タイトル",
  "blog": "ブログ本文"
}`;

  const text = await callClaude(prompt, 2048);
  return NextResponse.json(parseJSON(text));
}

async function handleGrade(body: Record<string, string>) {
  if (!body.carName?.trim()) {
    return NextResponse.json({ error: '車種名は必須です' }, { status: 400 });
  }

  const vehicleInfo = buildVehicleInfo(body);

  const prompt = `あなたは中古車・未使用車販売店「松下モータース」のDXサポートAIです。
以下の車両情報をもとに、カーセンサー向けのグレード補記とアピールポイントを生成してください。

【車両情報】
${vehicleInfo}

【出力要件】

■ グレード補記（カーセンサーのグレード補記入力フィールド用・100文字以内厳守）
以下のフォーマットで出力すること：
「{エンジン型式・グレード略称}　{乗車定員} {車両状態} {装備1} {装備2} {装備3}…　（{カラー名}）」

フォーマットのルール：
- 冒頭はエンジン排気量・駆動方式・グレード名の略称（例: 2.0 e:HEV エアー EX）
- 乗車定員・車両状態はその直後
- 装備はスペース区切り（読点・句読点なし）、検索されやすいキーワードを優先して列挙
- カラー名は最後に全角括弧で（例: （メテオロイドグレー・メタリック））
- 合計100文字以内に厳密に収める
- 自然な流れで読めるよう重要度順に並べる

■ アピールポイント: 購買意欲を高める具体的なポイントを5〜7つ（各30〜60文字）

以下のJSON形式のみで回答してください（マークダウン・コードブロック不使用）：
{
  "mode": "grade",
  "gradeNote": "グレード補記テキスト",
  "appealPoints": [
    "アピールポイント1",
    "アピールポイント2",
    "アピールポイント3",
    "アピールポイント4",
    "アピールポイント5"
  ]
}`;

  const text = await callClaude(prompt, 1024);
  return NextResponse.json(parseJSON(text));
}

async function handleReply(body: Record<string, string>) {
  if (!body.inquiry?.trim()) {
    return NextResponse.json({ error: '問い合わせ内容は必須です' }, { status: 400 });
  }

  const prompt = `あなたは中古車・未使用車販売店「松下モータース」の接客担当スタッフです。
以下のお客様からの問い合わせに対して、丁寧で信頼感のある返信メールの下書きを作成してください。

【お客様からの問い合わせ】
${body.inquiry}

【返信の要件】
- 丁寧な敬語（ですます調）で、温かみのある文体
- お客様の質問・要望に具体的に答える
- 次のアクション（来店・お電話・追加情報のご案内など）を自然に促す
- 署名は「松下モータース スタッフ一同」に統一
- 本文は250〜400文字程度

以下のJSON形式のみで回答してください（マークダウン・コードブロック不使用）：
{
  "mode": "reply",
  "subject": "Re: [問い合わせ内容を推定して件名を補完]",
  "body": "返信本文（改行を含む）"
}`;

  const text = await callClaude(prompt, 1024);
  return NextResponse.json(parseJSON(text));
}

async function handlePhoto(body: Record<string, unknown>) {
  const images = body.images as { base64: string; mediaType: string }[] | undefined;
  if (!images || images.length === 0) {
    return NextResponse.json({ error: '画像を1枚以上アップロードしてください' }, { status: 400 });
  }

  const prompt = `あなたは中古車・未使用車の専門家AIです。
添付された車両画像（コーションプレート・内装・外観など）を詳しく解析してください。

以下の情報を読み取り、JSONのみで出力してください（マークダウン・コードブロック不使用）：

{
  "mode": "photo",
  "chassisNumber": "車台番号（コーションプレートから正確に読み取る。例: ZRR80-0123456）",
  "modelCode": "型式（例: 3BA-ZRR80W）",
  "colorCode": "カラーコード（例: 070）",
  "trimCode": "トリムコード（例: FJ010）",
  "year": "年式推測（例: 2020年式）",
  "grade": "グレード推測（例: Si W×B III）",
  "equipment": ["読み取れた装備・オプション1", "装備2", "装備3"],
  "notes": "その他の特記事項（読み取り精度・不明点など）"
}

【解析のポイント】
- コーションプレートが写っていれば車台番号・型式・カラーコード・トリムコードを正確に読み取る
- ナビ画面・シート素材・ルーフ形状・ADAS表示等から装備を判断
- 外観からボディカラー・ホイール・オプションを判断
- 確実でない情報には「（推測）」と付記し、読み取れなかった項目は空文字にする`;

  const text = await callClaudeVision(images, prompt, 2048);
  return NextResponse.json(parseJSON(text));
}

// ── Entry point ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;
    const { mode } = body;

    if (mode === 'multi') return handleMulti(body as Record<string, string>);
    if (mode === 'grade') return handleGrade(body as Record<string, string>);
    if (mode === 'reply') return handleReply(body as Record<string, string>);
    if (mode === 'photo') return handlePhoto(body);

    return NextResponse.json({ error: '不正なモードです' }, { status: 400 });
  } catch (err) {
    console.error('Optimize API error:', err);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
