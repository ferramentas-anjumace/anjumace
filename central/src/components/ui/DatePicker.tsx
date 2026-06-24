import { useEffect, useId, useRef, useState } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { FieldShell, fieldIds, controlClasses } from './Field'

/* ----------------------------------------------------------------------------
   DatePicker + Calendar — sem dependências externas. Nomes de mês/dia em pt-BR
   via Intl. Semana começa no domingo. Teclado no calendário: setas movem o dia
   focado, Enter/Espaço selecionam, PageUp/PageDown trocam de mês.
---------------------------------------------------------------------------- */

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

const monthFmt = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
const fullFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}
function isSameDay(a: Date | null, b: Date | null) {
  return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}
function addDays(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
}

/** Matriz 6×7 de dias cobrindo o mês de `view` (com sobras dos vizinhos). */
function buildGrid(view: Date) {
  const first = new Date(view.getFullYear(), view.getMonth(), 1)
  const start = addDays(first, -first.getDay()) // recua até domingo
  return Array.from({ length: 42 }, (_, i) => addDays(start, i))
}

export interface CalendarProps {
  value: Date | null
  onSelect: (date: Date) => void
  className?: string
}

export function Calendar({ value, onSelect, className }: CalendarProps) {
  const today = startOfDay(new Date())
  const [view, setView] = useState<Date>(() => (value ? new Date(value.getFullYear(), value.getMonth(), 1) : addMonths(today, 0)))
  const [focus, setFocus] = useState<Date>(() => value ?? today)
  const gridRef = useRef<HTMLDivElement>(null)
  const days = buildGrid(view)

  // Foca o botão do dia em foco após mudanças.
  useEffect(() => {
    const key = focus.toISOString().slice(0, 10)
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${key}"]`)?.focus()
  }, [focus, view])

  function moveFocus(next: Date) {
    setFocus(next)
    if (next.getMonth() !== view.getMonth() || next.getFullYear() !== view.getFullYear()) {
      setView(new Date(next.getFullYear(), next.getMonth(), 1))
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault(); moveFocus(addDays(focus, -1)); break
      case 'ArrowRight':
        e.preventDefault(); moveFocus(addDays(focus, 1)); break
      case 'ArrowUp':
        e.preventDefault(); moveFocus(addDays(focus, -7)); break
      case 'ArrowDown':
        e.preventDefault(); moveFocus(addDays(focus, 7)); break
      case 'PageUp':
        e.preventDefault(); moveFocus(addMonths(focus, -1)); break
      case 'PageDown':
        e.preventDefault(); moveFocus(addMonths(focus, 1)); break
      case 'Enter':
      case ' ':
        e.preventDefault(); onSelect(startOfDay(focus)); break
    }
  }

  const monthLabel = monthFmt.format(view)

  return (
    <div className={cn('w-64 select-none p-3', className)}>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          aria-label="Mês anterior"
          onClick={() => setView(addMonths(view, -1))}
          className="grid size-7 place-items-center rounded-sm text-muted transition-colors hover:bg-slate-600 hover:text-strong focus-visible:outline-none focus-visible:shadow-focus"
        >
          <ChevronLeft size={16} strokeWidth={1.5} aria-hidden />
        </button>
        <span className="font-display text-body-s font-semibold capitalize text-strong">{monthLabel}</span>
        <button
          type="button"
          aria-label="Próximo mês"
          onClick={() => setView(addMonths(view, 1))}
          className="grid size-7 place-items-center rounded-sm text-muted transition-colors hover:bg-slate-600 hover:text-strong focus-visible:outline-none focus-visible:shadow-focus"
        >
          <ChevronRight size={16} strokeWidth={1.5} aria-hidden />
        </button>
      </div>

      <div className="grid grid-cols-7" role="rowgroup" aria-hidden>
        {WEEKDAYS.map((w) => (
          <div key={w} className="grid h-7 place-items-center font-mono text-[11px] uppercase text-faint">
            {w}
          </div>
        ))}
      </div>

      <div ref={gridRef} className="grid grid-cols-7" role="grid" aria-label={monthLabel} onKeyDown={onKeyDown}>
        {days.map((d) => {
          const key = d.toISOString().slice(0, 10)
          const inMonth = d.getMonth() === view.getMonth()
          const selected = isSameDay(d, value)
          const isToday = isSameDay(d, today)
          const isFocus = isSameDay(d, focus)
          return (
            <button
              key={key}
              type="button"
              data-day={key}
              role="gridcell"
              aria-selected={selected}
              tabIndex={isFocus ? 0 : -1}
              onClick={() => onSelect(startOfDay(d))}
              className={cn(
                'relative grid size-9 place-items-center rounded-sm font-mono text-mono-data tabular-nums transition-colors focus-visible:outline-none focus-visible:shadow-focus',
                !inMonth && 'text-faint',
                inMonth && !selected && 'text-fg hover:bg-slate-600 hover:text-strong',
                selected && 'bg-steel-500 text-accent-fg',
                isToday && !selected && 'text-steel-300',
              )}
            >
              {d.getDate()}
              {isToday && !selected && (
                <span className="absolute bottom-1 size-1 rounded-full bg-steel-400" aria-hidden />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export interface DatePickerProps {
  value: Date | null
  onChange: (date: Date | null) => void
  label?: React.ReactNode
  helperText?: React.ReactNode
  error?: React.ReactNode
  optional?: boolean
  placeholder?: string
  disabled?: boolean
  id?: string
  className?: string
}

/**
 * DatePicker — gatilho estilizado como input que abre um Calendar em popover.
 * Fecha ao selecionar, Escape ou clique fora.
 */
export function DatePicker({
  value,
  onChange,
  label,
  helperText,
  error,
  optional,
  placeholder = 'dd/mm/aaaa',
  disabled,
  id,
  className,
}: DatePickerProps) {
  const reactId = useId()
  const fieldId = id ?? reactId
  const { helperId, errorId } = fieldIds(fieldId)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <FieldShell
      id={fieldId}
      label={label}
      helperText={helperText}
      error={error}
      optional={optional}
      className={className}
    >
      <div ref={rootRef} className="relative">
        <button
          type="button"
          id={fieldId}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          onClick={() => setOpen((v) => !v)}
          className={cn(controlClasses(!!error, 'flex h-10 items-center justify-between gap-2 pl-3 pr-3 text-left'))}
        >
          <span className={cn(value ? 'text-strong' : 'text-faint')}>
            {value ? fullFmt.format(value) : placeholder}
          </span>
          <CalendarIcon size={18} strokeWidth={1.5} className="shrink-0 text-muted" aria-hidden />
        </button>

        {open && (
          <div
            role="dialog"
            aria-label="Escolher data"
            className="absolute z-popover mt-1.5 rounded-md border border-strong bg-slate-700 shadow-e2 animate-slide-up"
          >
            <Calendar
              value={value}
              onSelect={(d) => {
                onChange(d)
                setOpen(false)
              }}
            />
          </div>
        )}
      </div>
    </FieldShell>
  )
}
