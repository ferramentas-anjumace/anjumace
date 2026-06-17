import { cn } from '../../lib/cn'

/**
 * ProgressBar — barra de progresso linear.
 * - value: 0–100
 * - tone: 'accent' | 'accent-2' | 'success'
 * - size: 'sm' | 'md'
 * - showLabel: mostra % à direita
 */
export function ProgressBar({ value = 0, tone = 'accent', size = 'md', showLabel = false, className, ...props }) {
  const v = Math.max(0, Math.min(100, value))
  const track = size === 'sm' ? 'h-1.5' : 'h-2.5'
  const fill = { accent: 'bg-accent', 'accent-2': 'bg-accent-2', success: 'bg-success' }[tone]
  return (
    <div className={cn('flex items-center gap-3', className)} {...props}>
      <div
        className={cn('relative flex-1 overflow-hidden rounded-full bg-surface-sunken', track)}
        role="progressbar"
        aria-valuenow={v}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-slow ease-out', fill)}
          style={{ width: `${v}%` }}
        />
      </div>
      {showLabel && <span className="text-caption tabular-nums w-9 text-right">{Math.round(v)}%</span>}
    </div>
  )
}

/**
 * ProgressRing — anel de progresso circular (ex. anel de meta no app).
 * - value: 0–100
 * - size: px do diâmetro
 * - stroke: espessura
 * - tone: 'accent' | 'accent-2'
 * - children: conteúdo central (ex. "75%")
 */
export function ProgressRing({ value = 0, size = 72, stroke = 6, tone = 'accent', className, children, ...props }) {
  const v = Math.max(0, Math.min(100, value))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (v / 100) * c
  const color = tone === 'accent-2' ? 'var(--accent-2)' : 'var(--accent)'
  return (
    <div className={cn('relative inline-grid place-items-center', className)} style={{ width: size, height: size }} {...props}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`${Math.round(v)}%`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-sunken)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-slow ease-out"
        />
      </svg>
      {children && <span className="absolute text-body-sm font-semibold text-content">{children}</span>}
    </div>
  )
}
