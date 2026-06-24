import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/lib/session'
import { type ClientStatus } from './data'

/* ----------------------------------------------------------------------------
   Store de clientes — Supabase (tabela public.clients)
   ----------------------------------------------------------------------------
   Compartilhado pelo time. Admin cria/edita/exclui; todos veem. Avatar é um
   data URL guardado na coluna `avatar` (text).
---------------------------------------------------------------------------- */

export interface Client {
  id: string
  name: string
  segment: string | null
  phase: string | null
  status: ClientStatus
  contact: string | null
  since: string | null
  progress: number
  avatar: string | null
}

export type ClientInput = {
  name: string
  segment?: string
  phase?: string
  status?: ClientStatus
  contact?: string
  since?: string
  progress?: number
}

interface ClientsCtx {
  clients: Client[]
  loading: boolean
  getClient: (id?: string) => Client | undefined
  addClient: (input: ClientInput) => Promise<{ error: string | null }>
  updateClient: (id: string, patch: Partial<ClientInput> & { avatar?: string }) => Promise<{ error: string | null }>
  removeClient: (id: string) => Promise<void>
  setClientStatus: (id: string, status: ClientStatus) => Promise<void>
  setClientAvatar: (id: string, dataUrl: string) => Promise<void>
}

const Context = createContext<ClientsCtx | null>(null)

export function ClientsProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  const fetchClients = useCallback(async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('id, name, segment, phase, status, contact, since, progress, avatar')
      .order('name')
    if (!error && data) setClients(data as Client[])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (status === 'authed') {
      setLoading(true)
      fetchClients()
    } else if (status === 'anon') {
      setClients([])
      setLoading(false)
    }
  }, [status, fetchClients])

  const getClient = useCallback((id?: string) => clients.find((c) => c.id === id), [clients])

  const addClient = useCallback(
    async (input: ClientInput) => {
      const { error } = await supabase.from('clients').insert({
        name: input.name,
        segment: input.segment ?? null,
        phase: input.phase ?? null,
        status: input.status ?? 'onboarding',
        contact: input.contact ?? null,
        since: input.since ?? null,
        progress: input.progress ?? 0,
      })
      if (error) return { error: error.message }
      await fetchClients()
      return { error: null }
    },
    [fetchClients],
  )

  const updateClient = useCallback(
    async (id: string, patch: Partial<ClientInput> & { avatar?: string }) => {
      const { error } = await supabase.from('clients').update(patch).eq('id', id)
      if (error) return { error: error.message }
      await fetchClients()
      return { error: null }
    },
    [fetchClients],
  )

  const removeClient = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id)
      if (!error) await fetchClients()
    },
    [fetchClients],
  )

  const setClientStatus = useCallback(
    async (id: string, s: ClientStatus) => {
      await supabase.from('clients').update({ status: s }).eq('id', id)
      await fetchClients()
    },
    [fetchClients],
  )

  const setClientAvatar = useCallback(
    async (id: string, dataUrl: string) => {
      await supabase.from('clients').update({ avatar: dataUrl }).eq('id', id)
      await fetchClients()
    },
    [fetchClients],
  )

  const value = useMemo<ClientsCtx>(
    () => ({ clients, loading, getClient, addClient, updateClient, removeClient, setClientStatus, setClientAvatar }),
    [clients, loading, getClient, addClient, updateClient, removeClient, setClientStatus, setClientAvatar],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useClients() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useClients deve ser usado dentro de <ClientsProvider>')
  return ctx
}
