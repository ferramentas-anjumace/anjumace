import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Check, ChevronDown, X } from 'lucide-react'
import 'flag-icons/css/flag-icons.min.css'
import { HERO, FORM, ERROS, SUCESSO, PRIVACIDADE } from './data'
import { PAISES, BRASIL } from './paises'

/* Bandeira de verdade via flag-icons (SVG) — emoji de bandeira não renderiza
   no Windows (as fontes do sistema não têm os glifos, só mostram a sigla). */
function Flag({ code, className = '' }) {
  return (
    <span
      className={`fi fi-${code.toLowerCase()} shrink-0 rounded-[3px] ${className}`}
      style={{ width: '1.25rem', height: '0.875rem' }}
      aria-hidden
    />
  )
}

/* Captura pública → função lista_espera_signup no Supabase da Central
   (migration 0040). A anon key é pública por design — quem protege a
   tabela é o RLS + a própria função.
   Sync ActiveCampaign (tag "Lista de Espera", lista "LEADS") via
   /api/ac-sync, fire-and-forget — nunca bloqueia a conversão. */
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://hcinspgpmmsohtbizvor.supabase.co'
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjaW5zcGdwbW1zb2h0Yml6dm9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMjQxNzgsImV4cCI6MjA5NzkwMDE3OH0.KmmfhdE93gTy5loqF_uF5v6M9YyjWT_Y35Gd1XTjyZk'

async function enviarLead({ name, email, whatsapp }) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/lista_espera_signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ p_name: name, p_email: email, p_whatsapp: whatsapp }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  if (!data?.ok) throw new Error(data?.error || 'invalid')

  fetch('/api/ac-sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, phone: whatsapp, source: 'lista_espera' }),
  }).catch(() => {})

  return data
}

/* Máscara BR conforme digita: (11) 98765-4321. Aceita 10 ou 11 dígitos. */
function maskWhatsappBR(value) {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/* Máscara genérica pros demais países: só agrupa dígitos de 3 em 3
   (não dá pra ter uma máscara específica por DDI sem uma lib de telefone). */
function maskWhatsappGenerico(value) {
  const d = value.replace(/\D/g, '').slice(0, 14)
  return d.replace(/(\d{3})(?=\d)/g, '$1 ')
}

function maskWhatsapp(value, country) {
  return country.code === 'BR' ? maskWhatsappBR(value) : maskWhatsappGenerico(value)
}

const emailValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

/* Gradiente de marca dos CTAs — mesmo recibo da página de obrigado:
   sálvia → creme em repouso, desliza no hover. */
const gradient =
  'bg-gradient-to-r from-sage-400 via-cream-200 to-sage-500 bg-[length:200%_100%] bg-left hover:bg-right text-graphite-900 shadow-md hover:shadow-lg transition-[background-position,box-shadow,transform] duration-slow ease-out'

/* Pill de input do formulário — creme sobre creme, como na página original. */
const inputPill =
  'h-14 w-full rounded-full border border-transparent bg-cream-200/60 px-6 text-body text-graphite-900 placeholder:text-graphite-900/45 outline-none transition-[border-color,box-shadow] duration-fast focus:border-sage-400 focus:shadow-focus'

/** CTA pill com a seta em círculo destacado à direita (assinatura da original). */
function CtaPill({ label, onClick, type = 'button', loading = false }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      className={`group inline-flex h-16 items-center gap-4 rounded-full py-2 pl-8 pr-2 font-medium uppercase tracking-wide disabled:pointer-events-none disabled:opacity-60 ${gradient}`}
    >
      <span className="text-sm md:text-base">{loading ? 'Enviando…' : label}</span>
      <span className="inline-grid size-12 shrink-0 place-items-center rounded-full bg-cream-100/80 text-graphite-900 transition-transform duration-moderate ease-spring group-hover:translate-x-0.5">
        <ArrowRight
          className={`size-5 ${loading ? 'animate-pulse' : ''}`}
          strokeWidth={1.5}
          aria-hidden
        />
      </span>
    </button>
  )
}

/** Hero preto de tela cheia — headline à esquerda, apoio à direita, CTA embaixo. */
function Hero({ onOpen }) {
  return (
    <section className="relative flex min-h-dvh flex-col overflow-hidden bg-graphite-950 text-cream-100">
      {/* Orbes de luz — profundidade e movimento contínuo sutil no preto. */}
      <div
        className="pointer-events-none absolute -left-32 top-1/4 size-96 animate-float-slow rounded-full bg-sage-500/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 right-[8%] size-80 animate-float rounded-full bg-gold-500/10 blur-3xl"
        aria-hidden
      />

      {/* Logo no topo da dobra. */}
      <div className="relative z-10 flex justify-center pt-10 md:pt-12">
        <img src="/logo-anju.svg" alt="Anju Mace" className="h-4 w-auto animate-fade-in" />
      </div>

      <div className="container relative flex flex-1 flex-col items-center justify-center gap-12 py-16 text-center md:flex-row md:gap-16 md:text-left">
        <h1 className="animate-fade-in-up text-display-sm text-cream-100 md:text-display [animation-delay:120ms]">
          {HERO.title.replace(/\.$/, '')}
          <span className="text-sage-400">.</span>
        </h1>

        {/* Filete vertical separando headline e apoio (só desktop). */}
        <span className="hidden h-24 w-px shrink-0 bg-cream-100/20 md:block" aria-hidden />

        <p className="max-w-xs animate-fade-in-up text-body-lg text-cream-100/75 [animation-delay:280ms]">
          {HERO.description}
        </p>
      </div>

      <div className="relative z-10 flex animate-fade-in-up justify-center pb-16 [animation-delay:440ms] md:pb-20">
        <CtaPill label={HERO.cta} onClick={onOpen} />
      </div>
    </section>
  )
}

/** Modal simples com as políticas de privacidade (a original abria um popup). */
function PrivacidadeModal({ open, onClose }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-modal grid place-items-center p-6" role="dialog" aria-modal="true" aria-label={PRIVACIDADE.title}>
      <div className="absolute inset-0 bg-graphite-950/60 animate-fade-in" onClick={onClose} aria-hidden />
      <div className="relative max-w-lg animate-scale-in rounded-3xl bg-cream-50 p-8 shadow-xl">
        <h3 className="text-h4 text-graphite-900">{PRIVACIDADE.title}</h3>
        <div className="mt-4 flex flex-col gap-3">
          {PRIVACIDADE.paragraphs.map((p) => (
            <p key={p} className="text-body-sm leading-relaxed text-graphite-900/70">{p}</p>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 inline-flex h-11 items-center rounded-full bg-sage-400 px-6 text-body-sm font-medium text-graphite-900 transition-colors duration-fast hover:bg-sage-500"
        >
          {PRIVACIDADE.close}
        </button>
      </div>
    </div>
  )
}

/** Seletor de país (bandeira + DDI) pro campo de WhatsApp — busca por nome ou código. */
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
        className="flex h-14 items-center gap-1.5 rounded-full bg-cream-200/60 pl-5 pr-3 text-graphite-900 transition-colors duration-fast hover:bg-cream-200"
      >
        <Flag code={value.code} />
        <span className="text-body-sm font-medium text-graphite-900/60">+{value.dial}</span>
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
              className="h-10 w-full rounded-full bg-cream-200/60 px-4 text-body-sm text-graphite-900 outline-none placeholder:text-graphite-900/45"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto py-1" data-lenis-prevent>
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-body-sm text-graphite-900/50">Nenhum país encontrado.</li>
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
                  className={`flex w-full items-center gap-3 px-4 py-2 text-left text-body-sm transition-colors duration-fast hover:bg-cream-200/70 ${
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

/** Drawer lateral creme com o formulário — desliza da direita como na original. */
function FormDrawer({ open, onClose }) {
  const [values, setValues] = useState({ name: '', email: '', whatsapp: '' })
  const [country, setCountry] = useState(BRASIL)
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [showPrivacidade, setShowPrivacidade] = useState(false)
  const firstFieldRef = useRef(null)

  /* Esc fecha; ao abrir, foco no primeiro campo. */
  useEffect(() => {
    if (!open) return
    firstFieldRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const set = (key) => (e) =>
    setValues((v) => ({
      ...v,
      [key]: key === 'whatsapp' ? maskWhatsapp(e.target.value, country) : e.target.value,
    }))

  const handleCountryChange = (next) => {
    setCountry(next)
    setValues((v) => ({ ...v, whatsapp: maskWhatsapp(v.whatsapp, next) }))
  }

  const whatsappMinDigits = country.code === 'BR' ? 10 : 7

  async function handleSubmit(e) {
    e.preventDefault()
    if (values.name.trim().length < 2) return setError(ERROS.name)
    if (!emailValido(values.email)) return setError(ERROS.email)
    if (values.whatsapp.replace(/\D/g, '').length < whatsappMinDigits) return setError(ERROS.whatsapp)
    if (!consent) return setError(ERROS.consent)

    setError(null)
    setLoading(true)
    try {
      await enviarLead({
        name: values.name.trim(),
        email: values.email.trim(),
        whatsapp: `+${country.dial} ${values.whatsapp}`,
      })
      setDone(true)
    } catch {
      setError(ERROS.network)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-overlay" role="dialog" aria-modal="true" aria-label={FORM.title}>
      {/* Backdrop escurecendo o hero. */}
      <div className="absolute inset-0 animate-fade-in bg-graphite-950/70" onClick={onClose} aria-hidden />

      {/* Painel creme — largura total no mobile, coluna à direita no desktop. */}
      <aside
        data-lenis-prevent
        className="absolute inset-y-0 right-0 flex w-full flex-col overflow-y-auto bg-cream-50 px-7 py-8 animate-[slide-in-right_0.45s_var(--ease-out)_both] md:max-w-lg md:px-12"
      >
        {/* Cabeçalho: wordmark + fechar. */}
        <div className="flex items-center justify-between border-b border-graphite-900/10 pb-5">
          {/* Logo é creme — brightness-0 escurece para ler sobre o painel claro. */}
          <img src="/logo-anju.svg" alt="Anju Mace" className="h-3.5 w-auto brightness-0 opacity-70" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="inline-grid size-9 place-items-center rounded-full text-graphite-900/60 transition-colors duration-fast hover:bg-cream-200/70 hover:text-graphite-900"
          >
            <X className="size-5" strokeWidth={1.5} />
          </button>
        </div>

        {done ? (
          /* Estado de sucesso — substitui o formulário. */
          <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
            <span className="relative inline-grid animate-scale-in place-items-center">
              <span className="absolute inset-0 animate-float-slow rounded-full bg-sage-400/30 blur-xl" aria-hidden />
              <span className="relative inline-grid size-16 place-items-center rounded-full bg-sage-400 text-graphite-900 shadow-lg">
                <Check className="size-8" strokeWidth={2} aria-hidden />
              </span>
            </span>
            <h2 className="text-h3 text-graphite-900">{SUCESSO.title}</h2>
            <p className="max-w-sm text-body text-graphite-900/70">{SUCESSO.description}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 inline-flex h-12 items-center rounded-full border border-graphite-900/20 px-8 text-body-sm font-medium uppercase tracking-wide text-graphite-900 transition-colors duration-fast hover:bg-cream-200/70"
            >
              {SUCESSO.close}
            </button>
          </div>
        ) : (
          <div className="flex flex-1 flex-col justify-center py-10">
            <h2 className="mx-auto max-w-xs text-center text-h3 font-light text-sage-700">
              {FORM.title}
            </h2>

            {/* Sem honeypot: o autofill do navegador preenchia o campo invisível
                e o envio era bloqueado sem feedback. A validação real (formato,
                limites, dedupe) fica na função lista_espera_signup do Supabase. */}
            <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-4">
              <input
                ref={firstFieldRef}
                type="text"
                name="name"
                autoComplete="name"
                placeholder={FORM.namePlaceholder}
                value={values.name}
                onChange={set('name')}
                className={inputPill}
              />
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder={FORM.emailPlaceholder}
                value={values.email}
                onChange={set('email')}
                className={inputPill}
              />
              <div className="flex items-center gap-2">
                <CountrySelect value={country} onChange={handleCountryChange} />
                <input
                  type="tel"
                  name="whatsapp"
                  autoComplete="tel-national"
                  inputMode="numeric"
                  placeholder={FORM.whatsappPlaceholder}
                  value={values.whatsapp}
                  onChange={set('whatsapp')}
                  className={inputPill}
                />
              </div>

              {/* Aceite de privacidade. */}
              <label className="flex cursor-pointer items-start gap-2.5 px-2 pt-1">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="peer sr-only"
                />
                <span className="mt-0.5 inline-grid size-5 shrink-0 place-items-center rounded-[5px] border border-graphite-900/25 bg-cream-50 transition-colors duration-fast peer-checked:border-sage-500 peer-checked:bg-sage-400 peer-focus-visible:shadow-focus">
                  <Check
                    className={`size-3.5 text-graphite-900 ${consent ? 'opacity-100' : 'opacity-0'}`}
                    strokeWidth={3}
                    aria-hidden
                  />
                </span>
                <span className="text-body-sm text-graphite-900/70">
                  {FORM.consentBefore}
                  <button
                    type="button"
                    onClick={() => setShowPrivacidade(true)}
                    className="underline underline-offset-2 transition-colors duration-fast hover:text-graphite-900"
                  >
                    {FORM.consentLink}
                  </button>
                </span>
              </label>

              {error && (
                <p className="px-2 text-body-sm text-danger" role="alert">
                  {error}
                </p>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`group inline-flex h-16 w-full items-center justify-between rounded-full py-2 pl-8 pr-2 font-medium uppercase tracking-wide disabled:pointer-events-none disabled:opacity-60 ${gradient}`}
                >
                  <span className="text-sm md:text-base">
                    {loading ? 'Enviando…' : FORM.submit}
                  </span>
                  <span className="inline-grid size-12 shrink-0 place-items-center rounded-full bg-cream-100/80 text-graphite-900 transition-transform duration-moderate ease-spring group-hover:translate-x-0.5">
                    <ArrowRight
                      className={`size-5 ${loading ? 'animate-pulse' : ''}`}
                      strokeWidth={1.5}
                      aria-hidden
                    />
                  </span>
                </button>
              </div>
            </form>
          </div>
        )}
      </aside>

      <PrivacidadeModal open={showPrivacidade} onClose={() => setShowPrivacidade(false)} />
    </div>
  )
}

/**
 * Página de Lista de Espera — recriação da página original do WordPress
 * (anjumace.com.br/lista-de-espera) no design system, com o formulário
 * gravando o lead direto no CRM da Central (origem "Lista de Espera").
 */
export function AppListaEspera() {
  const [formOpen, setFormOpen] = useState(false)

  useEffect(() => {
    document.title = 'Lista de Espera - Anju Mace'
  }, [])

  return (
    <div className="min-h-dvh bg-graphite-950 antialiased">
      <Hero onOpen={() => setFormOpen(true)} />
      <FormDrawer open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  )
}
