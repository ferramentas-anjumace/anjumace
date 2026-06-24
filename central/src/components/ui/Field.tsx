import { cn } from '@/lib/cn'

export interface FieldShellProps {
  id: string
  label?: React.ReactNode
  /** Texto de ajuda — some quando há erro. */
  helperText?: React.ReactNode
  /** Mensagem de erro; quando presente, o campo entra em estado de erro. */
  error?: React.ReactNode
  /** Marca o campo como opcional no rótulo. */
  optional?: boolean
  className?: string
  children: React.ReactNode
}

/** ids derivados para vincular label/descrição ao controle. */
export function fieldIds(id: string) {
  return { helperId: `${id}-helper`, errorId: `${id}-error` }
}

/**
 * Estrutura compartilhada de campo: rótulo, controle, ajuda e erro —
 * com associação aria correta. Usada por Input, Textarea, Select e SearchField.
 */
export function FieldShell({
  id,
  label,
  helperText,
  error,
  optional,
  className,
  children,
}: FieldShellProps) {
  const { helperId, errorId } = fieldIds(id)
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="flex items-center gap-1.5 text-body-s font-medium text-strong">
          {label}
          {optional && (
            <span className="font-mono text-mono-label uppercase text-faint">opcional</span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p id={errorId} className="text-body-s text-err">
          {error}
        </p>
      ) : (
        helperText && (
          <p id={helperId} className="text-body-s text-muted">
            {helperText}
          </p>
        )
      )}
    </div>
  )
}

/** Classes base compartilhadas pelos controles de texto. */
export function controlClasses(hasError?: boolean, extra?: string) {
  return cn(
    'w-full rounded-xs border bg-slate-900 text-body text-strong placeholder:text-faint',
    'transition-[border-color,box-shadow,background-color] duration-fast ease-out',
    'focus-visible:outline-none focus-visible:shadow-focus',
    'disabled:cursor-not-allowed disabled:opacity-50',
    hasError
      ? 'border-err/60 focus-visible:shadow-[0_0_0_3px_var(--err-tint)]'
      : 'border-strong hover:border-line',
    extra,
  )
}
