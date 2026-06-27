import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

// FormData でバイナリを受け取るため bodyParser を無効化
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'ファイルがありません' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    const jpeg = await sharp(buffer)
      .resize(1120, 1120, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 88 })
      .toBuffer();

    return NextResponse.json({ base64: jpeg.toString('base64'), mediaType: 'image/jpeg' });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
