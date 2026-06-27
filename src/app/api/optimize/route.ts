import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { getOcrProvider } from '@/lib/ocr/factory';
import type { OcrImage } from '@/lib/ocr/types';
import sharp from 'sharp';
import { findVehicleByModelCode } from '@/lib/model-code-map';

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

// ── Shared prompt builders ─────────────────────────────────────────────

function buildGradePrompt(vehicleDesc: string): string {
  return `あなたは中古車・未使用車販売店「松下モータース」のDXサポートAIです。
以下の車両情報（写真AIによる解析結果）をもとに、カーセンサー向けのグレード補記とアピールポイントを生成してください。

【車両情報（写真解析より）】
${vehicleDesc}

■ グレード補記（100文字以内厳守）
フォーマット：「{排気量・駆動・グレード略称}　{乗車定員} {装備1} {装備2}…　（{カラー名}）」
- 装備はスペース区切り・検索キーワード優先
- 不足情報は推測で補完し（推測）と付記

■ アピールポイント: 5〜7つ（各30〜60文字）

JSON形式のみで回答（マークダウン不使用）：
{"gradeNote":"...","appealPoints":["...","...","..."]}`;
}

function buildMultiPrompt(vehicleDesc: string): string {
  return `あなたは中古車・未使用車販売店「松下モータース」のSNS担当AIです。
以下の車両情報（写真AI解析結果）をもとに、InstagramとSEOブログ記事を生成してください。

【車両情報（写真解析より）】
${vehicleDesc}

■ Instagram投稿文（250〜350文字）
- 冒頭フックで思わず読みたくなる一行
- 絵文字でテンポよく、生活シーンを想起させる
- CTA: 「DMしてね」「プロフのリンクから」を自然に

■ Instagramハッシュタグ（20〜25個）
- 車種・メーカー・地域（#静岡中古車 #浜松中古車）・松下モータース固有タグ

■ ブログ記事タイトル（32〜38文字、SEO最適化）

■ ブログ本文（1000〜1500文字）
- H2/H3見出し3〜4個、静岡・浜松のローカルSEOキーワードを自然に散りばめる
- 末尾にCTA（来店・問い合わせ促進）

JSON形式のみで回答（マークダウン不使用・改行は\\nでエスケープ）：
{"instagram":"...","instagramHashtags":"...","blogTitle":"...","blog":"..."}`;
}

function parseGradeResult(result: PromiseSettledResult<string>) {
  if (result.status !== 'fulfilled') return { gradeNote: '', appealPoints: [] as string[] };
  try {
    const d = parseJSON(result.value) as { gradeNote?: string; appealPoints?: string[] };
    return { gradeNote: d.gradeNote ?? '', appealPoints: d.appealPoints ?? [] };
  } catch { return { gradeNote: '', appealPoints: [] as string[] }; }
}

function parseMultiResult(result: PromiseSettledResult<string>) {
  if (result.status !== 'fulfilled') return { instagram: '', instagramHashtags: '', blogTitle: '', blog: '' };
  try {
    const d = parseJSON(result.value) as { instagram?: string; instagramHashtags?: string; blogTitle?: string; blog?: string };
    return {
      instagram:         d.instagram         ?? '',
      instagramHashtags: d.instagramHashtags ?? '',
      blogTitle:         d.blogTitle         ?? '',
      blog:              d.blog              ?? '',
    };
  } catch { return { instagram: '', instagramHashtags: '', blogTitle: '', blog: '' }; }
}

// ── Mode handlers ──────────────────────────────────────────────────────

async function handleMulti(body: Record<string, string>) {
  if (!body.carName?.trim()) {
    return NextResponse.json({ error: '車種名は必須です' }, { status: 400 });
  }

  const vehicleInfo = buildVehicleInfo(body);

  const prompt = `あなたは中古車・未使用車販売店「松下モータース」のSNS・コンテンツマーケティング担当AIです。
以下の車両情報をもとに、InstagramとSEOブログの2媒体向けに最大限バズる・集客できる文章を生成してください。

【車両情報】
${vehicleInfo}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ Instagram投稿文（250〜350文字）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
要件:
- 冒頭1〜2行で「思わず止まって読みたくなる」フックを作る（例: 「これ、絶対後悔しない一台。」「え、この装備でこの価格？」）
- 絵文字を効果的に使い、テンポよく読める構成
- 車両の「一番の魅力」を感情に訴えかけるエピソード形式で語る
- 「ファミリーに最高」「通勤でも週末でも」など生活シーンを想起させる
- CTAで「DMしてね」「詳細はプロフのリンクから」を自然に入れる
- 改行・空行を多用してスマホで読みやすくする

■ Instagramハッシュタグ（20〜25個）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
要件:
- 車種名・メーカー名・グレード名の専用タグ（検索流入）
- 地域タグ（#静岡中古車 #浜松中古車 #静岡県 など）
- 松下モータース固有タグ（#松下モータース #MatsushitaMotors）
- トレンドタグ（#カーライフ #マイカー #愛車 #車のある生活 #中古車選び）
- 購買意図タグ（#中古車購入 #カーセンサー #グーネット #車探し）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 自社ブログ記事タイトル
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
要件:
- Google検索で上位表示を狙えるSEOタイトル（32〜38文字）
- 「【年式・車種名・グレード】〇〇のあなたにおすすめ！松下モータース在庫情報」の形式を参考に
- 数字・ブラケット・感情ワード（「最高」「おすすめ」「徹底解説」）を含める

■ 自社ブログ本文（1000〜1500文字）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
要件:
- H2/H3相当の見出し（「## 見出し」形式）を3〜4個使いSEO構造を作る
- 冒頭リード文: この車が「誰に」「どんな場面で」最高なのかを2〜3文で示す
- セクション1: 車両スペック・グレードの特徴を詳しく解説
- セクション2: 装備・オプションのハイライト（箇条書き可）
- セクション3: こんな人におすすめ！（ターゲット別ユースケース）
- セクション4: 松下モータースならではの安心ポイント（アフターサービス・保証など自然に込める）
- 末尾CTA: お問い合わせ・来店促進の文章
- 全体を通して「静岡」「浜松」「中古車」「未使用車」などのローカルSEOキーワードを自然に散りばめる

以下のJSON形式のみで回答してください（マークダウン・コードブロック不使用、改行は\\nでエスケープ）：
{
  "mode": "multi",
  "instagram": "Instagram投稿文",
  "instagramHashtags": "#ハッシュタグ #リスト",
  "blogTitle": "ブログ記事タイトル",
  "blog": "ブログ本文（\\n改行含む）"
}`;

  const text = await callClaude(prompt, 4096);
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

function buildVehicleDesc(ocrResult: { year: string; grade: string; modelCode: string; colorCode: string; equipment: string[] }): string {
  return [
    ocrResult.year      ? `年式: ${ocrResult.year}`              : null,
    ocrResult.grade     ? `グレード: ${ocrResult.grade}`          : null,
    ocrResult.modelCode ? `型式: ${ocrResult.modelCode}`          : null,
    ocrResult.colorCode ? `カラーコード: ${ocrResult.colorCode}`  : null,
    ocrResult.equipment.length > 0
      ? `検出装備: ${ocrResult.equipment.join('・')}`
      : null,
  ].filter(Boolean).join('\n') || '（コーションプレートなし。外観・内装から推測）';
}

async function handlePhoto(body: Record<string, unknown>) {
  // ── 文章再生成モード（OCRスキップ） ──────────────────────────────────
  if (body.regenerate) {
    const vehicleDesc = (body.vehicleDesc as string) || '（車両情報不明）';
    const [gradeResult, multiResult] = await Promise.allSettled([
      callClaude(buildGradePrompt(vehicleDesc), 1024),
      callClaude(buildMultiPrompt(vehicleDesc), 4096),
    ]);
    return NextResponse.json({
      mode: 'photo_regenerate',
      ...parseGradeResult(gradeResult),
      ...parseMultiResult(multiResult),
    });
  }

  const rawImages = body.images as OcrImage[] | undefined;
  if (!rawImages || rawImages.length === 0) {
    return NextResponse.json({ error: '画像を1枚以上アップロードしてください' }, { status: 400 });
  }

  // HEIC/HEIF はサーバー側で Sharp を使って JPEG に変換する
  const images = await Promise.all(rawImages.map(async (img) => {
    if (img.mediaType === 'image/heic' || img.mediaType === 'image/heif') {
      const buf = Buffer.from(img.base64, 'base64');
      const jpeg = await sharp(buf).jpeg({ quality: 88 }).toBuffer();
      return { base64: jpeg.toString('base64'), mediaType: 'image/jpeg' } as OcrImage;
    }
    return img;
  }));

  // ── OCRのみモード（フェーズ1: 車両ID・装備を先に返す） ────────────────
  if (body.ocr_only) {
    const provider  = getOcrProvider();
    const ocrResult = await provider.analyzeVehicleImages(images);

    // 型式照合: OCRが返した modelCode からメーカー・車種を確定してnotesに補記
    const modelMatch = findVehicleByModelCode(ocrResult.modelCode ?? '');
    if (modelMatch) {
      const confirmed = `${modelMatch.maker} ${modelMatch.vehicleName}`;
      // notes に型式照合結果を付記（フロントで表示される）
      ocrResult.notes = ocrResult.notes
        ? `${ocrResult.notes} ／ 型式照合: ${confirmed}`
        : `型式照合: ${confirmed}`;
      // grade が空欄で vehicleName が grade フィールドに紛れ込んでいたら補正
      if (!ocrResult.grade && ocrResult.modelCode) {
        ocrResult.grade = '（装備確認要）';
      }
    }

    return NextResponse.json({
      mode: 'photo_ocr',
      ...ocrResult,
      vehicleDesc: buildVehicleDesc(ocrResult),
    });
  }

  // ── 通常モード（OCR + 文章生成を一括） ──────────────────────────────
  const provider  = getOcrProvider();
  const ocrResult = await provider.analyzeVehicleImages(images);
  const vehicleDesc = buildVehicleDesc(ocrResult);

  const [gradeResult, multiResult] = await Promise.allSettled([
    callClaude(buildGradePrompt(vehicleDesc), 1024),
    callClaude(buildMultiPrompt(vehicleDesc), 4096),
  ]);

  return NextResponse.json({
    mode: 'photo',
    ...ocrResult,
    ...parseGradeResult(gradeResult),
    ...parseMultiResult(multiResult),
  });
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
