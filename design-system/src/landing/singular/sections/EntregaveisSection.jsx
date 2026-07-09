import { LayoutGrid, Mic, Users, Sparkles } from 'lucide-react'
import { Section, SectionHeader } from '../../../components'
import { ENTREGAVEIS } from '../data'
import { ConsultoraButton } from './CtaButton'
import { Reveal, useInView } from '../Reveal'
import { ImagePlaceholder } from '../ImagePlaceholder'

const extraIcons = [LayoutGrid, Mic, Users]

/* Placeholder de foto de cada card de sustentação (mesma proporção nos 3). */
const extraImages = [
  'Arte/print: as aulas dos pilares do método T.E.M.P.L.O.',
  'Foto: Anju ao vivo — Hot Seat / falando com alunas',
  'Print: a comunidade Aliança no Circle',
]

/**
 * Bloco 7 · Os entregáveis — timeline da Prescrição Singular que se desenha
 * no scroll (mockup da ficha acompanhando ao lado), cards de sustentação com
 * hover e banda-bônus dourada com brilho.
 */
export function EntregaveisSection() {
  const [lineRef, lineInView] = useInView({ threshold: 0.1 })

  return (
    <Section id="entregaveis" tone="base" padding="lg">
      <Reveal>
        <SectionHeader
          align="center"
          eyebrow={ENTREGAVEIS.eyebrow}
          title={ENTREGAVEIS.title}
          description={ENTREGAVEIS.description}
          className="mb-14 max-w-3xl"
        />
      </Reveal>

      {/* Etapas da Prescrição Singular — timeline + mockup fixo no desktop */}
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <h3 className="mb-8 text-center text-h4 text-content">{ENTREGAVEIS.stepsTitle}</h3>
        </Reveal>

        <div className="grid items-start gap-12 lg:grid-cols-[1fr_320px]">
          <ol ref={lineRef} className="relative flex flex-col">
            <span
              aria-hidden
              className={`absolute left-6 top-6 h-[calc(100%-4.5rem)] w-px origin-top bg-gradient-to-b from-accent via-accent/60 to-accent-2/60 transition-transform duration-[1800ms] ease-out ${
                lineInView ? 'scale-y-100' : 'scale-y-0'
              }`}
            />
            {ENTREGAVEIS.steps.map((step, i) => (
              <li key={step.name} className="relative flex gap-6 pb-10 last:pb-0">
                <Reveal
                  as="span"
                  variant="scale"
                  delay={i * 180}
                  className="z-10 inline-grid size-12 shrink-0 place-items-center rounded-full bg-accent font-display text-lg font-light text-accent-on shadow-sm"
                >
                  {String(i + 1).padStart(2, '0')}
                </Reveal>
                <Reveal delay={i * 180 + 100} className="flex flex-col gap-2 pt-2">
                  <h4 className="text-h5 text-content">{step.name}</h4>
                  <p className="text-body-sm text-content-muted leading-relaxed">{step.text}</p>
                </Reveal>
              </li>
            ))}
          </ol>

          <Reveal variant="right" delay={200} className="lg:sticky lg:top-28">
            <ImagePlaceholder
              label="Mockup: a ficha da Prescrição Singular no celular"
              size="1080 × 1920 px · 9:16 · WebP/PNG"
              ratio="aspect-[9/16]"
              className="mx-auto max-w-[280px] lg:max-w-none"
            />
          </Reveal>
        </div>
      </div>

      {/* O que sustenta a prescrição */}
      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {ENTREGAVEIS.extras.map((extra, i) => {
          const Icon = extraIcons[i]
          return (
            <Reveal
              key={extra.title}
              delay={i * 120}
              className="group flex flex-col gap-4 rounded-2xl border border-subtle bg-surface p-8 shadow-sm transition-[transform,box-shadow] duration-moderate ease-out hover:-translate-y-2 hover:shadow-lg"
            >
              <span className="inline-grid size-12 place-items-center rounded-full bg-accent-subtle text-accent-text transition-transform duration-moderate ease-spring group-hover:-rotate-6 group-hover:scale-110">
                <Icon className="size-6" strokeWidth={1.5} />
              </span>
              <h3 className="text-h5 text-content">{extra.title}</h3>
              <p className="text-body-sm text-content-muted leading-relaxed">{extra.text}</p>
              {/* mt-auto ancora as fotos no rodapé — os 3 cards ficam alinhados */}
              <ImagePlaceholder
                label={extraImages[i]}
                size="1200 × 750 px · 16:10 · WebP"
                ratio="aspect-[16/10]"
                rounded="rounded-xl"
                className="mt-auto"
              />
            </Reveal>
          )
        })}
      </div>

      {/* Bônus — banda dourada com varredura de brilho */}
      <Reveal variant="scale" className="mt-16">
        <div className="relative flex flex-col items-center gap-5 overflow-hidden rounded-3xl bg-gradient-to-br from-accent-2-subtle via-surface-warm to-accent-2-subtle px-8 py-14 text-center md:px-16">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-shine bg-gradient-to-r from-transparent via-white/40 to-transparent"
          />
          <span className="inline-flex items-center gap-2 text-label text-accent-2-text">
            <Sparkles className="size-4" strokeWidth={1.5} aria-hidden />
            {ENTREGAVEIS.bonus.kicker}
          </span>
          <h3 className="text-h2 text-content">{ENTREGAVEIS.bonus.title}</h3>
          <p className="max-w-2xl text-body text-content-secondary leading-relaxed">
            {ENTREGAVEIS.bonus.text}
          </p>
          <p className="text-body-lg font-medium text-content">{ENTREGAVEIS.bonus.closing}</p>
        </div>
      </Reveal>

      <div className="mt-14 flex justify-center">
        <Reveal>
          <ConsultoraButton />
        </Reveal>
      </div>
    </Section>
  )
}
