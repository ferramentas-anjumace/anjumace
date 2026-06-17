import { Check } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Button } from '../Button/Button'
import { Badge } from '../Badge/Badge'

/**
 * PricingCard — plano de preço.
 * - name, price, period, description
 * - features: string[]
 * - featured: bool — destaque (borda acento + escala)
 * - badge: texto do selo (ex. "Mais popular")
 * - cta: { label, onClick } | ReactNode
 */
export function PricingCard({
  name,
  price,
  period = '/mês',
  description,
  features = [],
  featured = false,
  badge,
  cta,
  className,
  ...props
}) {
  return (
    <div
      className={cn(
        'relative flex flex-col gap-6 rounded-2xl p-8 transition-transform duration-base',
        featured
          ? 'bg-surface border-2 border-accent shadow-lg md:scale-[1.03]'
          : 'bg-surface border border-subtle shadow-sm',
        className,
      )}
      {...props}
    >
      {badge && (
        <Badge variant="solid" size="sm" className="absolute -top-3 left-8" uppercase>
          {badge}
        </Badge>
      )}

      <div className="flex flex-col gap-1">
        <h3 className="text-h5 text-content">{name}</h3>
        {description && <p className="text-body-sm text-content-muted">{description}</p>}
      </div>

      <div className="flex items-baseline gap-1">
        <span className="font-display text-5xl font-light tracking-tight text-content">{price}</span>
        <span className="text-body-sm text-content-muted">{period}</span>
      </div>

      <ul className="flex flex-col gap-3">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2.5 text-body-sm text-content-secondary">
            <Check className="mt-0.5 size-4 shrink-0 text-accent-text" strokeWidth={2} aria-hidden />
            {f}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-2">
        {cta && typeof cta === 'object' && 'label' in cta ? (
          <Button variant={featured ? 'primary' : 'outline'} fullWidth onClick={cta.onClick}>
            {cta.label}
          </Button>
        ) : (
          cta
        )}
      </div>
    </div>
  )
}

/** PricingTable — grade de planos. */
export function PricingTable({ className, children, ...props }) {
  return (
    <div className={cn('grid grid-cols-1 gap-6 md:grid-cols-3 items-center', className)} {...props}>
      {children}
    </div>
  )
}
