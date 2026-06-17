import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../lib/cn'

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
}

/**
 * Modal — diálogo centralizado com scrim, foco gerenciado e ESC para fechar.
 *
 * - open: bool
 * - onClose(): callback
 * - title, description
 * - size: sm | md | lg | xl
 * - footer: ReactNode (ações)
 * - closeOnBackdrop: bool (default true)
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  footer,
  closeOnBackdrop = true,
  className,
  children,
}) {
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-modal grid place-items-center p-4">
      <div
        className="absolute inset-0 bg-[var(--overlay-scrim)] animate-fade-in"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'relative w-full rounded-3xl bg-surface shadow-xl border border-subtle outline-none',
          'animate-scale-in',
          sizes[size],
          className,
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 grid place-items-center size-9 rounded-full text-content-muted hover:bg-surface-sunken transition-colors duration-fast focus-visible:shadow-focus focus-visible:outline-none"
        >
          <X className="size-5" strokeWidth={1.5} aria-hidden />
        </button>

        <div className="p-6 md:p-8">
          {(title || description) && (
            <div className="flex flex-col gap-1.5 mb-5 pr-8">
              {title && <h2 className="text-h4">{title}</h2>}
              {description && <p className="text-body-sm text-content-muted">{description}</p>}
            </div>
          )}
          <div className="text-body text-content-secondary">{children}</div>
          {footer && <div className="mt-8 flex items-center justify-end gap-3">{footer}</div>}
        </div>
      </div>
    </div>,
    document.body,
  )
}
