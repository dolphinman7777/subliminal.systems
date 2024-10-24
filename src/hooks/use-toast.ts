"use client";

import { useContext } from 'react';
import { ToastContext } from '@/contexts/toast-context';
import type { ToastProps } from '@/types/toast';

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export type { ToastProps };
