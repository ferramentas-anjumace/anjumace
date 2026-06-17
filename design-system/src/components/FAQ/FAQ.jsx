import { useState, useId } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '../../lib/cn'

/**
 * FAQItem — pergunta + resposta expansível, com nó de timeline à esquerda
 * (reproduz o padrão de FAQ do material). Acessível (button + region).
 */
function FAQItem({ question, answer, icon, isLast, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()

  return (
    <div className="relative pl-10">
      {/* Timeline: linha + nó */}
      <span
        className={cn('absolute left-[7px] top-7 bottom-0 w-px bg-border', isLast && 'hidden')}
        aria-hidden
      />
      <span
        className={cn(
          'absolute left-0 top-5 grid place-items-center size-4 rounded-full border transition-colors duration-base',
          open ? 'border-accent bg-accent' : 'border-strong bg-surface',
        )}
        aria-hidden
      />

      <div className="border-b border-subtle">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-4 py-5 text-left focus-visible:outline-none focus-visible:shadow-focus rounded-sm"
        >
          <span className="flex items-center gap-3">
            <span className="text-body font-semibold text-content">{question}</span>
          </span>
          <span className="flex items-center gap-3">
            {icon && <span className="text-content-subtle hidden md:block">{icon}</span>}
            <Plus
              className={cn(
                'size-5 shrink-0 text-content-muted transition-transform duration-moderate ease-standard',
                open && 'rotate-45',
              )}
              strokeWidth={1.5}
              aria-hidden
            />
          </span>
        </button>
        <div
          id={id}
          role="region"
          className={cn(
            'grid transition-all duration-moderate ease-standard',
            open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
          )}
        >
          <div className="overflow-hidden">
            <p className="pb-6 pr-8 text-body text-content-muted leading-relaxed">{answer}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * FAQ — lista de perguntas frequentes (timeline).
 * - items: [{ question, answer, icon? }]
 * - defaultOpenIndex: índice inicialmente aberto (ou null)
 */
export function FAQ({ items = [], defaultOpenIndex = 0, className, ...props }) {
  return (
    <div className={cn('flex flex-col', className)} {...props}>
      {items.map((it, i) => (
        <FAQItem
          key={i}
          question={it.question}
          answer={it.answer}
          icon={it.icon}
          isLast={i === items.length - 1}
          defaultOpen={i === defaultOpenIndex}
        />
      ))}
    </div>
  )
}
