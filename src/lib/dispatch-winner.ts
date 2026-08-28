import { RANK_ORDER, WINDOW_MS, type Rank } from './dispatch-config';
import type { DispatchEvent } from './dispatch-redis';

export type Press = { id: string; name: string; rank: string; time: number };

export function parsePresses(raw: Record<string, unknown>): Press[] {
  return Object.entries(raw).map(([key, val]) => {
    const [id, name, rank] = key.split('::');
    return { id, name, rank, time: Number(val) };
  });
}

export function determineWinner(event: DispatchEvent, presses: Press[]): Press | null {
  if (presses.length === 0) return null;
  if (Date.now() <= event.startedAt + WINDOW_MS) return null; // window still open

  const windowEnd = event.startedAt + WINDOW_MS;
  const within = presses.filter(p => p.time <= windowEnd);
  const after  = presses.filter(p => p.time > windowEnd);

  if (within.length > 0) {
    return within.sort((a, b) => {
      const rd = RANK_ORDER[b.rank as Rank] - RANK_ORDER[a.rank as Rank];
      return rd !== 0 ? rd : a.time - b.time;
    })[0];
  }
  return after.sort((a, b) => a.time - b.time)[0];
}
