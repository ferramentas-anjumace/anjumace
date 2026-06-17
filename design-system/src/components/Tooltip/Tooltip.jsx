import { useId, useState } from 'react'
import { cn } from '../../lib/cn'

const positions = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
}

/**
 * Tooltip — dica em hover/foco. Leve, sem dependência de portal.
 * Envolve um único elemento interativo (filho).
 *
 * - content: texto da dica
 * - side: 'top' | 'bottom' | 'left' | 'right'
 */
export function Tooltip({ content, side = 'top', className, children }) {
  const [open, setOpen] = useState(false)
  const id = useId()

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span aria-describedby={open ? id : undefined}>{children}</span>
      <span
        role="tooltip"
        id={id}
        className={cn(
          'pointer-events-none absolute z-tooltip w-max max-w-xs rounded-md px-2.5 py-1.5',
          'bg-surface-inverse text-content-inverse text-xs font-medium shadow-lg',
          'transition-[opacity,transform] duration-fast ease-out',
          open ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
          positions[side],
          className,
        )}
      >
        {content}
      </span>
    </span>
  )
}
