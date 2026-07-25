import { Section } from '../../components'
import { Reveal } from '../singular/Reveal'
import { JOURNEY } from '../data'

/** Jornada — 3 estágios de ascensão. */
export function JourneySection() {
  return (
    <Section tone="base" padding="lg">
      <Reveal className="mx-auto mb-14 max-w-3xl text-center">
        <span className="text-label text-accent-text">A ascensão</span>
        <h2 className="mt-4 text-h2 text-content">{JOURNEY.title}</h2>
        <p className="mt-4 text-body-lg text-content-secondary">{JOURNEY.description}</p>
      </Reveal>

      <div className="grid gap-6 md:grid-cols-3">
        {JOURNEY.stages.map((s, i) => (
          <Reveal
            key={s.n}
            delay={i * 100}
            className="flex flex-col gap-4 rounded-2xl border border-subtle bg-surface p-8 shadow-sm"
          >
            <span className="font-display text-6xl font-light leading-none text-accent/30">{s.n}</span>
            <h3 className="text-h5 text-content">{s.title}</h3>
            <p className="text-body-sm text-content-muted leading-relaxed">{s.description}</p>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
