import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { transcript } = await req.json();

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [{
      role: 'user',
      content: `お客様の発言から探している車のメーカー・モデル・グレードをJSONで抽出してください。
発言:「${transcript}」

{"maker": "メーカー名またはnull", "model": "モデル名またはnull", "grade": "グレード名またはnull"}

JSONのみ返してください。`,
    }],
  });

  const text = (msg.content[0] as { type: 'text'; text: string }).text;
  const match = text.match(/\{[\s\S]*\}/);
  const data = match ? JSON.parse(match[0]) : { maker: null, model: null, grade: null };
  return NextResponse.json(data);
}
