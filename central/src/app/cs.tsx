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
  loading: boolean
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
  const [loading, setLoading] = useState(true)

  const pending = useRef<Record<string, CsCasePatch>>({})
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const fetchAll = useCallback(async () => {
    const [c, k] = await Promise.all([
      supabase.from('cs_cases').select('*').order('sort', { ascending: true }).order('created_at', { ascending: true }),
      supabase.from('cs_case_checks').select('*'),
    ])
    if (!c.error && c.data) setCases((c.data as CsRow[]).map(rowToCase))
    if (!k.error && k.data) setChecks((k.data as CheckRow[]).map(rowToCheck))
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
        .subscribe()
      return () => {
        supabase.removeChannel(channel)
      }
    } else if (status === 'anon') {
      setCases([])
      setChecks([])
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

  const value = useMemo<CsCtx>(
    () => ({ cases, checks, loading, updateCase, setCaseStatus, removeCase, addCasesForLeads, checksFor, toggleCheck }),
    [cases, checks, loading, updateCase, setCaseStatus, removeCase, addCasesForLeads, checksFor, toggleCheck],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useCs() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useCs deve ser usado dentro de <CsProvider>')
  return ctx
}
