import { forwardRef, useId, createContext, useContext } from 'react'
import { cn } from '@/lib/cn'

interface RadioGroupCtx {
  name: string
  value?: string
  onChange?: (value: string) => void
}
const RadioGroupContext = createContext<RadioGroupCtx | null>(null)

export interface RadioGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  name: string
  value?: string
  onChange?: (value: string) => void
  label?: React.ReactNode
}

/** Agrupa Radios com navegação por setas (comportamento nativo do name). */
export function RadioGroup({ name, value, onChange, label, className, children, ...props }: RadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ name, value, onChange }}>
      <div role="radiogroup" aria-label={typeof label === 'string' ? label : undefined} className={cn('flex flex-col gap-2.5', className)} {...props}>
        {label && <span className="text-body-s font-medium text-strong">{label}</span>}
        {children}
      </div>
    </RadioGroupContext.Provider>
  )
}

export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value'> {
  value: string
  label?: React.ReactNode
  description?: React.ReactNode
}

/**
 * Radio — botão de opção. Use dentro de <RadioGroup> para controle de valor,
 * ou standalone com props nativas.
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, description, value, id, disabled, name, checked, onChange, ...props }, ref) => {
    const reactId = useId()
    const fieldId = id ?? reactId
    const group = useContext(RadioGroupContext)
    const resolvedName = group?.name ?? name
    const resolvedChecked = group ? group.value === value : checked
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
            ref={ref}
            id={fieldId}
            type="radio"
            name={resolvedName}
            value={value}
            checked={resolvedChecked}
            disabled={disabled}
            onChange={(e) => {
              group?.onChange?.(value)
              onChange?.(e)
            }}
            className="peer absolute inset-0 cursor-[inherit] appearance-none rounded-full border border-strong bg-slate-900 transition-colors duration-fast checked:border-steel-500 hover:border-line focus-visible:outline-none focus-visible:shadow-focus"
            {...props}
          />
          <span className="pointer-events-none size-2 rounded-full bg-steel-500 opacity-0 transition-opacity peer-checked:opacity-100" />
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
Radio.displayName = 'Radio'
