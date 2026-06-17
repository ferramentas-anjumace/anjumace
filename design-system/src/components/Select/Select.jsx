import { forwardRef, useId } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Field, controlBase } from '../Field/Field'

/**
 * Select — dropdown nativo estilizado (acessível por padrão).
 * - label, hint, error, success, required
 * - options: [{ value, label }] OU passe <option> como children
 * - placeholder: opção inicial desabilitada
 * - size: 'sm' | 'md' | 'lg'
 */
export const Select = forwardRef(function Select(
  {
    label,
    hint,
    error,
    success,
    required,
    options,
    placeholder,
    size = 'md',
    id,
    className,
    children,
    ...props
  },
  ref,
) {
  const autoId = useId()
  const fieldId = id || autoId
  const invalid = Boolean(error)
  const heights = { sm: 'h-9', md: 'h-11', lg: 'h-[3.25rem]' }

  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      success={success}
      required={required}
      htmlFor={fieldId}
    >
      <div className="relative flex items-center">
        <select
          ref={ref}
          id={fieldId}
          aria-invalid={invalid || undefined}
          defaultValue={placeholder ? '' : undefined}
          className={cn(
            controlBase(invalid),
            heights[size],
            'appearance-none pr-10 cursor-pointer',
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options
            ? options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))
            : children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3.5 size-4 text-content-muted"
          strokeWidth={1.5}
          aria-hidden
        />
      </div>
    </Field>
  )
})
