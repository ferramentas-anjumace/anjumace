import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/lib/session'
import { TASK_STATUS_META, type ChecklistItem, type Task, type TaskStatus } from './data'

/* ----------------------------------------------------------------------------
   Store de tarefas — Supabase (tabelas public.tasks + public.task_events)
   ----------------------------------------------------------------------------
   Dados compartilhados por toda a equipe. Cada mutação grava um evento no
   histórico, atribuído ao usuário logado. Após cada escrita, recarregamos a
   lista (simples e sem risco de divergência, dado o volume).
---------------------------------------------------------------------------- */

/** Entrada de criação de tarefa. */
export type TaskInput = Pick<Task, 'title'> &
  Partial<Pick<Task, 'description' | 'status' | 'priority' | 'assignees' | 'due' | 'tag' | 'clientId'>>

/** Campos editáveis de uma tarefa. */
export type TaskPatch = Partial<
  Pick<Task, 'title' | 'description' | 'priority' | 'assignees' | 'due' | 'tag' | 'clientId'>
>

interface TaskRow {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: Task['priority']
  assignees: string[] | null
  due: string | null
  tag: Task['tag'] | null
  client_id: string | null
  checklist: ChecklistItem[] | null
  created_at: string
  completed_at: string | null
  task_events: { id: string; at: string; who: string; text: string }[] | null
}

function mapRow(r: TaskRow): Task {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? undefined,
    status: r.status,
    priority: r.priority,
    assignees: r.assignees ?? [],
    due: r.due ?? undefined,
    tag: r.tag ?? undefined,
    clientId: r.client_id ?? undefined,
    checklist: r.checklist ?? [],
    createdAt: r.created_at,
    completedAt: r.completed_at ?? undefined,
    history: (r.task_events ?? [])
      .map((e) => ({ id: e.id, at: e.at, who: e.who, text: e.text }))
      .sort((a, b) => a.at.localeCompare(b.at)),
  }
}

interface TasksCtx {
  tasks: Task[]
  loading: boolean
  addTask: (input: TaskInput) => Promise<void>
  editTask: (id: string, patch: TaskPatch) => Promise<void>
  moveTask: (id: string, status: TaskStatus) => Promise<void>
  removeTask: (id: string) => Promise<void>
  /** Atualiza a checklist sem registrar evento no histórico (evita poluir o log). */
  setChecklist: (id: string, checklist: ChecklistItem[]) => Promise<void>
}

const Context = createContext<TasksCtx | null>(null)

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const { status, user } = useSession()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, task_events(*)')
      .order('created_at', { ascending: false })
    if (!error && data) setTasks((data as TaskRow[]).map(mapRow))
    setLoading(false)
  }, [])

  useEffect(() => {
    if (status === 'authed') {
      setLoading(true)
      fetchTasks()
    } else if (status === 'anon') {
      setTasks([])
      setLoading(false)
    }
  }, [status, fetchTasks])

  /** Registra um evento no histórico da tarefa. */
  const logEvent = useCallback(
    async (taskId: string, text: string) => {
      await supabase.from('task_events').insert({ task_id: taskId, who: user.name, text })
    },
    [user.name],
  )

  const addTask = useCallback(
    async (input: TaskInput) => {
      const stat = input.status ?? 'a-fazer'
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: input.title,
          description: input.description ?? null,
          status: stat,
          priority: input.priority ?? 'media',
          assignees: input.assignees ?? [],
          due: input.due ?? null,
          tag: input.tag ?? null,
          client_id: input.clientId ?? null,
          completed_at: stat === 'concluida' ? new Date().toISOString() : null,
        })
        .select('id')
        .single()
      if (error || !data) return
      await logEvent(data.id, 'criou a tarefa')
      await fetchTasks()
    },
    [logEvent, fetchTasks],
  )

  const editTask = useCallback(
    async (id: string, patch: TaskPatch) => {
      const row: Record<string, unknown> = {}
      if (patch.title !== undefined) row.title = patch.title
      if (patch.description !== undefined) row.description = patch.description ?? null
      if (patch.priority !== undefined) row.priority = patch.priority
      if (patch.assignees !== undefined) row.assignees = patch.assignees
      if (patch.due !== undefined) row.due = patch.due ?? null
      if (patch.tag !== undefined) row.tag = patch.tag ?? null
      if (patch.clientId !== undefined) row.client_id = patch.clientId ?? null
      const { error } = await supabase.from('tasks').update(row).eq('id', id)
      if (error) return
      await logEvent(id, 'editou a tarefa')
      await fetchTasks()
    },
    [logEvent, fetchTasks],
  )

  const moveTask = useCallback(
    async (id: string, status: TaskStatus) => {
      const current = tasks.find((t) => t.id === id)
      if (!current || current.status === status) return
      const text =
        status === 'concluida'
          ? 'concluiu a tarefa'
          : current.status === 'concluida'
            ? `reabriu em ${TASK_STATUS_META[status].label}`
            : `moveu para ${TASK_STATUS_META[status].label}`
      const { error } = await supabase
        .from('tasks')
        .update({ status, completed_at: status === 'concluida' ? new Date().toISOString() : null })
        .eq('id', id)
      if (error) return
      await logEvent(id, text)
      await fetchTasks()
    },
    [tasks, logEvent, fetchTasks],
  )

  const removeTask = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (!error) await fetchTasks()
    },
    [fetchTasks],
  )

  const setChecklist = useCallback(
    async (id: string, checklist: ChecklistItem[]) => {
      // Otimista: atualiza o estado local na hora para o check responder instantâneo.
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, checklist } : t)))
      await supabase.from('tasks').update({ checklist }).eq('id', id)
    },
    [],
  )

  const value = useMemo<TasksCtx>(
    () => ({ tasks, loading, addTask, editTask, moveTask, removeTask, setChecklist }),
    [tasks, loading, addTask, editTask, moveTask, removeTask, setChecklist],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useTasks() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useTasks deve ser usado dentro de <TasksProvider>')
  return ctx
}
