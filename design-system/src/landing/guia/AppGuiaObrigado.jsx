import { ArrowRight, ClipboardCheck, FileEdit, Video, RotateCcw, Route, PenLine, AlertTriangle } from 'lucide-react'
import { Reveal } from '../singular/Reveal'
import { ImagePlaceholder } from '../singular/ImagePlaceholder'

/* Página de obrigado / venda do Plano Templo Singular (/guia/obrigado).
   Copy verbatim do documento do funil (Página de Obrigado · Venda).
   Garantia CORRIGIDA pra 7 dias (o doc original se contradizia: "Quinze
   dias para conhecer..." seguido de "Você tem 7 dias para decidir" —
   decisão da All Hands 15/07: Templo = 15 dias, Singular = 7 dias).
   Vocabulário visual emprestado de /singular (orbes, painel-assinatura,
   marquee, banda de bônus) pra não ficar uma sequência monótona de blocos
   de texto — feedback do usuário (16/07).
   Hero (dobra 1) ganha foto de fundo (bg-guiaobrigado-desktop/mobile.webp,
   crop próprio por breakpoint), mesmo tratamento de /guia — por isso os
   orbes decorativos saíram, a foto já carrega o peso visual — 20/07.
   Cards de "o que entra no Singular" ganham foto — os 6: método reaproveita
   foto que já existe em /singular (mesmo conteúdo); correção de execução
   reaproveita guia-guia-treino.webp de /guia/download (mesma foto, pedido do
   usuário); ficha, alongamentos, reavaliação e leitura do corpo têm foto
   própria (guia-ficha.webp, guia-alongamentos.webp, guia-reavaliacao.webp,
   guia-avaliacao.webp) — 20/07. IncludeCard mantém o fallback ImagePlaceholder
   pra qualquer item futuro sem foto ainda. */

// Link real de checkout na Circle (planilha "Ofertas na Circle", 20/07).
const LINK_CHECKOUT_SINGULAR = 'https://anju-mace.circle.so/checkout/plano-templo-singular'
const LINK_GUIA_DOWNLOAD = '/guia/download'

const gradient =
  'bg-gradient-to-r from-sage-400 via-cream-200 to-sage-500 bg-[length:200%_100%] bg-left hover:bg-right text-graphite-900 shadow-md hover:shadow-lg transition-[background-position,box-shadow,transform] duration-slow ease-out'

function CtaPill({ label, href }) {
  return (
    <a
      href={href}
      className={`group flex min-h-16 w-full min-w-0 max-w-sm items-center gap-2.5 rounded-full py-2 pl-5 pr-2 font-medium uppercase tracking-normal sm:h-16 sm:w-auto sm:gap-3 sm:pl-6 sm:tracking-wide md:gap-4 md:pl-8 ${gradient}`}
    >
      <span className="flex-1 text-center text-sm leading-tight sm:whitespace-nowrap md:text-base">{label}</span>
      <span className="inline-grid size-12 shrink-0 place-items-center rounded-full bg-cream-100/80 text-graphite-900 transition-transform duration-moderate ease-spring group-hover:translate-x-0.5">
        <ArrowRight className="size-5" strokeWidth={1.5} aria-hidden />
      </span>
    </a>
  )
}

/** Par primário+secundário repetido ao fim de cada bloco — o "não" sempre
    visível ao lado do "sim", nunca escondido. Sem <div> próprio (fragment):
    quem chama precisa envolver em flex flex-col items-center — um wrapper
    extra aqui quebrava a base percentual do w-full do CtaPill no mobile. */
function CtaRow({ tone = 'dark', secondaryLabel = 'Não, quero apenas o e-book', secondaryHref = LINK_GUIA_DOWNLOAD }) {
  const light = tone === 'light'
  return (
    <>
      <CtaPill label="Quero a leitura do meu corpo" href={LINK_CHECKOUT_SINGULAR} />
      <a
        href={secondaryHref}
        className={`text-caption underline underline-offset-4 transition-colors ${light ? 'text-graphite-900/45 hover:text-graphite-900/70' : 'text-cream-100/45 hover:text-cream-100/70'}`}
      >
        {secondaryLabel}
      </a>
    </>
  )
}

/** Card do "você não sabe" — grid 3 col no lugar de parágrafos empilhados.
    h-full: o Reveal que envolve já estica pra altura da linha do grid, mas
    sem h-full aqui o card fica do tamanho do próprio texto — os 3 boxes da
    linha ficavam com altura diferente (pedido de harmonia do usuário 20/07). */
function FactCard({ children }) {
  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl border border-graphite-900/10 bg-cream-50 p-6 shadow-sm">
      <span className="h-0.5 w-6 bg-sage-500" aria-hidden />
      <p className="text-body text-graphite-900/75">{children}</p>
    </div>
  )
}

/** Tile numerado — os 4 movimentos do mecanismo, alternando sálvia/dourado
    (eco do FalhaCard da captura) + grid 2 col no desktop. h-full pelo mesmo
    motivo do FactCard acima. */
function StepTile({ n, title, children, accent = 'sage' }) {
  const gold = accent === 'gold'
  return (
    <div className={`flex h-full gap-5 rounded-2xl border p-6 ${gold ? 'border-gold-300/25 bg-gold-300/5' : 'border-sage-500/25 bg-sage-500/10'}`}>
      <span className={`grid size-12 shrink-0 place-items-center rounded-xl border font-display text-lg font-extralight ${gold ? 'border-gold-300/50 bg-gold-300/10 text-gold-300' : 'border-sage-500/50 bg-sage-500/15 text-sage-400'}`}>
        {n}
      </span>
      <p className="text-body text-cream-100/75">
        <strong className="font-medium text-cream-100">{title}</strong> {children}
      </p>
    </div>
  )
}

/** Card com ícone — os 6 itens "core" do que entra no Singular (grid 3 col,
    mesmo vocabulário do DeliverableCard de /guia/download). Foto real quando
    já existe (reaproveitada de /singular); senão, ImagePlaceholder. */
function IncludeCard({ icon: Icon, title, image, imageAlt = '', imageLabel, children }) {
  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl border border-graphite-900/10 bg-cream-50 p-6 shadow-sm">
      <span className="grid size-11 place-items-center rounded-full bg-sage-500/15 text-sage-700">
        <Icon className="size-5" strokeWidth={1.5} aria-hidden />
      </span>
      <p className="text-body text-graphite-900/75">
        <strong className="font-medium text-graphite-900">{title}</strong> {children}
      </p>
      {image ? (
        <img src={image} alt={imageAlt} loading="lazy" className="mt-auto aspect-[16/10] w-full rounded-xl object-cover" />
      ) : (
        <ImagePlaceholder
          label={imageLabel}
          size="1200 × 750 px · 16:10 · WebP"
          ratio="aspect-[16/10]"
          rounded="rounded-xl"
          className="mt-auto"
        />
      )}
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

/** Selo circular da garantia — "7D" no centro, texto curvo em volta ("GARANTIA
    DE 7 DIAS" repetido pra fechar o círculo) e traços radiais, como um selo. */
function GuaranteeBadge() {
  const size = 168
  const r = size / 2
  const textRadius = r - 22
  const ticks = Array.from({ length: 48 }, (_, i) => (360 / 48) * i)
  const ringText = 'GARANTIA DE 7 DIAS · '

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="shrink-0 text-sage-700">
      <defs>
        <path
          id="guarantee-ring"
          d={`M ${r - textRadius},${r} a ${textRadius},${textRadius} 0 1,1 ${textRadius * 2},0 a ${textRadius},${textRadius} 0 1,1 -${textRadius * 2},0`}
        />
      </defs>
      <g className="animate-spin-slow-reverse" style={{ transformOrigin: `${r}px ${r}px` }}>
        {ticks.map((angle) => (
          <line key={angle} x1={r} y1={4} x2={r} y2={12} stroke="currentColor" strokeWidth="1" opacity="0.4" transform={`rotate(${angle} ${r} ${r})`} />
        ))}
      </g>
      <g className="animate-spin-slow" style={{ transformOrigin: `${r}px ${r}px` }}>
        <text fontSize="7.5" letterSpacing="2.5" fill="currentColor" className="uppercase">
          <textPath href="#guarantee-ring" startOffset="0%">{ringText.repeat(3)}</textPath>
        </text>
      </g>
      <text x={r} y={r} textAnchor="middle" dominantBaseline="central" fontSize="44" fontWeight="300" fill="currentColor" className="font-display">
        7D
      </text>
    </svg>
  )
}

/** Faixa marquee — quebra o ritmo antes do fechamento, frases-síntese do
    Singular rolando em loop (mesmo padrão de MarqueeBand em /singular). */
const MARQUEE_PHRASES = ['Leitura do seu corpo', 'Prescrição individual', 'Ciclo bimestral', 'A Aliança', 'Método T.E.M.P.L.O.']

function MarqueeTrack({ hidden = false }) {
  return (
    <div aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {MARQUEE_PHRASES.map((phrase) => (
        <span key={phrase} className="flex items-center">
          <span className="whitespace-nowrap px-8 font-display text-lg font-light tracking-wide text-cream-100/70">{phrase}</span>
          <span className="size-1.5 shrink-0 rounded-full bg-sage-400/70" aria-hidden />
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

export function AppGuiaObrigado() {
  return (
    <main className="bg-graphite-950 text-cream-100">
      {/* --------------------------------------------------------- 1 · HERO */}
      <section className="relative flex min-h-dvh flex-col overflow-hidden">
        {/* Foto de fundo (arte própria por breakpoint) + véu grafite, mesmo
            tratamento do hero de /guia. */}
        <picture>
          <source media="(min-width: 768px)" srcSet="/bg-guiaobrigado-desktop.webp" />
          <img
            src="/bg-guiaobrigado-mobile.webp"
            alt=""
            aria-hidden
            className="absolute inset-0 size-full object-cover object-center"
          />
        </picture>
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-graphite-950" aria-hidden />
        <div className="relative z-10 flex justify-center pt-10 md:pt-12">
          <img src="/logo-anju.svg" alt="Anju Mace" className="h-4 w-auto animate-fade-in" />
        </div>
        <div className="container relative flex flex-1 flex-col items-center justify-center gap-8 py-16 text-center">
          <p className="animate-fade-in text-label text-sage-400">
            O e-book já está a caminho do seu e-mail
          </p>
          <h1 className="max-w-3xl animate-fade-in-up text-h1 text-[36px] text-cream-100 md:text-[62px] [animation-delay:120ms]">
            A teoria chega hoje. O corpo que vai recebê-la continua sem ninguém lendo<span className="text-sage-400">.</span>
          </h1>
          <p className="max-w-2xl animate-fade-in-up text-body-lg text-cream-100/75 [animation-delay:280ms]">
            Nas próximas semanas você vai treinar de qualquer forma.<br className="hidden md:block" />
            A pergunta que esta página faz é uma só: esse ciclo vai acontecer<br className="hidden md:block" />
            com uma prescrição feita para o seu corpo, ou vai ser mais um ciclo<br className="hidden md:block" />
            em que você aplica sozinha uma teoria escrita para todo mundo?
          </p>
          <div className="flex animate-fade-in-up flex-col items-center gap-4 [animation-delay:440ms]">
            <CtaRow />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- BLOCO 1 · A PONTE */}
      <section className="bg-cream-100 py-20 text-graphite-900 md:py-28">
        <div className="container flex max-w-3xl flex-col gap-8">
          <Reveal className="flex flex-col gap-4">
            <h2 className="text-h2 text-graphite-900">A teoria explica o padrão. Ninguém aplica o padrão no seu corpo por você.</h2>
          </Reveal>
          <Reveal delay={100} className="flex flex-col gap-4 text-body-lg text-graphite-900/70">
            <p>O guia vai mudar a forma como você observa a própria série. Você vai reconhecer a falha técnica no meio do agachamento, e vai saber a hora de encerrar.</p>
            <p>Só que observar sozinha tem um limite, e é sempre o mesmo: ninguém está olhando de fora.</p>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-3">
            <Reveal delay={150} className="h-full"><FactCard>Você não sabe se a sua lombar arredonda nas três últimas repetições.</FactCard></Reveal>
            <Reveal delay={220} className="h-full"><FactCard>Você não sabe qual dos seus encurtamentos está roubando amplitude do quadril.</FactCard></Reveal>
            <Reveal delay={290} className="h-full"><FactCard>Você não sabe se a ordem dos exercícios da sua sessão está gastando o seu sistema nervoso antes da hora.</FactCard></Reveal>
          </div>
          <Reveal delay={340}>
            <Callout tone="light">Nenhuma quantidade de leitura resolve isso, porque não é um problema de informação. É um problema de leitura. E leitura, alguém precisa fazer.</Callout>
          </Reveal>
          <Reveal delay={380} className="flex flex-col items-center gap-4">
            <CtaRow tone="light" />
          </Reveal>
        </div>
      </section>

      {/* -------------------------------------------- BLOCO 2 · O MECANISMO */}
      <section className="relative overflow-hidden border-t border-cream-100/10 py-20 md:py-28">
        <div className="pointer-events-none absolute -top-32 left-[8%] size-[28rem] animate-drift rounded-full bg-gold-300/10 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-40 right-[6%] size-[32rem] animate-drift-slow rounded-full bg-sage-500/10 blur-3xl" aria-hidden />
        <div className="container relative flex max-w-3xl flex-col gap-8">
          <Reveal className="flex flex-col gap-4">
            <h2 className="text-h2 text-cream-100">Receber um treino não é ter um treino feito para você.</h2>
            <p className="text-body-lg text-cream-100/70">
              Nada de catálogo. Nada de formulário automático que cospe uma ficha. Quatro movimentos, na ordem:
            </p>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            <Reveal delay={0} className="h-full"><StepTile n="1" title="Leitura.">Avaliação individual completa: formulário, fotos composicionais e testes funcionais, antes de qualquer exercício ser prescrito.</StepTile></Reveal>
            <Reveal delay={80} className="h-full"><StepTile n="2" accent="gold" title="Prescrição.">Ficha desenhada do zero por Anju, a partir do seu corpo e da prioridade que você declara.</StepTile></Reveal>
            <Reveal delay={160} className="h-full"><StepTile n="3" title="Execução.">Você envia o vídeo, recebe a correção. Biblioteca de execução gravada pela própria Anju.</StepTile></Reveal>
            <Reveal delay={240} className="h-full"><StepTile n="4" accent="gold" title="Releitura.">Reavaliação ao fim do ciclo. A prescrição evolui porque o seu corpo evoluiu.</StepTile></Reveal>
          </div>
          <Reveal delay={300} className="flex flex-col items-center gap-4">
            <CtaRow />
          </Reveal>
        </div>
      </section>

      {/* --------------------------------- BLOCO 3 · O QUE ENTRA NO SINGULAR */}
      <section className="bg-cream-100 py-20 text-graphite-900 md:py-28">
        <div className="container flex max-w-5xl flex-col gap-10">
          <Reveal className="flex max-w-3xl flex-col gap-4">
            <h2 className="text-h2 text-graphite-900">O que entra no Plano Templo Singular</h2>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Reveal delay={0} className="h-full"><IncludeCard icon={ClipboardCheck} image="/guia-avaliacao.webp" imageAlt="Formulário e fotos da avaliação inicial" title="Leitura do seu corpo.">Formulário, fotos e testes funcionais, antes de qualquer exercício.</IncludeCard></Reveal>
            <Reveal delay={60} className="h-full"><IncludeCard icon={FileEdit} image="/guia-ficha.webp" imageAlt="Aluna conferindo a ficha da Prescrição Singular pelo celular" title="Ficha prescrita do zero por Anju.">Construída a partir do seu corpo e da sua prioridade, nunca escolhida de um catálogo.</IncludeCard></Reveal>
            <Reveal delay={120} className="h-full"><IncludeCard icon={RotateCcw} image="/guia-alongamentos.webp" imageAlt="Tabela de Alongamentos Conscientes" title="Alongamentos Conscientes prescrito.">Protocolo de mobilidade desenhado para os seus encurtamentos, mapeados na avaliação.</IncludeCard></Reveal>
            <Reveal delay={180} className="h-full"><IncludeCard icon={Video} image="/guia-guia-treino.webp" imageAlt="Vídeo de execução com a correção de Anju" title="Correção de execução.">Você envia o vídeo, recebe a análise, com foco na ativação correta para o corpo feminino.</IncludeCard></Reveal>
            <Reveal delay={240} className="h-full"><IncludeCard icon={ClipboardCheck} image="/guia-reavaliacao.webp" imageAlt="Anju analisando a reavaliação de uma aluna" title="Reavaliação e relatório ao fim do ciclo.">Ponto de partida e ponto de chegada, lado a lado.</IncludeCard></Reveal>
            <Reveal delay={300} className="h-full"><IncludeCard icon={Route} image="/guia-metodo.webp" imageAlt="As aulas dos pilares do método T.E.M.P.L.O." title="Método T.E.M.P.L.O. em trilha guiada.">Os seis pilares sequenciados conforme a sua fase, com alguém do time validando cada avanço.</IncludeCard></Reveal>
          </div>

          {/* Banda de suporte + bônus — brilho dourado, eco da banda-bônus de /singular */}
          <Reveal variant="scale" delay={100}>
            <div className="relative flex flex-col gap-5 overflow-hidden rounded-3xl bg-gradient-to-br from-gold-100 via-cream-50 to-gold-100 px-8 py-10 text-center md:px-14 md:py-12">
              <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-shine bg-gradient-to-r from-transparent via-white/50 to-transparent" />
              <span className="relative mx-auto inline-flex items-center rounded-full border border-gold-500/40 bg-white/50 px-4 py-2 text-caption uppercase tracking-wider text-gold-700">
                E além da ficha
              </span>
              <div className="relative grid gap-6 text-left md:grid-cols-3">
                <p className="text-body text-graphite-900/75"><strong className="font-medium text-graphite-900">Suporte para dúvidas,</strong> ao longo do ciclo inteiro.</p>
                <p className="text-body text-graphite-900/75"><strong className="font-medium text-graphite-900">Hot Seat com Anju, e a Aliança completa.</strong> Contato direto com quem criou o método, numa comunidade que se reconhece pelo padrão, não pelo número de matrícula.</p>
                <p className="text-body text-graphite-900/75"><strong className="font-medium text-graphite-900">Bônus: Mentalidade de Treino Intencional.</strong> Quatro micro-aulas sobre constância, procrastinação e os desafios que aparecem no caminho.</p>
              </div>
            </div>
          </Reveal>

          <Reveal className="flex flex-col items-center gap-4">
            <CtaRow tone="light" />
          </Reveal>
        </div>
      </section>

      {/* --------------------------------------- BLOCO 4 · QUEM LÊ SEU CORPO */}
      <section className="border-t border-cream-100/10 py-20 md:py-28">
        <div className="container grid max-w-5xl items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <Reveal variant="left" className="relative mx-auto w-full max-w-sm lg:mx-0">
            <span aria-hidden className="absolute -left-3 -top-3 size-16 rounded-tl-3xl border-l-2 border-t-2 border-gold-400/60" />
            <span aria-hidden className="absolute -bottom-3 -right-3 size-16 rounded-br-3xl border-b-2 border-r-2 border-gold-400/60" />
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-graphite-900 shadow-xl">
              <img src="/landing/bioanju-desktop.webp" alt="Anju Mace" loading="lazy" className="absolute inset-0 size-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 bg-gradient-to-t from-graphite-950/90 via-graphite-950/40 to-transparent px-6 pb-6 pt-20 text-center">
                <span className="h-px w-12 bg-gold-400/60" aria-hidden />
                <p className="font-display text-lg tracking-wider text-cream-100"><span className="font-bold">ANJU</span> <span className="font-light">MACE</span></p>
                <p className="text-label text-cream-100/50">CREF 021553-G/DF</p>
              </div>
            </div>
          </Reveal>

          <div className="flex flex-col gap-5">
            <Reveal variant="right" className="flex flex-col gap-4">
              <h2 className="text-h2 text-cream-100">Quem lê o seu corpo</h2>
              <p className="text-body-lg text-cream-100">É Anju. Não é software. Não é formulário automático. Não é estagiário com planilha.</p>
            </Reveal>
            <Reveal variant="right" delay={100} className="flex flex-col gap-4 text-body-lg text-cream-100/70">
              <p>É Anju quem lê a sua avaliação, quem prescreve a sua ficha, quem corrige o seu vídeo e quem relê o seu corpo no fim do ciclo.</p>
              <p>E é exatamente por isso que existe um limite. Cada leitura passa, uma a uma, pelas mãos dela. Não há como acelerar isso sem quebrar o que faz o produto funcionar.</p>
            </Reveal>
            <Reveal variant="right" delay={150}>
              <Callout>O número de corpos que entram por ciclo é o número de corpos que cabem no tempo de uma pessoa. Não é tática de vendas. É aritmética.</Callout>
            </Reveal>
            <Reveal variant="right" delay={180} className="flex items-center gap-3 text-h5 text-cream-100">
              <span className="inline-grid size-10 shrink-0 place-items-center rounded-full bg-sage-500/15 text-sage-400">
                <PenLine className="size-5" strokeWidth={1.5} aria-hidden />
              </span>
              Prescrição assinada individualmente.
            </Reveal>
            <Reveal delay={220} className="flex flex-col items-start gap-4">
              <CtaRow />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ BLOCO 5 · GARANTIA */}
      <section className="relative overflow-hidden bg-cream-100 py-20 text-graphite-900 md:py-28">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-[32rem] -translate-x-1/2 -translate-y-1/2 animate-float-slow rounded-full bg-sage-400/10 blur-3xl" aria-hidden />
        <div className="container relative flex max-w-3xl flex-col gap-8">
          <Reveal className="flex flex-col gap-4">
            <h2 className="text-h2 text-graphite-900">A garantia</h2>
          </Reveal>
          <Reveal delay={100}>
            <div className="flex flex-col items-center gap-8 rounded-3xl border border-graphite-900/10 bg-cream-50 p-8 shadow-sm md:flex-row md:justify-between md:gap-10 md:p-10">
              <div className="flex flex-col gap-3 text-center md:text-left">
                <h3 className="text-h3 text-graphite-900">
                  <span className="text-sage-700">Sete dias</span> para conhecer o método por dentro.
                </h3>
                <p className="text-body-lg text-graphite-900/70">
                  Se concluir que não era para você, o investimento volta, sem burocracia. Você tem
                  sete dias para decidir se fica.
                </p>
              </div>
              <GuaranteeBadge />
            </div>
          </Reveal>
          <Reveal delay={150} className="text-body-lg text-graphite-900/70">
            <p>O seu corpo não tem sete dias parado esperando essa decisão: ele vai treinar de um jeito ou de outro.</p>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------- BLOCO 6 · POR QUE NÃO VOLTA
          Moldura de urgência: ícone de alerta pulsando, borda sólida com glow
          dourado e o mesmo "shine" das bandas de bônus, no lugar da caixa
          tracejada neutra — pedido do usuário (20/07), copy inalterada. */}
      <section className="border-t border-cream-100/10 py-20 md:py-28">
        <div className="container max-w-3xl">
          <Reveal className="mb-8 flex items-center gap-3">
            <span className="inline-grid size-10 shrink-0 animate-pulse place-items-center rounded-full bg-gold-400/15 text-gold-300">
              <AlertTriangle className="size-5" strokeWidth={1.5} aria-hidden />
            </span>
            <h2 className="text-h2 text-cream-100">Por que esta página não volta</h2>
          </Reveal>
          <Reveal delay={100}>
            <div className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-gold-400/40 bg-gold-300/5 p-8 text-body-lg text-cream-100/70 shadow-lg shadow-gold-500/10">
              <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-shine bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <p className="relative">O caminho para o Singular continua existindo depois daqui, pelo canal de sempre. O que não volta é este momento. Você acabou de ir atrás da teoria por trás dos seus treinos, e essa é uma decisão que quase ninguém toma. É a esse tipo de mulher que a leitura individual responde, e é agora que a porta está aberta na sua frente, sem que você precise procurar por ela.</p>
              <p className="relative">Some a isso o limite do bloco anterior: as leituras de cada ciclo cabem no tempo de uma pessoa só, e elas se preenchem na ordem em que chegam. Não estou pedindo pressa. Estou dizendo que a espera tem um preço, e que ele é pago em ciclos de treino.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* --------------------------------------------------- MARQUEE + FECHAMENTO */}
      <MarqueeBand />

      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-[36rem] -translate-x-1/2 -translate-y-1/2 animate-float-slow rounded-full bg-gold-400/15 blur-3xl" aria-hidden />
        <div className="container relative flex max-w-3xl flex-col items-center gap-6 text-center">
          <Reveal className="flex flex-col gap-4">
            <h2 className="text-h2 text-cream-100">O seu corpo sempre foi singular. O que falta é alguém lendo essa singularidade.</h2>
            <p className="text-body-lg text-cream-100/70">
              Você já deu o primeiro passo. O segundo é maior, e é o único que muda o próximo ciclo: em
              vez de aplicar sozinha uma teoria feita para todos os corpos, treinar a partir de uma
              leitura real do seu.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <p className="font-display text-h2 text-cream-100">O treino é onde se começa.<br className="hidden md:block" /> O templo é onde se chega.</p>
          </Reveal>
          <Reveal delay={150} className="flex flex-col items-center gap-4">
            <CtaPill label="Quero a leitura do meu corpo" href={LINK_CHECKOUT_SINGULAR} />
            <a
              href={LINK_GUIA_DOWNLOAD}
              className="text-caption text-cream-100/45 underline underline-offset-4 transition-colors hover:text-cream-100/70"
            >
              Prefiro conhecer o Plano Templo primeiro
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
