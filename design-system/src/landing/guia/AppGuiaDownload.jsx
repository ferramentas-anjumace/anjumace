import { ArrowRight, Download, LayoutGrid, Dumbbell, PlayCircle, ClipboardList, Activity, Users, Gift } from 'lucide-react'
import { Reveal } from '../singular/Reveal'
import { Typewriter } from '../singular/Typewriter'
import { EntregaveisList, EntregaveisCarousel } from './Entregaveis'
import { Nav } from './Nav'

/* Página de entrega do guia (/guia/download).
   Copy verbatim do documento do funil (Página de Entrega da Recompensa):
   dobra 0 entrega o PDF; dobras 1-5 apresentam o método e os quatro pilares
   que o guia não cobre; fechamento vende o Plano Templo. */

// Link real de checkout na Circle (planilha "Ofertas na Circle", 20/07) —
// mesma oferta do CTA "Templo normal" em /guia/templo.
const LINK_CHECKOUT_TEMPLO = 'https://anju-mace.circle.so/checkout/plano-templo'

const NAV_LINKS = [
  { label: 'Início', href: '#inicio' },
  { label: 'O Método', href: '#metodo' },
  { label: 'O que você recebe', href: '#entregaveis' },
]

const gradient =
  'bg-gradient-to-r from-sage-400 via-cream-200 to-sage-500 bg-[length:200%_100%] bg-left hover:bg-right text-graphite-900 shadow-md hover:shadow-lg transition-[background-position,box-shadow,transform] duration-slow ease-out'

function CtaPill({ label, href, download = false, icon: Icon = ArrowRight, size = 'md' }) {
  const lg = size === 'lg'
  const Comp = href ? 'a' : 'div'
  return (
    <Comp
      href={href}
      download={href && download ? true : undefined}
      className={`group flex ${lg ? 'h-20 max-w-md' : 'h-16 max-w-sm'} w-full items-center gap-2.5 rounded-full py-2 ${lg ? 'pl-7' : 'pl-5'} pr-2 font-medium uppercase tracking-normal sm:w-auto sm:gap-3 ${lg ? 'sm:pl-9' : 'sm:pl-6'} sm:tracking-wide md:gap-4 ${lg ? 'md:pl-10' : 'md:pl-8'} ${gradient}`}
    >
      <span className={`flex-1 whitespace-nowrap text-center ${lg ? 'text-base md:text-lg' : 'text-sm md:text-base'}`}>{label}</span>
      <span className={`inline-grid ${lg ? 'size-14' : 'size-12'} shrink-0 place-items-center rounded-full bg-cream-100/80 text-graphite-900 transition-transform duration-moderate ease-spring group-hover:translate-x-0.5`}>
        <Icon className={lg ? 'size-6' : 'size-5'} strokeWidth={1.5} aria-hidden />
      </span>
    </Comp>
  )
}

/** Tile de letra do método — eco dos numerais do e-book. */
function LetterTile({ letter, active = false, tone = 'light' }) {
  const light = tone === 'light'
  if (active) {
    return (
      <span className={`grid size-11 shrink-0 place-items-center rounded-full border font-display text-base font-semibold ${light ? 'border-sage-600/60 bg-sage-500/15 text-sage-700' : 'border-sage-500/50 bg-sage-500/15 text-sage-400'}`}>
        {letter}
      </span>
    )
  }
  return (
    <span className={`grid size-11 shrink-0 place-items-center rounded-full border font-display text-base font-semibold ${light ? 'border-graphite-900/15 bg-graphite-900/5 text-graphite-900/60' : 'border-cream-100/15 bg-cream-100/5 text-cream-100/60'}`}>
      {letter}
    </span>
  )
}

/** Card de grupo de letras — tiles + rótulo "X de Nome" no topo, a frase do
    documento em destaque abaixo. Copy verbatim: cada card usa exatamente a(s)
    frase(s) do documento, sem headline emprestado de outra seção. */
function LetterGroupCard({ letters, label, statement, tone = 'light', className = '' }) {
  const light = tone === 'light'
  return (
    <div
      className={`flex flex-col gap-4 rounded-2xl border p-6 ${
        light ? 'border-graphite-900/10 bg-cream-50 shadow-sm' : 'border-cream-100/12 bg-graphite-900'
      } ${className}`}
    >
      <div className="flex flex-nowrap gap-1.5">
        {letters.map((l) => <LetterTile key={l} letter={l} active tone={tone} />)}
      </div>
      <span className={`text-[16px] leading-relaxed tracking-tight lg:text-[18px] leading-relaxed ${light ? 'text-graphite-900/70' : 'text-cream-100/70'}`}>{label}</span>
      <p className={`text-h4 font-medium leading-snug ${light ? 'text-graphite-900' : 'text-cream-100'}`}>{statement}</p>
    </div>
  )
}

/* Os sete entregáveis do fechamento — lista + carrossel (ver ./Entregaveis). */
const DELIVERABLES = [
  { icon: LayoutGrid, title: 'O Método T.E.M.P.L.O. completo.', description: 'Os seis pilares, setenta e um subtópicos, em biblioteca livre. Você percorre no seu ritmo.', image: '/guia-metodo.webp', richCover: true },
  { icon: Dumbbell, title: 'Programas de treino periodizados.', description: 'Por nível e por frequência, criados por mim. Você para de montar sessão e passa a executar sessão.', image: '/guia-programa-treino.webp', richCover: true },
  { icon: PlayCircle, title: 'A biblioteca de execução.', description: 'Cada exercício gravado por mim, com foco na ativação correta para o corpo feminino. É onde o guia que você baixou sai do papel.', image: '/guia-execucao.webp', richCover: true },
  { icon: ClipboardList, title: 'O guia de treino.', description: 'Zona de repetição, ordem dos exercícios, série preparatória, modo foco.', image: '/guia-guia-treino.webp', richCover: true },
  { icon: Activity, title: 'Rotinas de mobilidade.', description: 'Por grupo muscular, como higiene do movimento.', image: '/guia-mobilidade.webp', richCover: true },
  { icon: Users, title: 'A Aliança.', description: 'A comunidade onde as Aliadas sustentam a constância umas das outras. Sem casta, sem hierarquia de mérito.', image: '/guia-alianca.webp', richCover: true },
  { icon: Gift, title: 'Dois bônus.', description: 'Alongamentos Conscientes, cinco aulas guiadas. Mentalidade de Treino Intencional, quatro micro-aulas sobre constância e procrastinação.', image: '/guia-bonus.webp', richCover: true },
]

/** Dobra de pilar (M/P/L/O) — headline, sub e corpo, alternando claro/escuro.
    O empilhamento via sticky (ver comentário no wrapper abaixo) só roda a
    partir do md. No mobile, depois de 3 rodadas tentando dar fôlego
    suficiente pro scroll (dvh cheio, mais padding, wrapper mais alto), o
    conteúdo continuava travando/cortando em telas de celular reais — o
    dvh dinâmico do Safari/iOS combinado com sticky + z-index empilhado é
    frágil demais pra 4 dobras com quantidade de texto bem diferente entre
    si. Solução: no mobile as 4 dobras viram seções normais empilhadas
    (sem sticky, sem sobrepor) — garante que todo o conteúdo sempre é
    alcançável rolando, ao custo do efeito de cobertura, que fica só pro
    desktop, onde já funciona bem (pedido do usuário, 23/07). */
function PilarSection({ letter, headline, sub, tone, z, children }) {
  const bg = tone === 'light' ? 'bg-[#FAFFF2]' : 'bg-[#F5F5DD]'
  return (
    <section
      className={`flex flex-col justify-center rounded-t-[2.5rem] py-28 text-graphite-900 shadow-[0_-24px_60px_-20px_rgba(0,0,0,0.15)] md:sticky md:top-0 md:min-h-[70dvh] md:py-28 ${z} ${bg}`}
    >
      <div className="container flex max-w-3xl flex-col gap-8">
        <Reveal variant={tone === 'light' ? 'right' : 'left'} className="flex flex-col gap-6">
          <LetterTile letter={letter} active tone="light" />
          <h2 className="text-h2 text-graphite-900 md:text-[48px]">{headline}</h2>
          <p className="text-[18px] leading-relaxed tracking-tight text-graphite-900 lg:text-[20px]">{sub}</p>
        </Reveal>
        <Reveal delay={100} className="flex flex-col gap-4 text-[18px] leading-relaxed tracking-tight text-graphite-900/70 lg:text-[20px]">
          {children}
        </Reveal>
      </div>
    </section>
  )
}

export function AppGuiaDownload() {
  return (
    <main className="page-largura-1050 bg-[#FAFFF2] text-graphite-900">
      {/* ------------------------------------------------ DOBRA 0 · A RECOMPENSA */}
      <section id="inicio" className="relative flex min-h-[70dvh] scroll-mt-16 flex-col overflow-hidden">
        <Nav links={NAV_LINKS} ctaLabel="Baixar o guia agora" ctaHref="#inicio" />
        <picture>
          <source media="(min-width: 768px)" srcSet="/bg-estaaqui-desktop.webp" />
          <img
            src="/bg-estaaqui-mobile.webp"
            alt=""
            aria-hidden
            className="absolute inset-0 size-full object-cover object-top md:object-center"
          />
        </picture>
        <div className="absolute inset-0 bg-graphite-950/55" aria-hidden />
        <div className="container relative flex flex-1 flex-col items-center justify-center gap-8 py-16 text-center">
          <h1 className="animate-fade-in-up text-h1 text-cream-100 md:text-[62px] [animation-delay:120ms]">
            Pronto. Está aqui<span className="text-cream-100">.</span>
          </h1>
          <p className="max-w-xl animate-fade-in-up text-[18px] leading-relaxed tracking-tight lg:text-[20px] text-cream-100/75 [animation-delay:280ms] md:max-w-none md:whitespace-nowrap">
            Os cinco tipos de falha, separados um a um, com o que fazer quando cada um aparece.
          </p>
          <div className="flex animate-fade-in-up flex-col items-center gap-3 [animation-delay:440ms]">
            <CtaPill label="Baixar o guia agora" icon={Download} size="lg" />
            <p className="text-center text-caption text-cream-100/45">
              Também mandei uma cópia para o seu e-mail,<br />caso você prefira ler depois.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------ DOBRA 1 · O QUE É O PLANO TEMPLO */}
      <section id="metodo" className="scroll-mt-16 bg-[#FAFFF2] py-20 text-graphite-900 md:py-28">
        <div className="container flex max-w-3xl flex-col gap-8">
          <Reveal variant="left" className="flex flex-col gap-4">
            <h2 className="text-h2 text-graphite-900 md:text-[48px]">Este guia é um pedaço de um método.<br className="sm:hidden" /> <span className="text-sage-700">Falta te contar de qual.</span></h2>
            <p className="text-[18px] leading-relaxed tracking-tight lg:text-[20px] text-graphite-900">
              O Plano Templo é o método que transforma treino em jornada, e jornada em identidade.
              Seis pilares, e o guia que você acabou de baixar mora dentro de dois deles.
            </p>
          </Reveal>
          <Reveal delay={100} className="flex flex-col gap-4 text-[18px] leading-relaxed tracking-tight text-graphite-900/70">
            <p>Ele nasceu da recusa a uma escolha falsa. De um lado, o fitness que promete o corpo e não entrega nada além dele. Do outro, o discurso morno que fala de aceitação e abre mão do resultado.</p>
            <p>Eu não quis escolher. O Método T.E.M.P.L.O. é o que sobrou dessa recusa: seis pilares que tratam o treino como instrumento, e o corpo como o lugar onde a mulher se encontra consigo mesma.</p>
          </Reveal>
          <Reveal delay={150} className="flex flex-col gap-4">
            <LetterGroupCard
              letters={['T', 'E']}
              label="T de Treino. E de Execução."
              statement="Onde você começa, e onde este guia vive."
              tone="dark"
            />
            <LetterGroupCard
              letters={['M', 'P', 'L', 'O']}
              label="M de Mentalidade. P de Propósito. L de Liberdade. O de Ordem."
              statement="Onde a coisa fica séria."
              tone="light"
            />
          </Reveal>
          <Reveal delay={200}>
            <p className="text-[18px] leading-relaxed tracking-tight text-graphite-900/70 md:text-[48px] md:font-light md:leading-tight">Vale entender <span className="text-sage-700">o que existe nesses quatro.</span><br className="hidden md:block" /> É deles que este guia não fala.</p>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------ DOBRAS 2-5 · OS PILARES */}
      <div className="md:h-[320dvh]">
      <PilarSection
        letter="M"
        tone="dark"
        z="z-10"
        headline="Você não tem um problema de disciplina. Tem um problema de decisão."
        sub="Disciplina não é uma virtude que algumas mulheres têm e outras não. É o que sobra quando as decisões já foram tomadas antes de você entrar na academia."
      >
        <p>Toda vez que você abre o aplicativo e pensa "o que eu faço hoje", gasta uma decisão. Toda vez que hesita entre ir e não ir, gasta outra. Quem treina há anos com constância não tem mais força de vontade que você. Tem menos decisões abertas.</p>
        <p>Mentalidade é o pilar do autodomínio, da constância com propósito, e da vigilância sobre o que você consome, do prato à mídia. Não é motivação. É arquitetura interna.</p>
      </PilarSection>

      <PilarSection
        letter="P"
        tone="light"
        z="z-20"
        headline="Eu conquistei o corpo que queria. E veio o vazio."
        sub="Não é ingratidão, e não é fraqueza. É o que acontece quando a motivação foi construída sobre uma base que se esgota exatamente no momento da conquista."
      >
        <p>Durante anos eu treinei por um motivo só: ser olhada. E consegui. As fotos viralizaram, os olhares vieram, e o corpo era exatamente o que eu tinha imaginado. Aí veio uma pergunta que me derrubou: e agora?</p>
        <p>A psicologia tem nome para isso. A satisfação chega, e em poucas semanas você volta ao mesmo nível de insatisfação de antes. Não porque você é ingrata: porque motivação construída sobre aprovação externa nunca chega.</p>
        <p>Propósito é o pilar que responde à única pergunta que precede qualquer técnica. Por que você treina? Se a resposta envolve o olhar de alguém, nenhuma periodização do mundo resolve.</p>
      </PilarSection>

      <PilarSection
        letter="L"
        tone="dark"
        z="z-30"
        headline="Existe uma diferença brutal entre ser vista e ser enxergada."
        sub="Ser vista é ser consumida por um olhar que passa para o próximo conteúdo em trinta segundos. Ser enxergada é ser reconhecida como alguém que existe além da superfície."
      >
        <p>Empoderar significa dar poder real. Um poder que não evapora quando o algoritmo muda, nem quando os olhares vão para outra direção. O que te venderam com esse nome é o contrário exato disso: dependência de validação externa, vestida de autoconfiança.</p>
        <p>Se você só se sente poderosa quando recebe atenção, não é poder. É dependência.</p>
        <p>Liberdade é o pilar do reconhecimento da própria essência, sem copiar padrão nenhum. É o fim da dissonância entre quem você é e quem finge ser. E o paradoxo é bonito: quando você para de buscar admiração, ela chega.</p>
      </PilarSection>

      <PilarSection
        letter="O"
        tone="light"
        z="z-40"
        headline="As suas escolhas estéticas não são neutras. Elas contam uma história sobre você."
        sub={'A pergunta não é "posso usar isso". A pergunta é: o que isso está dizendo sobre mim, e é verdade?'}
      >
        <p>Ordem não é código de vestimenta, e não é lista de proibição. É a diferença entre cultivar estética e buscar aprovação. Vestimenta, postura, presença, comunicação: tudo comunica antes de você abrir a boca. A questão é se comunica quem você é, ou quem você acha que precisa parecer ser.</p>
        <p>Existe uma pergunta simples, e ela cabe em toda manhã: o que eu quero comunicar hoje? Não o que gera mais reação. O que reflete quem eu sou.</p>
        <p>É o pilar mais silencioso do método, e o que mais muda a forma como você atravessa uma sala.</p>
      </PilarSection>
      </div>

      {/* --------------------------------------------- FECHAMENTO · O QUE VOCÊ RECEBE */}
      <section id="entregaveis" className="scroll-mt-16 border-t border-graphite-900/10 bg-[#F5F5DD] py-20 md:py-28">
        <div className="container flex max-w-5xl flex-col gap-10">
          <Reveal variant="right" className="flex max-w-3xl flex-col gap-4">
            <h2 className="text-h2 text-graphite-900 md:text-[48px]">Seis pilares. Você acabou de receber um pedaço de dois.</h2>
            <p className="text-[18px] leading-relaxed tracking-tight lg:text-[20px] text-graphite-900/70">
              O mercado vende treino e dieta. O Plano Templo entrega um método de transformação
              integral, e ele cabe na sua semana a partir de hoje.
            </p>
          </Reveal>
          <div className="flex flex-col gap-16 md:gap-20">
            <EntregaveisList items={DELIVERABLES} tone="light" />
            <EntregaveisCarousel items={DELIVERABLES} />
          </div>
          <Reveal className="flex max-w-3xl flex-col items-center gap-6 self-center text-center">
            <Typewriter as="p" text={'O treino é onde se começa.\nO templo é onde se chega.'} className="font-display text-h2 text-graphite-900 md:text-[48px]" />
            <CtaPill label="Quero o método completo" href={LINK_CHECKOUT_TEMPLO} />
            <p className="text-caption text-graphite-900/45">Seu corpo em movimento, seu poder em liberdade.</p>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-graphite-900/10 bg-[#FAFFF2] py-10">
        <div className="container flex justify-center">
          <img src="/logo-anju-dark.svg" alt="Anju Mace" loading="lazy" className="h-3.5 w-auto opacity-50" />
        </div>
      </footer>
    </main>
  )
}
