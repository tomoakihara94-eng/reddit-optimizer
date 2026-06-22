import Anthropic from '@anthropic-ai/sdk';
import type { OcrProvider, OcrImage, VehicleOcrResult } from '../types';

const VEHICLE_ANALYSIS_PROMPT = `あなたは中古車・未使用車の専門家AIです。
添付された車両画像（コーションプレート・内装・外観など）を詳しく解析してください。

以下の情報を読み取り、JSONのみで出力してください（マークダウン・コードブロック不使用）：

{
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

function parseJSON(text: string): Record<string, unknown> {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as Record<string, unknown>;
    throw new Error('Claude APIレスポンスの解析に失敗しました');
  }
}

export class ClaudeOcrProvider implements OcrProvider {
  readonly name = 'Claude Sonnet (Vision)';
  private readonly client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async analyzeVehicleImages(images: OcrImage[]): Promise<VehicleOcrResult> {
    const content: Anthropic.MessageParam['content'] = [
      ...images.map(img => ({
        type: 'image' as const,
        source: {
          type: 'base64' as const,
          media_type: img.mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
          data: img.base64,
        },
      })),
      { type: 'text' as const, text: VEHICLE_ANALYSIS_PROMPT },
    ];

    const message = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content }],
    });

    const res = message.content[0];
    if (res.type !== 'text') throw new Error('Claude APIからの応答が不正です');

    const parsed = parseJSON(res.text.trim());
    return {
      chassisNumber: String(parsed.chassisNumber ?? ''),
      modelCode:     String(parsed.modelCode ?? ''),
      colorCode:     String(parsed.colorCode ?? ''),
      trimCode:      String(parsed.trimCode ?? ''),
      year:          String(parsed.year ?? ''),
      grade:         String(parsed.grade ?? ''),
      equipment:     Array.isArray(parsed.equipment) ? parsed.equipment.map(String) : [],
      notes:         String(parsed.notes ?? ''),
      provider:      this.name,
    };
  }
}
