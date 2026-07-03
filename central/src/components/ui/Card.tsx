import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/cn'

/* ---------------------------------------------------------------- Card base */

const card = cva(['rounded-lg border transition-[border-color,box-shadow,background-color] duration-fast ease-out'], {
  variants: {
    variant: {
      base: 'bg-slate-900 border-line',
      interactive:
        'bg-slate-900 border-line hover:border-strong hover:bg-slate-800 cursor-pointer focus-visible:outline-none focus-visible:shadow-focus',
      /** Estado "aceso" — glow steel pontual. */
      active: 'bg-slate-800 border-steel-500/40 shadow-active',
    },
    padded: {
      true: 'p-5',
      false: '',
    },
  },
  defaultVariants: { variant: 'base', padded: true },
})

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof card> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padded, ...props }, ref) => (
    <div ref={ref} className={cn(card({ variant, padded }), className)} {...props} />
  ),
)
Card.displayName = 'Card'

/* --------------------------------------------------------------- CardIcon */

/**
 * Azulejo de ícone para cabeçalhos de card/seção — dá cor e identidade a cada
 * card. Tons da marca: `sage` (Sálvia) e `gold` (Dourado). Padrão do sistema
 * introduzido no checkpoint 2026-07-03.
 */
export function CardIcon({
  tone = 'sage',
  className,
  children,
}: {
  tone?: 'sage' | 'gold'
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        'grid size-9 shrink-0 place-items-center rounded-md border',
        tone === 'gold'
          ? 'border-sand-300 bg-sand-300/60 text-warn'
          : 'border-steel-500/35 bg-steel-300/60 text-steel-700',
        className,
      )}
    >
      {children}
    </span>
  )
}

export const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mb-4 flex items-start justify-between gap-3', className)}
      {...props}
    />
  ),
)
CardHeader.displayName = 'CardHeader'

export const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('font-display text-h3 font-semibold text-strong', className)}
      {...props}
    />
  ),
)
CardTitle.displayName = 'CardTitle'

export const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mt-4 flex items-center gap-2 border-t border-subtle pt-4', className)}
      {...props}
    />
  ),
)
CardFooter.displayName = 'CardFooter'

/* ----------------------------------------------------------- Stat/MetricCard */

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Label em mono uppercase. */
  label: React.ReactNode
  /** Valor principal em display. */
  value: React.ReactNode
  /** Variação percentual; sinal define cor/seta. */
  delta?: { value: string; direction: 'up' | 'down' | 'neutral' }
  /** Slot para sparkline (placeholder por enquanto). */
  sparkline?: React.ReactNode
  /** Aplica o estado "aceso" (glow steel). */
  active?: boolean
}

/**
 * StatCard / MetricCard — label em mono, valor em display, badge de delta e
 * slot para sparkline. `active` aplica o glow de ênfase.
 */
export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, label, value, delta, sparkline, active = false, ...props }, ref) => {
    const deltaTone =
      delta?.direction === 'up'
        ? 'text-ok'
        : delta?.direction === 'down'
          ? 'text-err'
          : 'text-muted'
    const DeltaIcon = delta?.direction === 'down' ? ArrowDownRight : ArrowUpRight

    return (
      <Card
        ref={ref}
        variant={active ? 'active' : 'base'}
        className={cn('flex flex-col gap-3', className)}
        {...props}
      >
        <div className="font-mono text-mono-label uppercase text-muted">{label}</div>
        <div className="flex items-end justify-between gap-3">
          <span className="font-display text-display-l font-semibold leading-none text-strong tabular-nums">
            {value}
          </span>
          {sparkline && <div className="h-8 w-24 shrink-0">{sparkline}</div>}
        </div>
        {delta && (
          <div className={cn('flex items-center gap-1 font-mono text-mono-data', deltaTone)}>
            {delta.direction !== 'neutral' && (
              <DeltaIcon size={14} strokeWidth={1.5} aria-hidden />
            )}
            {delta.value}
          </div>
        )}
      </Card>
    )
  },
)
StatCard.displayName = 'StatCard'

/* --------------------------------------------------------------- SandCard */

export interface SandCardProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * SandCard — variante quente de ênfase (a assinatura do sistema). Superfície
 * Sand clara com texto escuro. Use com parcimônia: no máximo uma por view.
 */
export const SandCard = forwardRef<HTMLDivElement, SandCardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border border-sand-300 bg-sand-200 p-5 text-on-sand shadow-e2',
        className,
      )}
      {...props}
    />
  ),
)
SandCard.displayName = 'SandCard'
