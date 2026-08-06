import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { transcript, context } = await req.json() as {
    transcript: string;
    context?: { maker: string | null; model: string | null } | null;
  };

  const ctxStr = context?.model
    ? `\n直前の会話でお客様が探していた車: メーカー「${context.maker ?? '-'}」モデル「${context.model}」`
    : '';

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `中古車販売店のスタッフとして、お客様の発言から意図と車の条件をJSONで抽出してください。${ctxStr}
発言:「${transcript}」

intentの種類:
- "search": 特定の車を探している（例:「ヴォクシーのZSはある？」「白いアルファードが欲しい」）
- "grade_info": グレードの違いや詳細を聞いている（例:「グレードの違いは？」「ZSとZの違いは？」）
- "recommend": 他のおすすめや似た車を聞いている（例:「他に似たのはある？」「おすすめは？」）

colorはCSVの車体色列に含まれそうな日本語で返す（例:「白」→「ホワイト」または「白」）。

{"intent": "search", "maker": null, "model": "ヴォクシー", "grade": "ZS", "color": null}

JSONのみ返してください。`,
    }],
  });

  const text = (msg.content[0] as { type: 'text'; text: string }).text;
  const match = text.match(/\{[\s\S]*\}/);
  const data = match
    ? JSON.parse(match[0])
    : { intent: 'search', maker: null, model: null, grade: null, color: null };
  return NextResponse.json(data);
}
