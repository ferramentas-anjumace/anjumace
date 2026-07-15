import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/lib/session'

/* ----------------------------------------------------------------------------
   Funil de Atração (Guia) — modelo de dados e provider
   ----------------------------------------------------------------------------
   Leads do e-book "Os cinco tipos de falha" (public.funnel_leads, migration
   0051), capturados na landing /guia com UTMs de atribuição. Separados do CRM:
   é topo de funil frio. "Promover pro CRM" cria o crm_lead (origem 'Guia') e
   carimba crm_lead_id/promoted_at aqui — mesmo desenho da Lista de Espera.
---------------------------------------------------------------------------- */

export interface FunnelLead {
  id: string
  name: string
  email: string
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
  utmContent?: string | null
  utmTerm?: string | null
  referrer?: string | null
  signupCount: number
  crmLeadId?: string | null
  promotedAt?: string | null
  createdAt: string
}

interface FunnelRow {
  id: string
  name: string
  email: string
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null
  referrer: string | null
  signup_count: number | null
  crm_lead_id: string | null
  promoted_at: string | null
  created_at: string
}

function rowToLead(r: FunnelRow): FunnelLead {
  return {
    id: r.id,
    name: r.name ?? '',
    email: r.email,
    utmSource: r.utm_source,
    utmMedium: r.utm_medium,
    utmCampaign: r.utm_campaign,
    utmContent: r.utm_content,
    utmTerm: r.utm_term,
    referrer: r.referrer,
    signupCount: r.signup_count ?? 1,
    crmLeadId: r.crm_lead_id,
    promotedAt: r.promoted_at,
    createdAt: r.created_at,
  }
}

interface FunnelCtx {
  leads: FunnelLead[]
  loading: boolean
  removeLead: (id: string) => Promise<void>
  /** Carimba o lead como promovido (o crm_lead é criado pelo chamador). */
  markPromoted: (id: string, crmLeadId: string) => Promise<{ error: string | null }>
}

const Context = createContext<FunnelCtx | null>(null)

export function FunnelProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const [leads, setLeads] = useState<FunnelLead[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    const { data, error } = await supabase
      .from('funnel_leads')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setLeads((data as FunnelRow[]).map(rowToLead))
    setLoading(false)
  }, [])

  useEffect(() => {
    if (status === 'authed') {
      setLoading(true)
      fetchAll()
      const channel = supabase
        .channel('funnel:sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'funnel_leads' }, () => fetchAll())
        .subscribe()
      return () => {
        supabase.removeChannel(channel)
      }
    } else if (status === 'anon') {
      setLeads([])
      setLoading(false)
    }
  }, [status, fetchAll])

  const removeLead = useCallback(async (id: string) => {
    setLeads((ls) => ls.filter((l) => l.id !== id))
    await supabase.from('funnel_leads').delete().eq('id', id)
  }, [])

  const markPromoted = useCallback(async (id: string, crmLeadId: string) => {
    const promotedAt = new Date().toISOString()
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, crmLeadId, promotedAt } : l)))
    const { error } = await supabase
      .from('funnel_leads')
      .update({ crm_lead_id: crmLeadId, promoted_at: promotedAt })
      .eq('id', id)
    return { error: error?.message ?? null }
  }, [])

  const value = useMemo<FunnelCtx>(
    () => ({ leads, loading, removeLead, markPromoted }),
    [leads, loading, removeLead, markPromoted],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useFunnel() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useFunnel deve ser usado dentro de <FunnelProvider>')
  return ctx
}
