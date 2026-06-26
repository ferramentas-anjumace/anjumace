import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/lib/session'

/* ----------------------------------------------------------------------------
   Store de comentários — Supabase (tabela public.comments)
   ----------------------------------------------------------------------------
   Polimórfico: cada comentário aponta para uma entidade via (entityType,
   entityId) — hoje "task" e "editorial". Carregamos todos de uma vez e
   indexamos em memória; o Realtime mantém o time em sincronia. Comentar pode,
   opcionalmente, gerar notificações (ex.: avisar os responsáveis da tarefa).
---------------------------------------------------------------------------- */

export type CommentEntity = 'task' | 'editorial'

export interface Comment {
  id: string
  entityType: CommentEntity
  entityId: string
  authorId: string
  authorName: string
  body: string
  createdAt: string
}

interface CommentRow {
  id: string
  entity_type: CommentEntity
  entity_id: string
  author_id: string
  author_name: string
  body: string
  created_at: string
}

function rowToComment(r: CommentRow): Comment {
  return {
    id: r.id,
    entityType: r.entity_type,
    entityId: r.entity_id,
    authorId: r.author_id,
    authorName: r.author_name,
    body: r.body,
    createdAt: r.created_at,
  }
}

/** Aviso opcional disparado ao comentar (ex.: notificar os responsáveis). */
export interface CommentNotify {
  /** Quem notificar (uuids). O próprio autor é sempre removido da lista. */
  userIds: string[]
  title: string
  body: string
  /** Liga a notificação a uma tarefa (deep-link no sino). */
  taskId?: string
}

const key = (type: CommentEntity, id: string) => `${type}:${id}`

interface CommentsCtx {
  loading: boolean
  getComments: (entityType: CommentEntity, entityId: string) => Comment[]
  count: (entityType: CommentEntity, entityId: string) => number
  addComment: (
    entityType: CommentEntity,
    entityId: string,
    body: string,
    notify?: CommentNotify,
  ) => Promise<void>
  removeComment: (id: string) => Promise<void>
}

const Context = createContext<CommentsCtx | null>(null)

export function CommentsProvider({ children }: { children: React.ReactNode }) {
  const { status, user } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)

  const fetchComments = useCallback(async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: true })
    if (!error && data) setComments((data as CommentRow[]).map(rowToComment))
    setLoading(false)
  }, [])

  useEffect(() => {
    if (status === 'authed') {
      setLoading(true)
      fetchComments()
      const channel = supabase
        .channel('comments:sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => fetchComments())
        .subscribe()
      return () => {
        supabase.removeChannel(channel)
      }
    } else if (status === 'anon') {
      setComments([])
      setLoading(false)
    }
  }, [status, fetchComments])

  const byEntity = useMemo(() => {
    const map: Record<string, Comment[]> = {}
    for (const c of comments) (map[key(c.entityType, c.entityId)] ??= []).push(c)
    return map
  }, [comments])

  const getComments = useCallback(
    (entityType: CommentEntity, entityId: string) => byEntity[key(entityType, entityId)] ?? [],
    [byEntity],
  )

  const count = useCallback(
    (entityType: CommentEntity, entityId: string) => getComments(entityType, entityId).length,
    [getComments],
  )

  const addComment = useCallback(
    async (entityType: CommentEntity, entityId: string, body: string, notify?: CommentNotify) => {
      const text = body.trim()
      if (!text) return
      const { data, error } = await supabase
        .from('comments')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          author_id: user.userId,
          author_name: user.name,
          body: text,
        })
        .select('*')
        .single()
      if (error || !data) return
      // Otimista (o Realtime confirma; manter local evita esperar o round-trip).
      setComments((prev) =>
        prev.some((c) => c.id === (data as CommentRow).id)
          ? prev
          : [...prev, rowToComment(data as CommentRow)],
      )

      if (notify) {
        const targets = [...new Set(notify.userIds)].filter((id) => id !== user.userId)
        if (targets.length) {
          await supabase.from('notifications').insert(
            targets.map((uid) => ({
              user_id: uid,
              title: notify.title,
              body: notify.body,
              task_id: notify.taskId ?? null,
            })),
          )
        }
      }
    },
    [user.userId, user.name],
  )

  const removeComment = useCallback(async (id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id))
    await supabase.from('comments').delete().eq('id', id)
  }, [])

  const value = useMemo<CommentsCtx>(
    () => ({ loading, getComments, count, addComment, removeComment }),
    [loading, getComments, count, addComment, removeComment],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useComments() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useComments deve ser usado dentro de <CommentsProvider>')
  return ctx
}
