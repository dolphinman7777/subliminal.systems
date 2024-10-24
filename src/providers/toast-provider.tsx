'use client';

import { ToastProvider as InternalToastProvider } from "@/contexts/toast-context";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <InternalToastProvider>{children}</InternalToastProvider>;
}
