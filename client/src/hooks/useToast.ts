import { toast as sonnerToast } from 'sonner'

export type ToastType = 'success' | 'error' | 'loading' | 'info'

interface ToastOptions {
  duration?: number
  description?: string
}

export const useToast = () => {
  const toast = (message: string, type: ToastType = 'info', options?: ToastOptions) => {
    const duration = options?.duration ?? 4000

    switch (type) {
      case 'success':
        return sonnerToast.success(message, {
          duration,
          description: options?.description
        })
      case 'error':
        return sonnerToast.error(message, {
          duration,
          description: options?.description
        })
      case 'loading':
        return sonnerToast.loading(message, {
          duration,
          description: options?.description
        })
      case 'info':
      default:
        return sonnerToast(message, {
          duration,
          description: options?.description
        })
    }
  }

  return {
    success: (message: string, options?: ToastOptions) => toast(message, 'success', options),
    error: (message: string, options?: ToastOptions) => toast(message, 'error', options),
    loading: (message: string, options?: ToastOptions) => toast(message, 'loading', options),
    info: (message: string, options?: ToastOptions) => toast(message, 'info', options)
  }
}
