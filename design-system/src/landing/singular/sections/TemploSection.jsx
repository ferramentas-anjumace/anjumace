import { Section, SectionHeader, Badge } from '../../../components'
import { cn } from '../../../lib/cn'
import { TEMPLO } from '../data'
import { CtaButton } from './CtaButton'
import { Reveal } from '../Reveal'

/**
 * Bloco 5 · O método T.E.M.P.L.O. — os dois pilares-núcleo (T e E) viram
 * cartões grafite em destaque, os quatro de sustentação ficam menores.
 * Letras-fantasma gigantes, entrada em cascata e hover com elevação.
 */
export function TemploSection() {
  return (
    <Section id="metodo" tone="surface" padding="lg">
      <Reveal>
        <SectionHeader
          align="center"
          eyebrow={TEMPLO.eyebrow}
          title={TEMPLO.title}
          description={TEMPLO.description}
          className="mb-6 max-w-3xl"
        />
      </Reveal>
      <Reveal delay={120}>
        <p className="mx-auto mb-14 max-w-2xl text-center text-body text-content-muted">
          {TEMPLO.intro}
        </p>
      </Reveal>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-12">
        {TEMPLO.pillars.map((pillar, i) => (
          <Reveal
            key={pillar.letter}
            delay={i * 100}
            className={cn(
              'group relative flex flex-col gap-4 overflow-hidden rounded-3xl p-8 transition-[transform,box-shadow] duration-moderate ease-out hover:-translate-y-2 hover:shadow-lg lg:p-10',
              pillar.core
                ? 'bg-surface-inverse text-content-inverse lg:col-span-6'
                : 'border border-subtle bg-surface-base lg:col-span-3',
            )}
          >
            <div className="relative flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* Monograma do pilar — azulejo pequeno, padrão CardIcon */}
                <span
                  className={cn(
                    'grid size-11 shrink-0 place-items-center rounded-xl border font-display text-xl font-light',
                    pillar.core
                      ? 'border-accent-2/30 bg-accent-2/15 text-accent-2'
                      : 'border-accent/20 bg-accent-subtle text-accent-text',
                  )}
                >
                  {pillar.letter}
                </span>
                <span className={cn('text-label', pillar.core ? 'text-accent-2' : 'text-accent-text')}>
                  {pillar.name}
                </span>
              </div>
              {pillar.core && (
                <Badge variant="solid-2" size="sm" uppercase>O seu treino</Badge>
              )}
            </div>
            <h3 className={cn('relative text-h5', pillar.core ? 'text-content-inverse' : 'text-content')}>
              {pillar.headline}
            </h3>
            <p
              className={cn(
                'relative text-body-sm leading-relaxed',
                pillar.core ? 'text-content-inverse/70' : 'text-content-muted',
              )}
            >
              {pillar.text}
            </p>
          </Reveal>
        ))}
      </div>

      <div className="mt-14 flex flex-col items-center gap-8 text-center">
        <Reveal>
          <p className="mx-auto max-w-2xl text-body-lg text-content-secondary">{TEMPLO.closing}</p>
        </Reveal>
        <Reveal delay={150}>
          <CtaButton />
        </Reveal>
      </div>
    </Section>
  )
}
