import { forwardRef } from 'react'
import { cn } from '@/lib/cn'

type Category = 'steel' | 'sand' | 'success' | 'danger' | 'warning'

const categoryBar: Record<Category, string> = {
  steel: 'bg-steel-500',
  sand: 'bg-sand-300',
  success: 'bg-ok',
  danger: 'bg-err',
  warning: 'bg-warn',
}

export interface AgendaRowProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Dia (ex.: "18") — bloco de data. */
  day: string
  /** Mês curto (ex.: "JUN"). */
  month: string
  /** Janela de horário (ex.: "14:30 – 15:00"). */
  time?: string
  title: React.ReactNode
  /** Linha de metadados (local, participantes). */
  meta?: React.ReactNode
  category?: Category
  /** Conteúdo à direita (avatares, badge). */
  trailing?: React.ReactNode
  interactive?: boolean
}

/**
 * AgendaRow / CalendarEventItem — bloco de data + barra de categoria colorida
 * à esquerda, horário, título e metadados.
 */
export const AgendaRow = forwardRef<HTMLDivElement, AgendaRowProps>(
  (
    { className, day, month, time, title, meta, category = 'steel', trailing, interactive, ...props },
    ref,
  ) => (
    <div
      ref={ref}
      tabIndex={interactive ? 0 : undefined}
      className={cn(
        'flex items-stretch gap-3 rounded-lg border border-line bg-slate-900 p-3',
        interactive &&
          'cursor-pointer transition-[border-color,background-color] duration-fast hover:border-strong hover:bg-slate-800 focus-visible:outline-none focus-visible:shadow-focus',
        className,
      )}
      {...props}
    >
      {/* barra de categoria */}
      <span className={cn('w-1 shrink-0 rounded-full', categoryBar[category])} aria-hidden />

      {/* bloco de data */}
      <div className="flex w-12 shrink-0 flex-col items-center justify-center rounded-md bg-slate-800 py-1.5">
        <span className="font-display text-h3 font-semibold leading-none text-strong tabular-nums">
          {day}
        </span>
        <span className="mt-0.5 font-mono text-mono-label uppercase text-muted">{month}</span>
      </div>

      {/* corpo */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
        {time && (
          <span className="font-mono text-mono-data text-steel-300 tabular-nums">{time}</span>
        )}
        <span className="truncate text-body font-medium text-strong">{title}</span>
        {meta && <span className="truncate text-body-s text-muted">{meta}</span>}
      </div>

      {trailing && <div className="flex shrink-0 items-center">{trailing}</div>}
    </div>
  ),
)
AgendaRow.displayName = 'AgendaRow'
