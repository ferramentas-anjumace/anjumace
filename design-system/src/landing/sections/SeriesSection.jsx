import { Play } from 'lucide-react'
import { Section } from '../../components'
import { SERIES } from '../data'

/** Séries originais — carrossel horizontal de capas cinematográficas. */
export function SeriesSection() {
  return (
    <Section tone="muted" padding="lg">
      <div className="mx-auto mb-12 max-w-3xl text-center">
        <span className="text-label text-accent-text">Séries originais</span>
        <h2 className="mt-4 text-h2 text-content">{SERIES.title}</h2>
        <p className="mt-4 text-body-lg text-content-secondary">{SERIES.description}</p>
      </div>

      <div className="-mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SERIES.covers.map((src, i) => (
          <div
            key={src}
            className="group relative aspect-[9/16] w-56 shrink-0 snap-start overflow-hidden rounded-2xl shadow-lg"
          >
            <img
              src={src}
              alt={`Série ${i + 1}`}
              className="size-full object-cover transition-transform duration-moderate group-hover:scale-105"
            />
            <span className="absolute bottom-4 left-1/2 grid size-12 -translate-x-1/2 place-items-center rounded-full glass text-white">
              <Play className="size-5 translate-x-0.5 fill-white" strokeWidth={1} aria-hidden />
            </span>
          </div>
        ))}
      </div>
    </Section>
  )
}
