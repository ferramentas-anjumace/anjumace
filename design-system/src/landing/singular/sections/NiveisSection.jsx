import { Quote, BadgeCheck } from 'lucide-react'
import { Section } from '../../../components'
import { NIVEIS } from '../data'
import { CtaButton } from './CtaButton'
import { Reveal } from '../Reveal'

/**
 * Bloco 3 · Os níveis — bloco grafite com orbes de luz e o depoimento de
 * Anju num cartão levemente rotacionado que flutua.
 */
export function NiveisSection() {
  return (
    <Section tone="inverse" padding="lg" className="relative overflow-hidden">
      {/* Orbes de profundidade */}
      <div
        className="pointer-events-none absolute -right-24 top-0 size-96 animate-float-slow rounded-full bg-sage-500/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-20 bottom-0 size-72 animate-float rounded-full bg-gold-500/10 blur-3xl"
        aria-hidden
      />

      <div className="relative grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal variant="left" className="flex flex-col gap-5">
          <h2 className="text-h2 text-content-inverse">{NIVEIS.title}</h2>
          <div className="flex flex-col gap-4">
            {NIVEIS.paragraphs.map((p, i) => (
              <p key={i} className="text-body-lg text-content-inverse/75 leading-relaxed">{p}</p>
            ))}
          </div>
          <div className="pt-4">
            <CtaButton />
          </div>
        </Reveal>

        <Reveal variant="right" delay={180}>
          <figure className="group relative flex flex-col gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.03] p-10 backdrop-blur-sm transition-transform duration-moderate ease-out hover:rotate-0 md:p-12 lg:rotate-1">
            {/* Aspas gigantes ao fundo */}
            <Quote className="size-8 text-accent-2" strokeWidth={1.5} aria-hidden />
            <blockquote className="relative font-display text-2xl font-light leading-snug text-content-inverse">
              {NIVEIS.quote}
            </blockquote>
            {/* Assinatura estilo perfil social: avatar + nome verificado + @. */}
            <figcaption className="flex items-center gap-3">
              <img
                src="/landing/avatar-desktop.webp"
                alt="Anju Mace"
                className="size-14 shrink-0 rounded-full object-cover"
              />
              <span className="flex flex-col gap-0.5">
                <span className="flex items-center gap-1.5 font-display text-lg font-semibold text-content-inverse">
                  {NIVEIS.quoteAuthor}
                  <BadgeCheck className="size-5 fill-sky-500 text-graphite-900" aria-label="Verificado" />
                </span>
                <span className="text-body-sm text-content-inverse/60">@anjumace</span>
              </span>
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </Section>
  )
}
