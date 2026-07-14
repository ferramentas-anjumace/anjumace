import { HERO } from '../data'
import { CtaButton } from './CtaButton'

/**
 * Hero cinematográfico: foto com ken-burns lento, entrada escalonada do
 * conteúdo, orbes de luz flutuando e indicador de scroll.
 */
export function HeroSection() {
  return (
    <section id="inicio" className="relative overflow-hidden bg-graphite-900 text-white">
      {/* Desktop: foto panorâmica com ken-burns. */}
      <img
        src={HERO.image}
        alt=""
        className="absolute inset-0 hidden size-full animate-ken-burns object-cover object-[60%_30%] md:block"
      />
      {/* Mobile: retrato vertical cobrindo a dobra inteira, sem tratamento. */}
      <img
        src="/landing/singular-hero-mobile.webp"
        alt=""
        className="absolute inset-0 size-full object-cover object-top md:hidden"
      />

      {/* Mobile: conteúdo ancorado embaixo (a parte escura da foto — o rosto
          fica livre no topo). Desktop: centralizado como antes. */}
      <div className="container relative flex min-h-[86vh] items-end py-16 md:items-center md:py-24">
        <div className="flex max-w-2xl flex-col gap-6">
          {/* Selo em pílula: borda dourada + vidro sutil, no lugar do travessão. */}
          {/* No mobile o selo quebra em 2 linhas pra ficar estreito e não
              alcançar o rosto da foto. */}
          <span className="inline-flex animate-fade-in-up items-center self-start rounded-full border border-accent-2/40 bg-white/5 px-4 py-2 text-label text-accent-2">
            <span>
              Consultoria de Treino
              <br className="md:hidden" /> Individualizada
            </span>
          </span>

          <span className="animate-fade-in-up text-h5 font-light text-white/90 [animation-delay:120ms]">
            {HERO.product}
          </span>

          <h1 className="animate-fade-in-up text-display-sm text-white [animation-delay:240ms] max-md:text-[40px] max-md:leading-[1.12] md:text-display">
            {HERO.title}
          </h1>

          {/* "Prescrição Singular" em destaque — o nome do processo é a marca. */}
          <p className="max-w-xl animate-fade-in-up text-body-lg text-white/80 [animation-delay:380ms]">
            {HERO.description.split('Prescrição Singular')[0]}
            <strong className="font-semibold text-white">Prescrição Singular</strong>
            {HERO.description.split('Prescrição Singular')[1]}
          </p>

          <div className="flex animate-fade-in-up flex-wrap items-center gap-3 pt-2 [animation-delay:520ms]">
            <CtaButton />
          </div>

        </div>
      </div>

    </section>
  )
}
