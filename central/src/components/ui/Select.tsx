import { forwardRef, useId } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import { FieldShell, fieldIds, controlClasses } from './Field'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: React.ReactNode
  helperText?: React.ReactNode
  error?: React.ReactNode
  optional?: boolean
  /** Placeholder renderizado como opção desabilitada inicial. */
  placeholder?: string
}

/**
 * Select — seletor nativo estilizado, com rótulo, ajuda e estado de erro.
 * Usa o <select> nativo para acessibilidade e teclado consistentes.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className, label, helperText, error, optional, placeholder, id, children, defaultValue, value, ...props },
    ref,
  ) => {
    const reactId = useId()
    const fieldId = id ?? reactId
    const { helperId, errorId } = fieldIds(fieldId)
    const isControlled = value !== undefined
    return (
      <FieldShell
        id={fieldId}
        label={label}
        helperText={helperText}
        error={error}
        optional={optional}
        className={className}
      >
        <div className="relative flex items-center">
          <select
            ref={ref}
            id={fieldId}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            value={value}
            defaultValue={isControlled ? undefined : (defaultValue ?? (placeholder ? '' : undefined))}
            className={cn(controlClasses(!!error, 'h-10 appearance-none pl-3 pr-9'))}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {children}
          </select>
          <ChevronDown
            size={18}
            strokeWidth={1.5}
            className="pointer-events-none absolute right-3 text-muted"
            aria-hidden
          />
        </div>
      </FieldShell>
    )
  },
)
Select.displayName = 'Select'
