import Anthropic from '@anthropic-ai/sdk';
import type { OcrProvider, OcrImage, VehicleOcrResult } from '../types';

const VEHICLE_ANALYSIS_PROMPT = `あなたはカーセンサー・グーネットへの車両登録を専門とするAIスペシャリストです。
日本全メーカー（トヨタ・ホンダ・日産・マツダ・スバル・三菱・スズキ・ダイハツ・レクサス・イスズ等）の
車両を熟知し、カーセンサー・グーネットの登録業務で使う公式装備名称を完全に習得しています。

添付画像（コーションプレート・外観・内装・ダッシュボード・ステアリング等）を徹底解析し、
JSONのみで出力してください（マークダウン・コードブロック不使用）。

━━━━━━━━━━━━━━━━━━━━━━
## 解析項目
━━━━━━━━━━━━━━━━━━━━━━

### A. コーションプレート
エンジンルーム・ドア開口部・車内のシールから読み取る：
- 車台番号: 例 ZRR80-1234567 / MXPB10-0001234 / 3DA-CV1W
- 型式: 例 3BA-ZRR80W / 5AA-MXPB10 / 6AA-ZYX15
- カラーコード: 2〜4桁英数字（例 040、6X3、8V5）
- トリムコード: 内装色コード（例 FJ010、GB410、FA020）

### B. 外観解析
- ヘッドライト: LED（チップ列が見える）/ HID/キセノン（青白い単一光）/ ハロゲン（電球色）
- フォグランプ: 有無・LED/ハロゲン
- ルーフ: サンルーフ / パノラマルーフ / ガラスルーフ / ムーンルーフ
- ホイール: アルミホイール / スチールホイール＋カバー
- ドア: スライドドア両側電動 / 片側電動 / 両側手動 / なし
- リアゲート: 電動 / 手動
- エアロ: フロントスポイラー・サイドステップ・リアスポイラーの有無
- ルーフレールの有無

### C. 内装解析
- シート素材: 本革 / ハーフレザー / 合皮 / ファブリック（布）
- シート配列: 3列シート / 2列 / ベンチシート / フルフラットシート / チップアップシート
- シート機能: 電動シート / シートヒーター / シートエアコン / オットマン / 後席電動格納
- ハンドル: ステアリングスイッチの有無（ADAS操作ボタンを確認）
- ナビ/オーディオ: 純正カーナビ / ディスプレイオーディオ / 社外ナビ / TVチューナー
- ETC/ETC2.0の有無
- ドライブレコーダーの有無（前方/前後/360度）
- USB/HDMI端子
- 後席モニター（フリップダウン/ヘッドレスト型）

### D. 安全・運転支援（カーセンサー/グーネット公式名称で出力すること）

| 検出できる表示・ロゴ・バッジ | 出力する名称 |
|---|---|
| Toyota Safety Sense / Honda Sensing / ProPilot / EyeSight / i-Activsense / e-Assist / DCBS / スマートアシスト等 | 衝突被害軽減ブレーキ |
| アラウンドビューモニター / 360°カメラ / 全方位カメラ | 全周囲カメラ |
| バックカメラ / リアカメラ / バックモニター | カメラ：バック |
| フロントカメラ | カメラ：フロント |
| サイドカメラ / 真横確認カメラ | カメラ：サイド |
| LDA / LKAS / LKA / レーンキープ / レーンキープアシスト | レーンキープアシスト |
| ACC / 全車速追従 / 追従クルーズ / ProPilot / ドライビングアシスト | アダプティブクルーズコントロール |
| BSM / BSW / ブラインドスポット / サイドモニター警告 | ブラインドスポットモニター |
| クリアランスソナー / コーナーセンサー / パーキングセンサー | 障害物センサー |
| AHB / オートハイビーム / ハイビームアシスト | オートマチックハイビーム |
| パーキングサポートブレーキ / 誤発進抑制 / PKSB | 誤発進抑制装置 |
| パーキングアシスト / インテリジェントパーキングアシスト | パーキングアシスト |
| ヒルスタートアシスト / ヒルディセントコントロール | ヒルディセントコントロール |
| エマージェンシーブレーキ / 自動ブレーキ | 衝突被害軽減ブレーキ |

### E. メーカー別固有装備識別
- **トヨタ/レクサス**: T-Connect / G-Link / JBLサウンド / ベンチレーション / S-Flow / KINTO
- **ホンダ**: ホンダセンシング / Honda CONNECT / BOSEサウンド / マジックシート / インターナビ
- **日産**: プロパイロット / インテリジェントルームミラー / BOSE / アラウンドビューモニター
- **マツダ**: マツダコネクト / BOSE / スカイアクティブ / レーダークルーズコントロール
- **スバル**: アイサイト / スターリンク / HARMANサウンド / X-MODE
- **三菱**: MIパイロット / S-AWC / デュアルカメラ / マルチアラウンドモニター
- **スズキ**: デュアルカメラブレーキサポート(DCBS) / スズキセーフティサポート / ナビオプション
- **ダイハツ**: スマートアシスト / CVT / スマートパノラマパーキングアシスト

━━━━━━━━━━━━━━━━━━━━━━
## 出力JSON
━━━━━━━━━━━━━━━━━━━━━━
{
  "chassisNumber": "車台番号（コーションプレートから正確に。読めない場合は空文字）",
  "modelCode": "型式（例: 3BA-ZRR80W）",
  "colorCode": "カラーコード（例: 040）",
  "trimCode": "トリムコード（例: FJ010）",
  "year": "年式（コーションプレートまたは外観から推定。例: 2022年式）",
  "grade": "グレード（バッジ・ロゴ・装備水準から判断。例: Si W×B III / Z / HYBRID Z）",
  "equipment": [
    "カーセンサー・グーネット公式名称の装備を列挙",
    "写真で確認できたものを確定として、不確かなものは末尾に（推測）"
  ],
  "notes": "読み取り精度・不明点・追加写真が必要な箇所の説明"
}`;

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
