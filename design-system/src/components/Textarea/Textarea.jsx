import { forwardRef, useId } from 'react'
import { cn } from '../../lib/cn'
import { Field, controlBase } from '../Field/Field'

/**
 * Textarea — área de texto multilinha com label/hint/erro.
 * - label, hint, error, success, required, rows
 */
export const Textarea = forwardRef(function Textarea(
  { label, hint, error, success, required, rows = 4, id, className, ...props },
  ref,
) {
  const autoId = useId()
  const fieldId = id || autoId
  const invalid = Boolean(error)

  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      success={success}
      required={required}
      htmlFor={fieldId}
    >
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        aria-invalid={invalid || undefined}
        className={cn(controlBase(invalid), 'py-3 resize-y min-h-[5rem]', className)}
        {...props}
      />
    </Field>
  )
})
