import { ChevronRight, Check } from 'lucide-react'
import { cn } from '../../lib/cn'

/**
 * ListItem — linha de lista do app (exercício, aula, item de treino).
 * - media: ReactNode (thumb/ícone) à esquerda
 * - title, subtitle
 * - meta: texto à direita (ex. "4×12")
 * - done: marca como concluído (check sálvia)
 * - trailing: ReactNode custom à direita (sobrescreve chevron)
 * - onClick: torna a linha interativa
 */
export function ListItem({
  media,
  title,
  subtitle,
  meta,
  done = false,
  trailing,
  onClick,
  className,
  ...props
}) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl bg-surface border border-subtle p-3 text-left',
        onClick && 'transition-colors duration-fast hover:bg-surface-sunken focus-visible:shadow-focus focus-visible:outline-none',
        className,
      )}
      {...props}
    >
      {media && (
        <span className="grid place-items-center size-12 shrink-0 overflow-hidden rounded-xl bg-surface-sunken text-content-secondary">
          {media}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-body-sm font-semibold text-content">{title}</span>
        {subtitle && <span className="truncate text-caption">{subtitle}</span>}
      </span>
      {meta && <span className="text-caption tabular-nums shrink-0">{meta}</span>}
      {trailing ??
        (done ? (
          <span className="grid place-items-center size-7 rounded-full bg-accent text-accent-on shrink-0">
            <Check className="size-4" strokeWidth={2.5} aria-hidden />
          </span>
        ) : onClick ? (
          <ChevronRight className="size-5 text-content-subtle shrink-0" strokeWidth={1.5} aria-hidden />
        ) : null)}
    </Comp>
  )
}
