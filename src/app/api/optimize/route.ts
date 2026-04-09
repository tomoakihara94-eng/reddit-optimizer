import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { subreddit, postType, title, body, language } = await req.json();

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const isJapanese = language === 'ja';

    const prompt = isJapanese
      ? `あなたはRedditの投稿最適化の専門家です。以下の投稿を分析し、エンゲージメント・アップボート・コメントを最大化するために最適化された版を提供してください。

サブレディット: r/${subreddit || 'general'}
投稿タイプ: ${postType || 'テキスト'}
元のタイトル: ${title}
元の本文: ${body || '（本文なし）'}

以下の形式のJSONオブジェクトで回答してください（マークダウンやコードブロックは使わず、生のJSONのみ）：
{
  "optimizedTitle": "最適化されたタイトル",
  "optimizedBody": "最適化された本文",
  "improvements": [
    "1つ目の改善点とその理由",
    "2つ目の改善点とその理由",
    "3つ目の改善点とその理由"
  ]
}

最適化のルール：
- タイトルは簡潔で興味を引き、r/${subreddit || 'general'}のスタイルに合わせる
- 感情的なフック、数字、疑問形を適宜活用する
- 本文は段落を整理して読みやすくする
- 長い本文にはTL;DRを末尾に追加する
- サブレディットのトーンとスタイルに合わせる
- 元のメッセージの核心は保ちながら、より魅力的にする
- 日本語で回答すること`
      : `You are an expert Reddit post optimizer. Analyze the following Reddit post and provide an optimized version that will maximize engagement, upvotes, and comments.

Subreddit: r/${subreddit || 'general'}
Post Type: ${postType || 'text'}
Original Title: ${title}
Original Body: ${body || '(no body)'}

Respond with a JSON object in exactly this format (no markdown, no code blocks, just raw JSON):
{
  "optimizedTitle": "your optimized title here",
  "optimizedBody": "your optimized body here",
  "improvements": [
    "First specific improvement made and why it helps",
    "Second specific improvement made and why it helps",
    "Third specific improvement made and why it helps"
  ]
}

Rules for optimization:
- Titles should be concise, intriguing, and follow r/${subreddit || 'general'} conventions
- Use emotional hooks, numbers, or questions when appropriate for the subreddit
- Body should be well-structured with clear paragraphs
- Add TL;DR at the end of long bodies
- Match the tone and style of the subreddit
- Keep the core message intact but make it more compelling`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response from AI' }, { status: 500 });
    }

    let result;
    try {
      result = JSON.parse(content.text.trim());
    } catch {
      const match = content.text.match(/\{[\s\S]*\}/);
      if (match) {
        result = JSON.parse(match[0]);
      } else {
        return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('Optimize API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
