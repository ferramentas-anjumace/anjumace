import { Section, Badge } from '../../../components'
import { CURSOS } from '../data'
import { Reveal } from '../Reveal'
import { ImagePlaceholder } from '../ImagePlaceholder'

/**
 * Bloco 6 · Os cursos de desenvolvimento integral — banda sálvia profunda
 * (diferente do grafite dos Níveis), cards em offset alternado com entrada
 * pelos lados e hover dourado.
 */
export function CursosSection() {
  return (
    <Section
      tone="inverse"
      padding="lg"
      className="relative overflow-hidden bg-gradient-to-b from-graphite-950 via-sage-900 to-graphite-950"
    >
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-accent-2/40 to-transparent"
        aria-hidden
      />

      <Reveal className="mx-auto mb-14 flex max-w-3xl flex-col items-center gap-5 text-center">
        <h2 className="text-h2 text-content-inverse">{CURSOS.title}</h2>
        {CURSOS.paragraphs.map((p, i) => (
          <p key={i} className="text-body-lg text-content-inverse/75 leading-relaxed">{p}</p>
        ))}
      </Reveal>

      <div className="grid gap-6 md:grid-cols-2">
        {CURSOS.items.map((curso, i) => (
          <Reveal
            key={curso.letter}
            variant={i % 2 === 0 ? 'left' : 'right'}
            delay={(i % 2) * 150}
            className="group flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-8 transition-[transform,border-color,background-color] duration-moderate ease-out hover:-translate-y-1.5 hover:border-accent-2/40 hover:bg-white/[0.08] md:p-10"
          >
            <ImagePlaceholder
              tone="dark"
              ratio="aspect-video"
              rounded="rounded-2xl"
              label={`Capa do curso ${curso.name}`}
              size="1280 × 720 px · 16:9 · WebP"
              className="mb-2"
            />
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* Monograma do curso — azulejo pequeno, padrão CardIcon */}
                <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-accent-2/30 bg-accent-2/15 font-display text-xl font-light text-accent-2 transition-colors duration-moderate group-hover:bg-accent-2/25">
                  {curso.letter}
                </span>
                <span className="text-h5 text-content-inverse">{curso.name}</span>
              </div>
              <Badge variant={curso.live ? 'solid' : 'solid-2'} size="sm" uppercase>
                {curso.status}
              </Badge>
            </div>

            <span className="text-label text-content-inverse/50">{CURSOS.kicker}</span>
            <h3 className="text-h4 text-content-inverse">{curso.headline}</h3>
            <p className="text-body-sm text-content-inverse/70 leading-relaxed">{curso.text}</p>

            <div className="mt-auto flex flex-col gap-2 border-t border-white/10 pt-4">
              <span className="text-label text-content-inverse/50">Módulos</span>
              <ul className="flex flex-col gap-1.5">
                {curso.modules.map((m) => (
                  <li key={m} className="flex items-start gap-2 text-body-sm text-content-inverse/80">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent-2" aria-hidden />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
