import { forwardRef, useId } from 'react'
import { cn } from '../../lib/cn'

/**
 * Radio — botão de opção circular. Use dentro de um grupo com mesmo `name`.
 * - label, description
 */
export const Radio = forwardRef(function Radio(
  { label, description, id, className, disabled, ...props },
  ref,
) {
  const autoId = useId()
  const rId = id || autoId

  return (
    <label
      htmlFor={rId}
      className={cn(
        'group inline-flex gap-3 cursor-pointer items-start',
        disabled && 'opacity-50 pointer-events-none',
        className,
      )}
    >
      <span className="relative inline-grid place-items-center mt-0.5">
        <input
          ref={ref}
          id={rId}
          type="radio"
          disabled={disabled}
          className="peer sr-only"
          {...props}
        />
        <span
          className={cn(
            'size-5 rounded-full border border-strong bg-surface',
            'transition-[border-color] duration-fast ease-standard',
            'peer-checked:border-accent peer-checked:border-[6px]',
            'peer-focus-visible:shadow-focus',
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
