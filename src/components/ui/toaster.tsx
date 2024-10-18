"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastActionElement,
  ToastProps,
  ToastProvider,
  ToastViewport,
} from "@/components/ui/toast"

// Update the ExtendedToastProps interface
interface ExtendedToastProps extends Omit<ToastProps, 'id'> {
  id: string;
  title?: string;
  description?: string;
  action?: ToastActionElement;
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }: ExtendedToastProps) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <div className="font-medium">{title}</div>}
              {description && (
                <div className="text-sm opacity-90">{description}</div>
              )}
            </div>
            {action}
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
