import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/lib/session'

/* ----------------------------------------------------------------------------
   Store da agenda — Supabase (tabela public.agenda_events)
   ----------------------------------------------------------------------------
   Compromissos do time. Admin cria/edita/exclui; todos veem. Participantes são
   ids de profiles (resolvidos para nomes na UI).
---------------------------------------------------------------------------- */

export type AgendaCategory = 'steel' | 'sand' | 'success' | 'danger'

export interface AgendaEvent {
  id: string
  /** Data ISO yyyy-mm-dd. */
  date: string
  time: string | null
  title: string
  meta: string | null
  category: AgendaCategory
  description: string | null
  meetingUrl: string | null
  location: string | null
  clientId: string | null
  /** Ids de profiles (participantes). */
  people: string[]
}

export type AgendaInput = {
  date: string
  time?: string
  title: string
  meta?: string
  category?: AgendaCategory
  description?: string
  meetingUrl?: string
  location?: string
  people?: string[]
}

interface AgendaRow {
  id: string
  date: string
  time: string | null
  title: string
  meta: string | null
  category: AgendaCategory
  description: string | null
  meeting_url: string | null
  location: string | null
  client_id: string | null
  people: string[] | null
}

function mapRow(r: AgendaRow): AgendaEvent {
  return {
    id: r.id,
    date: r.date,
    time: r.time,
    title: r.title,
    meta: r.meta,
    category: r.category,
    description: r.description,
    meetingUrl: r.meeting_url,
    location: r.location,
    clientId: r.client_id,
    people: r.people ?? [],
  }
}

function toRow(input: AgendaInput) {
  return {
    date: input.date,
    time: input.time || null,
    title: input.title,
    meta: input.meta || null,
    category: input.category ?? 'steel',
    description: input.description || null,
    meeting_url: input.meetingUrl || null,
    location: input.location || null,
    people: input.people ?? [],
  }
}

interface AgendaCtx {
  events: AgendaEvent[]
  loading: boolean
  addEvent: (input: AgendaInput) => Promise<{ error: string | null }>
  updateEvent: (id: string, input: AgendaInput) => Promise<{ error: string | null }>
  removeEvent: (id: string) => Promise<void>
}

const Context = createContext<AgendaCtx | null>(null)

export function AgendaProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const [events, setEvents] = useState<AgendaEvent[]>([])
  const [loading, setLoading] = useState(true)

  const fetchEvents = useCallback(async () => {
    const { data, error } = await supabase
      .from('agenda_events')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true })
    if (!error && data) setEvents((data as AgendaRow[]).map(mapRow))
    setLoading(false)
  }, [])

  useEffect(() => {
    if (status === 'authed') {
      setLoading(true)
      fetchEvents()
    } else if (status === 'anon') {
      setEvents([])
      setLoading(false)
    }
  }, [status, fetchEvents])

  const addEvent = useCallback(
    async (input: AgendaInput) => {
      const { error } = await supabase.from('agenda_events').insert(toRow(input))
      if (error) return { error: error.message }
      await fetchEvents()
      return { error: null }
    },
    [fetchEvents],
  )

  const updateEvent = useCallback(
    async (id: string, input: AgendaInput) => {
      const { error } = await supabase.from('agenda_events').update(toRow(input)).eq('id', id)
      if (error) return { error: error.message }
      await fetchEvents()
      return { error: null }
    },
    [fetchEvents],
  )

  const removeEvent = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('agenda_events').delete().eq('id', id)
      if (!error) await fetchEvents()
    },
    [fetchEvents],
  )

  const value = useMemo<AgendaCtx>(
    () => ({ events, loading, addEvent, updateEvent, removeEvent }),
    [events, loading, addEvent, updateEvent, removeEvent],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useAgenda() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useAgenda deve ser usado dentro de <AgendaProvider>')
  return ctx
}
