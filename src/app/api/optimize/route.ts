import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MEDIA_INSTRUCTIONS: Record<string, string> = {
  instagram: `
- 投稿文: 絵文字を適度に使い、親しみやすく魅力的な文章（150〜200文字）
- ハッシュタグ: 関連性の高いハッシュタグを10〜15個（#中古車 #松下モータース 等を含める）
- optimizedTitle に投稿文、optimizedBody にハッシュタグをまとめて出力すること`,

  website: `
- 記事タイトル: SEOを意識した検索されやすいタイトル
- 本文: 車両の魅力を伝えるブログ記事本文（400〜600文字）。見出しや改行を使い読みやすく
- optimizedTitle に記事タイトル、optimizedBody に本文を出力すること`,

  carsensor: `
- グレード補記: 装備・仕様を正確かつ簡潔に補足する説明文（100〜150文字）
- アピールポイント: 購買意欲を高める3〜5つのポイントを箇条書きで
- optimizedTitle にグレード補記、optimizedBody にアピールポイントを出力すること`,

  goonet: `
- 車両状態説明: 状態・装備を正確に伝える説明文（100〜150文字）
- おすすめコメント: 購入検討者の背中を押すひと言コメント（50〜80文字）
- optimizedTitle に車両状態説明、optimizedBody におすすめコメントを出力すること`,
};

export async function POST(req: NextRequest) {
  try {
    const { media, carModel, features } = await req.json();

    if (!carModel?.trim()) {
      return NextResponse.json({ error: '車種・グレードは必須です' }, { status: 400 });
    }

    const mediaLabel = {
      instagram: 'Instagram',
      website: '自社サイト（ブログ記事）',
      carsensor: 'カーセンサー',
      goonet: 'グーネット',
    }[media as string] ?? media;

    const mediaInstruction = MEDIA_INSTRUCTIONS[media as string] ?? MEDIA_INSTRUCTIONS.instagram;

    const prompt = `あなたは中古車・未使用車販売店「松下モータース」のDXサポートAIです。
以下の車両情報をもとに、指定された媒体に最適な投稿文を生成してください。

掲載媒体: ${mediaLabel}
車種・グレード: ${carModel}
車両の特徴・アピールポイント: ${features || '（記載なし）'}

【媒体別の出力要件】${mediaInstruction}

以下のJSON形式のみで回答してください（マークダウン・コードブロック不使用）：
{
  "optimizedTitle": "メインテキスト",
  "optimizedBody": "サブテキスト",
  "improvements": [
    "生成のポイント1",
    "生成のポイント2",
    "生成のポイント3"
  ]
}`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'AIからの応答が不正です' }, { status: 500 });
    }

    let result;
    try {
      result = JSON.parse(content.text.trim());
    } catch {
      const match = content.text.match(/\{[\s\S]*\}/);
      if (match) {
        result = JSON.parse(match[0]);
      } else {
        return NextResponse.json({ error: 'AIレスポンスの解析に失敗しました' }, { status: 500 });
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('Generate API error:', err);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
