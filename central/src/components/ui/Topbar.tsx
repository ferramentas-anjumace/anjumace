import { forwardRef } from 'react'
import { cn } from '@/lib/cn'

/**
 * Topbar — barra superior do app. Slots: leading (logo/breadcrumb), um centro
 * flexível (tipicamente a busca) e trailing (ações, tema, menu de usuário).
 */
export interface TopbarProps extends React.HTMLAttributes<HTMLElement> {
  leading?: React.ReactNode
  center?: React.ReactNode
  trailing?: React.ReactNode
}

export const Topbar = forwardRef<HTMLElement, TopbarProps>(
  ({ className, leading, center, trailing, children, ...props }, ref) => (
    <header
      ref={ref}
      className={cn(
        'flex h-14 items-center gap-4 border-b border-line bg-ink/80 px-4 backdrop-blur',
        className,
      )}
      {...props}
    >
      {leading && <div className="flex shrink-0 items-center gap-3">{leading}</div>}
      {center && <div className="flex min-w-0 flex-1 items-center">{center}</div>}
      {!center && <div className="flex-1" />}
      {trailing && <div className="flex shrink-0 items-center gap-2">{trailing}</div>}
      {children}
    </header>
  ),
)
Topbar.displayName = 'Topbar'

/** Placeholder de alternância de tema — o theming real vem depois. */
export const ThemeTogglePlaceholder = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    aria-label="Alternar tema (em breve)"
    title="Tema — em breve"
    className={cn(
      'grid size-9 place-items-center rounded-md text-muted transition-colors hover:bg-slate-800 hover:text-strong focus-visible:outline-none focus-visible:shadow-focus',
      className,
    )}
    {...props}
  />
))
ThemeTogglePlaceholder.displayName = 'ThemeTogglePlaceholder'
