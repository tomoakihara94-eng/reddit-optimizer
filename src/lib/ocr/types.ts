// ── OCR プロバイダー共通インターフェース ─────────────────────────────────
// 新しい画像認識APIを追加する場合は OcrProvider を実装した
// クラスを providers/ に追加し、factory.ts に登録するだけでよい。

export interface OcrImage {
  base64: string;
  mediaType: string;
}

export interface VehicleOcrResult {
  chassisNumber: string; // 車台番号
  modelCode: string;     // 型式
  colorCode: string;     // カラーコード
  trimCode: string;      // トリムコード
  year: string;          // 年式
  grade: string;         // グレード
  equipment: string[];        // 読み取れた装備リスト（視覚確認済み）
  possibleOptions: string[];  // グレード推定によるメーカーオプション候補（要確認）
  notes: string;              // 備考・精度コメント
  provider: string;      // 使用したプロバイダー名（UI表示用）
}

export interface OcrProvider {
  readonly name: string;
  analyzeVehicleImages(images: OcrImage[]): Promise<VehicleOcrResult>;
}
