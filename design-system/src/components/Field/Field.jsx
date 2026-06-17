import { cn } from '../../lib/cn'

/** Label autônomo da marca. */
export function Label({ required, className, children, ...props }) {
  return (
    <label
      className={cn('block text-body-sm font-medium text-content', className)}
      {...props}
    >
      {children}
      {required && <span className="text-danger-text ml-0.5" aria-hidden>*</span>}
    </label>
  )
}

/**
 * Field — invólucro de campo: label + controle + hint/erro/sucesso.
 * Usado por Input, Textarea, Select. Cuida de acessibilidade (ids, aria).
 *
 * - label, hint
 * - error: string — estado de erro (sobrescreve hint)
 * - success: string — mensagem de sucesso
 * - required
 * - htmlFor / id do controle (passe o mesmo id)
 */
export function Field({
  label,
  hint,
  error,
  success,
  required,
  htmlFor,
  className,
  children,
}) {
  const message = error || success || hint
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      )}
      {children}
      {message && (
        <p
          className={cn(
            'text-caption',
            error && 'text-danger-text',
            success && 'text-success-text',
            !error && !success && 'text-content-muted',
          )}
        >
          {message}
        </p>
      )}
    </div>
  )
}

/* Classe base compartilhada por controles de texto (input/textarea/select). */
export const controlBase = (invalid) =>
  cn(
    'w-full rounded-md bg-[var(--input-bg)] text-content',
    'border border-border px-3.5',
    'placeholder:text-content-subtle',
    'transition-[border-color,box-shadow] duration-fast ease-standard',
    'hover:border-strong',
    'focus-visible:outline-none focus-visible:border-accent focus-visible:shadow-focus',
    'disabled:opacity-50 disabled:pointer-events-none',
    invalid && 'border-danger focus-visible:border-danger focus-visible:shadow-none',
  )
