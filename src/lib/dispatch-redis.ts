import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export type DispatchEvent = {
  id: string;
  startedAt: number;
  status: 'active' | 'assigned';
  winner?: { id: string; name: string; rank: string };
};

export const EVENT_KEY    = 'dispatch:event';
export const PRESSES_KEY  = 'dispatch:presses';
export const TOKENS_KEY   = 'dispatch:tokens';
