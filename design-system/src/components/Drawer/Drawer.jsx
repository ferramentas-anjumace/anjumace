import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../lib/cn'

const sides = {
  right: { panel: 'right-0 top-0 h-full w-full max-w-md rounded-l-3xl', enter: 'animate-[slide-in-right_.3s_ease-out_both]' },
  left: { panel: 'left-0 top-0 h-full w-full max-w-md rounded-r-3xl', enter: 'animate-[slide-in-left_.3s_ease-out_both]' },
  bottom: { panel: 'inset-x-0 bottom-0 w-full rounded-t-3xl max-h-[85vh]', enter: 'animate-[slide-in-up_.3s_ease-out_both]' },
}

/**
 * Drawer — painel deslizante (lateral ou inferior). Útil para filtros,
 * carrinho, menu mobile, detalhes.
 *
 * - open, onClose
 * - side: 'right' | 'left' | 'bottom'
 * - title
 * - footer
 */
export function Drawer({ open, onClose, side = 'right', title, footer, className, children }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null
  const cfg = sides[side]

  return createPortal(
    <div className="fixed inset-0 z-modal">
      <div className="absolute inset-0 bg-[var(--overlay-scrim)] animate-fade-in" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn('absolute bg-surface shadow-xl border border-subtle flex flex-col', cfg.panel, cfg.enter, className)}
      >
        <div className="flex items-center justify-between gap-4 p-6 border-b border-subtle">
          <h2 className="text-h5">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="grid place-items-center size-9 rounded-full text-content-muted hover:bg-surface-sunken transition-colors duration-fast focus-visible:shadow-focus focus-visible:outline-none"
          >
            <X className="size-5" strokeWidth={1.5} aria-hidden />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 text-body text-content-secondary">{children}</div>
        {footer && <div className="border-t border-subtle p-6 flex items-center gap-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
