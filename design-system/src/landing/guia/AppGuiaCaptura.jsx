import { useMemo, useRef, useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { ImagePlaceholder } from '../singular/ImagePlaceholder'
import { Reveal } from '../singular/Reveal'

/* Página de captura do guia "Os cinco tipos de falha" (/guia).
   Copy verbatim do documento do funil (Página de Convite).
   Lead: RPC funil_guia_signup no Supabase (migration 0051) + sync
   ActiveCampaign via /api/ac-sync (fire-and-forget). Sucesso → /guia/download. */

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://hcinspgpmmsohtbizvor.supabase.co'
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjaW5zcGdwbW1zb2h0Yml6dm9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMjQxNzgsImV4cCI6MjA5NzkwMDE3OH0.KmmfhdE93gTy5loqF_uF5v6M9YyjWT_Y35Gd1XTjyZk'

/* UTMs da visita — capturadas na chegada e enviadas com o lead (atribuição
   pedida na All Hands). Persistem em sessionStorage pra sobreviver à rolagem. */
function readUtms() {
  try {
    const saved = sessionStorage.getItem('guia_utms')
    if (saved) return JSON.parse(saved)
    const q = new URLSearchParams(window.location.search)
    const utm = {}
    for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
      if (q.get(k)) utm[k] = q.get(k)
    }
    sessionStorage.setItem('guia_utms', JSON.stringify(utm))
    return utm
  } catch {
    return {}
  }
}

async function enviarLead({ name, email, utm }) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/funil_guia_signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      p_name: name,
      p_email: email,
      p_utm: utm,
      p_referrer: document.referrer || null,
      p_page: '/guia',
    }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  if (!data?.ok) throw new Error(data?.error || 'invalid')
  // ActiveCampaign em segundo plano — nunca bloqueia a conversão.
  fetch('/api/ac-sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, utm }),
  }).catch(() => {})
}

const emailValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

const gradient =
  'bg-gradient-to-r from-sage-400 via-cream-200 to-sage-500 bg-[length:200%_100%] bg-left hover:bg-right text-graphite-900 shadow-md hover:shadow-lg transition-[background-position,box-shadow,transform] duration-slow ease-out'
const inputPill =
  'h-14 w-full rounded-full border border-transparent bg-cream-100/10 px-6 text-body text-cream-100 placeholder:text-cream-100/40 outline-none transition-[border-color,box-shadow] duration-fast focus:border-sage-400 focus:shadow-focus'

function CtaPill({ label, onClick, type = 'button', loading = false }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      className={`group inline-flex h-16 items-center gap-3 rounded-full py-2 pl-6 pr-2 font-medium uppercase tracking-wide disabled:pointer-events-none disabled:opacity-60 md:gap-4 md:pl-8 ${gradient}`}
    >
      <span className="flex-1 whitespace-nowrap text-center text-xs sm:text-sm md:text-base">{loading ? 'Enviando…' : label}</span>
      <span className="inline-grid size-12 shrink-0 place-items-center rounded-full bg-cream-100/80 text-graphite-900 transition-transform duration-moderate ease-spring group-hover:translate-x-0.5">
        <ArrowRight className={`size-5 ${loading ? 'animate-pulse' : ''}`} strokeWidth={1.5} aria-hidden />
      </span>
    </button>
  )
}

/* Vocabulário visual do e-book aplicado à página. */

/** Mini-card com traço sálvia — os bullets do problema.
    `image` = foto real (720×450 · 16:10); `imageLabel` = placeholder até ela existir. */
function MiniCard({ title, children, tone = 'dark', image, imageAlt = '', imageLabel }) {
  const light = tone === 'light'
  return (
    <div className={`flex flex-col gap-3 rounded-2xl border p-6 ${light ? 'border-graphite-900/10 bg-cream-50 shadow-sm' : 'border-cream-100/10 bg-cream-100/5'}`}>
      {image ? (
        <img
          src={image}
          alt={imageAlt}
          loading="lazy"
          className="mb-1 aspect-[16/10] w-full rounded-xl object-cover"
        />
      ) : imageLabel && (
        <ImagePlaceholder
          label={imageLabel}
          size="720 × 450 px · 16:10 · WebP"
          ratio="aspect-[16/10]"
          rounded="rounded-xl"
          tone={light ? 'light' : 'dark'}
          className="mb-1"
        />
      )}
      <span className={`h-0.5 w-6 ${light ? 'bg-sage-500' : 'bg-sage-600'}`} aria-hidden />
      <p className={`text-body ${light ? 'text-graphite-900/75' : 'text-cream-100/75'}`}>
        <strong className={`font-medium ${light ? 'text-graphite-900' : 'text-cream-100'}`}>{title}</strong> {children}
      </p>
    </div>
  )
}

/** Card de falha com tile de numeral romano — eco da capa do e-book.
    As cores intercalam sálvia/dourado entre os boxes. */
function FalhaCard({ roman, title, children, accent = 'sage' }) {
  const gold = accent === 'gold'
  return (
    <div className={`flex gap-5 rounded-2xl border p-6 ${gold ? 'border-gold-300/25 bg-gold-300/5' : 'border-sage-500/25 bg-sage-500/10'}`}>
      <span className={`grid size-12 shrink-0 place-items-center rounded-xl border font-display text-lg font-extralight ${gold ? 'border-gold-300/50 bg-gold-300/10 text-gold-300' : 'border-sage-500/50 bg-sage-500/15 text-sage-400'}`}>
        {roman}
      </span>
      <p className="text-body text-cream-100/75">
        <strong className="font-medium text-cream-100">{title}</strong> {children}
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

/** Confirmação provisória em /guia/download — segura a rota até a página de
    entrega definitiva (Fase 2) entrar no ar. */
export function GuiaDownloadInterino() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-graphite-950 px-6 text-center text-cream-100">
      <img src="/logo-anju.svg" alt="Anju Mace" className="h-4 w-auto" />
      <h1 className="max-w-xl text-h2">O seu guia está a caminho do seu e-mail.</h1>
      <p className="max-w-md text-body-lg text-cream-100/70">
        Enviamos <em>Os cinco tipos de falha</em> para o endereço que você informou.
        Se não chegar em alguns minutos, confira o spam.
      </p>
    </main>
  )
}

export function AppGuiaCaptura() {
  const utm = useMemo(readUtms, [])
  const formRef = useRef(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | error
  const [errorField, setErrorField] = useState(null)

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })

  const submit = async (e) => {
    e.preventDefault()
    if (name.trim().length < 2) { setErrorField('nome'); return }
    if (!emailValido(email)) { setErrorField('email'); return }
    setErrorField(null)
    setStatus('loading')
    try {
      await enviarLead({ name: name.trim(), email: email.trim(), utm })
      window.location.assign('/guia/download')
    } catch {
      setStatus('error')
    }
  }

  return (
    <main className="bg-graphite-950 text-cream-100">
      {/* ---------------------------------------------------------- 1 · HERO */}
      <section className="relative flex min-h-dvh flex-col overflow-hidden">
        {/* Foto de fundo (arte própria por breakpoint) + véu grafite pra
            headline creme continuar legível. */}
        <picture>
          <source media="(min-width: 768px)" srcSet="/bg-guia-desktop.webp" />
          <img
            src="/bg-guia-mobile.webp"
            alt=""
            aria-hidden
            className="absolute inset-0 size-full object-cover object-center"
          />
        </picture>
        <div className="absolute inset-0 bg-graphite-950/55" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-graphite-950" aria-hidden />
        <div className="relative z-10 flex justify-center pt-10 md:pt-12">
          <img src="/logo-anju.svg" alt="Anju Mace" className="h-4 w-auto animate-fade-in" />
        </div>
        <div className="container relative flex flex-1 flex-col items-center justify-center gap-8 py-16 text-center">
          <h1 className="max-w-3xl animate-fade-in-up text-h1 text-[36px] text-cream-100 md:text-[62px] [animation-delay:120ms]">
            As três repetições que você deixa para trás são exatamente as que constroem<span className="text-sage-400">.</span>
          </h1>
          <p className="max-w-2xl animate-fade-in-up text-body-lg text-cream-100/75 [animation-delay:280ms]">
            São as três últimas de cada série, as únicas capazes de recrutar as fibras de maior limiar.
            Você para antes delas porque o seu corpo tem cinco maneiras diferentes de dizer chega,
            e quatro delas você confunde com uma só.
          </p>
          <div className="flex animate-fade-in-up flex-col items-center gap-3 [animation-delay:440ms]">
            <CtaPill label="Quero receber o guia" onClick={scrollToForm} />
            <p className="text-caption text-cream-100/45">
              Guia gratuito do pilar Execução, do Método T.E.M.P.L.O.<br />
              Chega no seu e-mail em minutos.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------ 2 · O PROBLEMA (dobra clara) */}
      <section className="bg-cream-100 py-20 text-graphite-900 md:py-28">
        <div className="container flex max-w-3xl flex-col gap-10">
          <Reveal>
            <h2 className="text-h2 text-graphite-900">
              A sua disciplina está impecável. É a sua leitura que está custando caro.
            </h2>
          </Reveal>
          <Reveal delay={100} className="flex flex-col gap-4">
            <p className="text-body-lg text-graphite-900">Você não falha semana. Não pula série. E o progresso não acompanha o esforço. A saída que te oferecem é sempre a mesma: aperte mais.</p>
            <p className="text-body-lg text-graphite-900/70">Só que a série não é decidida pela vontade. É decidida pela leitura. Cada vez que você encerra uma repetição cedo demais, o estímulo que deveria acontecer não acontece. Cada vez que você arranca uma repetição depois que a forma se perdeu, o estímulo vai para o lugar errado.</p>
          </Reveal>
          <Reveal delay={150}>
            <Callout tone="light">Nenhuma das duas aparece no espelho. As duas aparecem na estagnação.</Callout>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            <Reveal delay={0}><MiniCard tone="light" image="/guia-voce-para-cedo.webp" imageAlt="Mulher no supino com halteres, no limite da série" title="Você para cedo.">A queimação sobe e você encerra. O músculo tinha mais três repetições, e as fibras de maior limiar, as que só entram em cena quando o resto já não dá conta, nunca chegaram a ser convocadas.</MiniCard></Reveal>
            <Reveal delay={100}><MiniCard tone="light" image="/guia-voce-insiste-demais.webp" imageAlt="Agachamento no limite — a forma começando a ceder" title="Você insiste demais.">Arranca mais uma, e o joelho colapsa para dentro. O estímulo despenca, porque outras estruturas assumiram o trabalho, e a carga migra para tecidos que ninguém preparou para recebê-la.</MiniCard></Reveal>
            <Reveal delay={200}><MiniCard tone="light" image="/guia-voce-trata-igual.webp" imageAlt="Puxada na máquina — concentração na execução guiada" title="Você trata todos os exercícios igual.">Agachamento livre e cadeira extensora pedem distâncias opostas do limite. A mesma proximidade nos dois custa resultado em um e integridade no outro.</MiniCard></Reveal>
            <Reveal delay={300}><MiniCard tone="light" image="/guia-voce-decide.webp" imageAlt="Concentração sob a barra — lendo o próprio corpo antes da série" title="Você decide pela sensação.">"Está difícil, mas dá" e "aqui a técnica quebra" são duas mensagens distintas, vindas de dois lugares distintos do seu corpo. Sem essa distinção, cada série é um palpite bem-intencionado.</MiniCard></Reveal>
          </div>
          <Reveal delay={100} className="flex flex-col items-center gap-3 text-center">
            <CtaPill label="Quero aprender a distinguir" onClick={scrollToForm} />
            <p className="text-caption text-graphite-900/50">
              A diferença entre uma série que estimula e uma série que só cansa.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------- 3 · A SOLUÇÃO */}
      <section className="border-t border-cream-100/10 py-20 md:py-28">
        <div className="container flex max-w-3xl flex-col gap-10">
          <Reveal className="flex flex-col gap-4">
            <h2 className="text-h2 text-cream-100">Cinco limites. Cinco decisões técnicas diferentes.</h2>
            <p className="text-body-lg text-cream-100/70">
              O guia percorre cada tipo de falha, mostra como reconhecê-lo no meio da série, e diz
              exatamente o que fazer quando ele aparece: continuar, ou encerrar. Sem palpite.
            </p>
          </Reveal>
          <div className="flex flex-col gap-4">
            <Reveal delay={0}><FalhaCard roman="I" title="Falha técnica.">O único sinal que manda encerrar imediatamente, mesmo com a ficha pela metade. Não porque o músculo acabou, mas porque ele deixou de ser o protagonista da série.</FalhaCard></Reveal>
            <Reveal delay={80}><FalhaCard roman="II" accent="gold" title="Falha concêntrica.">O limite que vale procurar, com a lista dos exercícios onde procurá-lo é seguro e a dos exercícios onde procurá-lo é erro. É aqui que moram as suas três repetições.</FalhaCard></Reveal>
            <Reveal delay={160}><FalhaCard roman="III" title="Falha excêntrica.">A camada de capacidade que ainda existe depois do "não consigo mais", e o critério que decide quando ela pode ser aberta. Poucas mulheres sabem que ela existe. Menos ainda sabem quando usá-la.</FalhaCard></Reveal>
            <Reveal delay={240}><FalhaCard roman="IV" accent="gold" title="Falha neural.">Por que a coordenação some antes de a perna acabar, e por que isso muda a ordem inteira dos exercícios da sua sessão.</FalhaCard></Reveal>
            <Reveal delay={320}><FalhaCard roman="V" title="E a quinta,">a mais comum de todas, que não acontece no músculo nem no comando. É ela que explica as três repetições que você entrega de graça, série após série, sem nunca perceber.</FalhaCard></Reveal>
          </div>
          <Reveal>
          <Callout>
            Você pode continuar treinando com a mesma dedicação de sempre, e recebendo o mesmo
            retorno de sempre. Ou pode passar os próximos vinte minutos entendendo o que acontece
            nas três repetições que você nunca fez, e aplicar isso já no treino de amanhã.
          </Callout>
          </Reveal>
          <Reveal delay={100} className="flex justify-center">
            <CtaPill label="Quero receber o guia gratuito" onClick={scrollToForm} />
          </Reveal>
        </div>
      </section>

      {/* -------------------------------------------------- 4 · O FORMULÁRIO */}
      <section className="border-t border-cream-100/10 py-20 md:py-28">
        <div className="container max-w-xl">
          <Reveal variant="scale">
          <form
            ref={formRef}
            onSubmit={submit}
            className="flex flex-col gap-5 rounded-3xl border border-cream-100/10 bg-cream-100/5 p-8 md:p-10"
          >
            <div className="flex flex-col gap-2">
              <label htmlFor="guia-nome" className="whitespace-nowrap text-[10px] uppercase tracking-wide text-cream-100/60 sm:text-caption sm:tracking-wider">Nome</label>
              <input
                id="guia-nome"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputPill}
                autoComplete="name"
              />
              {errorField === 'nome' && <p className="text-caption text-red-400">Escreve seu nome pra eu saber como te chamar.</p>}
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="guia-email" className="whitespace-nowrap text-[10px] uppercase tracking-wide text-cream-100/60 sm:text-caption sm:tracking-wider">O melhor e-mail para receber o guia</label>
              <input
                id="guia-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputPill}
                autoComplete="email"
                inputMode="email"
              />
              {errorField === 'email' && <p className="text-caption text-red-400">Confere o e-mail — é nele que o guia chega.</p>}
            </div>
            <CtaPill type="submit" label="Enviar o guia para mim" loading={status === 'loading'} />
            {status === 'error' && (
              <p className="text-caption text-red-400">Algo falhou por aqui. Tenta de novo em instantes.</p>
            )}
            <p className="flex items-start gap-2 text-caption text-cream-100/45">
              <Check className="mt-0.5 size-4 shrink-0 text-sage-400" strokeWidth={1.5} aria-hidden />
              Acesso imediato. Sem cobrança, agora ou depois. Os seus dados ficam com Anju Mace, e com mais ninguém.
            </p>
          </form>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-cream-100/10 py-10">
        <div className="container flex justify-center">
          <img src="/logo-anju.svg" alt="Anju Mace" className="h-3.5 w-auto opacity-50" />
        </div>
      </footer>
    </main>
  )
}
