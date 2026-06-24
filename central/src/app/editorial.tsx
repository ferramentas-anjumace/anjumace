import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getEditorialSeed, type EditorialPost } from './data'

/* ----------------------------------------------------------------------------
   Store do calendário editorial
   ----------------------------------------------------------------------------
   Mantém as postagens de cada cliente em estado e persiste o mapa inteiro em
   localStorage (em produção iria ao back-end). Na primeira carga de um cliente
   sem registro, hidrata a partir do seed em data.ts. Diferente do store de
   clientes (que guarda só overrides), aqui guardamos a coleção completa porque
   postagens são criadas/editadas/removidas livremente.
---------------------------------------------------------------------------- */

const KEY = 'upskl-editorial-v1'

type PostMap = Record<string, EditorialPost[]>

function readMap(): PostMap {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

function uid() {
  return `ed-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

interface EditorialCtx {
  /** Postagens de um cliente (hidrata do seed se ainda não houver registro). */
  getPosts: (clientId: string) => EditorialPost[]
  /** Cria uma postagem e devolve o id gerado. */
  addPost: (clientId: string, post: Omit<EditorialPost, 'id'>) => string
  updatePost: (clientId: string, id: string, patch: Partial<Omit<EditorialPost, 'id'>>) => void
  removePost: (clientId: string, id: string) => void
}

const Context = createContext<EditorialCtx | null>(null)

export function EditorialProvider({ children }: { children: React.ReactNode }) {
  const [map, setMap] = useState<PostMap>(() => readMap())

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(map))
    } catch {
      // localStorage cheio — ignora a persistência.
    }
  }, [map])

  /** Garante a coleção do cliente, hidratando do seed na primeira vez. */
  const ensure = useCallback((m: PostMap, clientId: string): EditorialPost[] => {
    return m[clientId] ?? getEditorialSeed(clientId)
  }, [])

  const getPosts = useCallback(
    (clientId: string) => map[clientId] ?? getEditorialSeed(clientId),
    [map],
  )

  const addPost = useCallback(
    (clientId: string, post: Omit<EditorialPost, 'id'>) => {
      const id = uid()
      setMap((m) => ({ ...m, [clientId]: [...ensure(m, clientId), { ...post, id }] }))
      return id
    },
    [ensure],
  )

  const updatePost = useCallback(
    (clientId: string, id: string, patch: Partial<Omit<EditorialPost, 'id'>>) => {
      setMap((m) => ({
        ...m,
        [clientId]: ensure(m, clientId).map((p) => (p.id === id ? { ...p, ...patch } : p)),
      }))
    },
    [ensure],
  )

  const removePost = useCallback(
    (clientId: string, id: string) => {
      setMap((m) => ({ ...m, [clientId]: ensure(m, clientId).filter((p) => p.id !== id) }))
    },
    [ensure],
  )

  const value = useMemo<EditorialCtx>(
    () => ({ getPosts, addPost, updatePost, removePost }),
    [getPosts, addPost, updatePost, removePost],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useEditorial() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useEditorial deve ser usado dentro de <EditorialProvider>')
  return ctx
}
