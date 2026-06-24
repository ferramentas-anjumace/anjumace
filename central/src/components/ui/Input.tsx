import { forwardRef, useId } from 'react'
import { cn } from '@/lib/cn'
import { FieldShell, fieldIds, controlClasses } from './Field'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode
  helperText?: React.ReactNode
  error?: React.ReactNode
  optional?: boolean
  /** Ícone líder dentro do campo. */
  leadingIcon?: React.ReactNode
  /** Conteúdo à direita (ícone, unidade, botão). */
  trailing?: React.ReactNode
}

/**
 * Input — campo de texto com rótulo, ícone líder, ajuda e estado de erro.
 * Estados: default, focus, error, disabled.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, helperText, error, optional, leadingIcon, trailing, id, ...props }, ref) => {
    const reactId = useId()
    const inputId = id ?? reactId
    const { helperId, errorId } = fieldIds(inputId)
    return (
      <FieldShell
        id={inputId}
        label={label}
        helperText={helperText}
        error={error}
        optional={optional}
        className={className}
      >
        <div className="relative flex items-center">
          {leadingIcon && (
            <span className="pointer-events-none absolute left-3 text-muted">{leadingIcon}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={cn(
              controlClasses(!!error, 'h-10'),
              leadingIcon ? 'pl-9' : 'pl-3',
              trailing ? 'pr-9' : 'pr-3',
            )}
            {...props}
          />
          {trailing && <span className="absolute right-3 text-muted">{trailing}</span>}
        </div>
      </FieldShell>
    )
  },
)
Input.displayName = 'Input'
