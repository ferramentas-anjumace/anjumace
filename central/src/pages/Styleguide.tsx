import { Badge, SectionHeader, ThemeToggle, BrandSwitcher } from '@/components/ui'
import { cn } from '@/lib/cn'
import {
  colorGroups,
  typeScale,
  radii,
  spacing,
  elevations,
  motions,
} from './styleguide-data'
import { ComponentsGallery } from './styleguide-components'

/* ------------------------------------------------------------ layout helpers */

function Block({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="scroll-mt-20 border-t border-subtle pt-12">
      <SectionHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        className="mb-8"
      />
      {children}
    </section>
  )
}

/* ----------------------------------------------------------------- the page */

export function StyleguidePage() {
  return (
    <div className="min-h-screen bg-ink">
      {/* glow ambiente — único na view */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-80 bg-glow-steel" aria-hidden />

      <div className="relative mx-auto max-w-6xl px-6 py-16">
        {/* Hero */}
        <header className="mb-4">
          <div className="mb-4 flex items-center gap-3">
            <span className="font-mono text-mono-label uppercase text-steel-400">
              Anju Mace · Design System
            </span>
            <Badge tone="steel" dot>
              v0.2 · fundação
            </Badge>
            <div className="ml-auto flex items-center gap-2">
              <a
                href="/app"
                className="rounded-md px-3 py-2 text-body-s font-medium text-muted transition-colors hover:bg-slate-800 hover:text-strong focus-visible:outline-none focus-visible:shadow-focus"
              >
                Abrir a Central →
              </a>
              <BrandSwitcher />
              <ThemeToggle />
            </div>
          </div>
          <h1 className="font-display text-display-xl font-semibold text-strong">
            Steel &amp; Sand
          </h1>
          <p className="mt-4 max-w-2xl text-body-l text-muted">
            A base do design system da central de operações. Um instrumento de precisão:
            aço frio, fios de cabelo e respiro — com calor de areia gasto em um lugar só.
          </p>
        </header>

        <div className="mt-16 flex flex-col gap-16">
          {/* COR */}
          <Block
            eyebrow="Tokens · 01"
            title="Cores"
            description="Frio em camadas para a estrutura; Steel como accent funcional; Sand como assinatura quente e rara; status dessaturados."
          >
            <div className="flex flex-col gap-8">
              {colorGroups.map((g) => (
                <div key={g.group}>
                  <div className="mb-3 flex items-baseline gap-3">
                    <h3 className="font-display text-h3 font-semibold text-strong">{g.group}</h3>
                    <span className="text-body-s text-faint">{g.hint}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    {g.swatches.map((s) => (
                      <div
                        key={s.name}
                        className="overflow-hidden rounded-md border border-line bg-slate-900"
                      >
                        <div
                          className="h-16 w-full border-b border-subtle"
                          style={{ background: `var(${s.varName})` }}
                        />
                        <div className="px-3 py-2.5">
                          <div className="font-mono text-mono-data text-strong">{s.name}</div>
                          <div className="font-mono text-[11px] text-faint">{s.value}</div>
                          {s.note && (
                            <div className="mt-1 text-[11px] text-muted">{s.note}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Block>

          {/* TIPOGRAFIA */}
          <Block
            eyebrow="Tokens · 02"
            title="Tipografia"
            description="Duas vozes: Host Grotesk para display, Inter para UI e metadados (com números tabulares)."
          >
            <div className="flex flex-col divide-y divide-subtle rounded-lg border border-line bg-slate-900">
              {typeScale.map((t) => (
                <div
                  key={t.name}
                  className="flex flex-col gap-2 p-5 sm:flex-row sm:items-baseline sm:gap-6"
                >
                  <div className="w-40 shrink-0">
                    <div className="font-mono text-mono-data text-steel-300">{t.name}</div>
                    <div className="mt-1 font-mono text-[11px] leading-relaxed text-faint">
                      {t.specs}
                    </div>
                  </div>
                  <div
                    className={cn(
                      'min-w-0 text-strong',
                      t.className,
                      t.family === 'mono' && 'text-muted',
                    )}
                  >
                    {t.sample}
                  </div>
                </div>
              ))}
            </div>
          </Block>

          {/* ESPAÇAMENTO */}
          <Block
            eyebrow="Tokens · 03"
            title="Espaçamento"
            description="Ritmo base-4. A escala do Tailwind segue exatamente estes passos."
          >
            <div className="flex flex-col gap-2 rounded-lg border border-line bg-slate-900 p-5">
              {spacing.map((s) => (
                <div key={s.name} className="flex items-center gap-4">
                  <span className="w-10 font-mono text-mono-data text-steel-300">{s.name}</span>
                  <span className="w-14 font-mono text-[11px] text-faint">{s.value}</span>
                  <div className="h-3 rounded-xs bg-steel-500/60" style={{ width: s.value }} />
                </div>
              ))}
            </div>
          </Block>

          {/* RAIO */}
          <Block eyebrow="Tokens · 04" title="Raio" description="Cantos generosos — estrutura sem virar jornal.">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {radii.map((r) => (
                <div key={r.name} className="flex flex-col items-center gap-3">
                  <div
                    className="h-20 w-full border border-strong bg-slate-800"
                    style={{ borderRadius: `var(--${r.name})` }}
                  />
                  <div className="text-center">
                    <div className="font-mono text-mono-data text-strong">{r.name}</div>
                    <div className="font-mono text-[11px] text-faint">{r.value}</div>
                    <div className="mt-0.5 text-[11px] text-muted">{r.use}</div>
                  </div>
                </div>
              ))}
            </div>
          </Block>

          {/* ELEVAÇÃO */}
          <Block
            eyebrow="Tokens · 05"
            title="Elevação"
            description="Sutil no escuro — profundidade vem de superfície + linha + glow."
          >
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 lg:grid-cols-5">
              {elevations.map((e) => (
                <div key={e.name} className="flex flex-col items-center gap-3">
                  <div
                    className={cn(
                      'flex h-24 w-full items-center justify-center rounded-lg border border-line bg-slate-800',
                      e.shadow,
                    )}
                  >
                    <span className="font-mono text-mono-label uppercase text-faint">{e.name}</span>
                  </div>
                  <div className="text-center font-mono text-[11px] text-faint">{e.desc}</div>
                </div>
              ))}
            </div>
          </Block>

          {/* MOTION + Z-INDEX */}
          <Block eyebrow="Tokens · 06" title="Motion & camadas" description="Durações curtas, easing decidido. Respeita prefers-reduced-motion.">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-lg border border-line bg-slate-900 p-5">
                <div className="mb-4 font-mono text-mono-label uppercase text-faint">Motion</div>
                <div className="flex flex-col gap-2">
                  {motions.map((m) => (
                    <div key={m.name} className="flex items-baseline justify-between gap-4">
                      <span className="font-mono text-mono-data text-steel-300">{m.name}</span>
                      <span className="font-mono text-[11px] text-faint">{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-line bg-slate-900 p-5">
                <div className="mb-4 font-mono text-mono-label uppercase text-faint">Z-index</div>
                <div className="flex flex-col gap-2">
                  {[
                    ['dropdown', 1000],
                    ['sticky', 1100],
                    ['drawer', 1200],
                    ['modal', 1300],
                    ['popover', 1400],
                    ['toast', 1500],
                    ['tooltip', 1600],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-baseline justify-between gap-4">
                      <span className="font-mono text-mono-data text-steel-300">{k}</span>
                      <span className="font-mono text-[11px] text-faint">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Block>

          {/* COMPONENTES — galeria completa */}
          <ComponentsGallery />
        </div>

        <footer className="mt-20 border-t border-subtle pt-8">
          <p className="font-mono text-mono-data text-faint">
            Anju Mace · /styleguide · fundação Sálvia &amp; Dourado
          </p>
        </footer>
      </div>
    </div>
  )
}
