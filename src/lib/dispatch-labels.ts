import type { Redis } from '@upstash/redis';
import { INQUIRY_SOURCES, INQUIRY_LINES } from './dispatch-config';

// 差配者画面のボタンの名前。管理者画面「差配者名称」で変更し、Redis に保存する
//   visitDispatchers: 来店を差配する人（平賀・メインテーブル…）
//   phoneReceivers:   電話を受けた人（内海・平賀・事務A…）
//   inquirySources:   問い合わせのサイト / inquiryLines: 内線
export type Labels = {
  visitDispatchers: string[];
  phoneReceivers: string[];
  inquirySources: string[];
  inquiryLines: string[];
};

export const DEFAULT_LABELS: Labels = {
  visitDispatchers: ['平賀', 'メインテーブル', 'A', 'B', 'C'],
  phoneReceivers: ['内海', '平賀', '事務A', '事務B', '事務C', '事務D'],
  inquirySources: [...INQUIRY_SOURCES],
  inquiryLines: [...INQUIRY_LINES],
};

export const LABELS_KEY = 'dispatch:labels';
export const LABEL_MAX_ITEMS = 12;
export const LABEL_MAX_LENGTH = 12;

const KEYS = Object.keys(DEFAULT_LABELS) as (keyof Labels)[];

// 1〜12個、各 1〜12 文字、重複なし。おかしければ null
export function validateLabels(x: unknown): Labels | null {
  const r = x as Labels;
  if (!r) return null;
  const out = {} as Labels;
  for (const k of KEYS) {
    const list = r[k];
    if (!Array.isArray(list) || list.length < 1 || list.length > LABEL_MAX_ITEMS) return null;
    const trimmed = list.map(v => (typeof v === 'string' ? v.trim() : ''));
    if (trimmed.some(v => v.length < 1 || v.length > LABEL_MAX_LENGTH)) return null;
    if (new Set(trimmed).size !== trimmed.length) return null;
    out[k] = trimmed;
  }
  return out;
}

export async function getLabels(redis: Redis): Promise<Labels> {
  try {
    const raw = await redis.get(LABELS_KEY);
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return validateLabels(parsed) ?? DEFAULT_LABELS;
  } catch {
    return DEFAULT_LABELS;
  }
}
