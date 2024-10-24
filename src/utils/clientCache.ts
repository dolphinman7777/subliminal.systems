let eventSource: EventSource | null = null;

export function initCacheEventListener() {
  if (typeof window !== 'undefined' && !eventSource) {
    eventSource = new EventSource('/api/cache-events');
    eventSource.onmessage = (event) => {
      const invalidatedKey = event.data;
      localStorage.removeItem(invalidatedKey);
    };
  }
}

export function setClientCache(key: string, data: any, expirationInMinutes: number = 60) {
  const item = {
    value: data,
    expiry: new Date().getTime() + expirationInMinutes * 60000,
  };
  localStorage.setItem(key, JSON.stringify(item));
}

export function getClientCache(key: string) {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) return null;

  const item = JSON.parse(itemStr);
  const now = new Date().getTime();

  if (now > item.expiry) {
    localStorage.removeItem(key);
    return null;
  }
  return item.value;
}

export function clearClientCache() {
  localStorage.clear();
}