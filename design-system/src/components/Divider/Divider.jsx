import { cn } from '../../lib/cn'

/**
 * Divider — separador horizontal ou vertical.
 * - orientation: 'horizontal' | 'vertical'
 * - dashed: traço tracejado (assinatura da marca em docs/templates)
 * - label: texto centralizado (só horizontal)
 */
export function Divider({
  orientation = 'horizontal',
  dashed = false,
  label,
  className,
  ...props
}) {
  if (orientation === 'vertical') {
    return (
      <span
        role="separator"
        aria-orientation="vertical"
        className={cn(
          'inline-block self-stretch w-px',
          dashed ? 'border-l border-dashed border-border bg-transparent' : 'bg-border',
          className,
        )}
        {...props}
      />
    )
  }

  if (label) {
    return (
      <div
        role="separator"
        className={cn('flex items-center gap-4 text-content-muted', className)}
        {...props}
      >
        <span className={cn('h-px flex-1', dashed ? 'border-t border-dashed border-border' : 'bg-border')} />
        <span className="text-label">{label}</span>
        <span className={cn('h-px flex-1', dashed ? 'border-t border-dashed border-border' : 'bg-border')} />
      </div>
    )
  }

  return (
    <hr
      className={cn(
        'border-0 h-px w-full',
        dashed ? 'border-t border-dashed border-border h-0' : 'bg-border',
        className,
      )}
      {...props}
    />
  )
}
