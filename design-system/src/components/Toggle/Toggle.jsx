import { forwardRef, useId } from 'react'
import { cn } from '../../lib/cn'

/**
 * Toggle — interruptor (switch). Acessível via checkbox nativo.
 * - label, description
 * - size: 'sm' | 'md'
 */
export const Toggle = forwardRef(function Toggle(
  { label, description, size = 'md', id, className, disabled, ...props },
  ref,
) {
  const autoId = useId()
  const tId = id || autoId
  const track = size === 'sm' ? 'w-9 h-5' : 'w-11 h-6'
  const knob = size === 'sm' ? 'size-4 peer-checked:translate-x-4' : 'size-5 peer-checked:translate-x-5'

  return (
    <label
      htmlFor={tId}
      className={cn(
        'group inline-flex items-center gap-3 cursor-pointer',
        disabled && 'opacity-50 pointer-events-none',
        className,
      )}
    >
      <span className="relative inline-flex items-center">
        <input
          ref={ref}
          id={tId}
          type="checkbox"
          role="switch"
          disabled={disabled}
          className="peer sr-only"
          {...props}
        />
        <span
          className={cn(
            track,
            'rounded-full bg-surface-sunken border border-border',
            'transition-colors duration-base ease-standard',
            'peer-checked:bg-accent peer-checked:border-accent',
            'peer-focus-visible:shadow-focus',
          )}
        />
        <span
          className={cn(
            knob,
            'absolute left-0.5 rounded-full bg-surface shadow-sm',
            'transition-transform duration-base ease-spring',
          )}
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
