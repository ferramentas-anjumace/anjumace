import { forwardRef } from 'react'
import { cn } from '@/lib/cn'

/**
 * Sidebar — casca de navegação lateral sobre o poço (ink-deep). Composta por
 * Sidebar, SidebarGroup (label em mono) e SidebarItem (ícone + label + badge,
 * com indicador à esquerda no estado ativo).
 */
export const Sidebar = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, children, ...props }, ref) => (
    <nav
      ref={ref}
      aria-label="Navegação principal"
      className={cn(
        'flex h-full w-60 shrink-0 flex-col gap-6 overflow-y-auto border-r border-line bg-ink-deep p-3',
        className,
      )}
      {...props}
    >
      {children}
    </nav>
  ),
)
Sidebar.displayName = 'Sidebar'

export interface SidebarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: React.ReactNode
}

export function SidebarGroup({ label, className, children, ...props }: SidebarGroupProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)} {...props}>
      {label && (
        <div className="px-2 pb-1 font-mono text-mono-label uppercase text-faint">{label}</div>
      )}
      {children}
    </div>
  )
}

export interface SidebarItemProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  icon?: React.ReactNode
  active?: boolean
  /** Contador/badge à direita (ex.: nº de itens). */
  badge?: React.ReactNode
}

export const SidebarItem = forwardRef<HTMLAnchorElement, SidebarItemProps>(
  ({ className, icon, active, badge, children, ...props }, ref) => (
    <a
      ref={ref}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative flex items-center gap-2.5 rounded-md px-2 py-2 text-body-s transition-colors duration-fast focus-visible:outline-none focus-visible:shadow-focus',
        active
          ? 'bg-steel-tint text-strong'
          : 'text-muted hover:bg-slate-800 hover:text-strong',
        className,
      )}
      {...props}
    >
      {/* indicador à esquerda no ativo */}
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-steel-500" aria-hidden />
      )}
      {icon && (
        <span className={cn('shrink-0', active ? 'text-steel-300' : 'text-muted group-hover:text-strong')}>
          {icon}
        </span>
      )}
      <span className="flex-1 truncate">{children}</span>
      {badge != null && (
        <span className="shrink-0 font-mono text-mono-data text-faint tabular-nums">{badge}</span>
      )}
    </a>
  ),
)
SidebarItem.displayName = 'SidebarItem'
