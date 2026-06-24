import { BookOpen, Dumbbell, Users, Sparkles } from 'lucide-react'
import { Section } from '../../components'
import { ECOSYSTEM } from '../data'

const ICONS = { BookOpen, Dumbbell, Users, Sparkles }

/** Ecossistema — 4 pilares (Blog, Treinos, Comunidade, AI Planning). */
export function EcosystemSection() {
  return (
    <Section tone="inverse" padding="lg">
      <div className="mx-auto mb-14 max-w-3xl text-center">
        <span className="text-label text-accent-text">O ecossistema</span>
        <h2 className="mt-4 text-h2">{ECOSYSTEM.title}</h2>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {ECOSYSTEM.items.map((it) => {
          const Icon = ICONS[it.icon]
          return (
            <div
              key={it.title}
              className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-7"
            >
              <span className="inline-grid size-12 place-items-center rounded-full bg-accent/15 text-accent">
                {Icon && <Icon className="size-6" strokeWidth={1.5} />}
              </span>
              <h3 className="text-h6">{it.title}</h3>
              <p className="text-body-sm text-content-inverse/70 leading-relaxed">{it.description}</p>
            </div>
          )
        })}
      </div>
    </Section>
  )
}
