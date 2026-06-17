import { cn } from '../../lib/cn'

const variants = {
  neutral: 'bg-surface-sunken text-content-secondary',
  accent: 'bg-accent-subtle text-accent-text',
  'accent-2': 'bg-accent-2-subtle text-accent-2-text',
  solid: 'bg-accent text-accent-on',
  'solid-2': 'bg-accent-2 text-accent-2-on',
  success: 'bg-success-surface text-success-text',
  warning: 'bg-warning-surface text-warning-text',
  danger: 'bg-danger-surface text-danger-text',
  info: 'bg-info-surface text-info-text',
  outline: 'border border-strong text-content-secondary',
}

const sizes = {
  sm: 'h-5 px-2 text-2xs gap-1',
  md: 'h-6 px-2.5 text-xs gap-1',
  lg: 'h-7 px-3 text-sm gap-1.5',
}

/**
 * Badge / Tag — rótulo compacto.
 * - variant: neutral | accent | accent-2 | solid | solid-2 | success | warning | danger | info | outline
 * - size: sm | md | lg
 * - icon: ReactNode opcional à esquerda
 * - uppercase: aplica estilo de label (tracking largo) — bom p/ "VIP", "NOVO"
 */
export function Badge({
  variant = 'neutral',
  size = 'md',
  icon,
  uppercase = false,
  className,
  children,
  ...props
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap',
        uppercase && 'uppercase tracking-wider',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  )
}
