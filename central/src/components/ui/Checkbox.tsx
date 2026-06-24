import { forwardRef, useId } from 'react'
import { Check, Minus } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode
  /** Texto de apoio abaixo do rótulo. */
  description?: React.ReactNode
  /** Estado indeterminado (parcial). */
  indeterminate?: boolean
}

/**
 * Checkbox — usa um input nativo oculto sobre um indicador estilizado, então
 * mantém foco/teclado/forms acessíveis. Suporta estado indeterminado.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, indeterminate, id, checked, disabled, ...props }, ref) => {
    const reactId = useId()
    const fieldId = id ?? reactId
    return (
      <label
        htmlFor={fieldId}
        className={cn(
          'group inline-flex items-start gap-2.5',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          className,
        )}
      >
        <span className="relative grid size-[18px] shrink-0 place-items-center">
          <input
            ref={(node) => {
              if (node) node.indeterminate = !!indeterminate
              if (typeof ref === 'function') ref(node)
              else if (ref) ref.current = node
            }}
            id={fieldId}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            className="peer absolute inset-0 cursor-[inherit] appearance-none rounded-xs border border-strong bg-slate-900 transition-colors duration-fast checked:border-steel-500 checked:bg-steel-500 indeterminate:border-steel-500 indeterminate:bg-steel-500 hover:border-line focus-visible:outline-none focus-visible:shadow-focus"
            {...props}
          />
          <span className="pointer-events-none relative text-accent-fg opacity-0 transition-opacity peer-checked:opacity-100 peer-indeterminate:opacity-100">
            {indeterminate ? (
              <Minus size={13} strokeWidth={3} aria-hidden />
            ) : (
              <Check size={13} strokeWidth={3} aria-hidden />
            )}
          </span>
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
Checkbox.displayName = 'Checkbox'
