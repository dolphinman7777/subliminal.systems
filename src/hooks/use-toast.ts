import { useState } from 'react';

interface ToastProps {
  description: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const toast = ({ description, variant = 'default' }: ToastProps) => {
    setToasts((prevToasts) => {
      if (!Array.isArray(prevToasts)) {
        return [{ description, variant }];
      }
      return [...prevToasts, { description, variant }];
    });
    setTimeout(() => {
      setToasts((prevToasts) => {
        if (!Array.isArray(prevToasts)) {
          return [];
        }
        return prevToasts.slice(1);
      });
    }, 3000);
  };

  return { toast, toasts };
}
