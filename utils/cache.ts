import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600 }); // Cache for 10 minutes

export function getCachedData<T>(key: string): T | undefined {
  return cache.get(key);
}

export function setCachedData<T>(key: string, data: T): void {
  cache.set(key, data);
}