import { Button } from '../../components'
import { Wordmark } from '../../components'
import { NAV_LINKS } from '../data'

/** Cabeçalho fixo com vidro: marca + navegação âncora + CTA. */
export function Nav() {
  return (
    <header className="sticky top-0 z-sticky border-b border-subtle/60 glass">
      <div className="container flex h-16 items-center justify-between gap-6">
        <a href="#inicio" className="shrink-0" aria-label="Anju Mace — início">
          <Wordmark size="md" />
        </a>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Principal">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-body-sm text-content-secondary transition-colors duration-fast hover:text-content"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <Button as="a" href="#planos" size="sm" className="shrink-0">
          Iniciar jornada
        </Button>
      </div>
    </header>
  )
}
