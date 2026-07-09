import { Quote, Image as ImageIcon } from 'lucide-react'
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
          <span className="inline-flex items-center gap-3 text-label text-accent-2">
            <span className="h-px w-10 bg-accent-2/70" aria-hidden />
            {NIVEIS.eyebrow}
          </span>
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
            <span
              aria-hidden
              className="pointer-events-none absolute -top-4 right-6 select-none font-display text-[10rem] font-thin leading-none text-accent-2/10"
            >
              &ldquo;
            </span>
            <Quote className="size-8 text-accent-2" strokeWidth={1.5} aria-hidden />
            <blockquote className="relative font-display text-2xl font-light leading-snug text-content-inverse">
              {NIVEIS.quote}
            </blockquote>
            <figcaption className="flex items-center gap-3 text-label text-content-inverse/60">
              {/* Placeholder: avatar de Anju (foto quadrada, rosto centralizado) */}
              <span
                className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-dashed border-white/25 bg-white/5"
                title="Avatar de Anju — 240 × 240 px · 1:1 · WebP"
              >
                <ImageIcon className="size-4 text-white/50" strokeWidth={1.25} aria-hidden />
              </span>
              <span className="flex flex-col gap-0.5">
                {NIVEIS.quoteAuthor}
                <span className="font-mono text-xs normal-case tracking-normal text-content-inverse/40">
                  avatar 240 × 240 px
                </span>
              </span>
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </Section>
  )
}
