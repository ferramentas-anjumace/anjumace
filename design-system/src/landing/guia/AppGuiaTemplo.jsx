import { ArrowRight, Dumbbell, PlayCircle, ClipboardList, LayoutGrid, Activity, Users } from 'lucide-react'
import { Reveal } from '../singular/Reveal'

/* Página de downsell OTO do Plano Templo (/guia/templo) — 30 dias grátis.
   Copy verbatim do documento do funil (Página de Downsell · One Time Offer).
   Exibida só após recusa do Singular em /guia/obrigado; sem retorno (a
   condição não reaparece se a visitante sair e voltar — reforçar isso no
   nível de rota/sessão; ainda pendente).
   Mesmo vocabulário visual de /singular e de /guia/obrigado (orbes, cards
   com ícone, banda de bônus, marquee, glow) — pedido do usuário (16/07)
   pra manter a riqueza visual consistente em todo o funil.
   Cards de "o que abre hoje" usam as MESMAS fotos de /guia/download (é o
   mesmo conteúdo do Plano Templo) — pedido do usuário (20/07). */

// Links reais de checkout na Circle (planilha "Ofertas na Circle", 20/07).
const LINK_CHECKOUT_TEMPLO_TRIAL = 'https://anju-mace.circle.so/checkout/plano-templo-alunas-or-30-dias-free-or'
const LINK_CHECKOUT_TEMPLO_NORMAL = 'https://anju-mace.circle.so/checkout/plano-templo'

const gradient =
  'bg-gradient-to-r from-sage-400 via-cream-200 to-sage-500 bg-[length:200%_100%] bg-left hover:bg-right text-graphite-900 shadow-md hover:shadow-lg transition-[background-position,box-shadow,transform] duration-slow ease-out'

function CtaPill({ label, href }) {
  return (
    <a
      href={href}
      className={`group flex min-h-16 w-full min-w-0 max-w-sm items-center gap-2.5 overflow-hidden rounded-full py-2 pl-5 pr-2 font-medium uppercase tracking-normal sm:h-16 sm:w-auto sm:gap-3 sm:pl-6 sm:tracking-wide md:gap-4 md:pl-8 ${gradient}`}
    >
      <span className="flex-1 text-center text-sm leading-tight sm:whitespace-nowrap md:text-base">{label}</span>
      <span className="inline-grid size-12 shrink-0 place-items-center rounded-full bg-cream-100/80 text-graphite-900 transition-transform duration-moderate ease-spring group-hover:translate-x-0.5">
        <ArrowRight className="size-5" strokeWidth={1.5} aria-hidden />
      </span>
    </a>
  )
}

/** Par primário+recusa — fragment sem wrapper próprio (ver gotcha de
    /guia/obrigado: um <div> aqui quebra o w-full do CtaPill no mobile). */
function CtaRow({ tone = 'dark', primaryLabel = 'Sim, quero meus trinta dias abertos', secondaryLabel = 'Não, prefiro pagar desde o primeiro dia, depois' }) {
  const light = tone === 'light'
  return (
    <>
      <CtaPill label={primaryLabel} href={LINK_CHECKOUT_TEMPLO_TRIAL} />
      <a
        href={LINK_CHECKOUT_TEMPLO_NORMAL}
        className={`text-caption underline underline-offset-4 transition-colors ${light ? 'text-graphite-900/45 hover:text-graphite-900/70' : 'text-cream-100/45 hover:text-cream-100/70'}`}
      >
        {secondaryLabel}
      </a>
    </>
  )
}

/** Barra de progresso do funil — "Passo 2 de 2", 2 segmentos. No mobile o
    texto completo (whitespace-nowrap + string longa) estourava a largura e
    espremia os segmentos a quase zero — texto curto até sm, completo dali
    pra cima (mesmo recibo de tamanho responsivo do form de /guia). */
function ProgressBar() {
  return (
    <div className="sticky top-0 z-20 border-b border-cream-100/10 bg-graphite-950/90 backdrop-blur-sm">
      <div className="container flex items-center gap-3 py-3 sm:gap-4">
        <div className="flex flex-1 gap-1.5">
          <span className="h-1 flex-1 rounded-full bg-sage-400" aria-hidden />
          <span className="h-1 flex-1 rounded-full bg-sage-400" aria-hidden />
        </div>
        <p className="shrink-0 whitespace-nowrap text-[10px] uppercase tracking-wide text-cream-100/50 sm:text-caption sm:tracking-wider">
          <span className="sm:hidden">Passo 2 de 2</span>
          <span className="hidden sm:inline">Passo 2 de 2 · Uma condição que existe só nesta página</span>
        </p>
      </div>
    </div>
  )
}

/** Caixa da oferta — preço riscado vs. hoje por zero, moldura dourada.
    Compacta no mobile (padding, gap e o R$0 menor) pra caber inteira na
    primeira dobra junto com o CTA — pedido do usuário (20/07). */
function OfferBox() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-gold-400/30 bg-gradient-to-br from-gold-100 via-cream-50 to-gold-100 p-5 text-graphite-900 shadow-lg sm:p-8 md:p-10">
      <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-shine bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      <div className="relative flex flex-col items-center gap-2 text-center sm:gap-4">
        <span className="inline-flex items-center rounded-full border border-gold-500/40 bg-white/50 px-3 py-1.5 text-caption uppercase tracking-wider text-gold-700 sm:px-4 sm:py-2">
          Plano Templo · Acesso completo
        </span>
        <div className="flex items-end justify-center gap-3 sm:gap-4">
          <span className="flex flex-col items-center">
            <span className="text-caption uppercase tracking-wide text-graphite-900/45">Primeiro mês</span>
            <span className="text-h4 text-graphite-900/40 line-through">R$ 127</span>
          </span>
          <span className="flex flex-col items-center">
            <span className="text-caption uppercase tracking-wide text-sage-700">Hoje</span>
            <span className="font-display text-h2 text-sage-700 sm:text-h1">R$ 0</span>
          </span>
        </div>
        <p className="max-w-sm text-body-sm text-graphite-900/70 sm:text-body">
          Cobrança apenas no trigésimo primeiro dia. Cancele em um clique, sem justificar nada.
        </p>
      </div>
    </div>
  )
}

/** Card com ícone — os itens do que abre hoje (grid 3 col, mesmo vocabulário
    do DeliverableCard de /guia/download; mesmas fotos, já que é o mesmo
    conteúdo do Plano Templo mostrado ali). */
function OpenCard({ icon: Icon, title, image, imageAlt = '', children }) {
  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl border border-graphite-900/10 bg-cream-50 p-6 shadow-sm">
      <img src={image} alt={imageAlt} loading="lazy" className="aspect-[16/10] w-full rounded-xl object-cover" />
      <span className="grid size-11 place-items-center rounded-full bg-sage-500/15 text-sage-700">
        <Icon className="size-5" strokeWidth={1.5} aria-hidden />
      </span>
      <p className="text-body text-graphite-900/75">
        <strong className="font-medium text-graphite-900">{title}</strong> {children}
      </p>
    </div>
  )
}

/** Callout com filete dourado — a frase que fica. */
function Callout({ children, tone = 'dark' }) {
  const light = tone === 'light'
  return (
    <div className={`rounded-2xl border border-l-2 px-6 py-5 ${light ? 'border-gold-500/35 border-l-gold-500 bg-gold-100/50' : 'border-gold-300/30 border-l-gold-300 bg-gold-300/5'}`}>
      <p className={`text-body-lg ${light ? 'text-graphite-900' : 'text-cream-100'}`}>{children}</p>
    </div>
  )
}

/** Faixa marquee — mesmo padrão de /singular e /guia/obrigado. */
const MARQUEE_PHRASES = ['Trinta dias grátis', 'Método T.E.M.P.L.O. completo', 'Cancele quando quiser', 'Sem cobrança hoje', 'A Aliança']

function MarqueeTrack({ hidden = false }) {
  return (
    <div aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {MARQUEE_PHRASES.map((phrase) => (
        <span key={phrase} className="flex items-center">
          <span className="whitespace-nowrap px-8 font-display text-lg font-light tracking-wide text-cream-100/70">{phrase}</span>
          <span className="size-1.5 shrink-0 rounded-full bg-gold-400/70" aria-hidden />
        </span>
      ))}
    </div>
  )
}

function MarqueeBand() {
  return (
    <div className="overflow-hidden border-y border-cream-100/5 bg-graphite-950 py-6">
      <div className="flex w-max animate-marquee">
        <MarqueeTrack />
        <MarqueeTrack hidden />
        <MarqueeTrack hidden />
        <MarqueeTrack hidden />
        <MarqueeTrack hidden />
        <MarqueeTrack hidden />
      </div>
    </div>
  )
}

export function AppGuiaTemplo() {
  return (
    <main className="bg-graphite-950 text-cream-100">
      <ProgressBar />

      {/* --------------------------------------------------------- 1 · HERO */}
      <section className="relative flex min-h-dvh flex-col overflow-hidden">
        <div className="pointer-events-none absolute -left-32 top-1/4 size-96 animate-float-slow rounded-full bg-sage-500/15 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-24 bottom-0 size-72 animate-float rounded-full bg-gold-500/10 blur-3xl" aria-hidden />
        <div className="container relative flex flex-1 flex-col items-center justify-center gap-4 py-8 text-center sm:gap-6 sm:py-12 lg:gap-8 lg:py-16">
          <p className="animate-fade-in text-caption uppercase tracking-wider text-sage-400">
            Tudo bem. Prescrição individual não é para todo momento da jornada.
          </p>
          <h1 className="max-w-3xl animate-fade-in-up text-h1 text-[32px] text-cream-100 md:text-[62px] [animation-delay:120ms]">
            Então fique com o método inteiro por trinta dias, e não pague nada por eles<span className="text-sage-400">.</span>
          </h1>
          <p className="max-w-2xl animate-fade-in-up text-body-lg text-cream-100/75 [animation-delay:280ms]">
            Se você fechar essa página, você perde os 30 dias grátis.
          </p>
          <div className="w-full max-w-lg animate-fade-in-up [animation-delay:360ms]">
            <OfferBox />
          </div>
          <div className="flex animate-fade-in-up flex-col items-center gap-2 [animation-delay:440ms] sm:gap-4">
            <CtaPill label="Sim, quero meus trinta dias abertos" href={LINK_CHECKOUT_TEMPLO_TRIAL} />
            <p className="text-center text-caption text-cream-100/45">Acesso liberado em minutos. Nenhuma cobrança hoje.</p>
            <a href={LINK_CHECKOUT_TEMPLO_NORMAL} className="text-caption text-cream-100/45 underline underline-offset-4 transition-colors hover:text-cream-100/70">
              Não, prefiro pagar desde o primeiro dia, depois
            </a>
          </div>
        </div>
      </section>

      {/* ------------------------------------------- BLOCO 1 · O QUE ABRE HOJE */}
      <section className="bg-cream-100 py-20 text-graphite-900 md:py-28">
        <div className="container flex max-w-5xl flex-col gap-10">
          <Reveal className="flex max-w-3xl flex-col gap-4">
            <h2 className="text-h2 text-graphite-900">O que abre hoje</h2>
            <p className="text-body-lg text-graphite-900/70">Não é amostra. É o Plano Templo inteiro, do primeiro dia.</p>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Reveal delay={0} className="h-full"><OpenCard icon={Dumbbell} image="/guia-programa-treino.webp" imageAlt="Print de um programa de treino" title="Programas periodizados por nível e frequência,">criados por Anju. Você para de montar sessão e passa a executar sessão.</OpenCard></Reveal>
            <Reveal delay={60} className="h-full"><OpenCard icon={PlayCircle} image="/guia-execucao.webp" imageAlt="Print de um vídeo de execução" title="Biblioteca de execução.">Cada exercício gravado por Anju, com foco na ativação correta para o corpo feminino. É onde os cinco tipos de falha saem do papel e viram mão na barra.</OpenCard></Reveal>
            <Reveal delay={120} className="h-full"><OpenCard icon={ClipboardList} image="/guia-guia-treino.webp" imageAlt="Print do guia de treino" title="Guia de treino.">Zona de repetição, ordem dos exercícios, série preparatória e modo foco.</OpenCard></Reveal>
            <Reveal delay={180} className="h-full"><OpenCard icon={LayoutGrid} image="/guia-metodo.webp" imageAlt="Print da biblioteca do método" title="Método T.E.M.P.L.O. completo.">Seis pilares, setenta e um subtópicos, em biblioteca livre.</OpenCard></Reveal>
            <Reveal delay={240} className="h-full"><OpenCard icon={Activity} image="/guia-mobilidade.webp" imageAlt="Print de uma rotina de mobilidade" title="Rotinas de mobilidade,">por grupo muscular, como higiene do movimento.</OpenCard></Reveal>
            <Reveal delay={300} className="h-full"><OpenCard icon={Users} image="/guia-alianca.webp" imageAlt="Print da comunidade A Aliança" title="A Aliança.">A comunidade onde as Aliadas sustentam a constância umas das outras.</OpenCard></Reveal>
          </div>

          {/* Banda de bônus — brilho dourado, eco de /singular e /guia/obrigado */}
          <Reveal variant="scale" delay={100}>
            <div className="relative flex flex-col gap-5 overflow-hidden rounded-3xl bg-gradient-to-br from-gold-100 via-cream-50 to-gold-100 px-8 py-10 text-center md:px-14 md:py-12">
              <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-shine bg-gradient-to-r from-transparent via-white/50 to-transparent" />
              <span className="relative mx-auto inline-flex items-center rounded-full border border-gold-500/40 bg-white/50 px-4 py-2 text-caption uppercase tracking-wider text-gold-700">
                Bônus
              </span>
              <p className="relative mx-auto max-w-2xl text-body-lg text-graphite-900/75">
                Alongamentos Conscientes, cinco aulas guiadas. Mentalidade de Treino Intencional, quatro
                micro-aulas sobre constância e procrastinação.
              </p>
              <p className="relative text-h4 text-graphite-900">
                Tudo isso hoje, por zero.
              </p>
              <p className="relative text-body text-graphite-900/60">
                R$ 127 por mês a partir do trigésimo primeiro dia, se você quiser continuar.
              </p>
            </div>
          </Reveal>

          <Reveal className="flex flex-col items-center gap-4">
            <CtaRow tone="light" primaryLabel="Sim, quero meus trinta dias grátis" />
          </Reveal>
        </div>
      </section>

      {/* ------------------------------- BLOCO 2 · POR QUE NÃO SE REPETE */}
      <section className="relative overflow-hidden border-t border-cream-100/10 py-20 md:py-28">
        <div className="pointer-events-none absolute -top-32 right-[10%] size-[28rem] animate-drift rounded-full bg-gold-300/10 blur-3xl" aria-hidden />
        <div className="container relative max-w-3xl">
          <Reveal><h2 className="mb-8 text-h2 text-cream-100">Por que esta condição não se repete</h2></Reveal>
          <Reveal delay={100}>
            <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-gold-400/30 bg-gold-300/5 p-8 text-body-lg text-cream-100/70">
              <p>O Plano Templo continua existindo depois desta página. Você pode assiná-lo quando quiser, pagando desde o primeiro dia. Os trinta dias abertos não são a porta permanente. Eles existem por uma razão específica, e ela é você: acabou de ir atrás da técnica por trás do próprio treino, e quase ninguém faz isso. É a essa decisão que a condição responde, e é agora que ela está de pé. Feche esta página, e ela não reabre.</p>
            </div>
          </Reveal>
          <Reveal delay={150} className="mt-6">
            <Callout>Os próximos trinta dias vão passar de um jeito ou de outro. Você vai treinar amanhã, na semana que vem, no mês que vem. A única questão é se esse ciclo vai ser mais um dos que você já viveu, ou o primeiro que foi desenhado. Adiar não conserva a decisão. Adiar gasta um ciclo.</Callout>
          </Reveal>
        </div>
      </section>

      {/* --------------------------------------------------- MARQUEE + FECHAMENTO */}
      <MarqueeBand />

      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-[36rem] -translate-x-1/2 -translate-y-1/2 animate-float-slow rounded-full bg-sage-400/15 blur-3xl" aria-hidden />
        <div className="container relative flex max-w-3xl flex-col items-center gap-6 text-center">
          <Reveal className="flex flex-col gap-4">
            <h2 className="text-h2 text-cream-100">Você não chegou até aqui por falta de vontade.</h2>
            <p className="text-body-lg text-cream-100/70">
              Chegou por excesso dela, gasta no lugar errado. Hoje você não paga nada, não assina nada,
              não justifica nada. Entra, treina, e no fim de trinta dias tem a sua própria resposta,
              tirada do seu corpo, e não da minha promessa. O único risco desta página é sair dela e
              continuar exatamente onde estava.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <p className="font-display text-h2 text-cream-100">Seu corpo em movimento,<br className="hidden md:block" /> seu poder em liberdade.</p>
          </Reveal>
          <Reveal delay={150} className="flex flex-col items-center gap-4">
            <CtaPill label="Sim, quero meus trinta dias abertos" href={LINK_CHECKOUT_TEMPLO_TRIAL} />
            <a
              href={LINK_CHECKOUT_TEMPLO_NORMAL}
              className="text-caption text-cream-100/45 underline underline-offset-4 transition-colors hover:text-cream-100/70"
            >
              Não, obrigada. Prefiro gastar mais um ciclo decidindo sozinha.
            </a>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-cream-100/10 py-10">
        <div className="container flex justify-center">
          <img src="/logo-anju.svg" alt="Anju Mace" loading="lazy" className="h-3.5 w-auto opacity-50" />
        </div>
      </footer>
    </main>
  )
}
