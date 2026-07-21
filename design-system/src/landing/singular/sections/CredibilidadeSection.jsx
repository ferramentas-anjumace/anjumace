import { PenLine } from 'lucide-react'
import { Section, Wordmark } from '../../../components'
import { CREDIBILIDADE } from '../data'
import { ConsultoraButton } from './CtaButton'
import { Reveal } from '../Reveal'

/**
 * Bloco 8 · A credibilidade — painel-assinatura com moldura dourada nos
 * cantos e orbe flutuando; texto entra em cascata pela direita.
 */
export function CredibilidadeSection() {
  return (
    <Section id="quem-prescreve" tone="warm" padding="lg">
      <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        {/* Painel-assinatura: retrato oficial com a marca sobreposta na base. */}
        <Reveal variant="left" className="relative">
          {/* Moldura dourada nos cantos */}
          <span
            aria-hidden
            className="absolute -left-3 -top-3 size-16 rounded-tl-3xl border-l-2 border-t-2 border-accent-2/70"
          />
          <span
            aria-hidden
            className="absolute -bottom-3 -right-3 size-16 rounded-br-3xl border-b-2 border-r-2 border-accent-2/70"
          />

          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-graphite-900 shadow-xl">
            <img
              src="/landing/bioanju-desktop.webp"
              alt="Anju Mace"
              className="absolute inset-0 size-full object-cover"
            />
            {/* Assinatura sobre a base da foto */}
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 bg-gradient-to-t from-graphite-950/90 via-graphite-950/45 to-transparent px-8 pb-8 pt-24 text-center">
              <span className="h-px w-16 bg-accent-2/60" aria-hidden />
              <Wordmark size="md" tone="inverse" />
              <p className="text-label text-white/70">
                Prescrição assinada individualmente
              </p>
              {CREDIBILIDADE.credentials && (
                <p className="text-label text-white/50">{CREDIBILIDADE.credentials}</p>
              )}
            </div>
          </div>
        </Reveal>

        <div className="flex flex-col gap-5">
          <Reveal variant="right" delay={100}>
            <h2 className="text-h1 text-content">{CREDIBILIDADE.title}</h2>
          </Reveal>
          {CREDIBILIDADE.paragraphs.map((p, i) => (
            <Reveal key={i} variant="right" delay={200 + i * 120}>
              <p className="text-body-lg text-content-secondary leading-relaxed">{p}</p>
            </Reveal>
          ))}

          <Reveal variant="right" delay={440}>
            <p className="flex items-center gap-3 text-h5 text-content">
              <span className="inline-grid size-10 shrink-0 place-items-center rounded-full bg-accent-subtle text-accent-text">
                <PenLine className="size-5" strokeWidth={1.5} />
              </span>
              {CREDIBILIDADE.closing}
            </p>
          </Reveal>

          <Reveal variant="right" delay={640} className="pt-4">
            <ConsultoraButton />
          </Reveal>
        </div>
      </div>
    </Section>
  )
}
