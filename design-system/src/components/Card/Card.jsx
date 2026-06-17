import { cn } from '../../lib/cn'

const variants = {
  surface: 'bg-surface border border-subtle',
  elevated: 'bg-surface-elevated border border-subtle shadow-md',
  outline: 'bg-transparent border border-border',
  muted: 'bg-surface-sunken border border-transparent',
  glass: 'glass text-white',
}

const paddings = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

/**
 * Card — contêiner de conteúdo da marca (raio 2xl, sombra suave).
 *
 * - variant: surface | elevated | outline | muted | glass
 * - padding: none | sm | md | lg
 * - interactive: bool — hover/active sutil (use em cards clicáveis)
 * - as: tag ('div' default; use 'a'/'button' se clicável)
 */
export function Card({
  variant = 'surface',
  padding = 'md',
  interactive = false,
  as: Comp = 'div',
  className,
  children,
  ...props
}) {
  return (
    <Comp
      className={cn(
        'rounded-2xl',
        variants[variant],
        paddings[padding],
        interactive &&
          'transition-[transform,box-shadow] duration-base ease-out cursor-pointer hover:-translate-y-0.5 hover:shadow-lg focus-visible:shadow-focus focus-visible:outline-none',
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  )
}

export function CardHeader({ className, children, ...props }) {
  return <div className={cn('flex flex-col gap-1.5 mb-4', className)} {...props}>{children}</div>
}
export function CardTitle({ className, children, ...props }) {
  return <h3 className={cn('text-h5', className)} {...props}>{children}</h3>
}
export function CardDescription({ className, children, ...props }) {
  return <p className={cn('text-body-sm text-content-muted', className)} {...props}>{children}</p>
}
export function CardContent({ className, children, ...props }) {
  return <div className={cn('text-body text-content-secondary', className)} {...props}>{children}</div>
}
export function CardFooter({ className, children, ...props }) {
  return <div className={cn('flex items-center gap-3 mt-6', className)} {...props}>{children}</div>
}
