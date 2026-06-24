import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getContentSeed, type ContentItem } from './data'

/* ----------------------------------------------------------------------------
   Store da biblioteca de conteúdo
   ----------------------------------------------------------------------------
   Mesma arquitetura do store editorial: mantém os itens de cada cliente em
   estado e persiste o mapa inteiro em localStorage. Na primeira carga de um
   cliente sem registro, hidrata a partir do seed em data.ts.
---------------------------------------------------------------------------- */

const KEY = 'upskl-content-v1'

type ContentMap = Record<string, ContentItem[]>

function readMap(): ContentMap {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

function uid() {
  return `ct-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

interface ContentCtx {
  /** Itens de um cliente (hidrata do seed se ainda não houver registro). */
  getItems: (clientId: string) => ContentItem[]
  /** Cria um item e devolve o id gerado. */
  addItem: (clientId: string, item: Omit<ContentItem, 'id'>) => string
  updateItem: (clientId: string, id: string, patch: Partial<Omit<ContentItem, 'id'>>) => void
  removeItem: (clientId: string, id: string) => void
}

const Context = createContext<ContentCtx | null>(null)

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [map, setMap] = useState<ContentMap>(() => readMap())

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(map))
    } catch {
      // localStorage cheio — ignora a persistência.
    }
  }, [map])

  /** Garante a coleção do cliente, hidratando do seed na primeira vez. */
  const ensure = useCallback((m: ContentMap, clientId: string): ContentItem[] => {
    return m[clientId] ?? getContentSeed(clientId)
  }, [])

  const getItems = useCallback(
    (clientId: string) => map[clientId] ?? getContentSeed(clientId),
    [map],
  )

  const addItem = useCallback(
    (clientId: string, item: Omit<ContentItem, 'id'>) => {
      const id = uid()
      setMap((m) => ({ ...m, [clientId]: [...ensure(m, clientId), { ...item, id }] }))
      return id
    },
    [ensure],
  )

  const updateItem = useCallback(
    (clientId: string, id: string, patch: Partial<Omit<ContentItem, 'id'>>) => {
      setMap((m) => ({
        ...m,
        [clientId]: ensure(m, clientId).map((it) => (it.id === id ? { ...it, ...patch } : it)),
      }))
    },
    [ensure],
  )

  const removeItem = useCallback(
    (clientId: string, id: string) => {
      setMap((m) => ({ ...m, [clientId]: ensure(m, clientId).filter((it) => it.id !== id) }))
    },
    [ensure],
  )

  const value = useMemo<ContentCtx>(
    () => ({ getItems, addItem, updateItem, removeItem }),
    [getItems, addItem, updateItem, removeItem],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useContent() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useContent deve ser usado dentro de <ContentProvider>')
  return ctx
}
