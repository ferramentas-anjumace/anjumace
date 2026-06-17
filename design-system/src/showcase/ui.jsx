import { Divider } from '../components'
import { cn } from '../lib/cn'

/** Bloco de seção do showcase (título + divisor + conteúdo). */
export function ShowcaseSection({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-h3 mb-1">{title}</h2>
      <Divider className="mb-8" />
      <div className="space-y-10">{children}</div>
    </section>
  )
}

/** Linha rotulada (label à esquerda, exemplos à direita). */
export function Row({ label, children, className }) {
  return (
    <div className={cn('grid gap-3 md:grid-cols-[180px_1fr] md:items-center', className)}>
      <p className="text-label text-content-muted">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}
