import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/lib/session'

/* ----------------------------------------------------------------------------
   CS (pós-venda) — modelo de dados e provider
   ----------------------------------------------------------------------------
   Casos de CS (public.cs_cases, migration 0042). Um caso por lead GANHO do
   CRM — criado automaticamente por trigger no banco quando o comercial move
   o lead para "Fechado - Ganho". Os dados de contato continuam no crm_leads;
   a UI junta pelo lead_id (o CrmProvider já carrega todos os leads).

   Edições no drawer são otimistas com debounce por caso (mesmo padrão do CRM);
   o arraste no kanban persiste na hora.
---------------------------------------------------------------------------- */

export interface CsCase {
  id: string
  leadId: string
  status: string
  ownerId?: string | null
  notes?: string
  nextActionAt?: string | null // yyyy-mm-dd
  sort: number
  createdAt: string
}

export type CsCasePatch = Partial<Omit<CsCase, 'id' | 'leadId' | 'createdAt'>>

/** Passo do checklist de onboarding concluído num caso. */
export interface CsCheck {
  id: string
  caseId: string
  item: string // valor do catálogo cs_checklist
  doneBy?: string | null
  doneAt: string
}

/** Caso "encerrado" — identificado pelo texto (o catálogo é renomeável). */
export const isCsClosed = (status?: string) => /encerrad/i.test(status ?? '')

/** Atendimento do suporte (public.cs_tickets, migration 0047). */
export interface CsTicket {
  id: string
  leadId?: string | null
  contact?: string | null // nome livre quando a aluna não está no CRM
  channel: string // catálogo support_channel
  topic?: string | null // catálogo support_topic
  summary?: string | null
  status: string // catálogo support_status
  ownerId?: string | null
  openedAt: string // ISO
  resolvedAt?: string | null
  createdAt: string
}

export type CsTicketInput = Omit<CsTicket, 'id' | 'createdAt'>

/** Atendimento "resolvido" — pelo texto (o catálogo é renomeável). */
export const isTicketResolved = (status?: string) => /resolvid/i.test(status ?? '')

interface CsRow {
  id: string
  lead_id: string
  status: string
  owner_id: string | null
  notes: string | null
  next_action_at: string | null
  sort: number | null
  created_at: string
}

function rowToCase(r: CsRow): CsCase {
  return {
    id: r.id,
    leadId: r.lead_id,
    status: r.status ?? 'Onboarding',
    ownerId: r.owner_id,
    notes: r.notes ?? undefined,
    nextActionAt: r.next_action_at,
    sort: r.sort ?? 0,
    createdAt: r.created_at,
  }
}

interface CheckRow {
  id: string
  case_id: string
  item: string
  done_by: string | null
  done_at: string
}

function rowToCheck(r: CheckRow): CsCheck {
  return { id: r.id, caseId: r.case_id, item: r.item, doneBy: r.done_by, doneAt: r.done_at }
}

interface TicketRow {
  id: string
  lead_id: string | null
  contact: string | null
  channel: string
  topic: string | null
  summary: string | null
  status: string
  owner_id: string | null
  opened_at: string
  resolved_at: string | null
  created_at: string
}

function rowToTicket(r: TicketRow): CsTicket {
  return {
    id: r.id,
    leadId: r.lead_id,
    contact: r.contact,
    channel: r.channel,
    topic: r.topic,
    summary: r.summary,
    status: r.status,
    ownerId: r.owner_id,
    openedAt: r.opened_at,
    resolvedAt: r.resolved_at,
    createdAt: r.created_at,
  }
}

function ticketToRow(t: CsTicketInput): Record<string, unknown> {
  return {
    lead_id: t.leadId || null,
    contact: t.contact?.trim() || null,
    channel: t.channel,
    topic: t.topic || null,
    summary: t.summary?.trim() || null,
    status: t.status,
    owner_id: t.ownerId || null,
    opened_at: t.openedAt,
    resolved_at: t.resolvedAt || null,
  }
}

function patchToRow(patch: CsCasePatch): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (patch.status !== undefined) row.status = patch.status
  if (patch.ownerId !== undefined) row.owner_id = patch.ownerId || null
  if (patch.notes !== undefined) row.notes = patch.notes || null
  if (patch.nextActionAt !== undefined) row.next_action_at = patch.nextActionAt || null
  if (patch.sort !== undefined) row.sort = patch.sort
  return row
}

interface CsCtx {
  cases: CsCase[]
  checks: CsCheck[]
  tickets: CsTicket[]
  loading: boolean
  /** CRUD dos atendimentos do suporte (modal — grava na hora). */
  addTicket: (input: CsTicketInput) => Promise<{ error: string | null }>
  updateTicket: (id: string, input: CsTicketInput) => Promise<{ error: string | null }>
  removeTicket: (id: string) => Promise<void>
  updateCase: (id: string, patch: CsCasePatch) => void
  setCaseStatus: (id: string, status: string) => Promise<void>
  removeCase: (id: string) => Promise<void>
  /** Cria casos para leads ganhos que ainda não têm (backfill manual). */
  addCasesForLeads: (leadIds: string[]) => Promise<{ count: number; error: string | null }>
  /** Passos concluídos de um caso. */
  checksFor: (caseId: string) => CsCheck[]
  /** Marca/desmarca um passo do onboarding. */
  toggleCheck: (caseId: string, item: string, done: boolean) => Promise<void>
}

const Context = createContext<CsCtx | null>(null)

const DEBOUNCE_MS = 450

export function CsProvider({ children }: { children: React.ReactNode }) {
  const { status, user } = useSession()
  const [cases, setCases] = useState<CsCase[]>([])
  const [checks, setChecks] = useState<CsCheck[]>([])
  const [tickets, setTickets] = useState<CsTicket[]>([])
  const [loading, setLoading] = useState(true)

  const pending = useRef<Record<string, CsCasePatch>>({})
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const fetchAll = useCallback(async () => {
    const [c, k, t] = await Promise.all([
      supabase.from('cs_cases').select('*').order('sort', { ascending: true }).order('created_at', { ascending: true }),
      supabase.from('cs_case_checks').select('*'),
      supabase.from('cs_tickets').select('*').order('opened_at', { ascending: false }),
    ])
    if (!c.error && c.data) setCases((c.data as CsRow[]).map(rowToCase))
    if (!k.error && k.data) setChecks((k.data as CheckRow[]).map(rowToCheck))
    if (!t.error && t.data) setTickets((t.data as TicketRow[]).map(rowToTicket))
    setLoading(false)
  }, [])

  useEffect(() => {
    if (status === 'authed') {
      setLoading(true)
      fetchAll()
      const channel = supabase
        .channel('cs:sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cs_cases' }, () => {
          if (Object.keys(timers.current).length === 0) fetchAll()
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cs_case_checks' }, () => fetchAll())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cs_tickets' }, () => fetchAll())
        .subscribe()
      return () => {
        supabase.removeChannel(channel)
      }
    } else if (status === 'anon') {
      setCases([])
      setChecks([])
      setTickets([])
      setLoading(false)
    }
  }, [status, fetchAll])

  const flush = useCallback((id: string) => {
    const patch = pending.current[id]
    delete pending.current[id]
    delete timers.current[id]
    if (patch && Object.keys(patch).length > 0) {
      supabase.from('cs_cases').update(patchToRow(patch)).eq('id', id).then(() => {})
    }
  }, [])

  const updateCase = useCallback(
    (id: string, patch: CsCasePatch) => {
      setCases((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)))
      pending.current[id] = { ...pending.current[id], ...patch }
      clearTimeout(timers.current[id])
      timers.current[id] = setTimeout(() => flush(id), DEBOUNCE_MS)
    },
    [flush],
  )

  const setCaseStatus = useCallback(
    async (id: string, newStatus: string) => {
      const maxSort = cases.reduce((m, c) => (c.status === newStatus ? Math.max(m, c.sort) : m), -1)
      const patch: CsCasePatch = { status: newStatus, sort: maxSort + 1 }
      setCases((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)))
      await supabase.from('cs_cases').update(patchToRow(patch)).eq('id', id)
    },
    [cases],
  )

  const removeCase = useCallback(async (id: string) => {
    clearTimeout(timers.current[id])
    delete timers.current[id]
    delete pending.current[id]
    setCases((cs) => cs.filter((c) => c.id !== id))
    await supabase.from('cs_cases').delete().eq('id', id)
  }, [])

  const addCasesForLeads = useCallback(async (leadIds: string[]) => {
    if (leadIds.length === 0) return { count: 0, error: null }
    const rows = leadIds.map((leadId, idx) => ({ lead_id: leadId, sort: idx }))
    const { data, error } = await supabase.from('cs_cases').insert(rows).select('*')
    if (error) return { count: 0, error: error.message }
    const created = (data as CsRow[]).map(rowToCase)
    setCases((cs) => [...cs, ...created])
    return { count: created.length, error: null }
  }, [])

  const checksFor = useCallback(
    (caseId: string) => checks.filter((k) => k.caseId === caseId),
    [checks],
  )

  const toggleCheck = useCallback(
    async (caseId: string, item: string, done: boolean) => {
      if (done) {
        // Otimista com id provisório; o realtime traz a linha definitiva.
        const temp: CsCheck = {
          id: `temp-${caseId}-${item}`,
          caseId,
          item,
          doneBy: user?.userId ?? null,
          doneAt: new Date().toISOString(),
        }
        setChecks((ks) => [...ks.filter((k) => !(k.caseId === caseId && k.item === item)), temp])
        await supabase
          .from('cs_case_checks')
          .upsert({ case_id: caseId, item, done_by: user?.userId ?? null }, { onConflict: 'case_id,item' })
      } else {
        setChecks((ks) => ks.filter((k) => !(k.caseId === caseId && k.item === item)))
        await supabase.from('cs_case_checks').delete().eq('case_id', caseId).eq('item', item)
      }
    },
    [user?.userId],
  )

  const addTicket = useCallback(async (input: CsTicketInput) => {
    const { data, error } = await supabase.from('cs_tickets').insert(ticketToRow(input)).select('*').single()
    if (error) return { error: error.message }
    const created = rowToTicket(data as TicketRow)
    setTickets((ts) => [created, ...ts.filter((t) => t.id !== created.id)])
    return { error: null }
  }, [])

  const updateTicket = useCallback(async (id: string, input: CsTicketInput) => {
    const { error } = await supabase.from('cs_tickets').update(ticketToRow(input)).eq('id', id)
    if (error) return { error: error.message }
    setTickets((ts) => ts.map((t) => (t.id === id ? { ...t, ...input } : t)))
    return { error: null }
  }, [])

  const removeTicket = useCallback(async (id: string) => {
    setTickets((ts) => ts.filter((t) => t.id !== id))
    await supabase.from('cs_tickets').delete().eq('id', id)
  }, [])

  const value = useMemo<CsCtx>(
    () => ({ cases, checks, tickets, loading, addTicket, updateTicket, removeTicket, updateCase, setCaseStatus, removeCase, addCasesForLeads, checksFor, toggleCheck }),
    [cases, checks, tickets, loading, addTicket, updateTicket, removeTicket, updateCase, setCaseStatus, removeCase, addCasesForLeads, checksFor, toggleCheck],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useCs() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useCs deve ser usado dentro de <CsProvider>')
  return ctx
}
