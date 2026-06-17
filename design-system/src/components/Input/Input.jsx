import { forwardRef, useId } from 'react'
import { cn } from '../../lib/cn'
import { Field, controlBase } from '../Field/Field'

/**
 * Input — campo de texto com label/hint/erro e ícones opcionais.
 *
 * - label, hint, error, success, required
 * - leftIcon / rightIcon: ReactNode
 * - size: 'sm' | 'md' | 'lg'
 * Demais props nativos (type, value, onChange, placeholder…) passam direto.
 */
export const Input = forwardRef(function Input(
  {
    label,
    hint,
    error,
    success,
    required,
    leftIcon,
    rightIcon,
    size = 'md',
    id,
    className,
    ...props
  },
  ref,
) {
  const autoId = useId()
  const inputId = id || autoId
  const invalid = Boolean(error)
  const heights = { sm: 'h-9', md: 'h-11', lg: 'h-[3.25rem]' }

  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      success={success}
      required={required}
      htmlFor={inputId}
    >
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3.5 text-content-muted">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={invalid || undefined}
          className={cn(
            controlBase(invalid),
            heights[size],
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            className,
          )}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3.5 text-content-muted">{rightIcon}</span>
        )}
      </div>
    </Field>
  )
})
