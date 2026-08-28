import { Redis } from '@upstash/redis';

let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return _redis;
}

export type DispatchEvent = {
  id: string;
  startedAt: number;
  status: 'active' | 'assigned';
  winner?: { id: string; name: string; rank: string };
};

export const EVENT_KEY   = 'dispatch:event';
export const PRESSES_KEY = 'dispatch:presses';
export const TOKENS_KEY  = 'dispatch:tokens';
