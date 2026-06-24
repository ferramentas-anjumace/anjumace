import { useState } from 'react'
import { Section } from '../../components'
import { cn } from '../../lib/cn'
import { MODULES } from '../data'

/** Bloco de estatística colorido (número grande + unidade + descrição + fonte). */
function StatPanel({ stat, tone }) {
  const tones = {
    gold: 'bg-accent-2-subtle',
    sage: 'bg-accent-subtle',
  }
  return (
    <div className={cn('flex flex-1 flex-col gap-2 rounded-3xl p-8', tones[tone])}>
      <div className="flex items-baseline gap-1 text-content">
        <span className="font-display text-6xl font-light leading-none tracking-tight">{stat.value}</span>
        <span className="font-display text-3xl font-light leading-none opacity-70">{stat.unit}</span>
      </div>
      <span className="mt-1 text-body font-medium text-content">{stat.label}</span>
      <p className="text-body-sm text-content-secondary leading-relaxed">{stat.text}</p>
      {stat.source && (
        <span className="mt-1 text-caption text-content-subtle">Fonte: {stat.source}</span>
      )}
    </div>
  )
}

/** Seção Metodologia — seletor de abas + módulo ativo. */
export function ModulesSection() {
  const [active, setActive] = useState(0)
  const mod = MODULES[active]

  return (
    <Section id="metodologia" tone="warm" padding="lg">
      <div className="mx-auto mb-10 flex max-w-3xl flex-col items-center gap-4 text-center">
        <span className="text-label text-accent-text">Metodologia · 6 módulos</span>
        <h2 className="text-h2 text-content">
          Um caminho que transforma esforço físico em potência feminina absoluta
        </h2>
      </div>

      {/* Abas */}
      <div className="mb-8 flex flex-wrap justify-center gap-3">
        {MODULES.map((m, i) => (
          <button
            key={m.n}
            type="button"
            onClick={() => setActive(i)}
            aria-pressed={i === active}
            className={cn(
              'h-9 rounded-full px-5 text-body-sm font-medium transition-colors duration-fast',
              'focus-visible:shadow-focus focus-visible:outline-none',
              i === active
                ? 'bg-graphite-900 text-white'
                : 'border border-strong text-content hover:bg-surface-sunken',
            )}
          >
            Módulo {m.n}
          </button>
        ))}
      </div>

      {/* Módulo ativo */}
      <div className="grid items-stretch gap-5 lg:grid-cols-[1.45fr_1fr]">
        {/* Imagem + título/descrição sobrepostos */}
        <div className="relative min-h-[480px] overflow-hidden rounded-3xl shadow-xl">
          <img
            key={mod.image}
            src={mod.image}
            alt={mod.title}
            className="absolute inset-0 size-full object-cover animate-fade-in"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-graphite-950 via-graphite-950/40 to-transparent"
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-8 md:p-10">
            <h3 className="text-h3 text-white">{mod.title}</h3>
            <p className="max-w-xl text-body-sm text-white/80 leading-relaxed">
              {mod.description}
              {mod.quote && <span className="mt-2 block italic text-white/90"> {mod.quote}</span>}
            </p>
          </div>
        </div>

        {/* Estatísticas empilhadas */}
        <div className="flex flex-col gap-5">
          <StatPanel stat={mod.stats[0]} tone="gold" />
          {mod.stats[1] && <StatPanel stat={mod.stats[1]} tone="sage" />}
        </div>
      </div>
    </Section>
  )
}
