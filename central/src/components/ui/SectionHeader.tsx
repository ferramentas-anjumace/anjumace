import { forwardRef } from 'react'
import { cn } from '@/lib/cn'

export interface SectionHeaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Eyebrow em mono uppercase, acima do título. */
  eyebrow?: React.ReactNode
  /** Título da seção (display / Host Grotesk). */
  title: React.ReactNode
  /** Descrição opcional abaixo do título. */
  description?: React.ReactNode
  /** Ações à direita (botões, filtros). */
  actions?: React.ReactNode
}

/**
 * Cabeçalho de seção — eyebrow em mono + título em display. Slot de ações
 * alinhado à direita.
 */
export const SectionHeader = forwardRef<HTMLDivElement, SectionHeaderProps>(
  ({ className, eyebrow, title, description, actions, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-start justify-between gap-4', className)}
        {...props}
      >
        <div className="min-w-0">
          {eyebrow && (
            <div className="mb-2 font-mono text-mono-label uppercase text-steel-400">
              {eyebrow}
            </div>
          )}
          <h2 className="font-display text-h2 font-semibold text-strong">{title}</h2>
          {description && (
            <p className="mt-1.5 text-body-s text-muted max-w-prose">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    )
  },
)
SectionHeader.displayName = 'SectionHeader'
