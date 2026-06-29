import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/lib/session'

/* ----------------------------------------------------------------------------
   Tráfego Pago — modelo de dados, mock determinístico, helpers e provider
   ----------------------------------------------------------------------------
   A seção de mídia paga consome campanhas (Meta + Google), métricas diárias,
   criativos (estáticos / vídeos / carrossel) e páginas de captura. Hoje os
   números são um dataset de DEMONSTRAÇÃO gerado aqui (determinístico, estável
   entre reloads). Quando a fonte real existir — integração com a API do
   Meta/Google ou entrada manual gravada nas tabelas `paid_*` — o provider passa
   a ler do Supabase e este mock vira apenas fallback (`usingMock`).

   Tudo que a página exibe (KPIs, séries, rankings) é DERIVADO destes registros
   crus em memória, então trocar a fonte não muda a UI.
---------------------------------------------------------------------------- */

export type Platform = 'meta' | 'google'
export type CampaignStatus = 'active' | 'paused' | 'ended'
export type CreativeType = 'static' | 'video' | 'carousel'

export const PLATFORM_META: Record<Platform, { label: string; short: string; hex: string }> = {
  meta: { label: 'Meta Ads', short: 'Meta', hex: '#3f6fa6' },
  google: { label: 'Google Ads', short: 'Google', hex: '#cc7836' },
}

export const STATUS_META: Record<CampaignStatus, { label: string; tone: 'success' | 'warning' | 'neutral' }> = {
  active: { label: 'Ativa', tone: 'success' },
  paused: { label: 'Pausada', tone: 'warning' },
  ended: { label: 'Encerrada', tone: 'neutral' },
}

export const CREATIVE_META: Record<CreativeType, { label: string; plural: string; hex: string }> = {
  static: { label: 'Estático', plural: 'Estáticos', hex: '#7a5bb0' },
  video: { label: 'Vídeo', plural: 'Vídeos', hex: '#2f9c9c' },
  carousel: { label: 'Carrossel', plural: 'Carrosséis', hex: '#c45c93' },
}

export interface Campaign {
  id: string
  platform: Platform
  name: string
  objective: string
  status: CampaignStatus
  dailyBudget: number
}

/** Métrica crua de um dia de uma campanha (a fonte de tudo). */
export interface DailyMetric {
  campaignId: string
  date: string // yyyy-mm-dd
  spend: number
  impressions: number
  clicks: number
  leads: number
  sales: number
  revenue: number
}

export interface Creative {
  id: string
  campaignId: string
  platform: Platform
  name: string
  type: CreativeType
  spend: number
  impressions: number
  clicks: number
  leads: number
  /** Vídeos: visualizações de 3s+ (hook). */
  videoViews?: number
  /** Cor do placeholder de thumbnail (não temos imagens reais ainda). */
  thumbHex: string
}

export interface LandingPage {
  id: string
  name: string
  url: string
  visits: number
  leads: number
  spend: number
}

export interface PaidDataset {
  campaigns: Campaign[]
  metrics: DailyMetric[]
  creatives: Creative[]
  pages: LandingPage[]
}

/* ------------------------------------------------------------- formatadores */

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const brlCents = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const int = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })

/** Moeda sem centavos (valores grandes: investimento, faturamento). */
export const fmtMoney = (n: number) => brl.format(Math.round(n))
/** Moeda com centavos (custos unitários: CPL, CPC, CPA). */
export const fmtMoneyCents = (n: number) => (Number.isFinite(n) ? brlCents.format(n) : '—')
/** Inteiro com separador de milhar. */
export const fmtInt = (n: number) => int.format(Math.round(n))
/** Número compacto (12,4 mil). */
export function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace('.', ',')} mil`
  return int.format(Math.round(n))
}
/** Percentual com 1 casa (2,3%). */
export const fmtPct = (n: number) => (Number.isFinite(n) ? `${(n * 100).toFixed(1).replace('.', ',')}%` : '—')
/** Multiplicador de ROAS (3,2×). */
export const fmtX = (n: number) => (Number.isFinite(n) ? `${n.toFixed(1).replace('.', ',')}×` : '—')

/* ------------------------------------------------------------- agregação */

export interface Kpis {
  spend: number
  impressions: number
  clicks: number
  leads: number
  sales: number
  revenue: number
  cpl: number // custo por lead
  cpa: number // custo por aquisição (venda)
  cpc: number // custo por clique
  cpm: number // custo por mil impressões
  ctr: number // cliques / impressões
  cvr: number // leads / cliques
  roas: number // faturamento / investimento
}

/** Soma um conjunto de métricas diárias e deriva os indicadores. */
export function aggregate(rows: DailyMetric[]): Kpis {
  const s = rows.reduce(
    (a, r) => {
      a.spend += r.spend
      a.impressions += r.impressions
      a.clicks += r.clicks
      a.leads += r.leads
      a.sales += r.sales
      a.revenue += r.revenue
      return a
    },
    { spend: 0, impressions: 0, clicks: 0, leads: 0, sales: 0, revenue: 0 },
  )
  return {
    ...s,
    cpl: s.leads ? s.spend / s.leads : NaN,
    cpa: s.sales ? s.spend / s.sales : NaN,
    cpc: s.clicks ? s.spend / s.clicks : NaN,
    cpm: s.impressions ? (s.spend / s.impressions) * 1000 : NaN,
    ctr: s.impressions ? s.clicks / s.impressions : NaN,
    cvr: s.clicks ? s.leads / s.clicks : NaN,
    roas: s.spend ? s.revenue / s.spend : NaN,
  }
}

/** Direção de uma variação para o StatCard (custos: cair é bom → invertido). */
export function delta(curr: number, prev: number, lowerIsBetter = false): { value: string; direction: 'up' | 'down' | 'neutral' } {
  if (!Number.isFinite(curr) || !Number.isFinite(prev) || prev === 0) return { value: '—', direction: 'neutral' }
  const pct = (curr - prev) / prev
  const sign = pct > 0 ? '+' : ''
  const magnitudeUp = pct > 0.001
  const magnitudeDown = pct < -0.001
  // "up" = verde, "down" = vermelho. Para custos, alta é ruim → inverte a cor.
  let direction: 'up' | 'down' | 'neutral' = 'neutral'
  if (magnitudeUp) direction = lowerIsBetter ? 'down' : 'up'
  else if (magnitudeDown) direction = lowerIsBetter ? 'up' : 'down'
  return { value: `${sign}${(pct * 100).toFixed(1).replace('.', ',')}%`, direction }
}

/* ===========================================================================
   Gerador de dados de DEMONSTRAÇÃO (determinístico)
   =========================================================================== */

/** PRNG estável (mulberry32) — mesma seed, mesma sequência. */
function rng(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10)
}

interface Profile {
  c: Omit<Campaign, 'id'>
  seed: number
  baseSpend: number // R$/dia no auge
  cpm: number
  ctr: number
  cvr: number // lead por clique
  leadToSale: number
  ticket: number // faturamento por venda
  /** Multiplicador do gasto recente (campanhas pausadas/encerradas caem). */
  recentFactor: number
}

const PROFILES: Profile[] = [
  // -------- Meta --------
  { c: { platform: 'meta', name: 'Captação Leads — App 7 dias', objective: 'Cadastros', status: 'active', dailyBudget: 350 }, seed: 101, baseSpend: 320, cpm: 18, ctr: 0.021, cvr: 0.14, leadToSale: 0.08, ticket: 2400, recentFactor: 1 },
  { c: { platform: 'meta', name: 'Remarketing — TMS Quente', objective: 'Conversões', status: 'active', dailyBudget: 180 }, seed: 202, baseSpend: 160, cpm: 24, ctr: 0.034, cvr: 0.22, leadToSale: 0.16, ticket: 2400, recentFactor: 1 },
  { c: { platform: 'meta', name: 'Reconhecimento — Topo de Funil', objective: 'Alcance', status: 'active', dailyBudget: 220 }, seed: 303, baseSpend: 210, cpm: 11, ctr: 0.012, cvr: 0.06, leadToSale: 0.03, ticket: 2400, recentFactor: 1 },
  { c: { platform: 'meta', name: 'Lançamento TMS — CPL', objective: 'Cadastros', status: 'paused', dailyBudget: 500 }, seed: 404, baseSpend: 470, cpm: 16, ctr: 0.024, cvr: 0.18, leadToSale: 0.1, ticket: 2400, recentFactor: 0.05 },
  // -------- Google --------
  { c: { platform: 'google', name: 'Search — Marca Anju Mace', objective: 'Pesquisa', status: 'active', dailyBudget: 120 }, seed: 505, baseSpend: 95, cpm: 42, ctr: 0.085, cvr: 0.28, leadToSale: 0.2, ticket: 2400, recentFactor: 1 },
  { c: { platform: 'google', name: 'Performance Max — Geral', objective: 'PMax', status: 'active', dailyBudget: 300 }, seed: 606, baseSpend: 280, cpm: 20, ctr: 0.018, cvr: 0.12, leadToSale: 0.09, ticket: 2400, recentFactor: 1 },
  { c: { platform: 'google', name: 'YouTube — Glúteos de Aço', objective: 'Vídeo', status: 'active', dailyBudget: 160 }, seed: 707, baseSpend: 140, cpm: 9, ctr: 0.009, cvr: 0.05, leadToSale: 0.025, ticket: 2400, recentFactor: 1 },
  { c: { platform: 'google', name: 'Display — Remarketing GDA', objective: 'Display', status: 'ended', dailyBudget: 90 }, seed: 808, baseSpend: 80, cpm: 7, ctr: 0.006, cvr: 0.04, leadToSale: 0.02, ticket: 2400, recentFactor: 0 },
]

const DAYS = 90

/** Gera o dataset de demonstração ancorado em `today` (estável por seed). */
export function buildMockDataset(today = new Date()): PaidDataset {
  const campaigns: Campaign[] = PROFILES.map((p, i) => ({ id: `cmp-${i + 1}`, ...p.c }))
  const metrics: DailyMetric[] = []

  PROFILES.forEach((p, i) => {
    const id = `cmp-${i + 1}`
    const r = rng(p.seed)
    for (let back = DAYS - 1; back >= 0; back--) {
      const d = new Date(today)
      d.setDate(d.getDate() - back)
      const progress = (DAYS - 1 - back) / (DAYS - 1) // 0 (antigo) → 1 (hoje)
      const weekday = d.getDay()
      const weekend = weekday === 0 || weekday === 6 ? 0.78 : 1
      const trend = 0.8 + 0.4 * progress
      const noise = 0.75 + 0.5 * r()
      // Campanhas pausadas/encerradas desligam o gasto nos últimos 14 dias.
      const recent = back < 14 ? p.recentFactor : 1
      const spend = p.baseSpend * trend * weekend * noise * recent
      if (spend < 1) {
        metrics.push({ campaignId: id, date: isoDay(d), spend: 0, impressions: 0, clicks: 0, leads: 0, sales: 0, revenue: 0 })
        continue
      }
      const impressions = (spend / p.cpm) * 1000 * (0.9 + 0.2 * r())
      const clicks = impressions * p.ctr * (0.85 + 0.3 * r())
      const leads = clicks * p.cvr * (0.8 + 0.4 * r())
      const sales = leads * p.leadToSale * (0.7 + 0.6 * r())
      const revenue = sales * p.ticket
      metrics.push({
        campaignId: id,
        date: isoDay(d),
        spend: Math.round(spend),
        impressions: Math.round(impressions),
        clicks: Math.round(clicks),
        leads: Math.round(leads),
        sales: Math.round(sales * 10) / 10,
        revenue: Math.round(revenue),
      })
    }
  })

  return { campaigns, metrics, creatives: buildCreatives(), pages: buildPages() }
}

const CREATIVE_DEFS: Array<{ campaignId: string; name: string; type: CreativeType; seed: number; weight: number }> = [
  { campaignId: 'cmp-1', name: 'VSL — Método TMS em 8 semanas', type: 'video', seed: 11, weight: 1.4 },
  { campaignId: 'cmp-1', name: 'Depoimento — Transformação real', type: 'video', seed: 12, weight: 1.1 },
  { campaignId: 'cmp-1', name: 'Card — 3 erros que travam o glúteo', type: 'static', seed: 13, weight: 0.9 },
  { campaignId: 'cmp-2', name: 'Carrossel — Antes e depois', type: 'carousel', seed: 21, weight: 1.3 },
  { campaignId: 'cmp-2', name: 'Reels — Bastidores do treino', type: 'video', seed: 22, weight: 1.0 },
  { campaignId: 'cmp-3', name: 'Estático — Manifesto Anju Mace', type: 'static', seed: 31, weight: 0.7 },
  { campaignId: 'cmp-3', name: 'Vídeo — Hook 7s', type: 'video', seed: 32, weight: 0.85 },
  { campaignId: 'cmp-4', name: 'Card — Vagas abertas TMS', type: 'static', seed: 41, weight: 0.6 },
  { campaignId: 'cmp-4', name: 'Carrossel — O método TMS', type: 'carousel', seed: 42, weight: 0.8 },
  { campaignId: 'cmp-5', name: 'Search — Anúncio dinâmico', type: 'static', seed: 51, weight: 1.2 },
  { campaignId: 'cmp-6', name: 'PMax — Conjunto criativo A', type: 'static', seed: 61, weight: 1.05 },
  { campaignId: 'cmp-6', name: 'PMax — Vídeo quadrado', type: 'video', seed: 62, weight: 0.95 },
  { campaignId: 'cmp-7', name: 'YouTube — Glúteos de Aço 6s', type: 'video', seed: 71, weight: 0.7 },
  { campaignId: 'cmp-7', name: 'YouTube — In-stream 30s', type: 'video', seed: 72, weight: 0.65 },
]

const THUMBS = ['#9eab87', '#3f6fa6', '#cc7836', '#7a5bb0', '#2f9c9c', '#c45c93', '#5b6470']

function buildCreatives(): Creative[] {
  const byCampaign: Record<string, Platform> = {}
  PROFILES.forEach((p, i) => (byCampaign[`cmp-${i + 1}`] = p.c.platform))
  return CREATIVE_DEFS.map((def, i) => {
    const r = rng(def.seed)
    const platform = byCampaign[def.campaignId]
    const spend = Math.round((900 + r() * 4200) * def.weight)
    const cpm = 8 + r() * 30
    const impressions = Math.round((spend / cpm) * 1000)
    const ctr = (def.type === 'video' ? 0.012 : 0.02) * (0.7 + r() * 0.9) * def.weight
    const clicks = Math.round(impressions * ctr)
    const cvr = (0.08 + r() * 0.16) * def.weight
    const leads = Math.max(1, Math.round(clicks * cvr))
    const c: Creative = {
      id: `crt-${i + 1}`,
      campaignId: def.campaignId,
      platform,
      name: def.name,
      type: def.type,
      spend,
      impressions,
      clicks,
      leads,
      thumbHex: THUMBS[i % THUMBS.length],
    }
    if (def.type === 'video') c.videoViews = Math.round(impressions * (0.18 + r() * 0.22))
    return c
  })
}

const PAGE_DEFS: Array<{ name: string; url: string; seed: number; cvr: number; weight: number }> = [
  { name: 'Captura — App 7 dias', url: '/app-7-dias', seed: 91, cvr: 0.34, weight: 1.4 },
  { name: 'VSL — Página de vendas TMS', url: '/vsl-tms', seed: 92, cvr: 0.08, weight: 1.1 },
  { name: 'Aula gratuita — Inscrição', url: '/aula-gratuita', seed: 93, cvr: 0.41, weight: 1.0 },
  { name: 'Quiz — Diagnóstico corporal', url: '/quiz-corporal', seed: 94, cvr: 0.27, weight: 0.8 },
  { name: 'Landing — Lançamento TMS', url: '/lancamento-tms', seed: 95, cvr: 0.19, weight: 0.7 },
]

function buildPages(): LandingPage[] {
  return PAGE_DEFS.map((def, i) => {
    const r = rng(def.seed)
    const visits = Math.round((4000 + r() * 18000) * def.weight)
    const leads = Math.round(visits * def.cvr * (0.8 + r() * 0.4))
    const spend = Math.round((1500 + r() * 9000) * def.weight)
    return { id: `pg-${i + 1}`, name: def.name, url: def.url, visits, leads, spend }
  })
}

/* ===========================================================================
   Provider — lê do Supabase; cai para o mock se vazio/ausente
   =========================================================================== */

interface PaidTrafficCtx extends PaidDataset {
  loading: boolean
  /** Os dados exibidos são o mock de demonstração (tabelas vazias/ausentes). */
  usingMock: boolean
  refresh: () => Promise<void>
}

const Context = createContext<PaidTrafficCtx | null>(null)

const EMPTY: PaidDataset = { campaigns: [], metrics: [], creatives: [], pages: [] }

export function PaidTrafficProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const [data, setData] = useState<PaidDataset>(EMPTY)
  const [usingMock, setUsingMock] = useState(false)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const [c, m, cr, p] = await Promise.all([
      supabase.from('paid_campaigns').select('*'),
      supabase.from('paid_metrics').select('*'),
      supabase.from('paid_creatives').select('*'),
      supabase.from('paid_pages').select('*'),
    ])

    const failed = c.error || m.error || cr.error || p.error
    const empty = !c.data?.length || !m.data?.length

    if (failed || empty) {
      setData(buildMockDataset())
      setUsingMock(true)
      setLoading(false)
      return
    }

    setData({
      campaigns: (c.data as DbCampaign[]).map(mapCampaign),
      metrics: (m.data as DbMetric[]).map(mapMetric),
      creatives: (cr.data as DbCreative[]).map(mapCreative),
      pages: (p.data as DbPage[]).map(mapPage),
    })
    setUsingMock(false)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (status === 'authed') {
      setLoading(true)
      refresh()
      const channel = supabase
        .channel('paid_traffic:sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'paid_metrics' }, () => refresh())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'paid_campaigns' }, () => refresh())
        .subscribe()
      return () => {
        supabase.removeChannel(channel)
      }
    } else if (status === 'anon') {
      setData(EMPTY)
      setUsingMock(false)
      setLoading(false)
    }
  }, [status, refresh])

  const value = useMemo<PaidTrafficCtx>(
    () => ({ ...data, loading, usingMock, refresh }),
    [data, loading, usingMock, refresh],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function usePaidTraffic() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('usePaidTraffic deve ser usado dentro de <PaidTrafficProvider>')
  return ctx
}

/* ------------------------------------------------------- mapeadores do banco */

interface DbCampaign {
  id: string
  platform: Platform
  name: string
  objective: string
  status: CampaignStatus
  daily_budget: number
}
interface DbMetric {
  campaign_id: string
  date: string
  spend: number
  impressions: number
  clicks: number
  leads: number
  sales: number
  revenue: number
}
interface DbCreative {
  id: string
  campaign_id: string
  platform: Platform
  name: string
  type: CreativeType
  spend: number
  impressions: number
  clicks: number
  leads: number
  video_views: number | null
  thumb_hex: string | null
}
interface DbPage {
  id: string
  name: string
  url: string
  visits: number
  leads: number
  spend: number
}

const mapCampaign = (r: DbCampaign): Campaign => ({
  id: r.id,
  platform: r.platform,
  name: r.name,
  objective: r.objective,
  status: r.status,
  dailyBudget: Number(r.daily_budget) || 0,
})
const mapMetric = (r: DbMetric): DailyMetric => ({
  campaignId: r.campaign_id,
  date: r.date,
  spend: Number(r.spend) || 0,
  impressions: Number(r.impressions) || 0,
  clicks: Number(r.clicks) || 0,
  leads: Number(r.leads) || 0,
  sales: Number(r.sales) || 0,
  revenue: Number(r.revenue) || 0,
})
const mapCreative = (r: DbCreative): Creative => ({
  id: r.id,
  campaignId: r.campaign_id,
  platform: r.platform,
  name: r.name,
  type: r.type,
  spend: Number(r.spend) || 0,
  impressions: Number(r.impressions) || 0,
  clicks: Number(r.clicks) || 0,
  leads: Number(r.leads) || 0,
  videoViews: r.video_views == null ? undefined : Number(r.video_views),
  thumbHex: r.thumb_hex || '#5b6470',
})
const mapPage = (r: DbPage): LandingPage => ({
  id: r.id,
  name: r.name,
  url: r.url,
  visits: Number(r.visits) || 0,
  leads: Number(r.leads) || 0,
  spend: Number(r.spend) || 0,
})
