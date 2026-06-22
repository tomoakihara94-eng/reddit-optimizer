import type { OcrProvider, OcrImage, VehicleOcrResult } from '../types';

// ══════════════════════════════════════════════════════════════════════════════
// Google Cloud Vision API プロバイダー
//
// 【有効化手順】
// 1. GCP コンソールで Cloud Vision API を有効化する
//    https://console.cloud.google.com/apis/library/vision.googleapis.com
//
// 2. APIキーを作成（または サービスアカウント＋JSON認証を発行）
//    https://console.cloud.google.com/apis/credentials
//
// 3. Vercel 環境変数に設定する（Dashboard > Settings > Environment Variables）：
//    GOOGLE_VISION_API_KEY=AIzaSy...              ← APIキー方式（簡単）
//    ※ サービスアカウント方式は下記コメント参照
//
// 4. OCR_PROVIDER=google_vision を同様に環境変数に追加する
//
// 【参考ドキュメント】
// https://cloud.google.com/vision/docs/detecting-text
// https://cloud.google.com/vision/docs/reference/rest/v1/images/annotate
// ══════════════════════════════════════════════════════════════════════════════

// Google Vision API のレスポンス型（必要な部分のみ定義）
interface VisionAnnotateResponse {
  responses: {
    textAnnotations?: { description: string; boundingPoly?: unknown }[];
    fullTextAnnotation?: { text: string };
    error?: { message: string; code: number };
  }[];
}

// コーションプレートのテキストから車両情報を抽出するパーサー
// （実装時は実際のレスポンスフォーマットに合わせて調整する）
function parseVisionResponse(data: VisionAnnotateResponse, providerName: string): VehicleOcrResult {
  const allText = data.responses
    .map(r => r.fullTextAnnotation?.text ?? r.textAnnotations?.[0]?.description ?? '')
    .join('\n');

  // 車台番号: 英数字で構成される "メーカーコード-数字" パターンを探す
  const chassisMatch = allText.match(/([A-Z]{2,5}\d{1,2}-[\d]{6,7})/);
  // 型式: "XBA-" "3BA-" のような道路運送車両法の型式表記
  const modelMatch = allText.match(/(\d[A-Z]{2}-[A-Z\d]{4,8})/);
  // カラーコード: 3〜4桁の英数字
  const colorMatch = allText.match(/カラー[：:\s]*([A-Z\d]{3,4})/i);
  // トリムコード: 英数字5〜6桁
  const trimMatch = allText.match(/トリム[：:\s]*([A-Z]{1,2}\d{3,4})/i);

  return {
    chassisNumber: chassisMatch?.[1] ?? '',
    modelCode:     modelMatch?.[1] ?? '',
    colorCode:     colorMatch?.[1] ?? '',
    trimCode:      trimMatch?.[1] ?? '',
    year:          '',
    grade:         '',
    equipment:     [],
    notes:         `Google Cloud Vision で解析しました。テキスト全文:\n${allText.slice(0, 300)}`,
    provider:      providerName,
  };
}

export class GoogleVisionProvider implements OcrProvider {
  readonly name = 'Google Cloud Vision';

  async analyzeVehicleImages(images: OcrImage[]): Promise<VehicleOcrResult> {
    const apiKey = process.env.GOOGLE_VISION_API_KEY;

    // APIキー未設定 → モックを返してUIで確認できるようにする
    if (!apiKey) {
      return {
        chassisNumber: 'AB12C-3456789（モック）',
        modelCode:     '3BA-ZRR80W（モック）',
        colorCode:     '070（モック）',
        trimCode:      'FJ010（モック）',
        year:          '2021年式（モック）',
        grade:         'Si W×B III（モック）',
        equipment:     ['純正ナビ（モック）', '両側パワースライドドア（モック）'],
        notes:         [
          '【モック返却中】GOOGLE_VISION_API_KEY が未設定です。',
          'Vercel 環境変数に GOOGLE_VISION_API_KEY を追加し、',
          'OCR_PROVIDER=google_vision を設定すると本番APIに切り替わります。',
        ].join('\n'),
        provider: `${this.name}（モック）`,
      };
    }

    // ── 本番実装 ────────────────────────────────────────────────────────────
    const endpoint = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

    const requestBody = {
      requests: images.map(img => ({
        image: { content: img.base64 },
        features: [
          { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }, // コーションプレート向け
          { type: 'TEXT_DETECTION',          maxResults: 1 },
          { type: 'OBJECT_LOCALIZATION',     maxResults: 10 },
        ],
      })),
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Google Cloud Vision APIエラー (${res.status}): ${err}`);
    }

    const data = await res.json() as VisionAnnotateResponse;

    // レスポンスにエラーが含まれている場合
    const firstError = data.responses.find(r => r.error);
    if (firstError?.error) {
      throw new Error(`Google Vision レスポンスエラー: ${firstError.error.message}`);
    }

    return parseVisionResponse(data, this.name);
    // ────────────────────────────────────────────────────────────────────────
  }
}

// ── サービスアカウント認証方式（将来の参考実装） ───────────────────────────
// APIキーではなく サービスアカウントJSON を使う場合:
//
// 環境変数: GOOGLE_APPLICATION_CREDENTIALS_JSON=<base64エンコードしたJSONの文字列>
//
// import { GoogleAuth } from 'google-auth-library';  // npm install google-auth-library
//
// const credentialsJson = Buffer.from(
//   process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON!, 'base64'
// ).toString('utf-8');
// const auth = new GoogleAuth({
//   credentials: JSON.parse(credentialsJson),
//   scopes: ['https://www.googleapis.com/auth/cloud-vision'],
// });
// const token = await auth.getAccessToken();
// headers: { Authorization: `Bearer ${token}`, ... }
// ─────────────────────────────────────────────────────────────────────────────
