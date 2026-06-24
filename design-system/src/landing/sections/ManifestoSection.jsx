import { ArrowRight } from 'lucide-react'
import { Section, Button } from '../../components'
import { MANIFESTO } from '../data'

/** Manifesto + screenshots do app, em duas colunas. */
export function ManifestoSection() {
  return (
    <Section tone="base" padding="lg">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Texto */}
        <div className="flex flex-col gap-6">
          <h2 className="text-h2 text-content">{MANIFESTO.title}</h2>
          <p className="text-body-lg text-content-secondary">{MANIFESTO.lead}</p>
          <div className="flex flex-col gap-4">
            {MANIFESTO.paragraphs.map((p, i) => (
              <p key={i} className="text-body text-content-muted leading-relaxed">{p}</p>
            ))}
          </div>
          <div className="pt-2">
            <Button as="a" href="#planos" rightIcon={<ArrowRight className="size-4" strokeWidth={1.5} />}>
              {MANIFESTO.cta}
            </Button>
          </div>
        </div>

        {/* Screenshots */}
        <div className="relative flex justify-center gap-4">
          {MANIFESTO.screens.map((src, i) => (
            <img
              key={src}
              src={src}
              alt={`Tela do app Anju Mace ${i + 1}`}
              className={
                'w-1/2 max-w-[260px] rounded-2xl border border-subtle bg-surface shadow-lg ' +
                (i === 1 ? 'mt-10' : '')
              }
            />
          ))}
        </div>
      </div>
    </Section>
  )
}
