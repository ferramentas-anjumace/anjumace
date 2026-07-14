import { Section } from '../../../components'
import { MECANISMO } from '../data'
import { CtaButton } from './CtaButton'
import { Reveal } from '../Reveal'

/**
 * Bloco 4 · O mecanismo — banda-statement em sálvia clara, com anéis
 * decorativos girando devagar ao fundo e o fecho com sublinhado que se
 * desenha no scroll.
 */
export function MecanismoSection() {
  return (
    <Section tone="base" padding="lg" className="relative overflow-hidden bg-accent-subtle">
      {/* Luz ambiente — brilhos difusos derivando devagar + foco suave no
          centro, atrás do texto. Discreto: percebe-se o movimento, não o efeito. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-[12%] size-[36rem] animate-drift rounded-full bg-gold-200/60 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-48 right-[8%] size-[42rem] animate-drift-slow rounded-full bg-sage-300/50 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[26rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40 blur-3xl"
      />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
        <Reveal delay={100}>
          <h2 className="text-h1 text-content">{MECANISMO.title}</h2>
        </Reveal>
        <Reveal delay={200}>
          <p className="font-display text-2xl font-light leading-snug text-accent-text">
            {MECANISMO.lead}
          </p>
        </Reveal>
        <div className="flex flex-col gap-4">
          {MECANISMO.paragraphs.slice(0, -1).map((p, i) => (
            <Reveal key={i} delay={300 + i * 120}>
              <p className="text-body-lg text-content-secondary leading-relaxed">{p}</p>
            </Reveal>
          ))}
        </div>
        <Reveal
          from="opacity-0 translate-y-10 after:scale-x-0"
          to="opacity-100 translate-y-0 after:scale-x-100"
          delay={200}
          className="relative after:absolute after:-bottom-7 after:left-1/2 after:h-px after:w-72 after:-translate-x-1/2 after:origin-center after:bg-accent-2 after:transition-transform after:duration-slow after:delay-500 after:ease-out"
        >
          <p className="text-h4 text-content">
            {MECANISMO.paragraphs[MECANISMO.paragraphs.length - 1]}
          </p>
        </Reveal>
        <Reveal delay={300} className="pt-10">
          <CtaButton />
        </Reveal>
      </div>
    </Section>
  )
}
