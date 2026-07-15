import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/lib/session'

/* ----------------------------------------------------------------------------
   Tráfego Pago — modelo de dados, helpers e provider
   ----------------------------------------------------------------------------
   A seção de mídia paga consome campanhas (Meta + Google), métricas diárias,
   criativos (estáticos / vídeos / carrossel) e páginas de captura, lidos das
   tabelas `paid_*` no Supabase. Enquanto a fonte real não existir (integração
   com a API do Meta/Google ou entrada manual), as tabelas ficam vazias e a
   página mostra o estado "aguardando dados" — sem números fictícios.

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
   Provider — lê do Supabase (tabelas paid_*); vazio = aguardando dados reais
   =========================================================================== */

interface PaidTrafficCtx extends PaidDataset {
  loading: boolean
  refresh: () => Promise<void>
}

const Context = createContext<PaidTrafficCtx | null>(null)

const EMPTY: PaidDataset = { campaigns: [], metrics: [], creatives: [], pages: [] }

export function PaidTrafficProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const [data, setData] = useState<PaidDataset>(EMPTY)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const [c, m, cr, p] = await Promise.all([
      supabase.from('paid_campaigns').select('*'),
      supabase.from('paid_metrics').select('*'),
      supabase.from('paid_creatives').select('*'),
      supabase.from('paid_pages').select('*'),
    ])

    // Tabelas ausentes ou vazias = ainda sem dados reais; a página mostra o
    // estado "aguardando dados" (nada de números fictícios).
    if (c.error || m.error || cr.error || p.error) {
      setData(EMPTY)
      setLoading(false)
      return
    }

    setData({
      campaigns: (c.data as DbCampaign[]).map(mapCampaign),
      metrics: (m.data as DbMetric[]).map(mapMetric),
      creatives: (cr.data as DbCreative[]).map(mapCreative),
      pages: (p.data as DbPage[]).map(mapPage),
    })
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
      setLoading(false)
    }
  }, [status, refresh])

  const value = useMemo<PaidTrafficCtx>(
    () => ({ ...data, loading, refresh }),
    [data, loading, refresh],
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
