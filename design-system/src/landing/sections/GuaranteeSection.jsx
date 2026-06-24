import { ShieldCheck } from 'lucide-react'
import { Section } from '../../components'
import { GUARANTEE } from '../data'

/** Garantia de 7 dias. */
export function GuaranteeSection() {
  return (
    <Section id="garantia" tone="base" padding="md">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-3xl border border-accent/30 bg-accent-subtle px-8 py-14 text-center md:px-16">
        <span className="inline-grid size-16 place-items-center rounded-full bg-accent/15 text-accent-text">
          <ShieldCheck className="size-8" strokeWidth={1.5} />
        </span>
        <h2 className="text-h3 text-content">{GUARANTEE.title}</h2>
        <p className="text-body-lg text-content-secondary">{GUARANTEE.description}</p>
      </div>
    </Section>
  )
}
