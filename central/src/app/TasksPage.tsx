import { useEffect, useMemo, useState } from 'react'
import {
  Plus,
  LayoutGrid,
  List as ListIcon,
  CalendarDays,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Flag,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  History,
  ListChecks,
  Loader2,
} from 'lucide-react'
import {
  Button,
  IconButton,
  Card,
  CardHeader,
  CardTitle,
  StatCard,
  Badge,
  Avatar,
  AvatarGroup,
  ProgressBar,
  Checkbox,
  Input,
  Textarea,
  Select,
  DatePicker,
  SearchField,
  Drawer,
  Modal,
  EmptyState,
  Divider,
  useToast,
} from '@/components/ui'
import { useSession, ROLE_LABEL } from '@/lib/session'
import { usePermissions } from '@/lib/permissions'
import { useTasks, type TaskInput } from './tasks'
import { useProfiles } from './profiles'
import { CommentThread } from './CommentThread'
import {
  TASK_STATUS_ORDER,
  TASK_STATUS_META,
  TASK_PRIORITY_ORDER,
  TASK_PRIORITY_META,
  TASK_TAG_TONE,
  type ChecklistItem,
  type Task,
  type TaskStatus,
  type TaskPriority,
  type TaskTag,
} from './data'

/* ----------------------------------------------------------------- helpers */

const TAGS: TaskTag[] = ['Conteúdo', 'Design', 'Edição', 'Tráfego', 'Lançamento', 'Suporte']

const shortDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })
const fullDateTime = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
})

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function isoToDate(iso?: string): Date | null {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function dateToIso(d: Date | null): string | undefined {
  if (!d) return undefined
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
/** Estado do prazo de uma tarefa (para colorir o chip de data). */
function dueState(task: Task): 'none' | 'overdue' | 'today' | 'upcoming' {
  if (!task.due) return 'none'
  if (task.status === 'concluida') return 'upcoming'
  const t = todayIso()
  if (task.due < t) return 'overdue'
  if (task.due === t) return 'today'
  return 'upcoming'
}

/* ----------------------------------------------------------- chips e avatares */

function PriorityChip({ priority }: { priority: TaskPriority }) {
  const meta = TASK_PRIORITY_META[priority]
  return (
    <Badge size="sm" tone={meta.tone}>
      <Flag size={11} strokeWidth={2} aria-hidden /> {meta.label}
    </Badge>
  )
}

function DueChip({ task }: { task: Task }) {
  const state = dueState(task)
  if (state === 'none') return null
  const d = isoToDate(task.due)
  const tone = state === 'overdue' ? 'text-err' : state === 'today' ? 'text-warn' : 'text-faint'
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-[11px] ${tone}`}>
      <CalendarClock size={12} strokeWidth={1.5} aria-hidden />
      {d ? shortDate.format(d) : ''}
      {state === 'overdue' && ' · atrasada'}
      {state === 'today' && ' · hoje'}
    </span>
  )
}

function Assignees({ ids, size = 'sm' }: { ids: string[]; size?: 'sm' | 'xs' }) {
  const { getMember } = useProfiles()
  if (ids.length === 0) {
    return <span className="font-mono text-[11px] text-faint">sem responsável</span>
  }
  return (
    <AvatarGroup max={3}>
      {ids.map((id) => {
        const u = getMember(id)
        return <Avatar key={id} size={size === 'xs' ? 'xs' : 'sm'} name={u?.name ?? '?'} src={u?.avatar ?? undefined} />
      })}
    </AvatarGroup>
  )
}

/* ----------------------------------------------------------------- task card */

function TaskCard({
  task,
  canDrag,
  onOpen,
  onToggle,
  onDragStart,
}: {
  task: Task
  canDrag: boolean
  onOpen: () => void
  onToggle: () => void
  onDragStart?: (e: React.DragEvent) => void
}) {
  const done = task.status === 'concluida'
  return (
    <div
      draggable={canDrag}
      onDragStart={onDragStart}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
      className={`group flex flex-col gap-3.5 rounded-lg border border-line bg-slate-900 p-4 transition-colors hover:border-strong focus-visible:outline-none focus-visible:shadow-focus ${canDrag ? 'cursor-grab select-none active:cursor-grabbing' : 'cursor-pointer'}`}
    >
      <div className="flex items-start gap-3">
        {/* O clique no checkbox conclui/reabre — não deve abrir a tarefa. */}
        <span className="pt-0.5" onClick={(e) => e.stopPropagation()}>
          <Checkbox checked={done} onChange={onToggle} aria-label={done ? 'Reabrir tarefa' : 'Concluir tarefa'} />
        </span>
        <span className="min-w-0 flex-1">
          <span className={`text-body-s font-medium leading-snug ${done ? 'text-faint line-through' : 'text-strong'}`}>
            {task.title}
          </span>
        </span>
        {task.tag && (
          <Badge size="sm" tone={TASK_TAG_TONE[task.tag]} className="shrink-0">
            {task.tag}
          </Badge>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5 pl-[30px]">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
          <PriorityChip priority={task.priority} />
          <DueChip task={task} />
          <SubtaskChip task={task} />
        </div>
        <Assignees ids={task.assignees} />
      </div>
    </div>
  )
}

/* --------------------------------------------------------------- board view */

/* --------------------------------------------------------- agrupamento ----- */

type Tone = 'neutral' | 'steel' | 'sand' | 'success' | 'danger' | 'warning'
type GroupBy = 'status' | 'priority' | 'assignee'

interface TaskGroup {
  key: string
  label: string
  tone: Tone
  items: Task[]
}

const GROUP_BY_META: Record<GroupBy, string> = {
  status: 'Status',
  priority: 'Prioridade',
  assignee: 'Responsável',
}

const NONE_KEY = '__none__'

/** Monta os grupos da visão conforme o critério de agrupamento escolhido. */
function buildGroups(
  tasks: Task[],
  groupBy: GroupBy,
  members: { id: string; name: string }[],
): TaskGroup[] {
  if (groupBy === 'priority') {
    return TASK_PRIORITY_ORDER.map((p) => ({
      key: p,
      label: TASK_PRIORITY_META[p].label,
      tone: TASK_PRIORITY_META[p].tone,
      items: tasks.filter((t) => t.priority === p),
    }))
  }
  if (groupBy === 'assignee') {
    const groups: TaskGroup[] = members
      .map((u) => ({
        key: u.id,
        label: u.name,
        tone: 'steel' as Tone,
        items: tasks.filter((t) => t.assignees.includes(u.id)),
      }))
      .filter((g) => g.items.length > 0)
    const none = tasks.filter((t) => t.assignees.length === 0)
    if (none.length > 0) groups.push({ key: NONE_KEY, label: 'Sem responsável', tone: 'neutral', items: none })
    return groups
  }
  return TASK_STATUS_ORDER.map((s) => ({
    key: s,
    label: TASK_STATUS_META[s].label,
    tone: TASK_STATUS_META[s].tone,
    items: tasks.filter((t) => t.status === s),
  }))
}

/** Progresso da checklist de uma tarefa (null se não houver itens). */
function checklistProgress(task: Task): { done: number; total: number } | null {
  const c = task.checklist
  if (!c || c.length === 0) return null
  return { done: c.filter((i) => i.done).length, total: c.length }
}

/** Chip compacto de progresso de subtarefas (ex.: "2/5"). */
function SubtaskChip({ task }: { task: Task }) {
  const p = checklistProgress(task)
  if (!p) return null
  const complete = p.done === p.total
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-[11px] ${complete ? 'text-ok' : 'text-faint'}`}>
      <ListChecks size={12} strokeWidth={1.5} aria-hidden />
      {p.done}/{p.total}
    </span>
  )
}

/** Linha de adição rápida — cria uma tarefa só com título no grupo atual. */
function QuickAdd({ onAdd }: { onAdd: (title: string) => void }) {
  const [val, setVal] = useState('')
  const submit = () => {
    const t = val.trim()
    if (!t) return
    onAdd(t)
    setVal('')
  }
  return (
    <input
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
      onBlur={submit}
      placeholder="+ Adicionar tarefa"
      className="w-full rounded-md border border-dashed border-line bg-transparent px-2.5 py-1.5 text-body-s text-strong placeholder:text-faint focus:border-steel-500 focus:outline-none"
    />
  )
}

/* ------------------------------------------------------------- board view -- */

function BoardView({
  groups,
  canManage,
  canMove,
  onOpen,
  onToggle,
  onDropTask,
  onQuickAdd,
}: {
  groups: TaskGroup[]
  canManage: boolean
  canMove: boolean
  onOpen: (t: Task) => void
  onToggle: (t: Task) => void
  onDropTask: (id: string, key: string) => void
  onQuickAdd: (key: string, title: string) => void
}) {
  const [over, setOver] = useState<string | null>(null)
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {groups.map((g) => (
        <div
          key={g.key}
          onDragOver={canMove ? (e) => { e.preventDefault(); setOver(g.key) } : undefined}
          onDragLeave={canMove ? () => setOver((s) => (s === g.key ? null : s)) : undefined}
          onDrop={
            canMove
              ? (e) => {
                  e.preventDefault()
                  const id = e.dataTransfer.getData('text/plain')
                  if (id) onDropTask(id, g.key)
                  setOver(null)
                }
              : undefined
          }
          className={`flex min-h-[120px] flex-col gap-2.5 rounded-xl border p-3 transition-colors ${
            over === g.key ? 'border-steel-500 bg-steel-tint/40' : 'border-subtle bg-ink-deep/30'
          }`}
        >
          <div className="flex items-center justify-between px-1">
            <Badge tone={g.tone} dot>{g.label}</Badge>
            <span className="font-mono text-mono-data text-faint tabular-nums">{g.items.length}</span>
          </div>
          {g.items.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              canDrag={canMove}
              onOpen={() => onOpen(task)}
              onToggle={() => onToggle(task)}
              onDragStart={(e) => e.dataTransfer.setData('text/plain', task.id)}
            />
          ))}
          {g.items.length === 0 && (
            <p className="px-1 py-4 text-center text-body-s text-faint">Nada por aqui.</p>
          )}
          {canManage && <QuickAdd onAdd={(title) => onQuickAdd(g.key, title)} />}
        </div>
      ))}
    </div>
  )
}

/* ---------------------------------------------------------------- list view */

function ListView({
  groups,
  canManage,
  onOpen,
  onToggle,
  onQuickAdd,
}: {
  groups: TaskGroup[]
  canManage: boolean
  onOpen: (t: Task) => void
  onToggle: (t: Task) => void
  onQuickAdd: (key: string, title: string) => void
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  return (
    <div className="flex flex-col gap-5">
      {groups.map((g) => {
        const isCollapsed = !!collapsed[g.key]
        return (
          <section key={g.key} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCollapsed((c) => ({ ...c, [g.key]: !c[g.key] }))}
                aria-expanded={!isCollapsed}
                className="inline-flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:shadow-focus"
              >
                <ChevronRight
                  size={15}
                  strokeWidth={1.5}
                  className={`text-muted transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                  aria-hidden
                />
                <Badge tone={g.tone} dot>{g.label}</Badge>
              </button>
              <span className="font-mono text-mono-data text-faint tabular-nums">{g.items.length}</span>
            </div>
            {!isCollapsed && (
              <Card className="p-0">
                {g.items.length > 0 && (
                  <ul>
                    {g.items.map((task, i) => {
                      const done = task.status === 'concluida'
                      return (
                        <li
                          key={task.id}
                          className={`flex items-center gap-3 px-4 py-3 ${i < g.items.length - 1 ? 'border-b border-subtle' : ''}`}
                        >
                          <Checkbox checked={done} onChange={() => onToggle(task)} aria-label={done ? 'Reabrir' : 'Concluir'} />
                          <button
                            type="button"
                            onClick={() => onOpen(task)}
                            className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:shadow-focus rounded-xs"
                          >
                            <span className={`text-body-s font-medium ${done ? 'text-faint line-through' : 'text-strong'}`}>
                              {task.title}
                            </span>
                          </button>
                          <div className="hidden items-center gap-3 sm:flex">
                            <SubtaskChip task={task} />
                            <DueChip task={task} />
                            <PriorityChip priority={task.priority} />
                            {task.tag && <Badge size="sm" tone={TASK_TAG_TONE[task.tag]}>{task.tag}</Badge>}
                          </div>
                          <Assignees ids={task.assignees} />
                          {canManage && (
                            <IconButton aria-label="Abrir" size="sm" onClick={() => onOpen(task)}>
                              <MoreHorizontal size={16} strokeWidth={1.5} />
                            </IconButton>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
                {canManage && (
                  <div className="border-t border-subtle px-3 py-2 first:border-t-0">
                    <QuickAdd onAdd={(title) => onQuickAdd(g.key, title)} />
                  </div>
                )}
              </Card>
            )}
          </section>
        )
      })}
    </div>
  )
}

/* ----------------------------------------------------------- calendar view -- */

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
const STATUS_DOT: Record<Tone, string> = {
  neutral: 'bg-slate-500',
  steel: 'bg-steel-400',
  sand: 'bg-sand-400',
  success: 'bg-ok',
  danger: 'bg-err',
  warning: 'bg-warn',
}

/** Calendário mensal — posiciona as tarefas pela data de prazo (due). */
function CalendarView({ tasks, onOpen }: { tasks: Task[]; onOpen: (t: Task) => void }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = todayIso()

  const byDay = useMemo(() => {
    const m = new Map<string, Task[]>()
    for (const t of tasks) {
      if (!t.due) continue
      const list = m.get(t.due) ?? []
      list.push(t)
      m.set(t.due, list)
    }
    return m
  }, [tasks])

  const cells: (number | null)[] = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-h3 font-semibold capitalize text-strong">{monthLabel.format(cursor)}</h3>
        <div className="flex items-center gap-1">
          <IconButton size="sm" aria-label="Mês anterior" onClick={() => setCursor(new Date(year, month - 1, 1))}>
            <ChevronLeft size={16} strokeWidth={1.5} />
          </IconButton>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { const d = new Date(); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)) }}
          >
            Hoje
          </Button>
          <IconButton size="sm" aria-label="Próximo mês" onClick={() => setCursor(new Date(year, month + 1, 1))}>
            <ChevronRight size={16} strokeWidth={1.5} />
          </IconButton>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-subtle bg-subtle">
        {WEEKDAYS.map((w) => (
          <div key={w} className="bg-ink-deep/40 px-2 py-1.5 text-center font-mono text-[10px] uppercase text-faint">
            {w}
          </div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={`e${i}`} className="min-h-[92px] bg-ink-deep/20" />
          const iso = dateToIso(new Date(year, month, d))!
          const dayTasks = byDay.get(iso) ?? []
          const isToday = iso === today
          return (
            <div key={iso} className="min-h-[92px] bg-slate-900 p-1.5">
              <div className="mb-1 text-right">
                <span
                  className={`inline-grid size-5 place-items-center rounded-full font-mono text-[11px] tabular-nums ${
                    isToday ? 'bg-steel-500 text-accent-fg' : 'text-faint'
                  }`}
                >
                  {d}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {dayTasks.slice(0, 3).map((t) => {
                  const meta = TASK_STATUS_META[t.status]
                  const done = t.status === 'concluida'
                  return (
                    <button
                      key={t.id}
                      onClick={() => onOpen(t)}
                      title={t.title}
                      className="flex items-center gap-1 rounded-xs bg-ink-deep/50 px-1.5 py-0.5 text-left text-[11px] text-strong transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:shadow-focus"
                    >
                      <span className={`size-1.5 shrink-0 rounded-full ${STATUS_DOT[meta.tone]}`} aria-hidden />
                      <span className={`truncate ${done ? 'text-faint line-through' : ''}`}>{t.title}</span>
                    </button>
                  )
                })}
                {dayTasks.length > 3 && (
                  <span className="px-1 text-[10px] text-faint">+{dayTasks.length - 3} mais</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------ admin summary */

function AdminSummary({ tasks }: { tasks: Task[] }) {
  const { members } = useProfiles()
  const total = tasks.length
  const inProgress = tasks.filter((t) => t.status === 'em-andamento' || t.status === 'em-revisao').length
  const done = tasks.filter((t) => t.status === 'concluida').length
  const t = todayIso()
  const overdue = tasks.filter((x) => x.due && x.due < t && x.status !== 'concluida').length

  // Progresso por pessoa (apenas quem tem tarefa atribuída).
  const perPerson = members
    .map((u) => {
      const mine = tasks.filter((task) => task.assignees.includes(u.id))
      const concl = mine.filter((task) => task.status === 'concluida').length
      return { user: u, total: mine.length, done: concl }
    })
    .filter((p) => p.total > 0)
    .sort((a, b) => b.total - a.total)

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="grid grid-cols-2 gap-4 lg:col-span-2 lg:grid-cols-4">
        <StatCard label="Total" value={String(total)} />
        <StatCard label="Em andamento" value={String(inProgress)} active />
        <StatCard label="Concluídas" value={String(done)} delta={{ value: total ? `${Math.round((done / total) * 100)}%` : '0%', direction: 'up' }} />
        <StatCard
          label="Atrasadas"
          value={String(overdue)}
          delta={overdue > 0 ? { value: 'atenção', direction: 'down' } : undefined}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Avanço por pessoa</CardTitle>
          <Badge tone="steel" dot>admin</Badge>
        </CardHeader>
        <div className="flex flex-col gap-3">
          {perPerson.length === 0 && <p className="text-body-s text-faint">Nenhuma tarefa atribuída.</p>}
          {perPerson.map((p) => (
            <div key={p.user.id} className="flex items-center gap-3">
              <Avatar size="sm" name={p.user.name} src={p.user.avatar ?? undefined} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-body-s font-medium text-strong">{p.user.name}</span>
                  <span className="shrink-0 font-mono text-[11px] text-faint tabular-nums">{p.done}/{p.total}</span>
                </div>
                <ProgressBar value={p.total ? (p.done / p.total) * 100 : 0} tone="success" className="mt-1" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

/* ----------------------------------------------------------- form (criar/editar) */

type Draft = {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assignees: string[]
  due: string
  tag: '' | TaskTag
}

const EMPTY: Draft = {
  title: '', description: '', status: 'a-fazer', priority: 'media',
  assignees: [], due: '', tag: '',
}

function TaskFormModal({
  open,
  editing,
  onClose,
  onSubmit,
}: {
  open: boolean
  editing: Task | null
  onClose: () => void
  onSubmit: (draft: Draft) => void
}) {
  const { members } = useProfiles()
  const [draft, setDraft] = useState<Draft>(EMPTY)

  // Sincroniza o rascunho quando abre (cria ou edita).
  useEffect(() => {
    if (!open) return
    setDraft(
      editing
        ? {
            title: editing.title,
            description: editing.description ?? '',
            status: editing.status,
            priority: editing.priority,
            assignees: [...editing.assignees],
            due: editing.due ?? '',
            tag: editing.tag ?? '',
          }
        : EMPTY,
    )
  }, [open, editing])

  const toggleAssignee = (id: string) =>
    setDraft((d) => ({
      ...d,
      assignees: d.assignees.includes(id) ? d.assignees.filter((x) => x !== id) : [...d.assignees, id],
    }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={editing ? 'Editar tarefa' : 'Nova tarefa'}
      description="Defina responsáveis, prazo e prioridade."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSubmit(draft)}>{editing ? 'Salvar' : 'Criar tarefa'}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Título"
          value={draft.title}
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          placeholder="Ex.: Revisar plano da Anju Mace"
          autoFocus
        />
        <Textarea
          label="Descrição"
          optional
          rows={3}
          value={draft.description}
          onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          placeholder="Detalhes, contexto, links…"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Status"
            value={draft.status}
            onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as TaskStatus }))}
          >
            {TASK_STATUS_ORDER.map((s) => (
              <option key={s} value={s}>{TASK_STATUS_META[s].label}</option>
            ))}
          </Select>
          <Select
            label="Prioridade"
            value={draft.priority}
            onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value as TaskPriority }))}
          >
            {TASK_PRIORITY_ORDER.map((p) => (
              <option key={p} value={p}>{TASK_PRIORITY_META[p].label}</option>
            ))}
          </Select>
          <DatePicker
            label="Prazo"
            optional
            value={isoToDate(draft.due)}
            onChange={(d) => setDraft((dr) => ({ ...dr, due: dateToIso(d) ?? '' }))}
          />
          <Select
            label="Categoria"
            value={draft.tag}
            onChange={(e) => setDraft((d) => ({ ...d, tag: e.target.value as Draft['tag'] }))}
          >
            <option value="">Sem categoria</option>
            {TAGS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </div>
        <div>
          <div className="mb-2 text-body-s font-medium text-strong">Responsáveis</div>
          {members.length === 0 ? (
            <p className="rounded-md border border-line bg-slate-900 p-3 text-body-s text-faint">
              Nenhum membro cadastrado ainda. Crie usuários para poder atribuir.
            </p>
          ) : (
            <div className="grid max-h-44 grid-cols-1 gap-1 overflow-y-auto rounded-md border border-line bg-slate-900 p-2 sm:grid-cols-2">
              {members.map((u) => (
                <label
                  key={u.id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-slate-800"
                >
                  <Checkbox checked={draft.assignees.includes(u.id)} onChange={() => toggleAssignee(u.id)} />
                  <Avatar size="xs" name={u.name} src={u.avatar ?? undefined} />
                  <span className="min-w-0 flex-1 truncate text-body-s text-strong">{u.name}</span>
                  {u.team && <span className="font-mono text-[10px] uppercase text-faint">{u.team}</span>}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

/* --------------------------------------------------------- checklist ------- */

function newChecklistId() {
  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

/** Seção de subtarefas/checklist dentro do drawer. Edita em lote via onChange. */
function ChecklistSection({ task, onChange }: { task: Task; onChange: (items: ChecklistItem[]) => void }) {
  const items = task.checklist ?? []
  const [val, setVal] = useState('')
  const done = items.filter((i) => i.done).length

  const add = () => {
    const t = val.trim()
    if (!t) return
    onChange([...items, { id: newChecklistId(), text: t, done: false }])
    setVal('')
  }
  const toggle = (id: string) => onChange(items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)))
  const remove = (id: string) => onChange(items.filter((i) => i.id !== id))

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListChecks size={15} strokeWidth={1.5} className="text-steel-300" aria-hidden />
          <span className="text-body-s font-medium text-strong">Subtarefas</span>
        </div>
        {items.length > 0 && (
          <span className="font-mono text-[11px] text-faint tabular-nums">{done}/{items.length}</span>
        )}
      </div>
      {items.length > 0 && (
        <ProgressBar value={(done / items.length) * 100} tone="success" className="mb-3" />
      )}
      {items.length > 0 && (
        <ul className="mb-2 flex flex-col gap-1.5">
          {items.map((i) => (
            <li key={i.id} className="group flex items-center gap-2.5">
              <Checkbox
                checked={i.done}
                onChange={() => toggle(i.id)}
                label={<span className={i.done ? 'text-faint line-through' : 'text-fg'}>{i.text}</span>}
              />
              <button
                type="button"
                onClick={() => remove(i.id)}
                aria-label="Remover subtarefa"
                className="ml-auto grid size-6 shrink-0 place-items-center rounded-xs text-faint opacity-0 transition hover:text-err focus-visible:opacity-100 focus-visible:outline-none group-hover:opacity-100"
              >
                <Trash2 size={14} strokeWidth={1.5} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') add() }}
        placeholder="+ Adicionar subtarefa"
        className="w-full rounded-md border border-dashed border-line bg-transparent px-2.5 py-1.5 text-body-s text-strong placeholder:text-faint focus:border-steel-500 focus:outline-none"
      />
    </div>
  )
}

/* ------------------------------------------------------------- task drawer */

function TaskDrawer({
  task,
  canManage,
  onClose,
  onMove,
  onToggle,
  onEdit,
  onDelete,
  onChecklistChange,
}: {
  task: Task | null
  canManage: boolean
  onClose: () => void
  onMove: (status: TaskStatus) => void
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onChecklistChange: (items: ChecklistItem[]) => void
}) {
  const { getMember } = useProfiles()
  if (!task) return null
  const done = task.status === 'concluida'

  return (
    <Drawer
      open={!!task}
      onClose={onClose}
      width={460}
      title={task.title}
      description={`Criada em ${fullDateTime.format(new Date(task.createdAt))}`}
      footer={
        <>
          {canManage && (
            <>
              <Button variant="ghost" leftIcon={<Trash2 size={16} strokeWidth={1.5} />} onClick={onDelete}>
                Excluir
              </Button>
              <Button variant="secondary" leftIcon={<Pencil size={16} strokeWidth={1.5} />} onClick={onEdit}>
                Editar
              </Button>
            </>
          )}
          <Button
            variant={done ? 'secondary' : 'primary'}
            leftIcon={<Check size={16} strokeWidth={1.5} />}
            onClick={onToggle}
          >
            {done ? 'Reabrir' : 'Concluir'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Status */}
        <div>
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-faint">Status</div>
          {canManage ? (
            <Select value={task.status} onChange={(e) => onMove(e.target.value as TaskStatus)}>
              {TASK_STATUS_ORDER.map((s) => (
                <option key={s} value={s}>{TASK_STATUS_META[s].label}</option>
              ))}
            </Select>
          ) : (
            <Badge tone={TASK_STATUS_META[task.status].tone} dot>{TASK_STATUS_META[task.status].label}</Badge>
          )}
        </div>

        {/* Metadados */}
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="mb-1 font-mono text-[10px] uppercase tracking-wider text-faint">Prioridade</dt>
            <dd><PriorityChip priority={task.priority} /></dd>
          </div>
          <div>
            <dt className="mb-1 font-mono text-[10px] uppercase tracking-wider text-faint">Prazo</dt>
            <dd>{task.due ? <DueChip task={task} /> : <span className="text-body-s text-faint">—</span>}</dd>
          </div>
          {task.tag && (
            <div>
              <dt className="mb-1 font-mono text-[10px] uppercase tracking-wider text-faint">Categoria</dt>
              <dd><Badge size="sm" tone={TASK_TAG_TONE[task.tag]}>{task.tag}</Badge></dd>
            </div>
          )}
        </dl>

        {/* Responsáveis */}
        <div>
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-faint">Responsáveis</div>
          {task.assignees.length === 0 ? (
            <span className="text-body-s text-faint">Sem responsável</span>
          ) : (
            <ul className="flex flex-col gap-2">
              {task.assignees.map((id) => {
                const u = getMember(id)
                return (
                  <li key={id} className="flex items-center gap-2.5">
                    <Avatar size="sm" name={u?.name ?? '?'} src={u?.avatar ?? undefined} />
                    <span className="text-body-s text-strong">{u?.name ?? 'Desconhecido'}</span>
                    {u && <span className="font-mono text-[11px] text-faint">{ROLE_LABEL[u.role]}{u.team ? ` · ${u.team}` : ''}</span>}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Descrição */}
        {task.description && (
          <div>
            <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-faint">Descrição</div>
            <p className="whitespace-pre-wrap text-body-s text-fg">{task.description}</p>
          </div>
        )}

        <Divider />

        {/* Subtarefas / checklist */}
        <ChecklistSection task={task} onChange={onChecklistChange} />

        <Divider />

        {/* Discussão */}
        <CommentThread
          entityType="task"
          entityId={task.id}
          notifyUserIds={task.assignees}
          notifyLabel={task.title}
          taskId={task.id}
        />

        <Divider />

        {/* Histórico */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <History size={15} strokeWidth={1.5} className="text-steel-300" aria-hidden />
            <span className="text-body-s font-medium text-strong">Histórico</span>
          </div>
          <ol className="flex flex-col gap-3">
            {[...task.history].reverse().map((ev) => (
              <li key={ev.id} className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-steel-400" aria-hidden />
                <div className="min-w-0">
                  <p className="text-body-s text-fg">
                    <span className="font-medium text-strong">{ev.who}</span> {ev.text}
                  </p>
                  <p className="font-mono text-[11px] text-faint">{fullDateTime.format(new Date(ev.at))}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Drawer>
  )
}

/* ============================================================== página ===== */

export function TasksPage() {
  const toast = useToast()
  const { user } = useSession()
  const { can } = usePermissions()
  const { tasks, loading, addTask, editTask, moveTask, removeTask, setChecklist } = useTasks()
  const { members } = useProfiles()
  // Permissões configuráveis (matriz por papel). canManage = criar/editar/excluir.
  const canManage = can('create_task')
  const canMove = can('move_task')

  const [view, setView] = useState<'board' | 'list' | 'calendar'>('board')
  const [groupBy, setGroupBy] = useState<GroupBy>('status')
  const [search, setSearch] = useState('')
  const [assignee, setAssignee] = useState<string>(canManage ? 'all' : 'mine')
  const [tagFilter, setTagFilter] = useState<string>('all')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [openTaskId, setOpenTaskId] = useState<string | null>(null)
  const openTask = openTaskId ? tasks.find((t) => t.id === openTaskId) ?? null : null

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tasks.filter((t) => {
      if (assignee === 'mine' && !t.assignees.includes(user.id)) return false
      if (assignee !== 'all' && assignee !== 'mine' && !t.assignees.includes(assignee)) return false
      if (tagFilter !== 'all' && t.tag !== tagFilter) return false
      if (q && !t.title.toLowerCase().includes(q)) return false
      return true
    })
  }, [tasks, search, assignee, tagFilter, user.id])

  const groups = useMemo(() => buildGroups(filtered, groupBy, members), [filtered, groupBy, members])

  const toggle = (t: Task) => {
    const next: TaskStatus = t.status === 'concluida' ? 'a-fazer' : 'concluida'
    moveTask(t.id, next)
    toast.success(next === 'concluida' ? 'Tarefa concluída' : 'Tarefa reaberta', t.title)
  }

  /** Drag-and-drop no quadro: aplica o campo do grupo (status/prioridade/responsável). */
  const handleDropTask = (id: string, key: string) => {
    if (groupBy === 'status') {
      moveTask(id, key as TaskStatus)
      return
    }
    // Reagrupar por prioridade/responsável arrastando muda esses campos — só gestor.
    if (!canManage) return
    if (groupBy === 'priority') editTask(id, { priority: key as TaskPriority })
    else editTask(id, { assignees: key === NONE_KEY ? [] : [key] })
  }

  /** Adição rápida dentro de um grupo: presetar o campo do grupo. */
  const handleQuickAdd = (key: string, title: string) => {
    if (groupBy === 'status') addTask({ title, status: key as TaskStatus })
    else if (groupBy === 'priority') addTask({ title, priority: key as TaskPriority })
    else addTask({ title, assignees: key === NONE_KEY ? [] : [key] })
  }

  const submitForm = (draft: Draft) => {
    const title = draft.title.trim()
    if (!title) {
      toast.error('Informe um título')
      return
    }
    const payload = {
      title,
      description: draft.description.trim() || undefined,
      priority: draft.priority,
      assignees: draft.assignees,
      due: draft.due || undefined,
      tag: draft.tag || undefined,
    }
    if (editing) {
      editTask(editing.id, payload)
      if (draft.status !== editing.status) moveTask(editing.id, draft.status)
      toast.success('Tarefa atualizada', title)
    } else {
      addTask({ ...payload, status: draft.status } as TaskInput)
      toast.success('Tarefa criada', title)
    }
    setFormOpen(false)
    setEditing(null)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid place-items-center py-24 text-muted">
          <Loader2 size={26} strokeWidth={1.5} className="animate-spin text-steel-300" aria-label="Carregando tarefas" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-8">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="font-mono text-mono-label uppercase text-steel-400">Operação</span>
          <h1 className="mt-1 font-display text-h1 font-semibold text-strong">Tarefas</h1>
        </div>
        {canManage && (
          <Button
            leftIcon={<Plus size={18} strokeWidth={1.5} />}
            onClick={() => { setEditing(null); setFormOpen(true) }}
          >
            Nova tarefa
          </Button>
        )}
      </div>

      {/* Painel de admin */}
      {canManage && <AdminSummary tasks={tasks} />}

      {/* Barra de controles */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle de visão */}
          <div className="inline-flex rounded-md border border-strong p-0.5">
            <button
              onClick={() => setView('board')}
              className={`inline-flex items-center gap-1.5 rounded-xs px-2.5 py-1.5 font-mono text-mono-label uppercase transition-colors ${view === 'board' ? 'bg-slate-700 text-strong' : 'text-muted hover:text-strong'}`}
            >
              <LayoutGrid size={15} strokeWidth={1.5} /> Quadro
            </button>
            <button
              onClick={() => setView('list')}
              className={`inline-flex items-center gap-1.5 rounded-xs px-2.5 py-1.5 font-mono text-mono-label uppercase transition-colors ${view === 'list' ? 'bg-slate-700 text-strong' : 'text-muted hover:text-strong'}`}
            >
              <ListIcon size={15} strokeWidth={1.5} /> Lista
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`inline-flex items-center gap-1.5 rounded-xs px-2.5 py-1.5 font-mono text-mono-label uppercase transition-colors ${view === 'calendar' ? 'bg-slate-700 text-strong' : 'text-muted hover:text-strong'}`}
            >
              <CalendarDays size={15} strokeWidth={1.5} /> Calendário
            </button>
          </div>

          {/* Agrupar por (não se aplica ao calendário) */}
          {view !== 'calendar' && (
            <div className="w-40">
              <Select value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupBy)} aria-label="Agrupar por">
                {(Object.keys(GROUP_BY_META) as GroupBy[]).map((g) => (
                  <option key={g} value={g}>Agrupar: {GROUP_BY_META[g]}</option>
                ))}
              </Select>
            </div>
          )}

          {/* Filtro de responsável */}
          <div className="w-44">
            <Select value={assignee} onChange={(e) => setAssignee(e.target.value)} aria-label="Filtrar por responsável">
              <option value="all">Todos os responsáveis</option>
              <option value="mine">Minhas tarefas</option>
              {members.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </Select>
          </div>

          {/* Filtro de categoria */}
          <div className="w-40">
            <Select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} aria-label="Filtrar por categoria">
              <option value="all">Todas as categorias</option>
              {TAGS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className="w-full sm:w-64">
          <SearchField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
            placeholder="Buscar tarefa…"
            aria-label="Buscar tarefa"
          />
        </div>
      </div>

      {/* Conteúdo */}
      {view === 'calendar' ? (
        <CalendarView tasks={filtered} onOpen={(t) => setOpenTaskId(t.id)} />
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ListChecks size={22} strokeWidth={1.5} />}
            title="Nenhuma tarefa encontrada"
            description={tasks.length === 0 ? 'Crie a primeira tarefa do time.' : 'Ajuste os filtros para ver mais tarefas.'}
            action={
              canManage && tasks.length === 0 ? (
                <Button leftIcon={<Plus size={18} strokeWidth={1.5} />} onClick={() => { setEditing(null); setFormOpen(true) }}>
                  Nova tarefa
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : view === 'board' ? (
        <BoardView
          groups={groups}
          canManage={canManage}
          canMove={canMove}
          onOpen={(t) => setOpenTaskId(t.id)}
          onToggle={toggle}
          onDropTask={handleDropTask}
          onQuickAdd={handleQuickAdd}
        />
      ) : (
        <ListView
          groups={groups}
          canManage={canManage}
          onOpen={(t) => setOpenTaskId(t.id)}
          onToggle={toggle}
          onQuickAdd={handleQuickAdd}
        />
      )}

      {/* Overlays */}
      <TaskFormModal
        open={formOpen}
        editing={editing}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        onSubmit={submitForm}
      />
      <TaskDrawer
        task={openTask}
        canManage={canManage}
        onClose={() => setOpenTaskId(null)}
        onMove={(status) => openTask && moveTask(openTask.id, status)}
        onToggle={() => openTask && toggle(openTask)}
        onEdit={() => {
          if (!openTask) return
          setEditing(openTask)
          setOpenTaskId(null)
          setFormOpen(true)
        }}
        onDelete={() => {
          if (!openTask) return
          removeTask(openTask.id)
          toast.success('Tarefa removida', openTask.title)
          setOpenTaskId(null)
        }}
        onChecklistChange={(items) => openTask && setChecklist(openTask.id, items)}
      />
    </div>
  )
}
