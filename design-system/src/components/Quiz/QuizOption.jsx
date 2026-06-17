import { Check } from 'lucide-react'
import { cn } from '../../lib/cn'

/**
 * QuizOption — opção selecionável grande (card) de um quiz.
 * Funciona como radio (single) ou checkbox (multi) via `multi`.
 *
 * - selected: bool
 * - onSelect(): callback
 * - icon / emoji: visual à esquerda
 * - label: texto principal
 * - description: apoio
 * - multi: indicador quadrado (checkbox) em vez de circular
 */
export function QuizOption({
  selected = false,
  onSelect,
  icon,
  emoji,
  label,
  description,
  multi = false,
  className,
  ...props
}) {
  return (
    <button
      type="button"
      role={multi ? 'checkbox' : 'radio'}
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'group flex w-full items-center gap-4 rounded-2xl border p-4 text-left',
        'transition-all duration-base ease-standard',
        'focus-visible:shadow-focus focus-visible:outline-none',
        selected
          ? 'border-accent bg-accent-subtle shadow-sm'
          : 'border-border bg-surface hover:border-strong hover:bg-surface-sunken',
        className,
      )}
      {...props}
    >
      {(icon || emoji) && (
        <span
          className={cn(
            'grid place-items-center size-11 shrink-0 rounded-xl text-xl',
            selected ? 'bg-accent text-accent-on' : 'bg-surface-sunken text-content-secondary',
          )}
        >
          {emoji ?? icon}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-body font-semibold text-content">{label}</span>
        {description && <span className="text-caption">{description}</span>}
      </span>
      <span
        className={cn(
          'grid place-items-center size-6 shrink-0 border transition-colors duration-fast',
          multi ? 'rounded-[6px]' : 'rounded-full',
          selected ? 'border-accent bg-accent text-accent-on' : 'border-strong bg-surface',
        )}
      >
        {selected && <Check className="size-4" strokeWidth={3} aria-hidden />}
      </span>
    </button>
  )
}
