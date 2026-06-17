import { cn } from '../../lib/cn'

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

/**
 * CalendarStrip — faixa horizontal de dias (seletor de data do app).
 * Reproduz o strip de datas: chip circular, selecionado com aro/dourado,
 * dia "hoje" marcado.
 *
 * - days: [{ date: number, weekday?: 0–6, done?: bool }]
 * - selected: índice selecionado
 * - todayIndex: índice do dia atual
 * - onSelect(index)
 */
export function CalendarStrip({ days = [], selected = 0, todayIndex, onSelect, className, ...props }) {
  return (
    <div
      className={cn('flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', className)}
      role="tablist"
      {...props}
    >
      {days.map((d, i) => {
        const isSel = i === selected
        const isToday = i === todayIndex
        return (
          <button
            key={i}
            role="tab"
            aria-selected={isSel}
            onClick={() => onSelect?.(i)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 shrink-0',
              'w-11 h-16 rounded-full border transition-all duration-base ease-standard',
              'focus-visible:shadow-focus focus-visible:outline-none',
              isSel
                ? 'bg-accent-2 border-accent-2 text-accent-2-on shadow-sm'
                : isToday
                  ? 'bg-surface border-accent-2 text-content'
                  : 'bg-surface border-subtle text-content-muted hover:border-strong',
            )}
          >
            <span className="text-2xs font-medium uppercase tracking-wide opacity-80">
              {WEEKDAYS[d.weekday ?? i % 7]}
            </span>
            <span className="text-body-sm font-semibold tabular-nums">{d.date}</span>
            {d.done && <span className={cn('size-1 rounded-full', isSel ? 'bg-accent-2-on' : 'bg-accent')} />}
          </button>
        )
      })}
    </div>
  )
}
