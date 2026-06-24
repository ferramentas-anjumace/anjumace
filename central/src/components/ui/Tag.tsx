import { forwardRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface TagProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'onSelect'> {
  /** Torna o chip selecionável (filtro) — usa aria-pressed. */
  selectable?: boolean
  selected?: boolean
  onSelect?: (selected: boolean) => void
  /** Mostra o botão de remover. */
  onRemove?: () => void
  leadingIcon?: React.ReactNode
}

/**
 * Tag / Chip — rótulo compacto. Pode ser selecionável (filtro, com
 * aria-pressed) e/ou removível.
 */
export const Tag = forwardRef<HTMLSpanElement, TagProps>(
  (
    { className, selectable, selected = false, onSelect, onRemove, leadingIcon, children, ...props },
    ref,
  ) => {
    const interactive = selectable
    const base = cn(
      'inline-flex items-center gap-1.5 rounded-xs border px-2 h-7 text-body-s',
      'transition-[background-color,border-color,color] duration-fast ease-out',
      selected
        ? 'border-steel-500/40 bg-steel-tint text-steel-300'
        : 'border-line bg-slate-800 text-fg',
      interactive && 'cursor-pointer hover:border-strong focus-visible:outline-none focus-visible:shadow-focus',
    )

    const content = (
      <>
        {leadingIcon}
        <span className="truncate">{children}</span>
        {onRemove && (
          <button
            type="button"
            aria-label="Remover"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="-mr-0.5 ml-0.5 grid size-4 place-items-center rounded-full text-muted transition-colors hover:bg-slate-600 hover:text-strong focus-visible:outline-none focus-visible:shadow-focus"
          >
            <X size={12} strokeWidth={2} aria-hidden />
          </button>
        )}
      </>
    )

    if (interactive) {
      return (
        <span
          ref={ref}
          role="button"
          tabIndex={0}
          aria-pressed={selected}
          onClick={() => onSelect?.(!selected)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onSelect?.(!selected)
            }
          }}
          className={cn(base, className)}
          {...props}
        >
          {content}
        </span>
      )
    }

    return (
      <span ref={ref} className={cn(base, className)} {...props}>
        {content}
      </span>
    )
  },
)
Tag.displayName = 'Tag'
