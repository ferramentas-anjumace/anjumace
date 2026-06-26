import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'
import { useSession } from './session'

/* ----------------------------------------------------------------------------
   Notificações in-app (tabela public.notifications)
   ----------------------------------------------------------------------------
   Cada usuário vê só as próprias. A automação de tarefas insere notificações
   para os revisores quando uma tarefa entra em revisão. Entrega ao vivo via
   Realtime (se a tabela estiver na publicação); um poll leve garante a entrega
   mesmo sem Realtime.
---------------------------------------------------------------------------- */

export interface AppNotification {
  id: string
  title: string
  body: string | null
  taskId: string | null
  read: boolean
  createdAt: string
}

interface NotificationRow {
  id: string
  title: string
  body: string | null
  task_id: string | null
  read: boolean
  created_at: string
}

interface NotificationsCtx {
  items: AppNotification[]
  unread: number
  refresh: () => Promise<void>
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
}

const Context = createContext<NotificationsCtx>({
  items: [],
  unread: 0,
  refresh: async () => {},
  markRead: async () => {},
  markAllRead: async () => {},
})

const POLL_MS = 60_000

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { status, user } = useSession()
  const [items, setItems] = useState<AppNotification[]>([])

  const refresh = useCallback(async () => {
    if (!user.userId) return
    const { data, error } = await supabase
      .from('notifications')
      .select('id, title, body, task_id, read, created_at')
      .eq('user_id', user.userId)
      .order('created_at', { ascending: false })
      .limit(30)
    if (!error && data) {
      setItems(
        (data as NotificationRow[]).map((r) => ({
          id: r.id,
          title: r.title,
          body: r.body,
          taskId: r.task_id,
          read: r.read,
          createdAt: r.created_at,
        })),
      )
    }
  }, [user.userId])

  useEffect(() => {
    if (status !== 'authed' || !user.userId) {
      setItems([])
      return
    }
    refresh()

    // Realtime: novas notificações chegam na hora (se a tabela estiver na
    // publicação supabase_realtime — ver migration 0008).
    const channel = supabase
      .channel(`notifications:${user.userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.userId}` },
        () => refresh(),
      )
      .subscribe()

    // Poll de segurança (caso o Realtime não esteja habilitado).
    const timer = setInterval(refresh, POLL_MS)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(timer)
    }
  }, [status, user.userId, refresh])

  const markRead = useCallback(async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    await supabase.from('notifications').update({ read: true }).eq('id', id)
  }, [])

  const markAllRead = useCallback(async () => {
    if (!user.userId) return
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.userId).eq('read', false)
  }, [user.userId])

  const unread = useMemo(() => items.filter((n) => !n.read).length, [items])

  const value = useMemo<NotificationsCtx>(
    () => ({ items, unread, refresh, markRead, markAllRead }),
    [items, unread, refresh, markRead, markAllRead],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useNotifications() {
  return useContext(Context)
}
