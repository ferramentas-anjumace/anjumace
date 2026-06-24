import { forwardRef, useId } from 'react'
import { cn } from '@/lib/cn'
import { FieldShell, fieldIds, controlClasses } from './Field'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode
  helperText?: React.ReactNode
  error?: React.ReactNode
  optional?: boolean
}

/**
 * Textarea — área de texto multilinha com rótulo, ajuda e estado de erro.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, helperText, error, optional, id, rows = 4, ...props }, ref) => {
    const reactId = useId()
    const fieldId = id ?? reactId
    const { helperId, errorId } = fieldIds(fieldId)
    return (
      <FieldShell
        id={fieldId}
        label={label}
        helperText={helperText}
        error={error}
        optional={optional}
        className={className}
      >
        <textarea
          ref={ref}
          id={fieldId}
          rows={rows}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={cn(controlClasses(!!error, 'resize-y px-3 py-2.5 leading-relaxed'))}
          {...props}
        />
      </FieldShell>
    )
  },
)
Textarea.displayName = 'Textarea'
