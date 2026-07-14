import { useEffect, useRef } from 'react'
import { Button, Wordmark } from '../../../components'
import { NAV_LINKS, CTA_URL, CTA_LABEL } from '../data'
import { ctaGradient } from './CtaButton'

/** Barra de progresso de leitura — linha sálvia→dourado na base do header. */
function ScrollProgress() {
  const ref = useRef(null)

  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const el = document.documentElement
      const max = el.scrollHeight - el.clientHeight
      const p = max > 0 ? el.scrollTop / max : 0
      if (ref.current) ref.current.style.transform = `scaleX(${p})`
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <span
      ref={ref}
      aria-hidden
      className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-accent to-accent-2 will-change-transform"
    />
  )
}

/** Cabeçalho fixo com vidro: marca + navegação âncora + CTA + progresso. */
export function Nav() {
  return (
    <header className="sticky top-0 z-sticky border-b border-subtle/60 glass">
      {/* Mobile: só a logo, centralizada. Tablet+: logo à esquerda, CTA à direita. */}
      <div className="container flex h-16 items-center justify-center gap-6 md:justify-between">
        <a href="#inicio" className="shrink-0" aria-label="Anju Mace — início">
          <Wordmark size="md" />
        </a>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Principal">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="relative text-body-sm text-content-secondary transition-colors duration-fast after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-accent-2 after:transition-transform after:duration-base after:ease-out hover:text-content hover:after:origin-left hover:after:scale-x-100"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Só no desktop: no mobile o rótulo não cabe ao lado da logo, e o CTA
            do hero aparece logo abaixo. */}
        <Button as="a" href={CTA_URL} size="sm" className={`hidden shrink-0 uppercase tracking-wide md:inline-flex ${ctaGradient}`}>
          {CTA_LABEL}
        </Button>
      </div>
      <ScrollProgress />
    </header>
  )
}
