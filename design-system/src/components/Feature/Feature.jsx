import { cn } from '../../lib/cn'

/**
 * Feature — bloco ícone + título + descrição (linha de 3 do material).
 *
 * - icon: ReactNode (ícone monoline)
 * - title, description
 * - align: 'left' | 'center'
 * - iconStyle: 'plain' | 'circle' — moldura do ícone
 */
export function Feature({
  icon,
  title,
  description,
  align = 'left',
  iconStyle = 'plain',
  className,
  ...props
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3',
        align === 'center' && 'items-center text-center',
        className,
      )}
      {...props}
    >
      {icon && (
        <span
          className={cn(
            'text-accent-text',
            iconStyle === 'circle' &&
              'inline-grid place-items-center size-12 rounded-full bg-accent-subtle',
          )}
        >
          {icon}
        </span>
      )}
      <h3 className="text-h6 text-content">{title}</h3>
      {description && <p className="text-body-sm text-content-muted max-w-sm">{description}</p>}
    </div>
  )
}

/** FeatureGrid — grade responsiva de Features (1 → N colunas). */
export function FeatureGrid({ columns = 3, className, children, ...props }) {
  const cols = { 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-2 lg:grid-cols-4' }
  return (
    <div className={cn('grid grid-cols-1 gap-8', cols[columns], className)} {...props}>
      {children}
    </div>
  )
}
