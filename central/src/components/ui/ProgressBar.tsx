import { forwardRef } from 'react'
import { cn } from '@/lib/cn'

type Tone = 'steel' | 'success' | 'danger' | 'warning'

const toneFill: Record<Tone, string> = {
  steel: 'bg-steel-500',
  success: 'bg-ok',
  danger: 'bg-err',
  warning: 'bg-warn',
}

export interface ProgressBarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'role'> {
  /** 0–100. */
  value: number
  max?: number
  tone?: Tone
  /** Mostra o valor numérico em mono à direita do label. */
  showValue?: boolean
  /** Rótulo acima da barra. */
  label?: React.ReactNode
}

/**
 * ProgressBar / Meter — barra de progresso determinada. `tone` define a cor
 * do preenchimento; `label` e `showValue` são opcionais.
 */
export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ className, value, max = 100, tone = 'steel', showValue = false, label, ...props }, ref) => {
    const pct = Math.min(100, Math.max(0, (value / max) * 100))
    return (
      <div ref={ref} className={cn('flex flex-col gap-1.5', className)} {...props}>
        {(label || showValue) && (
          <div className="flex items-baseline justify-between gap-3">
            {label && <span className="text-body-s text-muted">{label}</span>}
            {showValue && (
              <span className="font-mono text-mono-data text-strong tabular-nums">
                {Math.round(pct)}%
              </span>
            )}
          </div>
        )}
        <div
          role="progressbar"
          aria-valuenow={Math.round(value)}
          aria-valuemin={0}
          aria-valuemax={max}
          className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800"
        >
          <div
            className={cn('h-full rounded-full transition-[width] duration-slow ease-out', toneFill[tone])}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    )
  },
)
ProgressBar.displayName = 'ProgressBar'
