import { createContext, useContext, useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'

/* ----------------------------------------------------------------------------
   Accordion — seções expansíveis. Modos single (uma por vez, opcionalmente
   colapsável) e multiple. Controlado ou não. Acessível: botão com
   aria-expanded controlando uma região.
---------------------------------------------------------------------------- */

interface AccordionCtx {
  isOpen: (value: string) => boolean
  toggle: (value: string) => void
  baseId: string
}
const Context = createContext<AccordionCtx | null>(null)
function useAccordion() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('Accordion.* deve ser usado dentro de <Accordion>')
  return ctx
}

const ItemContext = createContext<string>('')

type SingleProps = {
  type?: 'single'
  /** Permite fechar a seção aberta clicando nela de novo. */
  collapsible?: boolean
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}
type MultipleProps = {
  type: 'multiple'
  collapsible?: never
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
}

export type AccordionProps = (SingleProps | MultipleProps) & {
  className?: string
  children: React.ReactNode
}

export function Accordion(props: AccordionProps) {
  const { className, children } = props
  const multiple = props.type === 'multiple'
  const baseId = useId()

  const [internal, setInternal] = useState<string[]>(() => {
    if (props.defaultValue == null) return []
    return Array.isArray(props.defaultValue) ? props.defaultValue : [props.defaultValue]
  })

  const controlled = props.value != null
  const openList = controlled
    ? Array.isArray(props.value)
      ? props.value
      : props.value
        ? [props.value]
        : []
    : internal

  const isOpen = (value: string) => openList.includes(value)

  const toggle = (value: string) => {
    let next: string[]
    if (multiple) {
      next = openList.includes(value) ? openList.filter((v) => v !== value) : [...openList, value]
    } else {
      const isCurrentlyOpen = openList.includes(value)
      const collapsible = (props as SingleProps).collapsible
      next = isCurrentlyOpen ? (collapsible ? [] : openList) : [value]
    }
    if (!controlled) setInternal(next)
    if (multiple) (props as MultipleProps).onValueChange?.(next)
    else (props as SingleProps).onValueChange?.(next[0] ?? '')
  }

  return (
    <Context.Provider value={{ isOpen, toggle, baseId }}>
      <div className={cn('flex flex-col divide-y divide-subtle overflow-hidden rounded-lg border border-line bg-slate-900', className)}>
        {children}
      </div>
    </Context.Provider>
  )
}

export function AccordionItem({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  return (
    <ItemContext.Provider value={value}>
      <div className={className}>{children}</div>
    </ItemContext.Provider>
  )
}

export function AccordionTrigger({ className, children }: { className?: string; children: React.ReactNode }) {
  const { isOpen, toggle, baseId } = useAccordion()
  const value = useContext(ItemContext)
  const open = isOpen(value)
  return (
    <h3 className="flex">
      <button
        type="button"
        id={`${baseId}-trigger-${value}`}
        aria-expanded={open}
        aria-controls={`${baseId}-panel-${value}`}
        onClick={() => toggle(value)}
        className={cn(
          'group flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-body font-medium text-strong transition-colors duration-fast hover:bg-slate-800 focus-visible:outline-none focus-visible:shadow-focus',
          className,
        )}
      >
        {children}
        <ChevronDown
          size={18}
          strokeWidth={1.5}
          aria-hidden
          className={cn('shrink-0 text-muted transition-transform duration-fast', open && 'rotate-180 text-steel-300')}
        />
      </button>
    </h3>
  )
}

export function AccordionContent({ className, children }: { className?: string; children: React.ReactNode }) {
  const { isOpen, baseId } = useAccordion()
  const value = useContext(ItemContext)
  const open = isOpen(value)
  return (
    <div
      id={`${baseId}-panel-${value}`}
      role="region"
      aria-labelledby={`${baseId}-trigger-${value}`}
      hidden={!open}
      className={cn('px-5 pb-5 pt-0 text-body-s text-muted', className)}
    >
      {children}
    </div>
  )
}
