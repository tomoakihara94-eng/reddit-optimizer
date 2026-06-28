import type { OcrProvider, OcrImage, VehicleOcrResult } from '../types';

// ══════════════════════════════════════════════════════════════════════════════
// 車検証・コーションプレート特化型 OCR プロバイダー
//
// 日本の車両書類に特化したOCRサービスを想定。
// 下記のいずれかのサービスに差し替えて使うことを想定している：
//
// ① NAVITIME 車台番号OCR API
//    https://api-navitime-com.jp/
//
// ② テキスト特化 OCR（Azure AI Document Intelligence）
//    https://azure.microsoft.com/ja-jp/products/ai-services/ai-document-intelligence
//    事前トレーニング済みモデル "prebuilt-idDocument" が使用可能
//
// ③ 独自サービス（自動車業界向け）
//    例: Cariot OCR、MotorWeb等の車両情報APIと組み合わせる
//
// 【有効化手順】
// 1. 利用サービスのAPIキーを取得する
// 2. Vercel 環境変数に設定する:
//    CAR_DOC_OCR_ENDPOINT=https://your-ocr-api.example.com/v1/analyze
//    CAR_DOC_OCR_API_KEY=your-api-key-here
// 3. OCR_PROVIDER=car_doc を同様に環境変数に追加する
// ══════════════════════════════════════════════════════════════════════════════

// 外部OCR APIのレスポンス型（実際のサービスに合わせて変更する）
interface CarDocOcrResponse {
  chassisNumber?: string;
  modelCode?: string;
  colorCode?: string;
  trimCode?: string;
  registrationYear?: string; // 初年度登録年
  grade?: string;
  equipment?: string[];
  rawText?: string;
}

export class CarDocOcrProvider implements OcrProvider {
  readonly name = '車両書類特化型OCR';

  async analyzeVehicleImages(images: OcrImage[]): Promise<VehicleOcrResult> {
    const endpoint = process.env.CAR_DOC_OCR_ENDPOINT;
    const apiKey   = process.env.CAR_DOC_OCR_API_KEY;

    // エンドポイント未設定 → モックを返す
    if (!endpoint || !apiKey) {
      return {
        chassisNumber: 'ZRR80-1234567（モック）',
        modelCode:     '3BA-ZRR80W（モック）',
        colorCode:     '040（モック）',
        trimCode:      'GB010（モック）',
        year:          '2022年式（モック）',
        grade:         'X（モック）',
        equipment:       ['バックモニター（モック）', 'ETC（モック）', 'スマートキー（モック）'],
        possibleOptions: [],
        notes:           [
          '【モック返却中】CAR_DOC_OCR_ENDPOINT または CAR_DOC_OCR_API_KEY が未設定です。',
          'Vercel 環境変数に両方を設定し、',
          'OCR_PROVIDER=car_doc を追加すると本番APIに切り替わります。',
        ].join('\n'),
        provider: `${this.name}（モック）`,
      };
    }

    // ── 本番実装 ────────────────────────────────────────────────────────────
    // 利用するサービスのリクエスト形式に合わせて以下を変更する。
    // ここでは multipart/form-data で画像を送るケースを想定している。

    const formData = new FormData();
    images.forEach((img, i) => {
      const binary = Buffer.from(img.base64, 'base64');
      const blob   = new Blob([binary], { type: img.mediaType });
      formData.append(`image_${i}`, blob, `image_${i}.jpg`);
    });

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'X-API-Key': apiKey },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`車両書類OCR APIエラー (${res.status}): ${err}`);
    }

    const data = await res.json() as CarDocOcrResponse;

    return {
      chassisNumber: data.chassisNumber      ?? '',
      modelCode:     data.modelCode          ?? '',
      colorCode:     data.colorCode          ?? '',
      trimCode:      data.trimCode           ?? '',
      year:          data.registrationYear   ?? '',
      grade:         data.grade              ?? '',
      equipment:       data.equipment          ?? [],
      possibleOptions: [],
      notes:           data.rawText
                       ? `OCR 生テキスト（先頭300字）:\n${data.rawText.slice(0, 300)}`
                       : '',
      provider: this.name,
    };
    // ────────────────────────────────────────────────────────────────────────
  }
}

// ── Azure AI Document Intelligence を使う場合の参考実装 ─────────────────────
// npm install @azure/ai-form-recognizer
//
// import { DocumentAnalysisClient, AzureKeyCredential } from '@azure/ai-form-recognizer';
//
// const client = new DocumentAnalysisClient(
//   process.env.AZURE_FORM_RECOGNIZER_ENDPOINT!,
//   new AzureKeyCredential(process.env.AZURE_FORM_RECOGNIZER_KEY!)
// );
//
// const poller = await client.beginAnalyzeDocument(
//   'prebuilt-idDocument',
//   Buffer.from(images[0].base64, 'base64')
// );
// const result = await poller.pollUntilDone();
// ────────────────────────────────────────────────────────────────────────────
