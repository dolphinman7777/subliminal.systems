'use client';

import { useEffect } from 'react';
import { initCacheEventListener } from '@/utils/clientCache';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initCacheEventListener();
  }, []);

  return <>{children}</>;
}