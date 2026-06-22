import type { OcrProvider } from './types';
import { ClaudeOcrProvider }    from './providers/claude';
import { GoogleVisionProvider } from './providers/google-vision';
import { CarDocOcrProvider }    from './providers/car-doc';

// ── プロバイダー切り替え ──────────────────────────────────────────────────
// Vercel 環境変数 OCR_PROVIDER でプロバイダーを選択する。
//
//   OCR_PROVIDER=claude          → Claude Sonnet Vision（デフォルト・現在の実装）
//   OCR_PROVIDER=google_vision   → Google Cloud Vision API
//   OCR_PROVIDER=car_doc         → 車検証・コーションプレート特化型OCR
//
// 未設定の場合は claude がデフォルト。
// 新しいプロバイダーを追加する場合は providers/ にクラスを追加し、
// ここに case を1行加えるだけでよい。

export function getOcrProvider(): OcrProvider {
  const key = process.env.OCR_PROVIDER ?? 'claude';
  switch (key) {
    case 'google_vision': return new GoogleVisionProvider();
    case 'car_doc':       return new CarDocOcrProvider();
    case 'claude':
    default:              return new ClaudeOcrProvider();
  }
}
