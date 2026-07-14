import { Section, SectionHeader } from '../../../components'
import { PROBLEMA } from '../data'
import { CtaButton } from './CtaButton'
import { Reveal } from '../Reveal'

/**
 * Bloco 2 · O problema — header fixo à esquerda, sintomas como lista
 * editorial numerada à direita (nada de grid de cards).
 */
export function ProblemaSection() {
  return (
    <Section tone="warm" padding="lg">
      <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.35fr] lg:gap-20">
        <Reveal variant="left" className="lg:sticky lg:top-28">
          <SectionHeader
            title={PROBLEMA.title}
            description={PROBLEMA.description}
          />
        </Reveal>

        <ol className="flex flex-col">
          {PROBLEMA.items.map((item, i) => (
            <Reveal
              key={item.title}
              as="li"
              variant="right"
              delay={i * 130}
              className="group flex gap-6 border-b border-strong/30 py-9 first:pt-0 last:border-none md:gap-10"
            >
              <span
                className="font-display text-6xl font-thin leading-none text-accent-text/30 transition-colors duration-moderate group-hover:text-accent-2"
                aria-hidden
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="flex flex-col gap-2">
                <h3 className="text-h5 text-content">{item.title}</h3>
                <p className="text-body text-content-muted leading-relaxed">{item.text}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>

      <div className="mt-16 flex flex-col items-center gap-14 text-center">
        <Reveal
          from="opacity-0 translate-y-10 after:scale-x-0"
          to="opacity-100 translate-y-0 after:scale-x-100"
          className="relative max-w-2xl after:absolute after:-bottom-7 after:left-1/2 after:h-px after:w-72 after:-translate-x-1/2 after:origin-center after:bg-accent-2 after:transition-transform after:duration-slow after:delay-300 after:ease-out"
        >
          {/* No desktop, quebra depois do dois-pontos (pedido de copy). */}
          <p className="text-h4 text-content">
            {PROBLEMA.closing.split(': ')[0]}:
            <br className="hidden md:block" />{' '}
            {PROBLEMA.closing.split(': ')[1]}
          </p>
        </Reveal>
        <Reveal delay={200}>
          <CtaButton />
        </Reveal>
      </div>
    </Section>
  )
}
