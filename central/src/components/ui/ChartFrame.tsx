import { forwardRef } from 'react'
import { cn } from '@/lib/cn'

export interface ChartFrameProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode
  /** Rótulo em mono no topo (eyebrow). */
  eyebrow?: React.ReactNode
  actions?: React.ReactNode
  /** Altura da área de plotagem. */
  height?: number
  /** Rótulos do eixo Y (de cima para baixo). */
  yTicks?: string[]
  /** Rótulos do eixo X (esquerda para direita). */
  xTicks?: string[]
}

/**
 * ChartFrame — apenas o contêiner e os tokens de eixo para gráficos. O
 * gráfico real (linha/barra) entra como children numa etapa futura.
 */
export const ChartFrame = forwardRef<HTMLDivElement, ChartFrameProps>(
  ({ className, title, eyebrow, actions, height = 200, yTicks, xTicks, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-lg border border-line bg-slate-900 p-5', className)}
      {...props}
    >
      {(title || eyebrow || actions) && (
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            {eyebrow && (
              <div className="mb-1 font-mono text-mono-label uppercase text-steel-400">
                {eyebrow}
              </div>
            )}
            {title && (
              <h3 className="font-display text-h3 font-semibold text-strong">{title}</h3>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      <div className="flex gap-3">
        {/* Eixo Y */}
        {yTicks && yTicks.length > 0 && (
          <div
            className="flex flex-col justify-between py-1 text-right font-mono text-[11px] text-faint tabular-nums"
            style={{ height }}
          >
            {yTicks.map((t, i) => (
              <span key={i}>{t}</span>
            ))}
          </div>
        )}

        {/* Área de plotagem com grade em hairlines */}
        <div className="min-w-0 flex-1">
          <div
            className="relative w-full overflow-hidden rounded-md border border-subtle bg-ink-deep/40"
            style={{ height }}
          >
            {/* linhas de grade horizontais */}
            <div className="absolute inset-0 flex flex-col justify-between">
              {Array.from({ length: 4 }).map((_, i) => (
                <span key={i} className="h-px w-full bg-[var(--line-subtle)]" />
              ))}
            </div>
            {children ?? (
              <div className="absolute inset-0 grid place-items-center">
                <span className="font-mono text-mono-label uppercase text-faint">
                  área do gráfico
                </span>
              </div>
            )}
          </div>

          {/* Eixo X */}
          {xTicks && xTicks.length > 0 && (
            <div className="mt-2 flex justify-between font-mono text-[11px] text-faint tabular-nums">
              {xTicks.map((t, i) => (
                <span key={i}>{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  ),
)
ChartFrame.displayName = 'ChartFrame'
