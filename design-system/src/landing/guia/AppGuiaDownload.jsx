import { ArrowRight, Download, Image as ImageIcon, LayoutGrid, Dumbbell, PlayCircle, ClipboardList, Activity, Users, Gift } from 'lucide-react'
import { Reveal } from '../singular/Reveal'

/* Página de entrega do guia (/guia/download).
   Copy verbatim do documento do funil (Página de Entrega da Recompensa):
   dobra 0 entrega o PDF; dobras 1-5 apresentam o método e os quatro pilares
   que o guia não cobre; fechamento vende o Plano Templo. */

const PDF_URL = '/os-cinco-tipos-de-falha.pdf'
// TODO: trocar pelo link real de checkout do Plano Templo quando existir.
const LINK_CHECKOUT_TEMPLO = '#checkout-templo'

const gradient =
  'bg-gradient-to-r from-sage-400 via-cream-200 to-sage-500 bg-[length:200%_100%] bg-left hover:bg-right text-graphite-900 shadow-md hover:shadow-lg transition-[background-position,box-shadow,transform] duration-slow ease-out'

function CtaPill({ label, href, download = false, icon: Icon = ArrowRight }) {
  return (
    <a
      href={href}
      download={download || undefined}
      className={`group flex h-16 w-full max-w-sm items-center gap-2.5 rounded-full py-2 pl-5 pr-2 font-medium uppercase tracking-normal sm:w-auto sm:gap-3 sm:pl-6 sm:tracking-wide md:gap-4 md:pl-8 ${gradient}`}
    >
      <span className="flex-1 whitespace-nowrap text-center text-sm md:text-base">{label}</span>
      <span className="inline-grid size-12 shrink-0 place-items-center rounded-full bg-cream-100/80 text-graphite-900 transition-transform duration-moderate ease-spring group-hover:translate-x-0.5">
        <Icon className="size-5" strokeWidth={1.5} aria-hidden />
      </span>
    </a>
  )
}

/** Tile de letra do método — eco dos numerais do e-book. */
function LetterTile({ letter, active = false, tone = 'light' }) {
  const light = tone === 'light'
  if (active) {
    return (
      <span className={`grid size-11 shrink-0 place-items-center rounded-full border font-display text-base font-extralight ${light ? 'border-sage-600/60 bg-sage-500/15 text-sage-700' : 'border-sage-500/50 bg-sage-500/15 text-sage-400'}`}>
        {letter}
      </span>
    )
  }
  return (
    <span className={`grid size-11 shrink-0 place-items-center rounded-full border font-display text-base font-extralight ${light ? 'border-graphite-900/15 bg-graphite-900/5 text-graphite-900/60' : 'border-cream-100/15 bg-cream-100/5 text-cream-100/60'}`}>
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
      <span className={`text-body leading-relaxed ${light ? 'text-graphite-900/70' : 'text-cream-100/70'}`}>{label}</span>
      <p className={`text-h4 font-medium leading-snug ${light ? 'text-graphite-900' : 'text-cream-100'}`}>{statement}</p>
    </div>
  )
}

/** Card de entregável — ícone, título, descrição e um print/imagem embaixo
    (placeholder tracejado enquanto o asset daquele módulo não existe).
    min-h fixo (medido pelo card com mais texto) + descrição em flex-1 pra
    todos os 7 ficarem com a mesma altura e a imagem alinhada embaixo. */
function DeliverableCard({ icon: Icon, title, description, imageLabel, image }) {
  return (
    <div className="flex min-h-[520px] flex-col gap-5 rounded-3xl bg-cream-100 p-8 text-graphite-900">
      <span className="grid size-12 place-items-center rounded-full bg-sage-500/15 text-sage-700">
        <Icon className="size-6" strokeWidth={1.5} aria-hidden />
      </span>
      <div className="flex flex-1 flex-col gap-2">
        <h3 className="text-h4 font-medium text-graphite-900">{title}</h3>
        <p className="text-body text-graphite-900/70">{description}</p>
      </div>
      {image ? (
        <img
          src={image}
          alt=""
          width={800}
          height={600}
          loading="lazy"
          decoding="async"
          className="aspect-[4/3] w-full rounded-2xl object-cover"
        />
      ) : (
        <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-graphite-900/15 bg-graphite-900/5 p-4 text-center text-graphite-900/45">
          <ImageIcon className="size-6" strokeWidth={1.5} aria-hidden />
          <p className="text-caption leading-snug">{imageLabel}</p>
        </div>
      )}
    </div>
  )
}

/** Dobra de pilar (M/P/L/O) — headline, sub e corpo, alternando claro/escuro.
    As 4 dobras precisam compartilhar UM ÚNICO contêiner de sticky (ver o
    wrapper em torno delas lá embaixo) — contêineres separados por seção
    nunca dão sobreposição real (M só solta depois que P já teria que ter
    soltado também, então nunca ficam grudados ao mesmo tempo). Com um
    contêiner comum, mais alto que a soma das 4, todas soltam no MESMO
    instante (perto do fim) — o que não é visível, pois M/P/L já estão
    cobertas por O havia muito, e evita o "pisca de volta" de quem soltasse
    sozinho antes das outras. */
function PilarSection({ letter, headline, sub, tone, z, children }) {
  const light = tone === 'light'
  return (
    <section
      className={`sticky top-0 ${z} flex min-h-dvh flex-col justify-center rounded-t-[2.5rem] py-20 shadow-[0_-24px_60px_-20px_rgba(0,0,0,0.4)] md:py-28 ${
        light ? 'bg-cream-100 text-graphite-900' : 'bg-graphite-950 text-cream-100'
      }`}
    >
      <div className="container flex max-w-3xl flex-col gap-8">
        <Reveal className="flex flex-col gap-6">
          <LetterTile letter={letter} active tone={tone} />
          <h2 className={`text-h2 ${light ? 'text-graphite-900' : 'text-cream-100'}`}>{headline}</h2>
          <p className={`text-body-lg ${light ? 'text-graphite-900' : 'text-cream-100'}`}>{sub}</p>
        </Reveal>
        <Reveal delay={100} className={`flex flex-col gap-4 text-body-lg ${light ? 'text-graphite-900/70' : 'text-cream-100/70'}`}>
          {children}
        </Reveal>
      </div>
    </section>
  )
}

export function AppGuiaDownload() {
  return (
    <main className="bg-graphite-950 text-cream-100">
      {/* ------------------------------------------------ DOBRA 0 · A RECOMPENSA */}
      <section className="relative flex min-h-[70dvh] flex-col overflow-hidden">
        <div className="pointer-events-none absolute -left-32 top-1/4 size-96 animate-float-slow rounded-full bg-sage-500/15 blur-3xl" aria-hidden />
        <div className="relative z-10 flex justify-center pt-10 md:pt-12">
          <img src="/logo-anju.svg" alt="Anju Mace" className="h-4 w-auto animate-fade-in" />
        </div>
        <div className="container relative flex flex-1 flex-col items-center justify-center gap-8 py-16 text-center">
          <h1 className="animate-fade-in-up text-h1 text-cream-100 md:text-[62px] [animation-delay:120ms]">
            Pronto. Está aqui<span className="text-sage-400">.</span>
          </h1>
          <p className="max-w-xl animate-fade-in-up text-body-lg text-cream-100/75 [animation-delay:280ms]">
            Os cinco tipos de falha, separados um a um, com o que fazer quando cada um aparece.
          </p>
          <div className="flex animate-fade-in-up flex-col items-center gap-3 [animation-delay:440ms]">
            <CtaPill label="Baixar o guia agora" href={PDF_URL} download icon={Download} />
            <p className="text-center text-caption text-cream-100/45">
              Também mandei uma cópia para o seu e-mail,<br />caso você prefira ler depois.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------ DOBRA 1 · O QUE É O PLANO TEMPLO */}
      <section className="bg-cream-100 py-20 text-graphite-900 md:py-28">
        <div className="container flex max-w-3xl flex-col gap-8">
          <Reveal className="flex flex-col gap-4">
            <h2 className="text-h2 text-graphite-900">Este guia é um pedaço de um método.<br className="sm:hidden" /> Falta te contar de qual.</h2>
            <p className="text-body-lg text-graphite-900">
              O Plano Templo é o método que transforma treino em jornada, e jornada em identidade.
              Seis pilares, e o guia que você acabou de baixar mora dentro de dois deles.
            </p>
          </Reveal>
          <Reveal delay={100} className="flex flex-col gap-4 text-body-lg text-graphite-900/70">
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
            <p className="text-body-lg text-graphite-900/70">Vale entender o que existe nesses quatro. É deles que este guia não fala.</p>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------ DOBRAS 2-5 · OS PILARES */}
      <div className="h-[460dvh]">
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
      <section className="border-t border-cream-100/10 py-20 md:py-28">
        <div className="container flex max-w-5xl flex-col gap-10">
          <Reveal className="flex max-w-3xl flex-col gap-4">
            <h2 className="text-h2 text-cream-100">Seis pilares. Você acabou de receber um pedaço de dois.</h2>
            <p className="text-body-lg text-cream-100/70">
              O mercado vende treino e dieta. O Plano Templo entrega um método de transformação
              integral, e ele cabe na sua semana a partir de hoje.
            </p>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ['O Método T.E.M.P.L.O. completo.', 'Os seis pilares, setenta e um subtópicos, em biblioteca livre. Você percorre no seu ritmo.', LayoutGrid, 'Print da biblioteca do método', '/guia-metodo.webp'],
              ['Programas de treino periodizados.', 'Por nível e por frequência, criados por mim. Você para de montar sessão e passa a executar sessão.', Dumbbell, 'Print de um programa de treino', '/guia-programa-treino.webp'],
              ['A biblioteca de execução.', 'Cada exercício gravado por mim, com foco na ativação correta para o corpo feminino. É onde o guia que você baixou sai do papel.', PlayCircle, 'Print de um vídeo de execução', '/guia-execucao.webp'],
              ['O guia de treino.', 'Zona de repetição, ordem dos exercícios, série preparatória, modo foco.', ClipboardList, 'Print do guia de treino', '/guia-guia-treino.webp'],
              ['Rotinas de mobilidade.', 'Por grupo muscular, como higiene do movimento.', Activity, 'Print de uma rotina de mobilidade', '/guia-mobilidade.webp'],
              ['A Aliança.', 'A comunidade onde as Aliadas sustentam a constância umas das outras. Sem casta, sem hierarquia de mérito.', Users, 'Print da comunidade A Aliança', '/guia-alianca.webp'],
              ['Dois bônus.', 'Alongamentos Conscientes, cinco aulas guiadas. Mentalidade de Treino Intencional, quatro micro-aulas sobre constância e procrastinação.', Gift, 'Print dos bônus', '/guia-bonus.webp'],
            ].map(([t, d, Icon, imgLabel, img], i) => (
              <Reveal key={t} delay={i * 60}>
                <DeliverableCard icon={Icon} title={t} description={d} imageLabel={imgLabel} image={img} />
              </Reveal>
            ))}
          </div>
          <Reveal className="flex max-w-3xl flex-col items-center gap-6 self-center text-center">
            <p className="font-display text-body-lg text-cream-100">O treino é onde se começa. O templo é onde se chega.</p>
            <CtaPill label="Quero o método completo" href={LINK_CHECKOUT_TEMPLO} />
            <p className="text-caption text-cream-100/45">Seu corpo em movimento, seu poder em liberdade.</p>
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
