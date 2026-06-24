import { createContext, useContext, useId, useRef } from 'react'
import { cn } from '@/lib/cn'

interface TabsCtx {
  value: string
  setValue: (v: string) => void
  variant: 'underline' | 'segmented'
  baseId: string
}
const TabsContext = createContext<TabsCtx | null>(null)

function useTabs() {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('Tabs.* deve ser usado dentro de <Tabs>')
  return ctx
}

export interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value: string
  onValueChange: (value: string) => void
  variant?: 'underline' | 'segmented'
}

/**
 * Tabs — controlado. Variantes underline (linha guia) e segmented (cápsula).
 * Navegação por setas e roles aria corretos.
 */
export function Tabs({ value, onValueChange, variant = 'underline', className, children, ...props }: TabsProps) {
  const baseId = useId()
  return (
    <TabsContext.Provider value={{ value, setValue: onValueChange, variant, baseId }}>
      <div className={cn('flex flex-col gap-4', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export interface TabListProps extends React.HTMLAttributes<HTMLDivElement> {
  'aria-label': string
}

export function TabList({ className, children, ...props }: TabListProps) {
  const { variant } = useTabs()
  const ref = useRef<HTMLDivElement>(null)

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return
    const tabs = Array.from(ref.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [])
    const current = tabs.findIndex((t) => t === document.activeElement)
    e.preventDefault()
    let next = current
    if (e.key === 'ArrowRight') next = (current + 1) % tabs.length
    else if (e.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = tabs.length - 1
    tabs[next]?.focus()
    tabs[next]?.click()
  }

  return (
    <div
      ref={ref}
      role="tablist"
      onKeyDown={onKeyDown}
      className={cn(
        variant === 'underline'
          ? 'flex items-center gap-1 border-b border-line'
          : 'inline-flex items-center gap-1 rounded-md border border-line bg-slate-900 p-1',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export interface TabProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
  value: string
  badge?: React.ReactNode
}

export function Tab({ value, badge, className, children, ...props }: TabProps) {
  const { value: active, setValue, variant, baseId } = useTabs()
  const selected = active === value
  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-selected={selected}
      aria-controls={`${baseId}-panel-${value}`}
      tabIndex={selected ? 0 : -1}
      onClick={() => setValue(value)}
      className={cn(
        'inline-flex items-center gap-2 text-body-s font-medium transition-[color,background-color,border-color] duration-fast focus-visible:outline-none focus-visible:shadow-focus',
        variant === 'underline'
          ? cn(
              '-mb-px border-b-2 px-1 py-2.5',
              selected
                ? 'border-steel-500 text-strong'
                : 'border-transparent text-muted hover:text-strong',
            )
          : cn(
              'rounded-sm px-3 py-1.5',
              selected ? 'bg-slate-700 text-strong shadow-e1' : 'text-muted hover:text-strong',
            ),
        className,
      )}
      {...props}
    >
      {children}
      {badge}
    </button>
  )
}

export interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

export function TabPanel({ value, className, children, ...props }: TabPanelProps) {
  const { value: active, baseId } = useTabs()
  if (active !== value) return null
  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      tabIndex={0}
      className={cn('focus-visible:outline-none', className)}
      {...props}
    >
      {children}
    </div>
  )
}
