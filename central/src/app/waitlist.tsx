import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/lib/session'

/* ----------------------------------------------------------------------------
   Lista de Espera — modelo de dados e provider
   ----------------------------------------------------------------------------
   Inscrições da landing /lista-de-espera (public.waitlist_leads, migration
   0041). Separada do CRM de propósito: aqui é aquecimento; o CRM é negociação.
   Quando o lead esquenta, "Promover pro CRM" cria o crm_lead (via useCrm) e
   carimba promoted_lead_id/promoted_at na inscrição.
---------------------------------------------------------------------------- */

export interface WaitlistLead {
  id: string
  name: string
  email?: string
  whatsapp?: string
  notes?: string
  promotedLeadId?: string | null
  promotedAt?: string | null
  createdAt: string
}

interface WaitlistRow {
  id: string
  name: string
  email: string | null
  whatsapp: string | null
  notes: string | null
  promoted_lead_id: string | null
  promoted_at: string | null
  created_at: string
}

function rowToLead(r: WaitlistRow): WaitlistLead {
  return {
    id: r.id,
    name: r.name ?? '',
    email: r.email ?? undefined,
    whatsapp: r.whatsapp ?? undefined,
    notes: r.notes ?? undefined,
    promotedLeadId: r.promoted_lead_id,
    promotedAt: r.promoted_at,
    createdAt: r.created_at,
  }
}

interface WaitlistCtx {
  entries: WaitlistLead[]
  loading: boolean
  removeEntry: (id: string) => Promise<void>
  /** Carimba a inscrição como promovida (o crm_lead é criado pelo chamador). */
  markPromoted: (id: string, crmLeadId: string) => Promise<{ error: string | null }>
}

const Context = createContext<WaitlistCtx | null>(null)

export function WaitlistProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const [entries, setEntries] = useState<WaitlistLead[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    const { data, error } = await supabase
      .from('waitlist_leads')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setEntries((data as WaitlistRow[]).map(rowToLead))
    setLoading(false)
  }, [])

  useEffect(() => {
    if (status === 'authed') {
      setLoading(true)
      fetchAll()
      const channel = supabase
        .channel('waitlist:sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'waitlist_leads' }, () => fetchAll())
        .subscribe()
      return () => {
        supabase.removeChannel(channel)
      }
    } else if (status === 'anon') {
      setEntries([])
      setLoading(false)
    }
  }, [status, fetchAll])

  const removeEntry = useCallback(async (id: string) => {
    setEntries((es) => es.filter((e) => e.id !== id))
    await supabase.from('waitlist_leads').delete().eq('id', id)
  }, [])

  const markPromoted = useCallback(async (id: string, crmLeadId: string) => {
    const promotedAt = new Date().toISOString()
    setEntries((es) => es.map((e) => (e.id === id ? { ...e, promotedLeadId: crmLeadId, promotedAt } : e)))
    const { error } = await supabase
      .from('waitlist_leads')
      .update({ promoted_lead_id: crmLeadId, promoted_at: promotedAt })
      .eq('id', id)
    return { error: error?.message ?? null }
  }, [])

  const value = useMemo<WaitlistCtx>(
    () => ({ entries, loading, removeEntry, markPromoted }),
    [entries, loading, removeEntry, markPromoted],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useWaitlist() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useWaitlist deve ser usado dentro de <WaitlistProvider>')
  return ctx
}
