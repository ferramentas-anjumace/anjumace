import { Fragment } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface Crumb {
  label: React.ReactNode
  href?: string
  onClick?: () => void
}

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: Crumb[]
}

/**
 * Breadcrumb — trilha de navegação. O último item é a página atual
 * (aria-current). Separador em hairline com chevron.
 */
export function Breadcrumb({ items, className, ...props }: BreadcrumbProps) {
  return (
    <nav aria-label="Trilha de navegação" className={cn('flex items-center', className)} {...props}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <Fragment key={i}>
              <li className="flex items-center">
                {isLast ? (
                  <span aria-current="page" className="text-body-s font-medium text-strong">
                    {item.label}
                  </span>
                ) : item.href || item.onClick ? (
                  <a
                    href={item.href}
                    onClick={item.onClick}
                    className="rounded-xs text-body-s text-muted transition-colors hover:text-strong focus-visible:outline-none focus-visible:shadow-focus"
                  >
                    {item.label}
                  </a>
                ) : (
                  <span className="text-body-s text-muted">{item.label}</span>
                )}
              </li>
              {!isLast && (
                <ChevronRight size={14} strokeWidth={1.5} className="text-faint" aria-hidden />
              )}
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
