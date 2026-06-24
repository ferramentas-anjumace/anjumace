import { forwardRef } from 'react'
import { cn } from '@/lib/cn'

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Ícone (lucide) — renderizado em um disco sutil. */
  icon?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  /** Ação principal — orienta o próximo passo, sem tom de desculpa. */
  action?: React.ReactNode
}

/**
 * EmptyState — ocupa o vazio orientando a próxima ação. Ícone, título,
 * descrição e ação.
 */
export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-strong bg-slate-900/40 px-6 py-12 text-center',
        className,
      )}
      {...props}
    >
      {icon && (
        <div className="grid size-12 place-items-center rounded-full bg-slate-800 text-steel-400">
          {icon}
        </div>
      )}
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-h3 font-semibold text-strong">{title}</h3>
        {description && (
          <p className="mx-auto max-w-sm text-body-s text-muted">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  ),
)
EmptyState.displayName = 'EmptyState'
