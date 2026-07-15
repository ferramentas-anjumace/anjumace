import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/lib/session'
import { listEntityFiles, removeStorageFiles } from './attachments'
import type {
  ApprovalEvent,
  EditorialApproval,
  EditorialCard,
  EditorialChannel,
  EditorialPost,
  EditorialStage,
  TrackStatus,
} from './data'

/* ----------------------------------------------------------------------------
   Store do calendário editorial — Supabase (tabela public.editorial_posts)
   ----------------------------------------------------------------------------
   Compartilhado por todo o time (antes era localStorage). Edições são
   otimistas (estado local muda na hora) e persistidas com um pequeno debounce
   por post — assim digitar o título não dispara um write por tecla. O Realtime
   mantém os outros navegadores em sincronia.
---------------------------------------------------------------------------- */

type PostMap = Record<string, EditorialPost[]>

interface PostRow {
  id: string
  client_id: string
  date: string
  publish_time: string | null
  title: string
  format: string
  channels: EditorialChannel[] | null
  stage: EditorialStage
  approval: EditorialApproval
  comment: string | null
  copy: string | null
  caption: string | null
  copy_status: TrackStatus | null
  art_status: TrackStatus | null
  approval_log: ApprovalEvent[] | null
  description: string | null
  upload_url: string | null
  cta: string | null
  pending: EditorialPost['pending'] | null
  ready: EditorialPost['ready'] | null
  cards: EditorialCard[] | null
  assignee: string | null
  task_id: string | null
}

function rowToPost(r: PostRow): EditorialPost {
  return {
    id: r.id,
    date: r.date,
    publishTime: r.publish_time ? r.publish_time.slice(0, 5) : undefined,
    title: r.title ?? '',
    format: r.format,
    channels: r.channels ?? [],
    stage: r.stage,
    approval: r.approval,
    comment: r.comment ?? undefined,
    copy: r.copy ?? undefined,
    caption: r.caption ?? undefined,
    copyStatus: r.copy_status ?? 'pendente',
    artStatus: r.art_status ?? 'pendente',
    approvalLog: r.approval_log ?? [],
    description: r.description ?? undefined,
    uploadUrl: r.upload_url ?? undefined,
    cta: r.cta ?? undefined,
    pending: r.pending ?? [],
    ready: r.ready ?? [],
    cards: r.cards ?? [],
    assignee: r.assignee ?? undefined,
    taskId: r.task_id ?? undefined,
  }
}

type PostPatch = Partial<Omit<EditorialPost, 'id'>>

/** Converte um patch (camelCase) nas colunas da tabela (snake_case). */
function patchToRow(patch: PostPatch): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (patch.date !== undefined) row.date = patch.date
  if (patch.publishTime !== undefined) row.publish_time = patch.publishTime || null
  if (patch.title !== undefined) row.title = patch.title
  if (patch.format !== undefined) row.format = patch.format
  if (patch.channels !== undefined) row.channels = patch.channels
  if (patch.stage !== undefined) row.stage = patch.stage
  if (patch.approval !== undefined) row.approval = patch.approval
  if (patch.comment !== undefined) row.comment = patch.comment ?? null
  if (patch.copy !== undefined) row.copy = patch.copy ?? null
  if (patch.caption !== undefined) row.caption = patch.caption ?? null
  if (patch.copyStatus !== undefined) row.copy_status = patch.copyStatus
  if (patch.artStatus !== undefined) row.art_status = patch.artStatus
  if (patch.approvalLog !== undefined) row.approval_log = patch.approvalLog
  if (patch.description !== undefined) row.description = patch.description ?? null
  if (patch.uploadUrl !== undefined) row.upload_url = patch.uploadUrl ?? null
  if (patch.cta !== undefined) row.cta = patch.cta ?? null
  if (patch.pending !== undefined) row.pending = patch.pending
  if (patch.ready !== undefined) row.ready = patch.ready
  if (patch.cards !== undefined) row.cards = patch.cards
  if (patch.assignee !== undefined) row.assignee = patch.assignee ?? null
  if (patch.taskId !== undefined) row.task_id = patch.taskId ?? null
  return row
}

/* ---- Gaveta de conteúdos (public.editorial_ideas, migration 0049) --------
   Ideias e roteiros SEM data. Ao agendar, a ideia vira um post do calendário
   (o roteiro entra como copy) e sai da gaveta. */

export interface EditorialIdea {
  id: string
  clientId: string
  title: string
  format?: string | null // catálogo editorial_format
  script?: string | null // roteiro / esboço da copy
  createdBy?: string | null
  createdAt: string
}

export type EditorialIdeaInput = Pick<EditorialIdea, 'title' | 'format' | 'script'>

interface IdeaRow {
  id: string
  client_id: string
  title: string
  format: string | null
  script: string | null
  created_by: string | null
  sort: number | null
  created_at: string
}

function rowToIdea(r: IdeaRow): EditorialIdea {
  return {
    id: r.id,
    clientId: r.client_id,
    title: r.title,
    format: r.format,
    script: r.script,
    createdBy: r.created_by,
    createdAt: r.created_at,
  }
}

interface EditorialCtx {
  getPosts: (clientId: string) => EditorialPost[]
  loading: boolean
  addPost: (clientId: string, post: Omit<EditorialPost, 'id'>) => Promise<string | null>
  updatePost: (clientId: string, id: string, patch: PostPatch) => void
  removePost: (clientId: string, id: string) => Promise<void>
  /** Gaveta de conteúdos (ideias/roteiros sem data). */
  getIdeas: (clientId: string) => EditorialIdea[]
  addIdea: (clientId: string, input: EditorialIdeaInput) => Promise<{ error: string | null }>
  updateIdea: (id: string, input: EditorialIdeaInput) => Promise<{ error: string | null }>
  removeIdea: (id: string) => Promise<void>
}

const Context = createContext<EditorialCtx | null>(null)

const DEBOUNCE_MS = 450

export function EditorialProvider({ children }: { children: React.ReactNode }) {
  const { status, user } = useSession()
  const [map, setMap] = useState<PostMap>({})
  const [ideas, setIdeas] = useState<EditorialIdea[]>([])
  const [loading, setLoading] = useState(true)

  // Persistência adiada por post (coalesce de edições rápidas, ex.: digitar).
  const pending = useRef<Record<string, PostPatch>>({})
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const fetchPosts = useCallback(async () => {
    const [posts, ideasRes] = await Promise.all([
      supabase.from('editorial_posts').select('*').order('date', { ascending: true }),
      supabase.from('editorial_ideas').select('*').order('sort', { ascending: true }).order('created_at', { ascending: true }),
    ])
    if (!posts.error && posts.data) {
      const next: PostMap = {}
      for (const r of posts.data as PostRow[]) {
        ;(next[r.client_id] ??= []).push(rowToPost(r))
      }
      setMap(next)
    }
    if (!ideasRes.error && ideasRes.data) setIdeas((ideasRes.data as IdeaRow[]).map(rowToIdea))
    setLoading(false)
  }, [])

  useEffect(() => {
    if (status === 'authed') {
      setLoading(true)
      fetchPosts()
      const channel = supabase
        .channel('editorial_posts:sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'editorial_posts' }, () => {
          // Não recarrega no meio de uma edição local (evita "pular" o cursor).
          if (Object.keys(timers.current).length === 0) fetchPosts()
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'editorial_ideas' }, () => {
          if (Object.keys(timers.current).length === 0) fetchPosts()
        })
        .subscribe()
      return () => {
        supabase.removeChannel(channel)
      }
    } else if (status === 'anon') {
      setMap({})
      setIdeas([])
      setLoading(false)
    }
  }, [status, fetchPosts])

  const getPosts = useCallback((clientId: string) => map[clientId] ?? [], [map])

  const addPost = useCallback(async (clientId: string, post: Omit<EditorialPost, 'id'>) => {
    const { data, error } = await supabase
      .from('editorial_posts')
      .insert({ client_id: clientId, ...patchToRow(post) })
      .select('*')
      .single()
    if (error || !data) return null
    const created = rowToPost(data as PostRow)
    setMap((m) => ({ ...m, [clientId]: [...(m[clientId] ?? []), created] }))
    return created.id
  }, [])

  const flush = useCallback((id: string) => {
    const patch = pending.current[id]
    delete pending.current[id]
    delete timers.current[id]
    if (patch && Object.keys(patch).length > 0) {
      supabase.from('editorial_posts').update(patchToRow(patch)).eq('id', id).then(() => {})
    }
  }, [])

  const updatePost = useCallback(
    (clientId: string, id: string, patch: PostPatch) => {
      // Otimista: aplica no estado local na hora.
      setMap((m) => ({
        ...m,
        [clientId]: (m[clientId] ?? []).map((p) => (p.id === id ? { ...p, ...patch } : p)),
      }))
      // Debounce da persistência por post.
      pending.current[id] = { ...pending.current[id], ...patch }
      clearTimeout(timers.current[id])
      timers.current[id] = setTimeout(() => flush(id), DEBOUNCE_MS)
    },
    [flush],
  )

  const removePost = useCallback(async (clientId: string, id: string) => {
    clearTimeout(timers.current[id])
    delete timers.current[id]
    delete pending.current[id]
    setMap((m) => ({ ...m, [clientId]: (m[clientId] ?? []).filter((p) => p.id !== id) }))
    // Captura os arquivos antes de excluir (o gatilho limpa os metadados depois).
    const files = await listEntityFiles('editorial', id)
    await supabase.from('editorial_posts').delete().eq('id', id)
    await removeStorageFiles(files) // remove os arquivos órfãos do Storage
  }, [])

  const getIdeas = useCallback((clientId: string) => ideas.filter((i) => i.clientId === clientId), [ideas])

  const addIdea = useCallback(async (clientId: string, input: EditorialIdeaInput) => {
    const { data, error } = await supabase
      .from('editorial_ideas')
      .insert({
        client_id: clientId,
        title: input.title.trim(),
        format: input.format || null,
        script: input.script?.trim() || null,
        created_by: user?.userId ?? null,
      })
      .select('*')
      .single()
    if (error || !data) return { error: error?.message ?? 'Falha ao salvar a ideia.' }
    const created = rowToIdea(data as IdeaRow)
    setIdeas((is) => [...is.filter((i) => i.id !== created.id), created])
    return { error: null }
  }, [user?.userId])

  const updateIdea = useCallback(async (id: string, input: EditorialIdeaInput) => {
    const { error } = await supabase
      .from('editorial_ideas')
      .update({ title: input.title.trim(), format: input.format || null, script: input.script?.trim() || null })
      .eq('id', id)
    if (error) return { error: error.message }
    setIdeas((is) => is.map((i) => (i.id === id ? { ...i, ...input } : i)))
    return { error: null }
  }, [])

  const removeIdea = useCallback(async (id: string) => {
    setIdeas((is) => is.filter((i) => i.id !== id))
    await supabase.from('editorial_ideas').delete().eq('id', id)
  }, [])

  const value = useMemo<EditorialCtx>(
    () => ({ getPosts, loading, addPost, updatePost, removePost, getIdeas, addIdea, updateIdea, removeIdea }),
    [getPosts, loading, addPost, updatePost, removePost, getIdeas, addIdea, updateIdea, removeIdea],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useEditorial() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useEditorial deve ser usado dentro de <EditorialProvider>')
  return ctx
}
