import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 120;

// Google 画像検索で実車の写真を参照しながら生成できるのは Gemini 3.1 Flash Image のみ
const MODEL = 'gemini-3.1-flash-image';
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';

type ImageData = { mime_type?: string; data: string };

// レスポンス内の最後の画像ブロックを探す（SDK の output_image と同じ扱い）
function findLastImage(node: unknown): ImageData | null {
  let found: ImageData | null = null;
  const visit = (v: unknown) => {
    if (Array.isArray(v)) { v.forEach(visit); return; }
    if (!v || typeof v !== 'object') return;
    const o = v as Record<string, unknown>;
    if (o.type === 'image' && typeof o.data === 'string' && o.data.length > 0) {
      found = { mime_type: typeof o.mime_type === 'string' ? o.mime_type : undefined, data: o.data };
    }
    Object.values(o).forEach(visit);
  };
  visit(node);
  return found;
}

function buildPrompt(carName: string, carType: string, imageHint: string, scene: string): string {
  const car = carType ? `${carName} (${carType})` : carName;
  return `Photorealistic automotive photograph for a Japanese used-car dealer's blog article about the ${car}.
${imageHint ? `\nTarget model and generation: ${imageHint}\n` : ''}
Scene: ${scene}

Requirements:
- The car must be exactly the ${car} as sold in Japan. Use image search to check real photos of this exact model and generation, and reproduce its body shape, front grille, headlights, wheels and proportions accurately. Do not substitute a different model or generation.
- Natural, realistic photography. Natural light, no heavy retouching.
- No text, captions, logos overlays or watermarks. License plates blank or unreadable.
- If people appear, keep them natural and secondary to the car.`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: '画像生成が未設定です（GEMINI_API_KEY がありません）' }, { status: 503 });
  }

  let body: { carName?: string; carType?: string; imageHint?: string; scene?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'リクエストの形式が不正です' }, { status: 400 });
  }
  const carName = body.carName?.trim() ?? '';
  const carType = body.carType?.trim() ?? '';
  const scene = body.scene?.trim() ?? '';
  const imageHint = body.imageHint?.trim().slice(0, 500) ?? '';
  if (!carName || !scene) {
    return NextResponse.json({ error: '車種名と画像の内容が必要です' }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        input: [{ type: 'text', text: buildPrompt(carName, carType, imageHint, scene) }],
        tools: [{ type: 'google_search', search_types: ['web_search', 'image_search'] }],
        response_format: { type: 'image', mime_type: 'image/jpeg', aspect_ratio: '16:9', image_size: '1K' },
      }),
      signal: AbortSignal.timeout(110_000),
    });
  } catch {
    return NextResponse.json({ error: '画像生成がタイムアウトしました' }, { status: 504 });
  }

  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = (json as { error?: { message?: string } } | null)?.error?.message;
    console.error('[article/image] Gemini error', res.status, msg);
    return NextResponse.json({ error: `画像生成に失敗しました（${res.status}）` }, { status: 502 });
  }

  const image = findLastImage(json);
  if (!image) {
    return NextResponse.json({ error: '画像が返ってきませんでした。再生成してください' }, { status: 502 });
  }
  return NextResponse.json({ mimeType: image.mime_type ?? 'image/jpeg', data: image.data });
}
