import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Portal } from '@/lib/Portal'

type ToastTone = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  tone: ToastTone
  title: React.ReactNode
  description?: React.ReactNode
}

interface ToastApi {
  toast: (t: Omit<ToastItem, 'id'>) => void
  success: (title: React.ReactNode, description?: React.ReactNode) => void
  error: (title: React.ReactNode, description?: React.ReactNode) => void
  info: (title: React.ReactNode, description?: React.ReactNode) => void
}

const ToastContext = createContext<ToastApi | null>(null)

/** Hook para disparar toasts de qualquer ponto sob o ToastProvider. */
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast precisa estar dentro de <ToastProvider>')
  return ctx
}

const config: Record<ToastTone, { icon: React.ReactNode; accent: string }> = {
  success: { icon: <CheckCircle2 size={18} strokeWidth={1.5} />, accent: 'text-ok' },
  error: { icon: <AlertCircle size={18} strokeWidth={1.5} />, accent: 'text-err' },
  info: { icon: <Info size={18} strokeWidth={1.5} />, accent: 'text-steel-300' },
}

export function ToastProvider({
  children,
  duration = 4000,
}: {
  children: React.ReactNode
  duration?: number
}) {
  const [items, setItems] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const remove = useCallback((id: number) => {
    setItems((cur) => cur.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (t: Omit<ToastItem, 'id'>) => {
      const id = ++counter.current
      setItems((cur) => [...cur, { ...t, id }])
      window.setTimeout(() => remove(id), duration)
    },
    [duration, remove],
  )

  const api: ToastApi = {
    toast,
    success: (title, description) => toast({ tone: 'success', title, description }),
    error: (title, description) => toast({ tone: 'error', title, description }),
    info: (title, description) => toast({ tone: 'info', title, description }),
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Portal>
        <div
          className="pointer-events-none fixed bottom-4 right-4 z-toast flex w-[min(92vw,360px)] flex-col gap-2"
          role="region"
          aria-label="Notificações"
        >
          {items.map((t) => (
            <div
              key={t.id}
              role="status"
              className="pointer-events-auto flex items-start gap-3 rounded-lg border border-strong bg-slate-800 p-3.5 shadow-e3 animate-slide-up"
            >
              <span className={cn('mt-0.5 shrink-0', config[t.tone].accent)}>
                {config[t.tone].icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-body-s font-medium text-strong">{t.title}</p>
                {t.description && <p className="mt-0.5 text-body-s text-muted">{t.description}</p>}
              </div>
              <button
                type="button"
                aria-label="Fechar notificação"
                onClick={() => remove(t.id)}
                className="-mr-1 -mt-1 grid size-6 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-slate-600 hover:text-strong focus-visible:outline-none focus-visible:shadow-focus"
              >
                <X size={14} strokeWidth={2} aria-hidden />
              </button>
            </div>
          ))}
        </div>
      </Portal>
    </ToastContext.Provider>
  )
}
