import { cn } from '../../lib/cn'

/**
 * QuizProgress — progresso do quiz: contador + barra (ou dots).
 * - step: passo atual (1-based)
 * - total: total de passos
 * - variant: 'bar' | 'dots'
 */
export function QuizProgress({ step = 1, total = 1, variant = 'bar', className, ...props }) {
  const pct = Math.round((step / total) * 100)
  return (
    <div className={cn('flex flex-col gap-2', className)} {...props}>
      <div className="flex items-center justify-between">
        <span className="text-label text-content-muted">Pergunta {step} de {total}</span>
        <span className="text-caption tabular-nums">{pct}%</span>
      </div>
      {variant === 'bar' ? (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-accent transition-[width] duration-moderate ease-out" style={{ width: `${pct}%` }} />
        </div>
      ) : (
        <div className="flex gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors duration-base',
                i < step ? 'bg-accent' : 'bg-surface-sunken',
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
