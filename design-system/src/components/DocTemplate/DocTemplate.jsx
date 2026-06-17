import { cn } from '../../lib/cn'
import { Wordmark } from '../Brand/Wordmark'

/**
 * DocPage — folha de documento A4 (proporção 595×842) com cabeçalho de marca
 * e rodapé. Base para checklists, ebooks, receitas, infográficos.
 *
 * - title: título à direita do header (ex. "Morning Fitness Checklist")
 * - footer: texto/nó do rodapé
 * - tone: 'cream' | 'surface'
 */
export function DocPage({ title, footer, tone = 'cream', className, children, ...props }) {
  const bg = tone === 'cream' ? 'bg-cream-100 text-graphite-800' : 'bg-surface text-content'
  return (
    <div
      className={cn('flex aspect-[595/842] w-full flex-col rounded-xl border border-subtle p-8 shadow-md', bg, className)}
      {...props}
    >
      <header className="flex items-center justify-between border-b border-graphite-800/15 pb-4">
        <Wordmark size="sm" />
        {title && <span className="text-body-sm text-graphite-500">{title}</span>}
      </header>
      <div className="flex-1 py-6">{children}</div>
      {footer && (
        <footer className="border-t border-dashed border-graphite-800/20 pt-3 text-center text-2xs text-graphite-500">
          {footer}
        </footer>
      )}
    </div>
  )
}

/**
 * ChecklistTemplate — template de checklist (ex. rotina matinal).
 * - intro: parágrafo de abertura
 * - items: [{ label, description }]
 */
export function ChecklistTemplate({ title = 'Checklist', intro, items = [], footer, className }) {
  return (
    <DocPage title={title} footer={footer} className={className}>
      {intro && <p className="text-body-sm text-graphite-600 leading-relaxed mb-6">{intro}</p>}
      <ul className="flex flex-col gap-5">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="mt-0.5 size-5 shrink-0 rounded-[5px] border border-graphite-800/40" aria-hidden />
            <span className="flex flex-col">
              <span className="font-display text-base font-bold uppercase tracking-wide text-graphite-800">{it.label}</span>
              {it.description && <span className="text-xs text-graphite-500 leading-relaxed">{it.description}</span>}
            </span>
          </li>
        ))}
      </ul>
    </DocPage>
  )
}
