import { ArrowRight } from 'lucide-react'
import { Reveal } from '../singular/Reveal'

/* Página de obrigado / venda do Plano Templo Singular (/guia/obrigado).
   Copy verbatim do documento do funil (Página de Obrigado · Venda).
   Garantia CORRIGIDA pra 7 dias (o doc original se contradizia: "Quinze
   dias para conhecer..." seguido de "Você tem 7 dias para decidir" —
   decisão da All Hands 15/07: Templo = 15 dias, Singular = 7 dias). */

// TODO: trocar pelo link real de checkout do Plano Templo Singular quando existir.
const LINK_CHECKOUT_SINGULAR = '#checkout-singular'
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
function CtaRow({ tone = 'dark', secondaryLabel = 'Não, quero apenas o e-book', secondaryHref = '#' }) {
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

/** Tile numerado — os 4 movimentos do mecanismo (Leitura/Prescrição/Execução/Releitura). */
function StepTile({ n, title, children }) {
  return (
    <div className="flex gap-5 rounded-2xl border border-cream-100/10 bg-cream-100/5 p-6">
      <span className="grid size-12 shrink-0 place-items-center rounded-full border border-sage-500/50 bg-graphite-950 font-display text-lg font-extralight text-sage-400">
        {n}
      </span>
      <p className="text-body text-cream-100/75">
        <strong className="font-medium text-cream-100">{title}</strong> {children}
      </p>
    </div>
  )
}

/** Trilha vertical numerada — o que entra no Plano Templo Singular (9 itens),
    mesmo padrão do Fechamento de /guia/download. */
function TrilhaItem({ n, total, title, children }) {
  return (
    <Reveal delay={n * 40} className="relative flex gap-5 pb-8 last:pb-0">
      {n < total && <span className="absolute left-5 top-10 bottom-0 w-px bg-graphite-900/15" aria-hidden />}
      <span className="relative z-10 grid size-10 shrink-0 place-items-center rounded-full border border-sage-600/50 bg-cream-100 font-display text-sm font-extralight text-sage-700">
        {String(n).padStart(2, '0')}
      </span>
      <p className="pt-2 text-body text-graphite-900/70">
        <strong className="font-medium text-graphite-900">{title}</strong> {children}
      </p>
    </Reveal>
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
      {ticks.map((angle) => (
        <line key={angle} x1={r} y1={4} x2={r} y2={12} stroke="currentColor" strokeWidth="1" opacity="0.4" transform={`rotate(${angle} ${r} ${r})`} />
      ))}
      <text fontSize="7.5" letterSpacing="1.5" fill="currentColor" className="uppercase">
        <textPath href="#guarantee-ring" startOffset="0%">{ringText.repeat(2)}</textPath>
      </text>
      <text x={r} y={r} textAnchor="middle" dominantBaseline="central" fontSize="36" fontWeight="300" fill="currentColor" className="font-display">
        7D
      </text>
    </svg>
  )
}

export function AppGuiaObrigado() {
  return (
    <main className="bg-graphite-950 text-cream-100">
      {/* --------------------------------------------------------- 1 · HERO */}
      <section className="relative flex min-h-dvh flex-col overflow-hidden">
        <div className="pointer-events-none absolute -right-32 top-1/3 size-96 animate-float-slow rounded-full bg-sage-500/15 blur-3xl" aria-hidden />
        <div className="relative z-10 flex justify-center pt-10 md:pt-12">
          <img src="/logo-anju.svg" alt="Anju Mace" className="h-4 w-auto animate-fade-in" />
        </div>
        <div className="container relative flex flex-1 flex-col items-center justify-center gap-8 py-16 text-center">
          <p className="animate-fade-in text-caption uppercase tracking-wider text-sage-400">
            O e-book Os cinco tipos de falha já está a caminho do seu e-mail.
          </p>
          <h1 className="max-w-3xl animate-fade-in-up text-h1 text-[36px] text-cream-100 md:text-[62px] [animation-delay:120ms]">
            A teoria chega hoje. O corpo que vai recebê-la continua sem ninguém lendo<span className="text-sage-400">.</span>
          </h1>
          <p className="max-w-2xl animate-fade-in-up text-body-lg text-cream-100/75 [animation-delay:280ms]">
            Nas próximas semanas você vai treinar de qualquer forma. A pergunta que esta página faz é uma
            só: esse ciclo vai acontecer com uma prescrição feita para o seu corpo, ou vai ser mais um
            ciclo em que você aplica sozinha uma teoria escrita para todo mundo?
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
          <Reveal delay={150} className="flex flex-col gap-2 text-body-lg text-graphite-900/70">
            <p>Você não sabe se a sua lombar arredonda nas três últimas repetições.</p>
            <p>Você não sabe qual dos seus encurtamentos está roubando amplitude do quadril.</p>
            <p>Você não sabe se a ordem dos exercícios da sua sessão está gastando o seu sistema nervoso antes da hora.</p>
          </Reveal>
          <Reveal delay={200}>
            <Callout tone="light">Nenhuma quantidade de leitura resolve isso, porque não é um problema de informação. É um problema de leitura. E leitura, alguém precisa fazer.</Callout>
          </Reveal>
          <Reveal delay={250} className="flex flex-col items-center gap-4">
            <CtaRow tone="light" />
          </Reveal>
        </div>
      </section>

      {/* -------------------------------------------- BLOCO 2 · O MECANISMO */}
      <section className="border-t border-cream-100/10 py-20 md:py-28">
        <div className="container flex max-w-3xl flex-col gap-8">
          <Reveal className="flex flex-col gap-4">
            <h2 className="text-h2 text-cream-100">Receber um treino não é ter um treino feito para você.</h2>
            <p className="text-body-lg text-cream-100/70">
              Nada de catálogo. Nada de formulário automático que cospe uma ficha. Quatro movimentos, na ordem:
            </p>
          </Reveal>
          <div className="flex flex-col gap-4">
            <Reveal delay={0}><StepTile n="1" title="Leitura.">Avaliação individual completa: formulário, fotos composicionais e testes funcionais, antes de qualquer exercício ser prescrito.</StepTile></Reveal>
            <Reveal delay={80}><StepTile n="2" title="Prescrição.">Ficha desenhada do zero por Anju, a partir do seu corpo e da prioridade que você declara.</StepTile></Reveal>
            <Reveal delay={160}><StepTile n="3" title="Execução.">Você envia o vídeo, recebe a correção. Biblioteca de execução gravada pela própria Anju.</StepTile></Reveal>
            <Reveal delay={240}><StepTile n="4" title="Releitura.">Reavaliação ao fim do ciclo. A prescrição evolui porque o seu corpo evoluiu.</StepTile></Reveal>
          </div>
          <Reveal delay={300} className="flex flex-col items-center gap-4">
            <CtaRow />
          </Reveal>
        </div>
      </section>

      {/* --------------------------------- BLOCO 3 · O QUE ENTRA NO SINGULAR */}
      <section className="bg-cream-100 py-20 text-graphite-900 md:py-28">
        <div className="container flex max-w-3xl flex-col gap-10">
          <Reveal className="flex flex-col gap-4">
            <h2 className="text-h2 text-graphite-900">O que entra no Plano Templo Singular</h2>
          </Reveal>
          <div className="flex flex-col">
            {[
              ['Leitura do seu corpo.', 'Formulário, fotos e testes funcionais, antes de qualquer exercício.'],
              ['Ficha prescrita do zero por Anju.', 'Construída a partir do seu corpo e da sua prioridade, nunca escolhida de um catálogo.'],
              ['Alongamentos Conscientes prescrito.', 'Protocolo de mobilidade desenhado para os seus encurtamentos, mapeados na avaliação.'],
              ['Correção de execução.', 'Você envia o vídeo, recebe a análise, com foco na ativação correta para o corpo feminino.'],
              ['Reavaliação e relatório ao fim do ciclo.', 'Ponto de partida e ponto de chegada, lado a lado.'],
              ['Método T.E.M.P.L.O. em trilha guiada.', 'Os seis pilares sequenciados conforme a sua fase, com alguém do time validando cada avanço.'],
              ['Suporte para dúvidas,', 'ao longo do ciclo inteiro.'],
              ['Hot Seat com Anju, e a Aliança completa.', 'Contato direto com quem criou o método, numa comunidade que se reconhece pelo padrão, não pelo número de matrícula.'],
              ['Bônus: Mentalidade de Treino Intencional.', 'Quatro micro-aulas sobre constância, procrastinação e os desafios que aparecem no caminho.'],
            ].map(([t, d], i, arr) => (
              <TrilhaItem key={t} n={i + 1} total={arr.length} title={t}>{d}</TrilhaItem>
            ))}
          </div>
          <Reveal className="flex flex-col items-center gap-4">
            <CtaRow tone="light" />
          </Reveal>
        </div>
      </section>

      {/* --------------------------------------- BLOCO 4 · QUEM LÊ SEU CORPO */}
      <section className="border-t border-cream-100/10 py-20 md:py-28">
        <div className="container flex max-w-3xl flex-col gap-8">
          <Reveal className="flex flex-col gap-4">
            <h2 className="text-h2 text-cream-100">Quem lê o seu corpo</h2>
            <p className="text-body-lg text-cream-100">É Anju. Não é software. Não é formulário automático. Não é estagiário com planilha.</p>
          </Reveal>
          <Reveal delay={100} className="flex flex-col gap-4 text-body-lg text-cream-100/70">
            <p>É Anju quem lê a sua avaliação, quem prescreve a sua ficha, quem corrige o seu vídeo e quem relê o seu corpo no fim do ciclo.</p>
            <p>E é exatamente por isso que existe um limite. Cada leitura passa, uma a uma, pelas mãos dela. Não há como acelerar isso sem quebrar o que faz o produto funcionar.</p>
          </Reveal>
          <Reveal delay={150}>
            <Callout>O número de corpos que entram por ciclo é o número de corpos que cabem no tempo de uma pessoa. Não é tática de vendas. É aritmética.</Callout>
          </Reveal>
          <Reveal delay={200} className="flex flex-col items-center gap-4">
            <CtaRow />
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------ BLOCO 5 · GARANTIA */}
      <section className="bg-cream-100 py-20 text-graphite-900 md:py-28">
        <div className="container flex max-w-3xl flex-col gap-8">
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

      {/* ---------------------------------------- BLOCO 6 · POR QUE NÃO VOLTA */}
      <section className="border-t border-cream-100/10 py-20 md:py-28">
        <div className="container flex max-w-3xl flex-col gap-4 text-body-lg text-cream-100/70">
          <Reveal><h2 className="text-h2 text-cream-100">Por que esta página não volta</h2></Reveal>
          <Reveal delay={100}>
            <p>O caminho para o Singular continua existindo depois daqui, pelo canal de sempre. O que não volta é este momento. Você acabou de ir atrás da teoria por trás dos seus treinos, e essa é uma decisão que quase ninguém toma. É a esse tipo de mulher que a leitura individual responde, e é agora que a porta está aberta na sua frente, sem que você precise procurar por ela.</p>
          </Reveal>
          <Reveal delay={150}>
            <p>Some a isso o limite do bloco anterior: as leituras de cada ciclo cabem no tempo de uma pessoa só, e elas se preenchem na ordem em que chegam. Não estou pedindo pressa. Estou dizendo que a espera tem um preço, e que ele é pago em ciclos de treino.</p>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------- FECHAMENTO */}
      <section className="border-t border-cream-100/10 py-20 md:py-28">
        <div className="container flex max-w-3xl flex-col items-center gap-6 text-center">
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
