import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'

/* ----------------------------------------------------------------------------
   Stepper — progresso por etapas. Orientação horizontal (padrão) ou vertical.
   Status derivado de `current`: concluída (< current), ativa (=== current),
   pendente (> current). Etapas concluídas podem ser clicáveis.
---------------------------------------------------------------------------- */

export interface Step {
  label: React.ReactNode
  description?: React.ReactNode
}

export interface StepperProps {
  steps: Step[]
  /** Índice (base 0) da etapa ativa. */
  current: number
  orientation?: 'horizontal' | 'vertical'
  /** Callback ao clicar numa etapa já concluída. */
  onStepClick?: (index: number) => void
  className?: string
}

type Status = 'complete' | 'active' | 'upcoming'

function Bullet({ status, index }: { status: Status; index: number }) {
  return (
    <span
      className={cn(
        'grid size-7 shrink-0 place-items-center rounded-full border font-mono text-mono-data tabular-nums transition-colors duration-fast',
        status === 'complete' && 'border-steel-500 bg-steel-500 text-accent-fg',
        status === 'active' && 'border-steel-500 bg-steel-tint text-steel-300 shadow-active',
        status === 'upcoming' && 'border-strong bg-slate-900 text-faint',
      )}
    >
      {status === 'complete' ? <Check size={15} strokeWidth={2.5} aria-hidden /> : index + 1}
    </span>
  )
}

function Labels({ step, status }: { step: Step; status: Status }) {
  return (
    <span className="flex flex-col gap-0.5 leading-tight">
      <span
        className={cn(
          'text-body-s font-medium',
          status === 'upcoming' ? 'text-muted' : 'text-strong',
        )}
      >
        {step.label}
      </span>
      {step.description && <span className="text-body-s text-faint">{step.description}</span>}
    </span>
  )
}

export function Stepper({
  steps,
  current,
  orientation = 'horizontal',
  onStepClick,
  className,
}: StepperProps) {
  const statusOf = (i: number): Status =>
    i < current ? 'complete' : i === current ? 'active' : 'upcoming'

  if (orientation === 'vertical') {
    return (
      <ol className={cn('flex flex-col', className)}>
        {steps.map((step, i) => {
          const status = statusOf(i)
          const clickable = status === 'complete' && onStepClick
          const last = i === steps.length - 1
          return (
            <li key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <Bullet status={status} index={i} />
                {!last && (
                  <span
                    className={cn(
                      'my-1 w-px flex-1',
                      i < current ? 'bg-steel-500' : 'bg-[var(--line-strong)]',
                    )}
                    aria-hidden
                  />
                )}
              </div>
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepClick?.(i)}
                aria-current={status === 'active' ? 'step' : undefined}
                className={cn(
                  'pb-6 pt-0.5 text-left disabled:cursor-default',
                  clickable && 'rounded-sm focus-visible:outline-none focus-visible:shadow-focus',
                )}
              >
                <Labels step={step} status={status} />
              </button>
            </li>
          )
        })}
      </ol>
    )
  }

  return (
    <ol className={cn('flex items-start', className)}>
      {steps.map((step, i) => {
        const status = statusOf(i)
        const clickable = status === 'complete' && onStepClick
        const last = i === steps.length - 1
        return (
          <li key={i} className={cn('flex items-start gap-3', !last && 'flex-1')}>
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick?.(i)}
              aria-current={status === 'active' ? 'step' : undefined}
              className={cn(
                'flex shrink-0 items-center gap-3 disabled:cursor-default',
                clickable && 'rounded-sm focus-visible:outline-none focus-visible:shadow-focus',
              )}
            >
              <Bullet status={status} index={i} />
              <Labels step={step} status={status} />
            </button>
            {!last && (
              <span
                className={cn(
                  'mt-3.5 h-px flex-1',
                  i < current ? 'bg-steel-500' : 'bg-[var(--line-strong)]',
                )}
                aria-hidden
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
