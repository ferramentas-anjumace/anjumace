import { useId } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Portal } from '@/lib/Portal'
import { useLockBodyScroll, useEscapeKey, useFocusTrap } from '@/lib/overlay'
import { IconButton } from './IconButton'

export interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: React.ReactNode
  description?: React.ReactNode
  side?: 'right' | 'left'
  width?: number
  footer?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

/**
 * Drawer / Sheet — painel deslizante a partir da borda. Backdrop, trava de
 * scroll, foco aprisionado, Escape e clique-fora. role="dialog" + aria-modal.
 */
export function Drawer({
  open,
  onClose,
  title,
  description,
  side = 'right',
  width = 420,
  footer,
  children,
  className,
}: DrawerProps) {
  const titleId = useId()
  const descId = useId()
  useLockBodyScroll(open)
  useEscapeKey(open, onClose)
  const trapRef = useFocusTrap<HTMLDivElement>(open)

  if (!open) return null

  return (
    <Portal>
      <div className="fixed inset-0 z-drawer">
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
          style={{ width }}
          className={cn(
            'absolute top-0 flex h-full max-w-[90vw] flex-col border-line bg-slate-900 shadow-e3 animate-slide-in-right',
            side === 'right' ? 'right-0 border-l' : 'left-0 border-r',
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line p-5">
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

          <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>

          {footer && (
            <div className="flex items-center justify-end gap-2 border-t border-line bg-ink/40 p-4">
              {footer}
            </div>
          )}
        </div>
      </div>
    </Portal>
  )
}
