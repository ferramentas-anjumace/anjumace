import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, ArrowRight, Calendar, Check, ChevronDown, Clock, Eye, Lightbulb, Moon, Plus, ShieldCheck, Video, X } from 'lucide-react'
import 'flag-icons/css/flag-icons.min.css'
import { Reveal } from '../singular/Reveal'
import { PAISES, BRASIL } from '../lista-espera/paises'

/* Página de captura do Hotseat "A Ordem" (novo projeto, /aordem-captura).
   Copy verbatim do documento do usuário (25/07) — só corrigido "entre
   entre" → "entre" na Seção 7 (digitação) e "Reservar meu lugar na sala →"
   sem a seta literal (ela já é o ícone do CtaPill).
   Estrutura/vocabulário visual emprestados do funil do guia (/guia): Nav
   absolute no hero, dobras alternando #FAFFF2/#F5F5DD, StepTile/Callout,
   CtaPill com seta em círculo. Campo de WhatsApp com seletor de país
   (bandeira + DDI) reaproveita PAISES/BRASIL de ../lista-espera/paises.
   Logo do projeto ainda não subiu — Nav usa wordmark textual "A ORDEM" até
   o arquivo (ex.: /logo-aordem.svg) chegar em design-system/public/. */

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://hcinspgpmmsohtbizvor.supabase.co'
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjaW5zcGdwbW1zb2h0Yml6dm9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMjQxNzgsImV4cCI6MjA5NzkwMDE3OH0.KmmfhdE93gTy5loqF_uF5v6M9YyjWT_Y35Gd1XTjyZk'

/* UTMs da visita — mesma lógica do /guia, sessionStorage própria pra não
   colidir com a atribuição do outro funil. */
function readUtms() {
  try {
    const saved = sessionStorage.getItem('aordem_utms')
    if (saved) return JSON.parse(saved)
    const q = new URLSearchParams(window.location.search)
    const utm = {}
    for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
      if (q.get(k)) utm[k] = q.get(k)
    }
    sessionStorage.setItem('aordem_utms', JSON.stringify(utm))
    return utm
  } catch {
    return {}
  }
}

async function enviarParaSupabase({ name, email, whatsapp, utm }) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/hotseat_ordem_signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      p_name: name,
      p_email: email,
      p_whatsapp: whatsapp,
      p_utm: utm,
      p_referrer: document.referrer || null,
      p_page: '/aordem-captura',
    }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  if (!data?.ok) throw new Error(data?.error || 'invalid')
}

/* Respostas da pesquisa "leads core" (migration 0059) — mesmo padrão de
   RPC dedicada acima, dedupe por e-mail (reenvio atualiza as respostas). */
async function enviarPesquisaParaSupabase({ email, name, phone, answers, smsConsent }) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/hotseat_ordem_pesquisa_submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      p_email: email,
      p_name: name,
      p_phone: phone,
      p_answers: answers,
      p_sms_consent: smsConsent,
    }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  if (!data?.ok) throw new Error(data?.error || 'invalid')
}

/* Envio pro formulário do Active Campaign que o responsável de infra
   mandou (form id 1, conta anjumace58987) — dispara a automação de
   lembrete por SMS já configurada lá. Passa por /api/aordem-ac-form (ver
   design-system/api/) em vez de chamar o Active direto do navegador: o
   endpoint de formulário do Active é feito pra POST clássico de <form>
   com redirect, e via fetch() do browser esbarra em CORS — o front engole
   o erro silenciosamente e o lead nunca chega lá. Nunca bloqueia a
   confirmação da vaga — o Supabase é a fonte de verdade. */
async function enviarParaActiveCampaign({ name, email, whatsapp }) {
  const res = await fetch('/api/aordem-ac-form', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, phone: whatsapp }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

/* Máscaras de WhatsApp — mesma lógica de ../lista-espera/AppListaEspera. */
function maskWhatsappBR(value) {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}
function maskWhatsappGenerico(value) {
  const d = value.replace(/\D/g, '').slice(0, 14)
  return d.replace(/(\d{3})(?=\d)/g, '$1 ')
}
function maskWhatsapp(value, country) {
  return country.code === 'BR' ? maskWhatsappBR(value) : maskWhatsappGenerico(value)
}

const emailValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

const gradient =
  'bg-gradient-to-r from-sage-400 via-cream-200 to-sage-500 bg-[length:200%_100%] bg-left hover:bg-right text-graphite-900 shadow-md hover:shadow-lg transition-[background-position,box-shadow,transform] duration-slow ease-out'
/* Variante escura — o par sálvia/creme quase desaparece sobre o fundo
   #F5F5DD do hero (25/07); grafite sólido (mesmo tom das dobras escuras
   do resto do funil) dá o contraste que faltava sem sair da identidade. */
const darkGradient =
  'bg-gradient-to-r from-graphite-800 to-graphite-950 text-cream-100 shadow-lg shadow-graphite-900/20 hover:shadow-xl transition-[box-shadow,transform] duration-slow ease-out'
/* Input compacto — pop-ups sem rolagem (formulário + pesquisa). */
const inputPillCompact =
  'h-11 w-full rounded-full border border-transparent bg-graphite-900/5 px-5 text-[15px] leading-relaxed tracking-tight text-graphite-900 placeholder:text-graphite-900/40 outline-none transition-[border-color,box-shadow] duration-fast focus:border-sage-400 focus:shadow-focus'

/** Bandeira via flag-icons (SVG) — emoji não renderiza no Windows. */
function Flag({ code, className = '' }) {
  return (
    <span
      className={`fi fi-${code.toLowerCase()} shrink-0 rounded-[3px] ${className}`}
      style={{ width: '1.25rem', height: '0.875rem' }}
      aria-hidden
    />
  )
}

/** Logo do WhatsApp em traço (não existe no lucide-react, que só cobre
    ícones genéricos) — desenhado no mesmo padrão minimalista dos demais
    ícones do CtaPill (stroke currentColor, cantos arredondados). */
function WhatsappIcon({ className, strokeWidth = 1.5, ...rest }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      <path d="M6.5 17.5 5 21l3.6-1.45A8.5 8.5 0 1 0 5.5 16.5Z" />
      <path d="M9 10c0 3 2 5 5 5" />
      <path d="M9 10v-.5a.5.5 0 0 1 1 0V10a.5.5 0 0 1-1 0Z" />
      <path d="M14 15h.5a.5.5 0 0 0 0-1H14a.5.5 0 0 0 0 1Z" />
    </svg>
  )
}

function CtaPill({ label, onClick, href, type = 'button', loading = false, variant = 'sage', fullWidth = false, icon: Icon = ArrowRight }) {
  const dark = variant === 'dark'
  const className = `group inline-flex h-16 items-center gap-2.5 rounded-full py-2 pl-6 pr-2 font-medium uppercase tracking-normal disabled:pointer-events-none disabled:opacity-60 sm:gap-3 sm:tracking-wide md:gap-4 md:pl-8 ${fullWidth ? 'w-full' : ''} ${dark ? darkGradient : gradient}`
  const content = (
    <>
      <span className="flex-1 whitespace-nowrap text-center text-sm sm:text-base">{loading ? 'Enviando…' : label}</span>
      <span className={`inline-grid size-12 shrink-0 place-items-center rounded-full transition-transform duration-moderate ease-spring group-hover:translate-x-0.5 ${dark ? 'bg-sage-400 text-graphite-900' : 'bg-cream-100/80 text-graphite-900'}`}>
        <Icon className={`size-5 ${loading ? 'animate-pulse' : ''}`} strokeWidth={1.5} aria-hidden />
      </span>
    </>
  )
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    )
  }
  return (
    <button type={type} onClick={onClick} disabled={loading} className={className}>
      {content}
    </button>
  )
}

/** CTA + legenda de escassez — repetida ao fim de quase todo bloco no doc
    original, então vira um único componente pra não variar o texto. */
/** O botão fica com a mesma largura da legenda abaixo dele: o wrapper é
    inline-flex (encolhe pro conteúdo mais largo, aqui a legenda, que é mais
    comprida que o rótulo do botão) e os filhos esticam (align-items:
    stretch, padrão do flex) pra preencher essa largura — pedido do
    usuário (25/07). */
function CtaBlock({ onClick, label = 'Reservar meu lugar na sala', tone = 'dark', align = 'center', variant = 'sage' }) {
  const light = tone === 'light'
  const left = align === 'left'
  return (
    <div className={`flex w-fit flex-col gap-3 ${left ? 'mx-auto lg:mx-0' : 'mx-auto'}`}>
      <CtaPill label={label} onClick={onClick} variant={variant} />
      <p className={`text-caption text-center ${light ? 'text-graphite-900/50' : 'text-cream-100/50'}`}>
        Gratuito enquanto houver vaga no Zoom<span className="hidden sm:inline"> | </span><br className="sm:hidden" /> Garanta seu Lugar Antes que Acabe
      </p>
    </div>
  )
}

/** Item de lista com selo de check — pros blocos "esta noite foi escrita
    para você se" / "disso decorrem duas coisas" / os 8 bullets do que muda. */
function ChecklistItem({ children, accent = 'sage' }) {
  const gold = accent === 'gold'
  return (
    <li className="flex gap-4">
      <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full ${gold ? 'bg-gold-400/15 text-gold-700' : 'bg-sage-400/15 text-sage-700'}`}>
        <Check className="size-4" strokeWidth={2.5} aria-hidden />
      </span>
      <p className="text-[16px] leading-relaxed tracking-tight lg:text-[18px] text-graphite-900/80">{children}</p>
    </li>
  )
}

/** Card numerado (01–08) — grade 2 col em vez de lista corrida, pra "o que
    muda na sua próxima série" virar checklist visual em vez de parede de
    8 linhas idênticas (pedido do usuário, 25/07). Selo sempre sálvia
    (sem alternar com dourado, a pedido do usuário). */
function NumberedPoint({ n, children, accent = 'sage' }) {
  const gold = accent === 'gold'
  return (
    <div className={`group flex h-full items-start gap-4 rounded-2xl border p-5 shadow-sm transition-colors duration-moderate hover:shadow-lg ${gold ? 'border-gold-400/30 bg-gold-300/10 hover:border-gold-500 hover:bg-gold-500' : 'border-sage-500/25 bg-sage-500/10 hover:border-sage-500 hover:bg-sage-500'}`}>
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-sage-400 to-sage-600 font-display text-sm font-medium text-cream-100 shadow-md transition-colors duration-moderate group-hover:bg-none group-hover:bg-cream-100 group-hover:text-sage-700">
        {n}
      </span>
      <p className="text-[16px] leading-relaxed tracking-tight lg:text-[17px] text-graphite-900/80 transition-colors duration-moderate group-hover:text-cream-100">{children}</p>
    </div>
  )
}

/** Callout com filete dourado — a frase que fica. Mesmo padrão premium
    usado no funil do guia (selo com ícone + brilho passando de leve). */
function Callout({ children, tone = 'dark' }) {
  const light = tone === 'light'
  return (
    <div className={`relative flex items-center gap-3 overflow-hidden rounded-2xl border-l-[3px] py-4 pl-5 pr-5 ${light ? 'border-l-gold-500 bg-gold-100/50' : 'border-l-gold-400 bg-gold-300/5'}`}>
      <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-shine bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      <span className="relative grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-cream-100 shadow-md">
        <Lightbulb className="size-4" strokeWidth={1.5} aria-hidden />
      </span>
      <p className={`relative text-[16px] leading-relaxed tracking-tight lg:text-[17px] ${light ? 'text-graphite-900' : 'text-cream-100'}`}>{children}</p>
    </div>
  )
}

/** Capas dos 3 movimentos — pôsteres prontos (kicker + título + descrição
    já desenhados na própria imagem), lado a lado estilo Netflix (mesmo
    padrão richCover do EntregaveisCarousel de /guia). Substitui o layout
    editorial anterior (pedido do usuário, 25/07). */
const MOVEMENT_COVERS = [
  { title: 'A execução consciente', image: '/movimento-1-execucao-consciente.webp' },
  { title: 'A constância que não depende de motivação', image: '/movimento-2-constancia.webp' },
  { title: 'A ordem que aparece', image: '/movimento-3-ordem-aparece.webp' },
]

/** Mobile: carrossel horizontal em loop automático, estilo Netflix (mesmo
    padrão do EntregaveisCarousel do funil do guia) — pedido do usuário
    (25/07). Itens duplicados 2x pra loop perfeito com o keyframe `marquee`.
    Desktop/tablet (sm+) continua com a grade estática lado a lado. */
function MovementCovers() {
  const track = [...MOVEMENT_COVERS, ...MOVEMENT_COVERS]
  return (
    <>
      <Reveal className="sm:hidden">
        <div className="-mx-6 overflow-hidden">
          <div className="flex w-max animate-[marquee_28s_linear_infinite] gap-4 pb-2 will-change-transform active:[animation-play-state:paused]">
            {track.map((item, i) => (
              <div
                key={`${item.title}-${i}`}
                aria-hidden={i >= MOVEMENT_COVERS.length || undefined}
                className="relative aspect-[2/3] w-[62vw] shrink-0 overflow-hidden rounded-2xl bg-graphite-900 shadow-md [transform:translateZ(0)]"
              >
                <img src={item.image} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <div className="hidden gap-4 sm:grid sm:grid-cols-3">
        {MOVEMENT_COVERS.map((item, i) => (
          <Reveal key={item.title} variant="scale" delay={i * 100}>
            <div className="group relative aspect-[2/3] overflow-hidden rounded-2xl bg-graphite-900 shadow-md transition-shadow duration-moderate hover:shadow-lg">
              <img
                src={item.image}
                alt={item.title}
                loading="lazy"
                className="absolute inset-0 size-full object-cover transition-transform duration-slow ease-out group-hover:scale-105"
              />
            </div>
          </Reveal>
        ))}
      </div>
    </>
  )
}

/** Etapa do diagrama "O caminho da noite" — pediram um diagrama de verdade
    pra essa seção (25/07), não só uma lista numerada: o selo vira ícone (nó
    do diagrama, não numeral) e as três etapas ficam lado a lado no desktop,
    conectadas por setas — no mobile continua empilhado com o filete vertical. */
function NightPathStep({ icon: Icon, n, title, children, accent = 'sage', isLast = false }) {
  const gold = accent === 'gold'
  return (
    <div className={`relative flex flex-1 flex-col gap-3 rounded-2xl border p-6 shadow-sm transition-shadow duration-moderate hover:shadow-md lg:h-full ${gold ? 'border-gold-300/25 bg-gold-300/5' : 'border-sage-500/25 bg-sage-500/10'}`}>
      {!isLast && (
        <span aria-hidden className="absolute -bottom-4 left-12 h-4 w-px bg-graphite-900/15 lg:hidden" />
      )}
      <div className="flex items-center gap-4">
        <span className={`relative z-10 grid size-12 shrink-0 place-items-center rounded-full text-cream-100 shadow-md ${gold ? 'bg-gradient-to-br from-gold-400 to-gold-600' : 'bg-gradient-to-br from-sage-400 to-sage-600'}`}>
          <Icon className="size-5" strokeWidth={1.5} aria-hidden />
        </span>
        <div className="flex flex-col">
          <span className="text-caption uppercase tracking-wider text-graphite-900/45">{n}</span>
          <h3 className="whitespace-nowrap text-h4 text-graphite-900">{title}</h3>
        </div>
      </div>
      <p className="text-[16px] leading-relaxed tracking-tight lg:text-[18px] text-graphite-900/75">{children}</p>
    </div>
  )
}

/** Seta conectando as etapas do diagrama — só entra no desktop, onde as
    etapas viram uma trilha horizontal. */
function PathArrow() {
  return (
    <div className="hidden shrink-0 items-center justify-center self-center lg:flex" aria-hidden>
      <ArrowRight className="size-5 text-graphite-900/25" strokeWidth={1.5} />
    </div>
  )
}

/** Seletor de país (bandeira + DDI) — mesmo componente de ../lista-espera,
    reimplementado aqui com a paleta/tokens do funil do guia. */
function CountrySelect({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return PAISES
    return PAISES.filter((p) => p.name.toLowerCase().includes(q) || p.dial.includes(q))
  }, [query])

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Selecionar país"
        className="flex h-11 items-center gap-1.5 rounded-full bg-graphite-900/5 pl-4 pr-2.5 text-graphite-900 transition-colors duration-fast hover:bg-graphite-900/10"
      >
        <Flag code={value.code} />
        <span className="text-[14px] font-medium text-graphite-900/60">+{value.dial}</span>
        <ChevronDown
          className={`size-4 text-graphite-900/50 transition-transform duration-fast ${open ? 'rotate-180' : ''}`}
          strokeWidth={1.5}
          aria-hidden
        />
      </button>

      {open && (
        <div
          className="absolute left-0 top-[calc(100%+0.5rem)] z-dropdown w-72 animate-scale-in overflow-hidden rounded-2xl bg-cream-50 shadow-xl"
          role="listbox"
        >
          <div className="border-b border-graphite-900/10 p-2">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar país..."
              className="h-10 w-full rounded-full bg-graphite-900/5 px-4 text-[14px] text-graphite-900 outline-none placeholder:text-graphite-900/45"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto py-1" data-lenis-prevent>
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-[14px] text-graphite-900/50">Nenhum país encontrado.</li>
            )}
            {filtered.map((p) => (
              <li key={p.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={p.code === value.code}
                  onClick={() => {
                    onChange(p)
                    setOpen(false)
                    setQuery('')
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-2 text-left text-[14px] transition-colors duration-fast hover:bg-graphite-900/5 ${
                    p.code === value.code ? 'bg-sage-400/15 text-graphite-900' : 'text-graphite-900/80'
                  }`}
                >
                  <Flag code={p.code} />
                  <span className="flex-1 truncate">{p.name}</span>
                  <span className="text-graphite-900/50">+{p.dial}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/** Accordion do FAQ (Seção 10) — mesma linguagem de card do resto da página. */
function FaqItem({ question, answer, defaultOpen = false, tone = 'light' }) {
  const dark = tone === 'dark'
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={`rounded-2xl border shadow-sm ${dark ? 'border-cream-100/15 bg-cream-100/5' : 'border-graphite-900/10 bg-cream-50'}`}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className={`text-[18px] font-medium ${dark ? 'text-cream-100' : 'text-graphite-900'}`}>{question}</span>
        <Plus className={`size-5 shrink-0 transition-transform duration-moderate ${dark ? 'text-cream-100/50' : 'text-graphite-900/50'} ${open ? 'rotate-45' : ''}`} strokeWidth={1.5} aria-hidden />
      </button>
      <div className={`grid transition-all duration-moderate ease-standard ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <p className={`px-6 pb-6 text-[16px] leading-relaxed tracking-tight lg:text-[18px] ${dark ? 'text-cream-100/70' : 'text-graphite-900/70'}`}>{answer}</p>
        </div>
      </div>
    </div>
  )
}

const FAQ_ITEMS = [
  {
    question: 'Preciso já treinar para acompanhar?',
    answer: 'Não. O encontro trata da sequência e do critério, não de uma ficha específica. Serve para quem treina há anos, para iniciantes e para quem ainda vai começar, por motivos diferentes.',
  },
  {
    question: 'Vai ficar gravado?',
    answer: 'Não. Apenas transmissão ao vivo.',
  },
  {
    question: 'É ao vivo mesmo?',
    answer: 'Sim, com perguntas ao vivo no final. É o motivo de a sala ter teto.',
  },
  {
    question: 'Sou iniciante e tenho vergonha de errar na academia. É para mim?',
    answer: 'É especialmente para você. A noite trata justamente do que ninguém para para explicar.',
  },
]

/* --------------------------------------------------------------------------
   Pesquisa "leads core" — estrutura reaproveitada do formulário que a
   Miranda montou no Active Campaign (form id 5); design descartado, usa os
   componentes desta página (pedido do usuário, 29/07). Perguntas e opções
   verbatim do script dela. */
const SURVEY_QUESTIONS = [
  { id: '18', step: 1, type: 'scale', question: 'De zero a dez, o quanto você está satisfeita com o que o seu treino vem entregando hoje?' },
  { id: '31', step: 1, type: 'multi', question: 'Nas últimas quatro semanas, o que fez você faltar ou encurtar um treino? Marque quantas quiser.', options: ['Cansaço no fim do dia', 'A rotina de trabalho', 'Filhos, casa ou família', 'A vontade não apareceu naquele dia', 'Dor ou desconforto físico', 'Não faltei nem encurtei nenhum treino', 'Outro motivo'] },
  { id: '32', step: 1, type: 'multi', question: 'Em quais destes movimentos você sente mais dificuldade de executar com técnica?', options: ['Agachamento e suas variações', 'Levantamento terra e puxadas', 'Exercícios de glúteo', 'Membros superiores (ombro, costas, braço)', 'Abdômen e core', 'Sinto dificuldade em quase tudo', 'Não sinto dificuldade em nenhum'] },
  { id: '21', step: 2, type: 'text', question: 'O que mais te incomoda hoje quando você pensa no seu treino? Escreva do jeito que vier.' },
  { id: '22', step: 2, type: 'text', question: 'Se o seu treino desse exatamente certo, o que teria mudado na sua vida daqui a um ano? Vale o que você estaria fazendo, como estaria se sentindo e o que estaria vendo. Pode escrever do jeito mais honesto: aqui não existe resposta errada nem resposta' },
  { id: '33', step: 2, type: 'multi', question: 'O que é importante para você em um treino? (marque quantas quiser)', options: ['Executar os movimentos com técnica', 'Voltar a evoluir depois de um período parada no mesmo lugar', 'Manter a constância sem sumir', 'Treinar sem dor', 'Ter mais energia no dia a dia', 'Gostar mais do que eu vejo no espelho'] },
  { id: '23', step: 2, type: 'text', question: 'Conte alguma coisa que você já tentou e que não funcionou. O que aconteceu?' },
  { id: '34', step: 3, type: 'multi', question: 'Pensando em investir num acompanhamento de treino, o quanto cada uma destas coisas pesa para você?', options: ['Medo de começar e não dar conta', 'Já investi antes e me arrependi', 'O valor do investimento', 'A minha rotina não deixa', 'Receio de receber algo genérico, igual para todo mundo', 'Acredito que consigo por conta própria'] },
  { id: '24', step: 3, type: 'text', question: 'Se você pudesse fazer uma pergunta à Anju na noite do encontro, qual seria? As perguntas mais frequentes entram no bloco ao vivo do final.' },
  { id: '35', step: 3, type: 'multi', question: 'Se você fosse contratar um acompanhamento de treino hoje, o que ele precisaria ter para você considerar que valeu? Marque até três. É a ordem de prioridade que interessa, não a lista completa.', options: ['Um programa montado para o meu nível e a minha frequência', 'Alguém que olhe como eu executo e me corrija', 'Vídeo de cada exercício, com o porquê de cada detalhe', 'Contato direto com quem prescreve, para tirar dúvida', 'Uma prescrição feita para o meu corpo, e não para um corpo qualquer', 'Um grupo de mulheres treinando junto comigo', 'Poder testar antes de me comprometer', 'Outro'] },
  { id: '26', step: 4, type: 'single', question: 'Quando você procura informação sobre treino, onde você olha primeiro?', options: ['Instagram', 'YouTube', 'TikTok', 'Busca no Google', 'Pergunto a alguém na academia', 'Pergunto a uma amiga'] },
  { id: '27', step: 4, type: 'single', question: 'Qual destas fases você está vivendo hoje? Escolha a que mais pesa na sua rotina.', options: ['Gestação', 'Pós-parto, até dois anos', 'Rotina com filhos pequenos', 'Perimenopausa ou menopausa', 'Nenhuma dessas no momento', 'Prefiro não responder'] },
]

const SURVEY_SCALE = Array.from({ length: 10 }, (_, i) => String(i + 1))

function SurveyCheckboxRow({ id, checked, onChange, children }) {
  // accent-color força o navegador a desenhar o quadradinho nativo dele
  // (ignora border-radius do autor) — pra ficar redonda de verdade,
  // desliga a aparência nativa (appearance-none) e desenha o check por cima.
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-2 py-0.5">
      <span className="relative mt-0.5 grid size-4 shrink-0 place-items-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="absolute inset-0 size-4 cursor-pointer appearance-none rounded-full border border-graphite-900/30 bg-transparent transition-colors checked:border-sage-500 checked:bg-sage-500"
        />
        <Check className={`relative size-3 text-cream-100 transition-opacity ${checked ? 'opacity-100' : 'opacity-0'}`} strokeWidth={3} aria-hidden />
      </span>
      <span className="text-[12px] leading-snug text-graphite-900/80 md:text-[14px]">{children}</span>
    </label>
  )
}

/** Uma pergunta da pesquisa — o tipo decide o controle (escala, múltipla
    escolha, única escolha ou texto livre). */
function SurveyQuestion({ item, value, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[14px] font-medium leading-snug text-graphite-900">{item.question}</p>
      {item.type === 'scale' && (
        <div className="flex flex-wrap gap-1">
          {SURVEY_SCALE.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              aria-pressed={value === n}
              className={`grid size-8 shrink-0 place-items-center rounded-full border text-[13px] font-medium transition-colors ${
                value === n
                  ? 'border-sage-500 bg-sage-500 text-graphite-900'
                  : 'border-graphite-900/15 text-graphite-900/60 hover:border-sage-400'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      )}
      {item.type === 'multi' && (
        <div className="flex flex-col">
          {item.options.map((opt) => (
            <SurveyCheckboxRow
              key={opt}
              id={`survey-${item.id}-${opt}`}
              checked={value.includes(opt)}
              onChange={() =>
                onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt])
              }
            >
              {opt}
            </SurveyCheckboxRow>
          ))}
        </div>
      )}
      {item.type === 'single' && (
        <div className="flex flex-col">
          {item.options.map((opt) => (
            <label key={opt} htmlFor={`survey-${item.id}-${opt}`} className="flex items-center gap-2 py-0.5">
              <input
                id={`survey-${item.id}-${opt}`}
                type="radio"
                name={`survey-${item.id}`}
                checked={value === opt}
                onChange={() => onChange(opt)}
                className="size-4 shrink-0 border-graphite-900/30 accent-sage-500"
              />
              <span className="text-[12px] leading-snug text-graphite-900/80 md:text-[14px]">{opt}</span>
            </label>
          ))}
        </div>
      )}
      {item.type === 'text' && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputPillCompact}
        />
      )}
    </div>
  )
}

export function AppAordemCaptura() {
  const utm = useMemo(() => readUtms(), [])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [country, setCountry] = useState(BRASIL)
  const [smsConsent, setSmsConsent] = useState(false)
  const [status, setStatus] = useState('idle') // idle | loading | error
  const [errorField, setErrorField] = useState(null)
  // Formulário virou pop-up (pedido do usuário, 29/07) — antes era uma
  // dobra própria da página, aberta rolando até ela; agora qualquer CTA
  // abre o mesmo formulário por cima do conteúdo, sem sair da página.
  const [formOpen, setFormOpen] = useState(false)
  // Ao reservar a vaga, o pop-up da pesquisa abre no lugar (não aparece
  // mais a tela de "vaga reservada" — pedido do usuário 29/07).
  const [surveyOpen, setSurveyOpen] = useState(false)
  const [surveyAnswers, setSurveyAnswers] = useState({})
  const [surveySmsConsent, setSurveySmsConsent] = useState(false)
  const [surveySubmitting, setSurveySubmitting] = useState(false)
  const [surveyDone, setSurveyDone] = useState(false)
  // Pesquisa em várias telas (pedido do usuário 29/07) — step 1, 2, 3...
  // conforme SURVEY_QUESTIONS.step; a ordem/divisão vai sendo ajustada aos poucos.
  const [surveyStep, setSurveyStep] = useState(1)
  const surveyStepCount = Math.max(...SURVEY_QUESTIONS.map((q) => q.step))

  useEffect(() => {
    document.title = 'A Ordem — Hotseat com Anju Mace'
  }, [])

  useEffect(() => {
    if (!formOpen && !surveyOpen) return
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      setFormOpen(false)
      setSurveyOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [formOpen, surveyOpen])

  // Trava a rolagem da página por trás dos pop-ups (senão dá pra rolar o
  // conteúdo desfocado ao fundo enquanto o modal está aberto). Precisa
  // travar o <html> também, não só o <body>: sem altura/overflow própria
  // no body, quem rola de fato é o documentElement — travar só o body não
  // tinha efeito nenhum (relatado pelo usuário 29/07).
  useEffect(() => {
    if (!formOpen && !surveyOpen) return
    const root = document.documentElement
    const prevRootOverflow = root.style.overflow
    const prevBodyOverflow = document.body.style.overflow
    root.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      root.style.overflow = prevRootOverflow
      document.body.style.overflow = prevBodyOverflow
    }
  }, [formOpen, surveyOpen])

  const openForm = () => setFormOpen(true)

  const surveyValue = (id, fallback) => surveyAnswers[id] ?? fallback
  const setSurveyValue = (id, value) => setSurveyAnswers((prev) => ({ ...prev, [id]: value }))

  const submitSurvey = async () => {
    setSurveySubmitting(true)
    const payload = {
      email: email.trim(),
      name: name.trim().split(' ')[0],
      phone: `+${country.dial} ${whatsapp}`,
      answers: surveyAnswers,
      smsConsent: surveySmsConsent,
    }
    // Supabase e Active Campaign em paralelo — pesquisa é informação extra, a
    // vaga já está confirmada, então um erro em qualquer um dos dois nunca
    // trava a tela de agradecimento.
    await Promise.allSettled([
      enviarPesquisaParaSupabase(payload),
      fetch('/api/aordem-pesquisa-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    ])
    setSurveySubmitting(false)
    setSurveyDone(true)
  }

  const handleCountryChange = (next) => {
    setCountry(next)
    setWhatsapp((v) => maskWhatsapp(v, next))
  }

  const whatsappMinDigits = country.code === 'BR' ? 10 : 7

  const submit = async (e) => {
    e.preventDefault()
    if (name.trim().length < 2) { setErrorField('nome'); return }
    if (!emailValido(email)) { setErrorField('email'); return }
    if (whatsapp.replace(/\D/g, '').length < whatsappMinDigits) { setErrorField('whatsapp'); return }
    if (!smsConsent) { setErrorField('sms'); return }
    setErrorField(null)
    setStatus('loading')
    try {
      await enviarParaSupabase({
        name: name.trim(),
        email: email.trim(),
        whatsapp: `+${country.dial} ${whatsapp}`,
        utm,
      })
      // Active Campaign: duas chamadas em paralelo, ambas em segundo plano
      // (nunca bloqueiam a confirmação da vaga). A do form dispara a
      // automação de lembrete por SMS; a do /api/ac-sync garante a tag
      // "Captação - A Ordem" via API (reforço caso o form não aplique).
      enviarParaActiveCampaign({
        name: name.trim(),
        email: email.trim(),
        whatsapp: `+${country.dial} ${whatsapp}`,
      }).catch(() => {})
      fetch('/api/ac-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: `+${country.dial} ${whatsapp}`,
          utm,
          source: 'aordem',
        }),
      }).catch(() => {})
      setStatus('idle')
      setFormOpen(false)
      setSurveyStep(1)
      setSurveyDone(false)
      setSurveyOpen(true)
    } catch {
      setStatus('error')
    }
  }

  return (
    <main className="page-largura-1050 bg-[#FAFFF2] text-graphite-900">
      {/* ---------------------------------------------------------- 1 · HERO */}
      {/* Sem min-h forçado (removido o min-h-svh, 29/07): a seção agora tem
          a altura natural do conteúdo (igual o desktop já fazia com
          min-h-0), sem sobra de creme vazio embaixo do botão. A foto usa
          object-top, então encurtar a caixa dela só corta menos da cauda
          já-esmaecida pro creme (indistinguível do fundo #F5F5DD) — o
          enquadramento do rosto no topo não muda. */}
      <section id="inicio" className="relative flex scroll-mt-16 flex-col overflow-hidden bg-[#F5F5DD] text-graphite-900">
        {/* Foto de fundo — já vem com o fade pro creme embutido na própria
            imagem, então cola direto no fundo #F5F5DD da dobra sem precisar
            de véu por cima. Crop próprio por breakpoint: retrato no mobile
            (rosto no topo, fade embaixo onde o texto cai), paisagem no
            desktop (25/07). */}
        <picture>
          <source media="(min-width: 1024px)" srcSet="/bg-hotseat1-desktop.webp" />
          <img
            src="/bg-hotseat1-mobile.webp"
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 size-full object-cover object-top lg:object-right-top"
          />
        </picture>

        {/* Top header — barra acima da dobra, colada no topo e full-bleed,
            substitui o Nav (pedido do usuário, 25/07). Cada informação
            (host/data/plataforma/duração) segmentada com ícone + divisor,
            nos mesmos cortes "·" do texto original. */}
        <div className="relative z-10 w-full border-b border-cream-100/10 bg-graphite-900/70">
          <Reveal variant="fade">
            <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-1.5 px-3 py-3.5 text-center text-[13px] text-cream-100/70 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-6 sm:gap-y-2 sm:px-6 md:py-4 md:text-[14px] lg:py-[18px] lg:text-[16px]">
              <span className="inline-flex items-center gap-2">
                <span className="relative flex size-2 shrink-0 lg:size-3" aria-hidden>
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-sage-400 opacity-60" />
                  <span className="relative inline-flex size-full rounded-full bg-sage-400" />
                </span>
                <span className="font-medium text-cream-100">Encontro ao vivo e gratuito com Anju Mace</span>
              </span>
              {/* flex-wrap (não flex-col forçado): itens curtos como "Zoom" e
                  "Uma hora e meia" se encaixam na mesma linha sozinhos,
                  só a data (mais longa) quebra pra linha própria — menos
                  altura total no mobile que empilhar tudo (pedido do
                  usuário 29/07, depois de ver o resultado do fix anterior). */}
              <div className="flex flex-row flex-nowrap items-center justify-center gap-x-1 text-[9px] sm:flex-wrap sm:gap-x-6 sm:gap-y-2 sm:text-[13px] md:text-[14px] lg:text-[16px]">
                <span className="hidden h-3 w-px bg-cream-100/15 sm:block lg:h-5" aria-hidden />
                <span className="inline-flex items-center gap-0.5 whitespace-nowrap sm:gap-1.5">
                  <Calendar className="size-2 shrink-0 text-sage-400 sm:size-3.5 lg:size-5" strokeWidth={1.5} aria-hidden />
                  Quinta-feira, 6 de agosto, às 19h37
                </span>
                <span className="hidden h-3 w-px bg-cream-100/15 sm:block lg:h-5" aria-hidden />
                <span className="inline-flex items-center gap-0.5 whitespace-nowrap sm:gap-1.5">
                  <Video className="size-2 shrink-0 text-sage-400 sm:size-3.5 lg:size-5" strokeWidth={1.5} aria-hidden />
                  Zoom
                </span>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Espaçamento vertical bem mais justo no mobile (gap/padding/fonte
            menores) — o botão precisa caber na primeira dobra assim que a
            página abre, em qualquer celular, sem precisar rolar (pedido do
            usuário 29/07). */}
        {/* pt-[185px] é fixo de propósito (não reduzir): a foto de fundo já
            vem com o fade pro creme embutido numa posição vertical
            específica — diminuir o padding empurra o texto pra cima da
            parte "cheia" da foto e corta o enquadramento (pedido do
            usuário 29/07). O respiro pro botão caber vem do gap/pb/fonte
            menores abaixo, não daqui.

            Sem flex-1/justify-end (removido 29/07): isso esticava o bloco
            pra preencher toda a sobra de altura da seção (min-h-svh) e
            "empurrava" o conteúdo pro fundo dela — dava a impressão de foto
            e texto arrastando em velocidades diferentes ao rolar. Sem isso,
            o conteúdo cai direto no ponto calibrado pelo pt-185 (logo
            depois do fim do fade da foto), mais pra cima. */}
        <div className="container relative flex flex-col items-center gap-3 pb-5 pt-[185px] text-center sm:gap-5 sm:pb-8 lg:items-start lg:pb-20 lg:pt-12 lg:text-left">
          <img src="/logo-ordem.svg" alt="A Ordem" className="h-8 w-auto animate-fade-in sm:h-10 md:h-12" />

          <h1 className="max-w-3xl animate-fade-in-up text-h1 text-[24px] text-graphite-900 sm:text-[30px] md:text-[42px] lg:max-w-md lg:text-[46px] [animation-delay:120ms]">
            Construa um corpo (e uma identidade) <strong className="font-medium">que comunica quem você é</strong>, sem pedir licença e sem pedir desculpa.
          </h1>

          <p className="max-w-2xl animate-fade-in-up text-[14px] leading-snug tracking-tight text-graphite-900/70 sm:-mt-4 sm:text-[18px] sm:leading-relaxed lg:mt-0 lg:max-w-md lg:text-[20px] [animation-delay:280ms]">
            Em uma hora e meia, Anju Mace mostra como o treino e a execução dos exercícios se tornam a porta de
            entrada para um corpo forte e feminino, e para uma identidade que você não precisa explicar.
          </p>

          <div className="animate-fade-in-up [animation-delay:440ms]">
            <CtaBlock onClick={openForm} align="left" tone="light" variant="dark" />
          </div>
        </div>
      </section>

      {/* ------------------------------------------ 2 · EXISTE UMA ORDEM */}
      <section id="a-ordem" className="scroll-mt-16 bg-[#FAFFF2] py-20 text-graphite-900 md:py-28">
        <div className="container flex flex-col gap-10">
          <Reveal variant="left">
            <h2 className="max-w-4xl text-h2 text-graphite-900 md:text-[48px]">
              Existe uma ordem por trás de um corpo forte e feminino e de uma identidade que comunica quem você realmente é.
            </h2>
          </Reveal>
          <Reveal delay={100} className="flex max-w-3xl flex-col gap-4 text-[18px] leading-relaxed tracking-tight lg:max-w-5xl lg:text-[20px]">
            <p className="text-graphite-900">Em uma hora e meia, você vai entender o passo a passo para a construção de um corpo forte e feminino, e como comunicar quem você é sem precisar explicar.</p>
            <p className="text-graphite-900/70">Não é sobre administrar a leitura que fazem de você. É sobre construir aquilo que será lido.</p>
            <p className="text-graphite-900/70">E o que será lido se constrói de um jeito específico, com uma sequência que quase ninguém te contou que existe.</p>
          </Reveal>

          {/* Diagrama · O caminho da noite — trilha horizontal com setas no
              desktop, empilhada com filete no mobile (pedido do usuário, 25/07). */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-3">
            <Reveal variant="scale" delay={0} className="lg:flex-1"><NightPathStep icon={Eye} n="01" title="Lida antes de falar">Seu valor é decidido pelo corpo antes de você abrir a boca. Você responde cobrindo ou responde mostrando, e as duas respostas miram o mesmo alvo: o olho de quem observa. É por isso que as duas cansam.</NightPathStep></Reveal>
            <PathArrow />
            <Reveal variant="scale" delay={100} className="lg:flex-1"><NightPathStep icon={ShieldCheck} n="02" accent="gold" title="Nada a explicar">Um corpo forte e feminino que se sustenta no tempo. E uma identidade que não pede licença, não pede desculpa e não precisa de legenda embaixo.</NightPathStep></Reveal>
            <PathArrow />
            <Reveal variant="scale" delay={200} className="lg:flex-1"><NightPathStep icon={Moon} n="03" title="Existe uma ordem" isLast>A Ordem. <strong className="font-medium text-graphite-900">Quinta-feira, 6 de agosto, às 19h37.</strong> Uma hora e meia sobre a sequência que constrói o corpo, e sobre a identidade que ele comunica.</NightPathStep></Reveal>
          </div>

          <Reveal delay={100}>
            <CtaBlock onClick={openForm} tone="light" />
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------- 3 · IDENTIFICAÇÃO DIRETA */}
      <section className="relative scroll-mt-16 overflow-hidden bg-graphite-950 py-20 text-cream-100 md:py-28">
        {/* Foto de fundo — escura (preto e branco, fundo quase preto), texto
            claro (cream) em vez do tratamento escuro-sobre-claro do resto
            da página. Crop próprio por breakpoint: retrato no mobile, rosto
            à esquerda no desktop, conteúdo à direita (25/07). */}
        <picture>
          <source media="(min-width: 1024px)" srcSet="/bg-hotseat2-desktop.webp" />
          <img
            src="/bg-hotseat2-mobile.webp"
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 size-full object-cover object-top lg:object-left-top"
          />
        </picture>
        <div className="container relative">
          <div className="flex flex-col gap-10 lg:ml-auto lg:max-w-xl">
            <Reveal variant="right">
              <h2 className="text-h2 text-cream-100 md:text-[48px]">Essa noite foi escrita para você se:</h2>
            </Reveal>

            <Reveal delay={100}>
              <ul className="divide-y divide-cream-100/15">
                <li className="flex items-start gap-3 py-4 first:pt-0">
                  <Check className="mt-1 size-4 shrink-0 text-sage-400" strokeWidth={2.5} aria-hidden />
                  <p className="text-[16px] leading-relaxed tracking-tight lg:text-[18px] text-cream-100/80">Você treina há anos, faz tudo igual,<br className="md:hidden" /> <strong className="font-medium text-cream-100">e o corpo parou de responder.</strong></p>
                </li>
                <li className="flex items-start gap-3 py-4">
                  <Check className="mt-1 size-4 shrink-0 text-sage-400" strokeWidth={2.5} aria-hidden />
                  <p className="text-[16px] leading-relaxed tracking-tight lg:text-[18px] text-cream-100/80">Você descobriu, um dia, <strong className="font-medium text-cream-100">que estava executando errado</strong>, e ninguém na academia falou nada.</p>
                </li>
                <li className="flex items-start gap-3 py-4">
                  <Check className="mt-1 size-4 shrink-0 text-sage-400" strokeWidth={2.5} aria-hidden />
                  <p className="text-[16px] leading-relaxed tracking-tight lg:text-[18px] text-cream-100/80">Você já pagou por um programa e <strong className="font-medium text-cream-100">recebeu a mesma ficha que a mulher ao lado</strong>, que treina há dez anos e tem outro corpo.</p>
                </li>
                <li className="flex items-start gap-3 py-4">
                  <Check className="mt-1 size-4 shrink-0 text-sage-400" strokeWidth={2.5} aria-hidden />
                  <p className="text-[16px] leading-relaxed tracking-tight lg:text-[18px] text-cream-100/80">Você chegou no corpo que queria e <strong className="font-medium text-cream-100">descobriu que faltava outra coisa.</strong></p>
                </li>
                <li className="flex items-start gap-3 py-4 last:pb-0">
                  <Check className="mt-1 size-4 shrink-0 text-sage-400" strokeWidth={2.5} aria-hidden />
                  <p className="text-[16px] leading-relaxed tracking-tight lg:text-[18px] text-cream-100/80">Você entrou numa fase em que o seu corpo mudou de regra, e <strong className="font-medium text-cream-100">o que funcionava antes parou de funcionar.</strong></p>
                </li>
              </ul>
            </Reveal>

            <Reveal delay={150} className="flex flex-col gap-3 text-[18px] leading-relaxed tracking-tight lg:text-[20px] text-cream-100/70">
              <p>Esta noite não foi escrita para quem procura atalho.</p>
              <p>E também não foi escrita para quem quer que alguém decida tudo no lugar dela.</p>
              <p>Se você treina sozinha e tem orgulho disso, o orgulho está certo.</p>
            </Reveal>

            <Reveal variant="scale" delay={200}>
              <Callout>A questão é outra: o que você conseguiria com a mesma disciplina, aplicada sobre uma sequência pensada?</Callout>
            </Reveal>

            <Reveal delay={100}>
              <CtaBlock onClick={openForm} align="left" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* --------------------------------------- 4 · O QUE MUDA (BULLETS) */}
      <section className="scroll-mt-16 bg-[#FAFFF2] py-20 text-graphite-900 md:py-28">
        <div className="container flex max-w-4xl flex-col gap-10">
          <Reveal variant="left">
            <h2 className="text-h2 text-graphite-900 md:text-[48px]">O que muda na sua próxima série depois desta noite:</h2>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2">
            <Reveal variant="scale" delay={0} className="h-full"><NumberedPoint n="01">As <strong className="font-medium text-graphite-900">quatro decisões</strong> que existem dentro de uma única série, e que você já está tomando hoje, mesmo sem saber que estão ali.</NumberedPoint></Reveal>
            <Reveal variant="scale" delay={40} className="h-full"><NumberedPoint n="02" accent="gold">Por que o <strong className="font-medium text-graphite-900">primeiro exercício da sessão</strong> recebe a melhor energia do seu dia, e o que acontece quando essa escolha é entregue ao acaso.</NumberedPoint></Reveal>
            <Reveal variant="scale" delay={80} className="h-full"><NumberedPoint n="03">O que separa um programa <strong className="font-medium text-graphite-900">organizado por nível e por frequência</strong> de uma ficha que circula igual para corpos que não são iguais.</NumberedPoint></Reveal>
            <Reveal variant="scale" delay={120} className="h-full"><NumberedPoint n="04" accent="gold">Por que o conteúdo gratuito entrega o exercício e <strong className="font-medium text-graphite-900">nunca entrega a ordem, o ajuste e o porquê.</strong> E por que isso não é maldade de ninguém, é limite de formato.</NumberedPoint></Reveal>
            <Reveal variant="scale" delay={160} className="h-full"><NumberedPoint n="05">Por que <strong className="font-medium text-graphite-900">constância é virtude construída</strong>, e não dom de nascença. O que quebrou antes não foi o seu caráter.</NumberedPoint></Reveal>
            <Reveal variant="scale" delay={200} className="h-full"><NumberedPoint n="06" accent="gold"><strong className="font-medium text-graphite-900">A diferença entre perseguir a estética e colher a estética</strong>, e por que só a segunda se sustenta no tempo.</NumberedPoint></Reveal>
            <Reveal variant="scale" delay={240} className="h-full"><NumberedPoint n="07">Como trocar a meta estética isolada por <strong className="font-medium text-graphite-900">marcador funcional</strong>: agachar com técnica, correr sem dor, carregar peso sem fadiga.</NumberedPoint></Reveal>
            <Reveal variant="scale" delay={280} className="h-full"><NumberedPoint n="08" accent="gold">A frase que reorganiza tudo o que vem depois: <strong className="font-medium text-graphite-900">você não pode ajustar aquilo que ainda não percebe.</strong></NumberedPoint></Reveal>
          </div>

          <Reveal delay={100}>
            <CtaBlock onClick={openForm} tone="light" />
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------- 5 · APRESENTAÇÃO DO ENCONTRO */}
      <section className="scroll-mt-16 border-t border-graphite-900/10 bg-[#F5F5DD] py-20 md:py-28">
        <div className="container flex max-w-4xl flex-col gap-10">
          <Reveal variant="right" className="flex flex-col gap-4">
            <h2 className="text-h2 text-graphite-900 md:text-[48px]">A Ordem</h2>
            <p className="text-[18px] leading-relaxed tracking-tight lg:text-[20px] text-graphite-900/70">
              Uma hora e meia sobre a sequência que constrói um corpo, e sobre a identidade que ele comunica.<br />
              O encontro tem três movimentos.
            </p>
          </Reveal>

          <MovementCovers />

          <Reveal delay={100} className="flex flex-col gap-3 text-[18px] leading-relaxed tracking-tight lg:text-[20px] text-graphite-900/70">
            <p>O nome deste encontro tem mais de uma leitura.<br className="hidden md:block" /> Todas se provam ao longo da noite, e nenhuma delas é a que você está imaginando agora.</p>
            <p className="text-graphite-900"><strong className="font-medium">Ao final, Anju abre para perguntas ao vivo.</strong></p>
          </Reveal>

          <Reveal delay={100}>
            <CtaBlock onClick={openForm} tone="light" />
          </Reveal>
        </div>
      </section>

      {/* --------------------------------------------- 6 · SUA TREINADORA */}
      <section id="treinadora" className="scroll-mt-16 bg-[#FAFFF2] py-20 text-graphite-900 md:py-28">
        <div className="container grid max-w-5xl items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <Reveal variant="left" className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
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
            <Reveal variant="right" className="flex flex-col gap-2">
              <span className="text-caption uppercase tracking-wider text-graphite-900/45">Conheça sua treinadora nessa noite</span>
              <h2 className="text-h2 text-graphite-900 md:text-[48px]">Anju Mace</h2>
            </Reveal>
            <Reveal variant="right" delay={100} className="flex flex-col gap-4 text-[18px] leading-relaxed tracking-tight lg:text-[20px] text-graphite-900/70">
              <p>Anju Mace não acredita em instalar potência em ninguém. A força já está em você. O trabalho é despertá-la.</p>
              <p>Foi para isso que ela <strong className="font-medium text-graphite-900">construiu o Método T.E.M.P.L.O.</strong>: técnica que respeita o corpo feminino, e propósito que sustenta a prática nos dias em que a motivação não aparece. Uma coisa sem a outra não constrói nada que dure.</p>
            </Reveal>
            <Reveal delay={150} className="flex flex-col gap-1 border-l-2 border-gold-400/60 pl-5 text-[18px] leading-relaxed tracking-tight lg:text-[20px] text-graphite-900">
              <p>Técnica sem propósito vira rotina.</p>
              <p>Propósito sem técnica vira intenção.</p>
            </Reveal>
            <Reveal variant="right" delay={180} className="flex flex-col gap-4 text-[18px] leading-relaxed tracking-tight lg:text-[20px] text-graphite-900/70">
              <p>Aqui você treina mais que o corpo. Você encontra a mulher que já vive aí dentro, e passa a treinar como quem a reconhece.</p>
              <p className="text-graphite-900"><strong className="font-medium">Seu corpo em movimento, seu poder em liberdade.</strong></p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- 7 · ESCASSEZ REAL */}
      <section className="relative overflow-hidden border-t border-graphite-900/10 bg-[#F5F5DD] py-20 md:py-28">
        {/* Foto de fundo — já vem clara/tingida de creme, então não precisa
            trocar cor de texto aqui (diferente da seção 3, que usava uma
            foto escura). Crop próprio por breakpoint (25/07). */}
        <picture>
          <source media="(min-width: 1024px)" srcSet="/bg-hotseat3-desktop.webp" />
          <img
            src="/bg-hotseat3-mobile.webp"
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 size-full object-cover object-top lg:object-left"
          />
        </picture>
        <div className="container relative max-w-3xl">
          <Reveal variant="left" className="mb-8 flex items-center gap-3">
            <span className="inline-grid size-10 shrink-0 animate-pulse place-items-center rounded-full bg-gold-400/15 text-gold-700">
              <AlertTriangle className="size-5" strokeWidth={1.5} aria-hidden />
            </span>
            <h2 className="text-h2 text-graphite-900 md:text-[48px]">Sobre o<br className="md:hidden" /> limite da sala</h2>
          </Reveal>

          <Reveal delay={100}>
            <div className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-gold-400/40 bg-gold-300/10 p-8 shadow-lg shadow-gold-500/10 backdrop-blur-md">
              <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-shine bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div className="relative flex flex-col gap-4 text-[18px] leading-relaxed tracking-tight lg:text-[20px] text-graphite-900/70">
                <p>A sala no Zoom comporta um número limitado de acessos simultâneos.</p>
                <p>Quando ele é atingido, o Zoom deixa de admitir novas entradas, e não existe nada que possamos fazer do nosso lado naquele momento.</p>
                <p className="text-graphite-900"><strong className="font-medium">Disso decorrem duas coisas:</strong></p>
              </div>
              <ul className="relative flex flex-col gap-3">
                <ChecklistItem accent="gold">O cadastro se encerra quando a lista alcança a capacidade da sala. Não há data de corte artificial. Há um número.</ChecklistItem>
                <ChecklistItem accent="gold">Na noite do encontro, o acesso é por ordem de chegada.<br className="hidden md:block" /> Estar inscrita garante o link, não garante a cadeira, caso a sala encha antes de você entrar.</ChecklistItem>
              </ul>
            </div>
          </Reveal>

          <Reveal delay={200} className="mt-6 flex items-center gap-4 rounded-2xl border border-graphite-900/10 bg-cream-50 px-6 py-5 shadow-sm">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-sage-400 to-sage-600 text-cream-100 shadow-md">
              <Clock className="size-5" strokeWidth={1.5} aria-hidden />
            </span>
            <p className="text-[16px] leading-relaxed tracking-tight lg:text-[18px] text-graphite-900">
              <strong className="font-medium">A recomendação prática é simples:</strong> entre 19h27 e 19h37. Quem chega às 20h00 depende de quem já está dentro.
            </p>
          </Reveal>
        </div>
      </section>

      {/* -------------------------------------------------- FORMULÁRIO (POP-UP) */}
      {formOpen && (
        <div
          className="fixed inset-0 z-modal flex bg-graphite-950/60 p-5 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Reserve seu lugar na sala"
          onClick={(e) => e.target === e.currentTarget && setFormOpen(false)}
        >
          {/* Sem rolagem: tudo (inclusive o botão) precisa caber na mesma
              tela — espaçamentos compactos de propósito (pedido do usuário
              29/07). */}
          <div className="relative m-auto w-full max-w-xl animate-scale-in rounded-3xl border border-graphite-900/10 bg-cream-50 p-4 shadow-2xl md:p-8">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              aria-label="Fechar"
              className="absolute right-4 top-4 grid size-8 place-items-center rounded-full text-graphite-900/40 transition-colors hover:bg-graphite-900/5 hover:text-graphite-900"
            >
              <X className="size-5" strokeWidth={1.5} aria-hidden />
            </button>

            <h2 className="mb-4 text-h4 text-graphite-900">Reserve seu lugar na sala</h2>
            <form onSubmit={submit} noValidate className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="aordem-nome" className="text-[10px] uppercase tracking-wide text-graphite-900/60">Seu nome</label>
                <input
                  id="aordem-nome"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputPillCompact}
                  autoComplete="name"
                />
                {errorField === 'nome' && <p className="text-caption text-red-400">Escreve seu nome pra eu saber como te chamar.</p>}
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="aordem-email" className="text-[10px] uppercase tracking-wide text-graphite-900/60">Seu melhor e-mail <span className="normal-case tracking-normal opacity-70">(é para lá que vai o link)</span></label>
                <input
                  id="aordem-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputPillCompact}
                  autoComplete="email"
                  inputMode="email"
                />
                {errorField === 'email' && <p className="text-caption text-red-400">Confere o e-mail — é nele que o link chega.</p>}
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="aordem-whatsapp" className="text-[10px] uppercase tracking-wide text-graphite-900/60">
                  Seu WhatsApp <span className="normal-case tracking-normal opacity-70">(chega o lembrete)</span>
                </label>
                <div className="flex items-center gap-2">
                  <CountrySelect value={country} onChange={handleCountryChange} />
                  <input
                    id="aordem-whatsapp"
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(maskWhatsapp(e.target.value, country))}
                    className={inputPillCompact}
                    autoComplete="tel-national"
                    inputMode="numeric"
                  />
                </div>
                {errorField === 'whatsapp' && <p className="text-caption text-red-400">Confere o número — é nele que chega o lembrete.</p>}
              </div>

              <label htmlFor="aordem-sms-consent" className="flex items-start gap-2">
                <input
                  id="aordem-sms-consent"
                  type="checkbox"
                  checked={smsConsent}
                  onChange={(e) => setSmsConsent(e.target.checked)}
                  className="mt-0.5 size-4 shrink-0 rounded border-graphite-900/30 accent-sage-500"
                />
                <span className="text-[11px] leading-snug text-graphite-900/60">
                  Ao enviar, você concorda em receber mensagens de texto da Anju Mace no número informado (o lembrete, por exemplo). Cancele quando quiser respondendo STOP.
                </span>
              </label>
              {errorField === 'sms' && <p className="text-caption text-red-400">Marque a caixa pra gente poder te avisar por SMS.</p>}

              <CtaPill type="submit" label="Reservar meu lugar na sala" loading={status === 'loading'} fullWidth />
              {status === 'error' && (
                <p className="text-caption text-red-400">Algo falhou por aqui. Tenta de novo em instantes.</p>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------- PESQUISA (POP-UP) */}
      {surveyOpen && (
        <div
          className="fixed inset-0 z-modal flex overflow-y-auto bg-graphite-950/60 p-5 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Pesquisa rápida"
          onClick={(e) => e.target === e.currentTarget && setSurveyOpen(false)}
        >
          {/* No desktop (wizard de passos) tudo cabe na mesma tela, sem
              rolagem — espaçamentos compactos de propósito (pedido do
              usuário 29/07). No mobile (abaixo) as perguntas vêm todas
              juntas, então o pop-up rola normalmente (pedido do usuário
              29/07, 2ª rodada) — por isso o overflow-y-auto no fundo. */}
          <div className="relative m-auto w-full max-w-xl animate-scale-in rounded-3xl border border-graphite-900/10 bg-cream-50 p-4 shadow-2xl md:p-9">
            <button
              type="button"
              onClick={() => setSurveyOpen(false)}
              aria-label="Fechar"
              className="absolute right-4 top-4 grid size-8 place-items-center rounded-full text-graphite-900/40 transition-colors hover:bg-graphite-900/5 hover:text-graphite-900"
            >
              <X className="size-5" strokeWidth={1.5} aria-hidden />
            </button>

            {surveyDone ? (
              <div className="flex flex-col items-center gap-5 py-6 text-center">
                <span className="relative inline-grid animate-scale-in place-items-center">
                  <span className="absolute inset-0 animate-float-slow rounded-full bg-sage-400/30 blur-xl" aria-hidden />
                  <span className="relative inline-grid size-16 place-items-center rounded-full bg-sage-400 text-graphite-900 shadow-lg">
                    <Check className="size-8" strokeWidth={2} aria-hidden />
                  </span>
                </span>
                <h3 className="text-h3 text-graphite-900">Recebido, obrigada.</h3>
                <div className="flex max-w-sm flex-col gap-3 text-[16px] leading-relaxed tracking-tight lg:text-[18px] text-graphite-900/70">
                  <p>Suas respostas vão ajudar a Anju a preparar<br className="hidden md:block" /> o encontro pensando em você.</p>
                  <p>Agora falta um passo:<br className="md:hidden" /> <strong className="font-medium text-graphite-900">entrar no grupo do WhatsApp</strong>,<br className="md:hidden" /> onde vão sair os<br className="hidden md:block" /> lembretes e o link da sala.</p>
                </div>
                <CtaPill
                  label="Entrar no grupo do WhatsApp"
                  href="https://chat.whatsapp.com/EC0ZhtpVdLhHFm3AAucb0Q?s=cl&p=i&ilr=2&amv=2"
                  icon={WhatsappIcon}
                />
              </div>
            ) : (
              <>
                <h2 className="mb-1 text-h3 text-graphite-900">Pesquisa rápida</h2>
                <p className="mb-3 text-[15px] leading-snug text-graphite-900/60">
                  Pra Anju levar suas respostas pra dentro do encontro.
                </p>

                {/* Mobile: todas as perguntas numa tela só, separadas por
                    linha divisória, rolando dentro do próprio pop-up, com um
                    único botão Finalizar no fim (pedido do usuário 29/07,
                    substitui o wizard de passos só nesse breakpoint). */}
                <div className="flex flex-col divide-y divide-graphite-900/10 sm:hidden">
                  {SURVEY_QUESTIONS.map((item) => (
                    <div key={item.id} className="py-4 first:pt-0">
                      <SurveyQuestion
                        item={item}
                        value={surveyValue(item.id, item.type === 'multi' ? [] : '')}
                        onChange={(v) => setSurveyValue(item.id, v)}
                      />
                    </div>
                  ))}

                  <label htmlFor="survey-sms-consent-mobile" className="flex items-start gap-2 pt-4">
                    <input
                      id="survey-sms-consent-mobile"
                      type="checkbox"
                      checked={surveySmsConsent}
                      onChange={(e) => setSurveySmsConsent(e.target.checked)}
                      className="mt-0.5 size-4 shrink-0 rounded border-graphite-900/30 accent-sage-500"
                    />
                    <span className="text-[12px] leading-snug text-graphite-900/60">
                      Ao enviar este formulário e se inscrever para receber mensagens de texto, você concorda em receber mensagens de texto de marketing (por exemplo, promoções, lembretes de carrinho) da Anju Mace no número informado. O consentimento não é uma condição de compra. Taxas de mensagens e dados podem ser aplicadas. A frequência das mensagens varia. Cancele a inscrição a qualquer momento respondendo STOP.
                    </span>
                  </label>

                  <div className="pt-4">
                    <CtaPill label="Finalizar" onClick={submitSurvey} loading={surveySubmitting} fullWidth />
                  </div>
                </div>

                {/* sm+ : wizard de passos original, sem rolagem. */}
                <div className="hidden sm:block">
                  <div className="flex flex-col gap-4">
                    {SURVEY_QUESTIONS.filter((q) => q.step === surveyStep).map((item) => (
                      <SurveyQuestion
                        key={item.id}
                        item={item}
                        value={surveyValue(item.id, item.type === 'multi' ? [] : '')}
                        onChange={(v) => setSurveyValue(item.id, v)}
                      />
                    ))}
                  </div>

                  {surveyStep === surveyStepCount && (
                    <label htmlFor="survey-sms-consent" className="mt-3 flex items-start gap-2">
                      <input
                        id="survey-sms-consent"
                        type="checkbox"
                        checked={surveySmsConsent}
                        onChange={(e) => setSurveySmsConsent(e.target.checked)}
                        className="mt-0.5 size-4 shrink-0 rounded border-graphite-900/30 accent-sage-500"
                      />
                      <span className="text-[12px] leading-snug text-graphite-900/60">
                        Ao enviar este formulário e se inscrever para receber mensagens de texto, você concorda em receber mensagens de texto de marketing (por exemplo, promoções, lembretes de carrinho) da Anju Mace no número informado. O consentimento não é uma condição de compra. Taxas de mensagens e dados podem ser aplicadas. A frequência das mensagens varia. Cancele a inscrição a qualquer momento respondendo STOP.
                      </span>
                    </label>
                  )}

                  <div className="mt-4">
                    {surveyStep < surveyStepCount ? (
                      <CtaPill label="Continuar" onClick={() => setSurveyStep((s) => s + 1)} fullWidth />
                    ) : (
                      <CtaPill label="Finalizar" onClick={submitSurvey} loading={surveySubmitting} fullWidth />
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* --------------------------------------- 8 · FECHAMENTO + 9 · FAQ */}
      <section id="faq" className="relative scroll-mt-16 overflow-hidden bg-graphite-950 py-20 text-cream-100 md:py-28">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-[36rem] -translate-x-1/2 -translate-y-1/2 animate-float-slow rounded-full bg-sage-500/15 blur-3xl" aria-hidden />
        <div className="container relative max-w-3xl">
          <div className="flex flex-col items-center gap-6 text-center">
            <Reveal variant="fade" className="flex flex-col gap-4 text-[18px] leading-relaxed tracking-tight lg:text-[20px] text-cream-100/75">
              <p>Você pode continuar administrando a leitura que fazem de você. Cobrindo mais, mostrando mais, ajustando a resposta conforme quem está olhando. Isso ocupa uma quantidade absurda de energia, e nunca termina, porque o olho de quem observa muda de opinião sem avisar.</p>
              <p>Ou você pode passar uma hora e meia entendendo como se constrói aquilo que será lido.</p>
              <p className="text-cream-100"><strong className="font-medium">A diferença entre as duas noites de quinta-feira é essa.</strong></p>
            </Reveal>
            <Reveal delay={100} className="flex flex-col items-center gap-3">
              <CtaPill label="Reservar meu lugar na sala" onClick={openForm} />
              <p className="text-center text-caption text-cream-100/50">
                Quinta-feira, 6 de agosto, às 19h37. Uma hora e meia.<br /> Gratuito, enquanto houver lugar na sala.
              </p>
            </Reveal>
          </div>

          <div className="mt-20 md:mt-28">
            <Reveal variant="fade">
              <h2 className="mb-8 text-center text-h2 text-cream-100 md:text-[48px]">Perguntas Frequentes</h2>
            </Reveal>
            <Reveal delay={80} className="flex flex-col gap-4">
              {FAQ_ITEMS.map((item, i) => (
                <FaqItem key={item.question} question={item.question} answer={item.answer} defaultOpen={i === 0} tone="dark" />
              ))}
            </Reveal>
          </div>
        </div>
      </section>

      <footer className="border-t border-graphite-900/10 bg-[#F5F5DD] py-10">
        <div className="container flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <img src="/logo-anju-dark.svg" alt="Anju Mace" loading="lazy" className="h-3.5 w-auto opacity-50" />
          <span className="text-caption text-graphite-900/45">© 2026 Anju Mace - Todos os direitos reservados</span>
        </div>
      </footer>
    </main>
  )
}
