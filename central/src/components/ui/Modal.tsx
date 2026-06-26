import { useId } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Portal } from '@/lib/Portal'
import { useLockBodyScroll, useEscapeKey, useFocusTrap } from '@/lib/overlay'
import { IconButton } from './IconButton'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: React.ReactNode
  description?: React.ReactNode
  /** Rodapé (ações). */
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  children?: React.ReactNode
  className?: string
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

/**
 * Modal / Dialog — centralizado, com backdrop, trava de scroll, foco
 * aprisionado, Escape e clique-fora para fechar. role="dialog" + aria-modal.
 */
export function Modal({ open, onClose, title, description, footer, size = 'md', children, className }: ModalProps) {
  const titleId = useId()
  const descId = useId()
  useLockBodyScroll(open)
  useEscapeKey(open, onClose)
  const trapRef = useFocusTrap<HTMLDivElement>(open)

  if (!open) return null

  return (
    <Portal>
      <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-ink-deep/70 backdrop-blur-sm animate-fade-in"
          onClick={onClose}
          aria-hidden
        />
        <div
          ref={trapRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={description ? descId : undefined}
          className={cn(
            'relative flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden rounded-xl border border-strong bg-slate-900 shadow-e3 animate-slide-up',
            sizes[size],
            className,
          )}
        >
          {(title || description) && (
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line p-5">
              <div className="min-w-0">
                {title && (
                  <h2 id={titleId} className="font-display text-h2 font-semibold text-strong">
                    {title}
                  </h2>
                )}
                {description && (
                  <p id={descId} className="mt-1 text-body-s text-muted">
                    {description}
                  </p>
                )}
              </div>
              <IconButton aria-label="Fechar" size="sm" onClick={onClose}>
                <X size={18} strokeWidth={1.5} aria-hidden />
              </IconButton>
            </div>
          )}

          {children && <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>}

          {footer && (
            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-line bg-ink/40 p-4">
              {footer}
            </div>
          )}
        </div>
      </div>
    </Portal>
  )
}
