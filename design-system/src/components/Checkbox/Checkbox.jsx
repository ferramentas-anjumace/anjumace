import { forwardRef, useId } from 'react'
import { Check } from 'lucide-react'
import { cn } from '../../lib/cn'

/**
 * Checkbox — caixa quadrada da marca (como o checklist matinal).
 * Acessível: usa <input> nativo escondido + visual customizado.
 * - label, description: textos opcionais
 * - size: 'sm' | 'md'
 */
export const Checkbox = forwardRef(function Checkbox(
  { label, description, size = 'md', id, className, disabled, ...props },
  ref,
) {
  const autoId = useId()
  const cbId = id || autoId
  const box = size === 'sm' ? 'size-4' : 'size-5'

  return (
    <label
      htmlFor={cbId}
      className={cn(
        'group inline-flex gap-3 cursor-pointer items-start',
        disabled && 'opacity-50 pointer-events-none',
        className,
      )}
    >
      <span className="relative inline-grid place-items-center mt-0.5">
        <input
          ref={ref}
          id={cbId}
          type="checkbox"
          disabled={disabled}
          className="peer sr-only"
          {...props}
        />
        <span
          className={cn(
            box,
            'rounded-[5px] border border-strong bg-surface',
            'transition-[background-color,border-color] duration-fast ease-standard',
            'peer-checked:bg-accent peer-checked:border-accent',
            'peer-focus-visible:shadow-focus',
            'peer-indeterminate:bg-accent peer-indeterminate:border-accent',
          )}
        />
        <Check
          className={cn(
            'pointer-events-none absolute text-accent-on opacity-0 peer-checked:opacity-100',
            'transition-opacity duration-fast',
            size === 'sm' ? 'size-3' : 'size-3.5',
          )}
          strokeWidth={3}
          aria-hidden
        />
      </span>
      {(label || description) && (
        <span className="flex flex-col">
          {label && <span className="text-body-sm font-medium text-content leading-snug">{label}</span>}
          {description && <span className="text-caption">{description}</span>}
        </span>
      )}
    </label>
  )
})
