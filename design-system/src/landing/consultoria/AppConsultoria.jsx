import { useEffect } from 'react'
import { ArrowRight } from 'lucide-react'

const WHATSAPP_URL =
  'https://wa.me/5531992098139?text=Olá!%20Gostaria%20de%20entender%20melhor%20como%20funciona%20a%20consultoria%20individual.'

const gradient =
  'bg-gradient-to-r from-sage-400 via-cream-200 to-sage-500 bg-[length:200%_100%] bg-left hover:bg-right text-graphite-900 shadow-md hover:shadow-lg transition-[background-position,box-shadow,transform] duration-slow ease-out'

function CtaPill({ label }) {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`group inline-flex h-16 items-center gap-4 rounded-full py-2 pl-8 pr-2 font-medium uppercase tracking-wide ${gradient}`}
    >
      <span className="text-sm md:text-base">{label}</span>

      <span className="inline-grid size-12 shrink-0 place-items-center rounded-full bg-cream-100/80 text-graphite-900 transition-transform duration-moderate ease-spring group-hover:translate-x-0.5">
        <ArrowRight
          className="size-5"
          strokeWidth={1.5}
          aria-hidden
        />
      </span>
    </a>
  )
}

function Hero() {
  return (
    <section className="relative flex min-h-dvh flex-col overflow-hidden bg-graphite-950 text-cream-100">

      {/* Orbes de luz */}
      <div
        className="pointer-events-none absolute -left-32 top-1/4 size-96 animate-float-slow rounded-full bg-sage-500/15 blur-3xl"
        aria-hidden
      />

      <div
        className="pointer-events-none absolute -bottom-24 right-[8%] size-80 animate-float rounded-full bg-gold-500/10 blur-3xl"
        aria-hidden
      />

      {/* Logo */}
      <div className="relative z-10 flex justify-center pt-10 md:pt-12">
        <img
          src="/logo-anju.svg"
          alt="Anju Mace"
          className="h-4 w-auto animate-fade-in"
        />
      </div>

      {/* Conteúdo */}
      <div className="container relative flex flex-1 flex-col items-center justify-center gap-12 py-16 text-center md:flex-row md:gap-16 md:text-left">

        <h1 className="max-w-xl animate-fade-in-up text-display-sm text-cream-100 md:text-display [animation-delay:120ms]">
          Um treino pensado
          <br />
          para você
          <span className="text-sage-400">.</span>
        </h1>

        {/* Filete vertical */}
        <span
          className="hidden h-24 w-px shrink-0 bg-cream-100/20 md:block"
          aria-hidden
        />

        <p className="max-w-sm animate-fade-in-up text-body-lg text-cream-100/75 [animation-delay:280ms]">
          Conheça meu acompanhamento individual e entenda como construímos uma
          estratégia de treino de acordo com o seu corpo, a sua rotina e os
          seus objetivos.
        </p>

      </div>

      {/* CTA */}
      <div className="relative z-10 flex animate-fade-in-up justify-center pb-16 [animation-delay:440ms] md:pb-20">
        <CtaPill label="QUERO TREINAR COM VOCÊ" />
      </div>

    </section>
  )
}

export function AppConsultoria() {
  useEffect(() => {
    document.title = 'Consultoria Individual - Anju Mace'
  }, [])

  return (
    <div className="min-h-dvh bg-graphite-950 antialiased">
      <Hero />
    </div>
  )
}
