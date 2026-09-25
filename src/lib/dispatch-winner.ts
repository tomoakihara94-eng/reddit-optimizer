import {
  WINDOW_MS, RESPONSES, DEFAULT_RESPONSE, STAFF_CONDITIONS, SALES_UNITS, SALES_UNITS_WEIGHT,
  AFFINITY_DEFAULT, AFFINITY_WEIGHT, type AffinityTable,
  type Response, type StaffCondition, type CustomerType,
} from './dispatch-config';
import type { DispatchEvent } from './dispatch-redis';

export type Press = { id: string; name: string; rank: string; time: number; response: Response };

// 値は旧形式（押した時刻の数値）と新形式（{ t, r }）の両方を受け付ける
export function parsePresses(raw: Record<string, unknown>): Press[] {
  return Object.entries(raw).map(([key, val]) => {
    const [id, name, rank] = key.split('::');
    let v: unknown = val;
    if (typeof v === 'string') { try { v = JSON.parse(v); } catch { /* 数値文字列 */ } }
    if (v && typeof v === 'object') {
      const { t, r } = v as { t: number; r?: string };
      const response = r && r in RESPONSES ? (r as Response) : DEFAULT_RESPONSE;
      return { id, name, rank, time: Number(t), response };
    }
    return { id, name, rank, time: Number(v), response: DEFAULT_RESPONSE };
  });
}

export function scoreOf(
  p: Press,
  staffConditions: Record<string, string>,
  customerType?: string,
  affinity: AffinityTable = {},
): number {
  const cond = STAFF_CONDITIONS[staffConditions[p.id] as StaffCondition] ?? 0;
  const base = RESPONSES[p.response] + cond + (SALES_UNITS[p.id] ?? 0) * SALES_UNITS_WEIGHT;
  const level = customerType ? affinity[p.id]?.[customerType as CustomerType] ?? AFFINITY_DEFAULT : AFFINITY_DEFAULT;
  return base * level * AFFINITY_WEIGHT;
}

export function determineWinner(
  event: DispatchEvent,
  presses: Press[],
  staffConditions: Record<string, string> = {},
  affinity: AffinityTable = {},
): Press | null {
  // 差配者本人と「対応中」の人は当選対象外
  const eligible = presses.filter(p => p.id !== event.dispatcherId && p.response !== '対応中');
  if (eligible.length === 0) return null;
  if (Date.now() <= event.startedAt + WINDOW_MS) return null; // window still open

  const windowEnd = event.startedAt + WINDOW_MS;
  const within = eligible.filter(p => p.time <= windowEnd);
  const after  = eligible.filter(p => p.time > windowEnd);

  if (within.length > 0) {
    const score = (p: Press) => scoreOf(p, staffConditions, event.customerType, affinity);
    return within.sort((a, b) => score(b) - score(a) || a.time - b.time)[0];
  }
  return after.sort((a, b) => a.time - b.time)[0];
}
