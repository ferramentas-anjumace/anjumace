import { useId, useState, useRef, useEffect, cloneElement, isValidElement } from 'react'
import { cn } from '@/lib/cn'

export interface DropdownMenuProps {
  /** Elemento gatilho (botão). Recebe os handlers de abertura. */
  trigger: React.ReactElement
  align?: 'start' | 'end'
  children: React.ReactNode
  className?: string
}

/**
 * DropdownMenu / Menu — menu acionado por um gatilho. Fecha ao clicar fora,
 * Escape ou selecionar item. Navegação por setas entre itens (role=menu).
 */
export function DropdownMenu({ trigger, align = 'start', children, className }: DropdownMenuProps) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

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
    // foca primeiro item
    const first = menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')
    first?.focus()
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
    const idx = items.findIndex((el) => el === document.activeElement)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      items[(idx + 1) % items.length]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      items[(idx - 1 + items.length) % items.length]?.focus()
    }
  }

  const triggerEl = isValidElement(trigger)
    ? cloneElement(trigger as React.ReactElement<Record<string, unknown>>, {
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        onClick: () => setOpen((v) => !v),
      })
    : trigger

  return (
    <div ref={rootRef} className="relative inline-flex">
      {triggerEl}
      {open && (
        <div
          ref={menuRef}
          role="menu"
          id={id}
          onKeyDown={onMenuKeyDown}
          onClick={() => setOpen(false)}
          className={cn(
            'absolute top-full z-dropdown mt-1.5 min-w-48 overflow-hidden rounded-md border border-strong bg-slate-700 p-1 shadow-e2 animate-slide-up',
            align === 'end' ? 'right-0' : 'left-0',
            className,
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export interface MenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode
  /** Estilo destrutivo. */
  destructive?: boolean
  /** Atalho exibido à direita (em mono). */
  shortcut?: string
}

export function MenuItem({ className, icon, destructive, shortcut, children, ...props }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-left text-body-s transition-colors focus-visible:outline-none',
        destructive
          ? 'text-err hover:bg-err-tint focus-visible:bg-err-tint'
          : 'text-fg hover:bg-slate-600 hover:text-strong focus-visible:bg-slate-600 focus-visible:text-strong',
        'disabled:pointer-events-none disabled:opacity-40',
        className,
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="flex-1">{children}</span>
      {shortcut && <span className="font-mono text-[11px] text-faint">{shortcut}</span>}
    </button>
  )
}

export function MenuLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2.5 pb-1 pt-2 font-mono text-mono-label uppercase text-faint">{children}</div>
  )
}

export function MenuSeparator() {
  return <div role="separator" className="my-1 h-px bg-[var(--line)]" />
}
