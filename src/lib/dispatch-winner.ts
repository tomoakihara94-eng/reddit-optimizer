import {
  WINDOW_MS, RESPONSES, DEFAULT_RESPONSE, STAFF_CONDITIONS, SALES_UNITS, SALES_UNITS_WEIGHT,
  AFFINITY_DEFAULT, AFFINITY_WEIGHT, type AffinityTable,
  type Response, type StaffCondition, type CustomerType,
} from './dispatch-config';
import type { DispatchEvent } from './dispatch-redis';

export type Press = { id: string; name: string; rank: string; time: number; response: Response; via?: 'app' | 'notification' };

// 値は旧形式（押した時刻の数値）と新形式（{ t, r }）の両方を受け付ける
export function parsePresses(raw: Record<string, unknown>): Press[] {
  return Object.entries(raw).map(([key, val]) => {
    const [id, name, rank] = key.split('::');
    let v: unknown = val;
    if (typeof v === 'string') { try { v = JSON.parse(v); } catch { /* 数値文字列 */ } }
    if (v && typeof v === 'object') {
      const { t, r, v: via } = v as { t: number; r?: string; v?: 'app' | 'notification' };
      const response = r && r in RESPONSES ? (r as Response) : DEFAULT_RESPONSE;
      return { id, name, rank, time: Number(t), response, ...(via ? { via } : {}) };
    }
    return { id, name, rank, time: Number(v), response: DEFAULT_RESPONSE };
  });
}

export type ScoreBreakdown = {
  response: Response; responsePts: number;
  condition: string | null; conditionPts: number;
  units: number; unitsPts: number;
  affinityLevel: number; base: number; score: number;
};

// 得点 =（応答 ＋ コンディション ＋ 実績×0.1）× 得意度×0.1
export function scoreBreakdown(
  p: Press,
  staffConditions: Record<string, string>,
  customerType?: string,
  affinity: AffinityTable = {},
): ScoreBreakdown {
  const condition = staffConditions[p.id] ?? null;
  const conditionPts = STAFF_CONDITIONS[condition as StaffCondition] ?? 0;
  const units = SALES_UNITS[p.id] ?? 0;
  const unitsPts = units * SALES_UNITS_WEIGHT;
  const responsePts = RESPONSES[p.response];
  const base = responsePts + conditionPts + unitsPts;
  const affinityLevel = customerType ? affinity[p.id]?.[customerType as CustomerType] ?? AFFINITY_DEFAULT : AFFINITY_DEFAULT;
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    response: p.response, responsePts, condition, conditionPts, units, unitsPts: round(unitsPts),
    affinityLevel, base: round(base), score: round(base * affinityLevel * AFFINITY_WEIGHT),
  };
}

export function scoreOf(
  p: Press,
  staffConditions: Record<string, string>,
  customerType?: string,
  affinity: AffinityTable = {},
): number {
  return scoreBreakdown(p, staffConditions, customerType, affinity).score;
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
