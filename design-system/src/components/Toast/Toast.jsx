import { createContext, useCallback, useContext, useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react'
import { cn } from '../../lib/cn'

const ICONS = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
  info: Info,
}
const ACCENT = {
  success: 'text-success-text',
  warning: 'text-warning-text',
  danger: 'text-danger-text',
  info: 'text-info-text',
}

const ToastContext = createContext(null)

/**
 * useToast — hook para disparar toasts.
 * @example const toast = useToast(); toast({ title: 'Salvo!', variant: 'success' })
 */
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast precisa de <ToastProvider> na árvore.')
  return ctx.push
}

/** ToastProvider — coloca no topo da app. Renderiza a pilha de toasts. */
export function ToastProvider({ children, duration = 4000 }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const push = useCallback(
    ({ title, description, variant = 'info' }) => {
      const id = Math.random().toString(36).slice(2)
      setToasts((t) => [...t, { id, title, description, variant }])
      if (duration) setTimeout(() => remove(id), duration)
      return id
    },
    [duration, remove],
  )

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      {createPortal(
        <div className="fixed bottom-4 right-4 z-toast flex w-full max-w-sm flex-col gap-3">
          {toasts.map((t) => {
            const Icon = ICONS[t.variant]
            return (
              <div
                key={t.id}
                role="status"
                className="flex items-start gap-3 rounded-2xl bg-surface border border-subtle p-4 shadow-lg [animation:toast-in_.3s_var(--ease-out)_both]"
              >
                <Icon className={cn('size-5 shrink-0 mt-0.5', ACCENT[t.variant])} strokeWidth={1.5} aria-hidden />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  {t.title && <p className="text-body-sm font-semibold text-content">{t.title}</p>}
                  {t.description && <p className="text-caption">{t.description}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => remove(t.id)}
                  aria-label="Fechar"
                  className="grid place-items-center size-6 shrink-0 rounded-full text-content-muted hover:bg-surface-sunken transition-colors duration-fast"
                >
                  <X className="size-4" strokeWidth={1.5} aria-hidden />
                </button>
              </div>
            )
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}
