import { forwardRef, useId } from 'react'
import { cn } from '@/lib/cn'

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'role'> {
  label?: React.ReactNode
  description?: React.ReactNode
}

/**
 * Switch — alterna um estado on/off. Input checkbox nativo (foco/teclado/forms)
 * sobre um trilho estilizado.
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, description, id, disabled, ...props }, ref) => {
    const reactId = useId()
    const fieldId = id ?? reactId
    return (
      <label
        htmlFor={fieldId}
        className={cn(
          'group inline-flex items-start gap-3',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          className,
        )}
      >
        <span className="relative inline-flex h-5 w-9 shrink-0 items-center">
          <input
            ref={ref}
            id={fieldId}
            type="checkbox"
            role="switch"
            disabled={disabled}
            className="peer size-full cursor-[inherit] appearance-none rounded-full border border-strong bg-slate-700 transition-colors duration-fast checked:border-steel-500 checked:bg-steel-500 focus-visible:outline-none focus-visible:shadow-focus"
            {...props}
          />
          {/* polegar */}
          <span className="pointer-events-none absolute left-0.5 size-4 rounded-full bg-knob shadow-e1 transition-transform duration-fast ease-out peer-checked:translate-x-4" />
        </span>
        {(label || description) && (
          <span className="flex flex-col gap-0.5 leading-tight">
            {label && <span className="text-body text-strong">{label}</span>}
            {description && <span className="text-body-s text-muted">{description}</span>}
          </span>
        )}
      </label>
    )
  },
)
Switch.displayName = 'Switch'
