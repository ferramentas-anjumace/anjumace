import { ArrowRight, Smartphone } from 'lucide-react'
import { Button } from '../../components'
import { HERO } from '../data'

/**
 * Hero editorial: fundo grafite com retrato cinematográfico, headline leve
 * grande, dual-CTA e a tagline da marca. (visual do design system)
 */
export function HeroSection() {
  return (
    <section
      id="inicio"
      className="relative overflow-hidden bg-graphite-900 text-white"
    >
      <img
        src="/landing/Modulo-1.webp"
        alt=""
        className="absolute inset-0 size-full object-cover object-[60%_30%] opacity-60"
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-graphite-950 via-graphite-950/85 to-graphite-950/30"
        aria-hidden
      />

      <div className="container relative flex min-h-[86vh] items-center py-24">
        <div className="flex max-w-2xl flex-col gap-7">
          <span className="text-label text-white/70">{HERO.eyebrow}</span>

          <h1 className="text-display-sm md:text-display text-white">{HERO.title}</h1>

          <p className="text-body-lg max-w-xl text-white/80">{HERO.description}</p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button as="a" href="#planos" size="lg" leftIcon={<Smartphone className="size-5" strokeWidth={1.5} />}>
              {HERO.primaryCta}
            </Button>
            <Button
              as="a"
              href="#metodologia"
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 active:bg-white/20"
              rightIcon={<ArrowRight className="size-5" strokeWidth={1.5} />}
            >
              {HERO.secondaryCta}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
