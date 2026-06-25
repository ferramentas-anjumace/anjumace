import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'
import { useSession } from './session'

/* ----------------------------------------------------------------------------
   Presença em tempo real (Supabase Realtime Presence)
   ----------------------------------------------------------------------------
   Cada cliente logado entra num canal compartilhado e "anuncia" o próprio uuid.
   Todos os clientes recebem a lista de quem está conectado AGORA — ou seja,
   online de verdade: a pessoa só aparece online enquanto tem a central aberta
   (logada). Ao fechar a aba / sair, o Supabase a remove da presença.

   `onlineIds` guarda os uuids (auth) presentes — que casam com profiles.id /
   session.user.userId.
---------------------------------------------------------------------------- */

interface PresenceCtx {
  onlineIds: Set<string>
  /** Conveniência: o id está online? */
  isOnline: (id: string) => boolean
}

const Context = createContext<PresenceCtx>({ onlineIds: new Set(), isOnline: () => false })

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { status, user } = useSession()
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (status !== 'authed' || !user.userId) {
      setOnlineIds(new Set())
      return
    }

    const channel = supabase.channel('central:presence', {
      config: { presence: { key: user.userId } },
    })

    const syncOnline = () => {
      // As chaves do estado de presença são os uuids (definidos em presence.key).
      setOnlineIds(new Set(Object.keys(channel.presenceState())))
    }

    channel
      .on('presence', { event: 'sync' }, syncOnline)
      .on('presence', { event: 'join' }, syncOnline)
      .on('presence', { event: 'leave' }, syncOnline)
      .subscribe((s) => {
        if (s === 'SUBSCRIBED') channel.track({ online_at: new Date().toISOString() })
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [status, user.userId])

  const value = useMemo<PresenceCtx>(
    () => ({ onlineIds, isOnline: (id: string) => onlineIds.has(id) }),
    [onlineIds],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function usePresence() {
  return useContext(Context)
}
