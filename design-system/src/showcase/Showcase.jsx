import { useState } from 'react'
import { Badge } from '../components'
import { cn } from '../lib/cn'
import { ThemeToggle, useTheme } from './ThemeToggle'
import { BaseSection } from './sections/BaseSection'
import { MarketingSection } from './sections/MarketingSection'
import { AppSection } from './sections/AppSection'
import { FormsSection } from './sections/FormsSection'
import { TemplatesSection } from './sections/TemplatesSection'
import { FoundationsSection } from './sections/FoundationsSection'

const TABS = [
  { id: 'foundations', label: 'Foundations', node: <FoundationsSection /> },
  { id: 'base', label: 'Base', node: <BaseSection /> },
  { id: 'marketing', label: 'Marketing', node: <MarketingSection /> },
  { id: 'app', label: 'App', node: <AppSection /> },
  { id: 'quiz', label: 'Forms/Quiz', node: <FormsSection /> },
  { id: 'templates', label: 'Templates', node: <TemplatesSection /> },
]

export function Showcase() {
  const { theme, toggle } = useTheme()
  const [tab, setTab] = useState('foundations')

  return (
    <div className="min-h-screen bg-surface-base text-content">
      <header className="sticky top-0 z-sticky border-b border-subtle bg-surface-base/80 backdrop-blur-md">
        <div className="container flex h-[var(--nav-height)] items-center justify-between gap-6">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-xl font-bold tracking-wider">ANJU</span>
            <span className="font-display text-xl font-light tracking-wider">MACE</span>
            <Badge variant="accent" size="sm" className="ml-2 hidden sm:inline-flex">Design System</Badge>
          </div>

          {/* Tabs */}
          <nav className="hidden md:flex items-center gap-1 rounded-full bg-surface-sunken p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'rounded-full px-4 h-9 text-body-sm font-medium transition-colors duration-fast ease-standard',
                  tab === t.id ? 'bg-surface text-content shadow-sm' : 'text-content-muted hover:text-content',
                )}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <ThemeToggle theme={theme} onToggle={toggle} />
        </div>

        {/* Tabs mobile */}
        <div className="md:hidden container pb-3 flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex-1 rounded-full px-4 h-9 text-body-sm font-medium transition-colors',
                tab === t.id ? 'bg-accent text-accent-on' : 'bg-surface-sunken text-content-muted',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="container py-16">
        <div className="mb-16">
          <p className="text-label text-accent-text">Fase 3 · Componentes</p>
          <h1 className="text-display-sm mt-3 max-w-3xl">Design System em movimento.</h1>
          <p className="text-body-lg text-content-secondary mt-4 max-w-2xl">
            Componentes construídos só com tokens, estados resolvidos e tema claro/escuro nativo.
          </p>
        </div>

        {TABS.find((t) => t.id === tab)?.node}
      </main>

      <footer className="border-t border-subtle">
        <div className="container py-10 text-caption">
          Anju Mace · Design System — Fase 3. Tema: {theme}.
        </div>
      </footer>
    </div>
  )
}
