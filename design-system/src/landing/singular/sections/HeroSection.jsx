import { HERO } from '../data'
import { CtaButton } from './CtaButton'
import { ImagePlaceholder } from '../ImagePlaceholder'

/**
 * Hero cinematográfico: foto com ken-burns lento, entrada escalonada do
 * conteúdo, orbes de luz flutuando e indicador de scroll.
 */
export function HeroSection() {
  return (
    <section id="inicio" className="relative overflow-hidden bg-graphite-900 text-white">
      {/* Foto só no desktop: as capas disponíveis têm texto gravado que, no
          mobile, aparece atrás da headline. Trocar por retrato limpo quando houver. */}
      <img
        src={HERO.image}
        alt=""
        className="absolute inset-0 hidden size-full animate-ken-burns object-cover object-[60%_30%] opacity-60 md:block"
      />
      <div
        className="absolute inset-0 hidden bg-gradient-to-r from-graphite-950 via-graphite-950/85 to-graphite-950/30 md:block"
        aria-hidden
      />
      {/* Mobile: gradiente grafite → sálvia profundo, sem foto. */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-graphite-950 via-graphite-900 to-sage-900/80 md:hidden"
        aria-hidden
      />

      {/* Orbes de luz — profundidade e movimento contínuo sutil. */}
      <div
        className="pointer-events-none absolute -left-32 top-1/4 size-96 animate-float-slow rounded-full bg-sage-500/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 right-[10%] size-80 animate-float rounded-full bg-gold-500/10 blur-3xl"
        aria-hidden
      />

      <div className="container relative flex min-h-[86vh] items-center py-24">
        <div className="flex max-w-2xl flex-col gap-6">
          <span className="inline-flex animate-fade-in-up items-center gap-3 text-label text-accent-2">
            <span className="h-px w-10 bg-accent-2/70" aria-hidden />
            {HERO.eyebrow}
          </span>

          <span className="animate-fade-in-up text-h5 font-light text-white/90 [animation-delay:120ms]">
            {HERO.product}
          </span>

          <h1 className="animate-fade-in-up text-display-sm text-white [animation-delay:240ms] md:text-display">
            {HERO.title}
          </h1>

          <p className="max-w-xl animate-fade-in-up text-body-lg text-white/80 [animation-delay:380ms]">
            {HERO.description}
          </p>

          <div className="flex animate-fade-in-up flex-wrap items-center gap-3 pt-2 [animation-delay:520ms]">
            <CtaButton />
          </div>

          {/* Só no mobile: o hero ainda não tem foto (o desktop usa a capa
              atual). Subir retrato limpo e aplicar como bg também no mobile. */}
          <ImagePlaceholder
            tone="dark"
            ratio=""
            rounded="rounded-2xl"
            label="Retrato limpo de Anju para o fundo do hero no mobile"
            size="1080 × 1620 px · 2:3 · WebP"
            className="mt-4 py-8 md:hidden"
          />
        </div>
      </div>

    </section>
  )
}
