import { useId, useState, useRef, cloneElement, isValidElement } from 'react'
import { cn } from '@/lib/cn'

type Side = 'top' | 'bottom' | 'left' | 'right'

export interface TooltipProps {
  content: React.ReactNode
  side?: Side
  /** Atraso para abrir (ms). */
  delay?: number
  children: React.ReactElement
}

const sideClasses: Record<Side, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
  left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
  right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
}

/**
 * Tooltip — dica em hover/focus. Vincula via aria-describedby. Posiciona
 * relativo a um wrapper inline; respeita reduced-motion.
 */
export function Tooltip({ content, side = 'top', delay = 150, children }: TooltipProps) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  const show = () => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setOpen(true), delay)
  }
  const hide = () => {
    clearTimeout(timer.current)
    setOpen(false)
  }

  const trigger = isValidElement(children)
    ? cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        'aria-describedby': open ? id : undefined,
        onMouseEnter: show,
        onMouseLeave: hide,
        onFocus: show,
        onBlur: hide,
      })
    : children

  return (
    <span className="relative inline-flex">
      {trigger}
      {open && (
        <span
          role="tooltip"
          id={id}
          className={cn(
            'pointer-events-none absolute z-tooltip w-max max-w-xs rounded-md border border-strong bg-slate-700 px-2 py-1 text-body-s text-strong shadow-e2 animate-fade-in',
            sideClasses[side],
          )}
        >
          {content}
        </span>
      )}
    </span>
  )
}
