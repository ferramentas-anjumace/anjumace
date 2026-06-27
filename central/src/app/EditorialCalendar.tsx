import { useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  ExternalLink,
  CalendarDays,
  Send,
  BadgeCheck,
  LayoutTemplate,
  Share2,
  Link2,
  ListTodo,
  ListChecks,
  MessageSquare,
  GalleryHorizontalEnd,
  Film,
  Scissors,
  Image as ImageIcon,
  X,
  UserCircle,
} from 'lucide-react'
import {
  Card,
  Badge,
  Button,
  IconButton,
  Tag,
  Tabs,
  TabList,
  Tab,
  Modal,
  Input,
  Textarea,
  Select,
  DatePicker,
  EmptyState,
  useToast,
} from '@/components/ui'
import {
  APPROVAL_META,
  ASSET_META,
  CHANNEL_META,
  FORMAT_META,
  STAGE_META,
  type EditorialApproval,
  type EditorialAsset,
  type EditorialChannel,
  type EditorialFormat,
  type EditorialPost,
  type EditorialStage,
} from './data'
import { useEditorial } from './editorial'
import { useTasks } from './tasks'
import { useProfiles } from './profiles'
import { useSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'

/* ---- Datas (ISO local, sem dependências) ------------------------------- */

function parseISO(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}
function addDays(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
}
function sameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const monthFmt = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
const longFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
const dayMonthFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })

/** "Hoje" real do navegador (ISO local), recalculado a cada carga. */
const TODAY_ISO = toISO(new Date())

/** Matriz 6×7 cobrindo o mês de `view`, começando no domingo. */
function buildGrid(view: Date) {
  const first = new Date(view.getFullYear(), view.getMonth(), 1)
  const start = addDays(first, -first.getDay())
  return Array.from({ length: 42 }, (_, i) => addDays(start, i))
}

const FORMAT_ICON: Record<EditorialFormat, React.ReactNode> = {
  carrossel: <GalleryHorizontalEnd size={13} strokeWidth={1.5} />,
  reels: <Film size={13} strokeWidth={1.5} />,
  corte: <Scissors size={13} strokeWidth={1.5} />,
  imagem: <ImageIcon size={13} strokeWidth={1.5} />,
}

/* ---- Chip de postagem na célula do calendário -------------------------- */

/** Labels curtos da etapa — a célula do calendário é estreita demais para os
 *  rótulos completos (ex.: "Para edição de vídeo" estoura). No drawer/lista os
 *  labels completos de STAGE_META continuam em uso. */
const STAGE_SHORT: Record<EditorialStage, string> = {
  'para-designer': 'Design',
  'para-edicao': 'Edição',
  'para-anju': 'Anju',
  concluido: 'Concluído',
}

function PostChip({ post, onOpen }: { post: EditorialPost; onOpen: () => void }) {
  const stage = STAGE_META[post.stage]
  const fmt = FORMAT_META[post.format]
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group/chip flex w-full flex-col gap-1.5 overflow-hidden rounded-md border border-line bg-slate-800 p-2 text-left transition-colors hover:border-strong hover:bg-slate-700 focus-visible:outline-none focus-visible:shadow-focus"
    >
      <span className="flex items-start gap-1.5">
        <span className="mt-0.5 shrink-0 text-faint group-hover/chip:text-steel-300">{FORMAT_ICON[post.format]}</span>
        <span className="line-clamp-2 text-body-s font-medium leading-snug text-strong">{post.title || 'Sem título'}</span>
      </span>
      <span className="flex min-w-0 flex-wrap items-center gap-1">
        <Badge tone={fmt.tone} size="sm" className="max-w-full">{fmt.label}</Badge>
        <Badge tone={stage.tone} size="sm" className="max-w-full">{STAGE_SHORT[post.stage]}</Badge>
      </span>
    </button>
  )
}

/* ---- Grade mensal ------------------------------------------------------ */

function MonthGrid({
  view,
  byDay,
  canManage,
  onOpen,
  onAdd,
}: {
  view: Date
  byDay: Map<string, EditorialPost[]>
  canManage: boolean
  onOpen: (id: string) => void
  onAdd: (iso: string) => void
}) {
  const days = buildGrid(view)
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[760px]">
        <div className="grid grid-cols-7 border-b border-line">
          {WEEKDAYS.map((w) => (
            <div key={w} className="px-2 py-2 font-mono text-mono-label uppercase text-faint">{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 border-l border-line">
          {days.map((d) => {
            const iso = toISO(d)
            const inMonth = sameMonth(d, view)
            const isToday = iso === TODAY_ISO
            const posts = byDay.get(iso) ?? []
            return (
              <div
                key={iso}
                className={`group/cell min-h-[8.5rem] border-b border-r border-line p-1.5 ${
                  inMonth ? '' : 'bg-ink/40'
                }`}
              >
                <div className="mb-1.5 flex items-center justify-between px-0.5">
                  <span
                    className={`grid size-6 place-items-center rounded-full font-mono text-mono-data tabular-nums ${
                      isToday
                        ? 'bg-steel-500 font-semibold text-accent-fg'
                        : inMonth
                          ? 'text-muted'
                          : 'text-faint'
                    }`}
                  >
                    {d.getDate()}
                  </span>
                  {canManage && inMonth && (
                    <button
                      type="button"
                      onClick={() => onAdd(iso)}
                      aria-label={`Nova postagem em ${longFmt.format(d)}`}
                      className="grid size-5 place-items-center rounded-sm text-faint opacity-0 transition-[opacity,color,background-color] hover:bg-slate-700 hover:text-strong focus-visible:opacity-100 focus-visible:outline-none focus-visible:shadow-focus group-hover/cell:opacity-100"
                    >
                      <Plus size={14} strokeWidth={1.5} aria-hidden />
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  {posts.map((p) => (
                    <PostChip key={p.id} post={p} onOpen={() => onOpen(p.id)} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ---- Lista ------------------------------------------------------------- */

function PostList({ posts, onOpen }: { posts: EditorialPost[]; onOpen: (id: string) => void }) {
  if (posts.length === 0) {
    return (
      <EmptyState
        icon={<CalendarDays size={22} strokeWidth={1.5} />}
        title="Sem postagens"
        description="Nenhuma postagem no calendário editorial ainda."
      />
    )
  }
  const sorted = [...posts].sort((a, b) => a.date.localeCompare(b.date))
  return (
    <div className="flex flex-col gap-2">
      {sorted.map((p) => {
        const d = parseISO(p.date)
        const stage = STAGE_META[p.stage]
        const fmt = FORMAT_META[p.format]
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onOpen(p.id)}
            className="flex items-center gap-4 rounded-lg border border-line bg-slate-900 p-3 text-left transition-colors hover:border-strong hover:bg-slate-800 focus-visible:outline-none focus-visible:shadow-focus"
          >
            <div className="w-12 shrink-0 text-center">
              <div className="font-mono text-mono-data font-semibold text-strong">{String(d.getDate()).padStart(2, '0')}</div>
              <div className="font-mono text-[10px] uppercase text-faint">{dayMonthFmt.format(d).split(' ')[1]}</div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-body-s font-medium text-strong">{p.title || 'Sem título'}</div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <Badge tone={fmt.tone} size="sm">{fmt.label}</Badge>
                {p.channels.map((ch) => (
                  <Badge key={ch} tone={CHANNEL_META[ch].tone} size="sm">{CHANNEL_META[ch].label}</Badge>
                ))}
              </div>
            </div>
            <Badge tone={stage.tone}>{stage.label}</Badge>
          </button>
        )
      })}
    </div>
  )
}

/* ---- Linha de propriedade no drawer ------------------------------------ */

function PropertyRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 py-2 sm:flex-row sm:items-start sm:gap-3">
      <div className="flex shrink-0 items-center gap-2 pt-1 text-muted sm:w-40">
        <span className="text-faint" aria-hidden>{icon}</span>
        <span className="text-body-s">{label}</span>
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

/** Conjunto de chips selecionáveis (mídia social / checklists). */
function ChipToggle<T extends string>({
  options,
  selected,
  onToggle,
  canManage,
  emptyTone,
}: {
  options: { value: T; label: string }[]
  selected: T[]
  onToggle: (value: T) => void
  canManage: boolean
  emptyTone: 'steel' | 'danger' | 'success'
}) {
  if (!canManage) {
    if (selected.length === 0) return <span className="text-body-s text-faint">—</span>
    return (
      <div className="flex flex-wrap gap-1.5">
        {selected.map((v) => {
          const opt = options.find((o) => o.value === v)
          return <Badge key={v} tone={emptyTone} size="sm">{opt?.label ?? v}</Badge>
        })}
      </div>
    )
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <Tag key={o.value} selectable selected={selected.includes(o.value)} onSelect={() => onToggle(o.value)}>
          {o.label}
        </Tag>
      ))}
    </div>
  )
}

/** Chips de seleção única (radio) — usado em Enviar e Formato. */
function ChipSelect<T extends string>({
  options,
  value,
  onChange,
  canManage,
  readTone,
  readLabel,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  canManage: boolean
  readTone: React.ComponentProps<typeof Badge>['tone']
  /** Rótulo de leitura quando o valor não está mais nas opções (ex.: legado). */
  readLabel?: string
}) {
  if (!canManage) {
    const opt = options.find((o) => o.value === value)
    return <Badge tone={readTone} size="sm">{opt?.label ?? readLabel ?? value}</Badge>
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <Tag key={o.value} selectable selected={value === o.value} onSelect={() => onChange(o.value)}>
          {o.label}
        </Tag>
      ))}
    </div>
  )
}

/** Seleção única em BADGES COLORIDOS (cada opção na sua cor). Selecionado fica
 *  destacado; os demais ficam esmaecidos. Usado no Status. */
function ToneChipSelect<T extends string>({
  options,
  value,
  onChange,
  canManage,
}: {
  options: { value: T; label: string; tone: React.ComponentProps<typeof Badge>['tone'] }[]
  value: T
  onChange: (value: T) => void
  canManage: boolean
}) {
  const current = options.find((o) => o.value === value)
  if (!canManage) {
    return <Badge tone={current?.tone} size="sm">{current?.label ?? value}</Badge>
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const selected = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(o.value)}
            className={`rounded-full transition focus-visible:outline-none focus-visible:shadow-focus ${
              selected ? 'ring-1 ring-strong ring-offset-1 ring-offset-slate-900' : 'opacity-40 hover:opacity-80'
            }`}
          >
            <Badge tone={o.tone} size="sm">{o.label}</Badge>
          </button>
        )
      })}
    </div>
  )
}

/* ---- Drawer de detalhe / edição ---------------------------------------- */

const FORMAT_OPTS = Object.entries(FORMAT_META).map(([value, m]) => ({ value: value as EditorialFormat, label: m.label }))
// "Tipo" oferece só Design / Edição de vídeo / Anju (concluído saiu do fluxo —
// a conclusão é refletida no Status). Posts antigos com 'concluido' seguem
// renderizando via STAGE_META/readLabel.
const STAGE_OPTS = Object.entries(STAGE_META)
  .filter(([value]) => value !== 'concluido')
  .map(([value, m]) => ({ value: value as EditorialStage, label: m.label }))
const APPROVAL_OPTS = Object.entries(APPROVAL_META).map(([value, m]) => ({ value: value as EditorialApproval, label: m.label, tone: m.tone }))
const CHANNEL_OPTS = Object.entries(CHANNEL_META).map(([value, m]) => ({ value: value as EditorialChannel, label: m.label }))
const ASSET_OPTS = Object.entries(ASSET_META).map(([value, m]) => ({ value: value as EditorialAsset, label: m.label }))

function PostDrawer({
  clientId,
  post,
  canManage,
  onClose,
}: {
  clientId: string
  post: EditorialPost
  canManage: boolean
  onClose: () => void
}) {
  const { updatePost, removePost } = useEditorial()
  const { addTask, editTask } = useTasks()
  const { members } = useProfiles()
  const { user } = useSession()
  const toast = useToast()

  const set = (patch: Partial<Omit<EditorialPost, 'id'>>) => updatePost(clientId, post.id, patch)

  /* Junção Editorial → Tarefas: ao definir/trocar o responsável, cria a tarefa
     vinculada (ou reatribui a existente) e notifica o novo responsável. */
  const assignResponsible = async (memberId: string) => {
    set({ assignee: memberId || undefined })
    if (!memberId) return
    const title = post.title || 'Sem título'
    let taskId = post.taskId
    if (taskId) {
      await editTask(taskId, { title, assignees: [memberId], due: post.date || undefined })
    } else {
      const id = await addTask({
        title,
        assignees: [memberId],
        due: post.date || undefined,
        tag: 'Conteúdo',
        clientId,
        status: 'a-fazer',
      })
      if (!id) {
        toast.error('Não foi possível criar a tarefa')
        return
      }
      taskId = id
      set({ taskId: id })
    }
    if (memberId !== user.userId) {
      await supabase.from('notifications').insert({
        user_id: memberId,
        title: 'Nova tarefa do editorial',
        body: `"${title}" foi atribuída a você.`,
        task_id: taskId ?? null,
      })
    }
    const who = members.find((m) => m.id === memberId)?.name
    toast.success('Responsável definido', who ? `Tarefa enviada para ${who}` : undefined)
  }

  const toggleIn = (key: 'channels' | 'pending' | 'ready', value: string) => {
    const list = post[key] as string[]
    const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
    set({ [key]: next } as Partial<EditorialPost>)
  }

  const fmt = FORMAT_META[post.format]
  const stage = STAGE_META[post.stage]

  return (
    <Modal open onClose={onClose} size="lg" className="max-w-3xl">
      {/* Cabeçalho fixo: formato + fechar */}
      <div className="sticky top-0 z-10 -mx-5 -mt-5 mb-12 flex items-center justify-between gap-2 border-b border-line bg-slate-900 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Badge tone={fmt.tone}>{fmt.label}</Badge>
          <Badge tone={stage.tone}>{stage.label}</Badge>
        </div>
        <IconButton aria-label="Fechar" size="sm" onClick={onClose}>
          <X size={18} strokeWidth={1.5} aria-hidden />
        </IconButton>
      </div>
      {canManage ? (
        <input
          value={post.title}
          onChange={(e) => set({ title: e.target.value })}
          placeholder="Título da postagem"
          aria-label="Título da postagem"
          className="mb-4 w-full bg-transparent font-display text-h2 font-semibold text-strong placeholder:text-faint focus:outline-none"
        />
      ) : (
        <h2 className="mb-4 font-display text-h2 font-semibold text-strong">{post.title || 'Sem título'}</h2>
      )}

      {/* Descrição — conteúdo da demanda (briefing, roteiro, instruções) */}
      <div className="mb-5">
        <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-faint">Descrição</div>
        {canManage ? (
          <Textarea
            rows={5}
            value={post.description ?? ''}
            onChange={(e) => set({ description: e.target.value })}
            placeholder="Conteúdo da demanda — briefing, roteiro, instruções..."
          />
        ) : (
          <p className="whitespace-pre-wrap text-body-s leading-relaxed text-fg">
            {post.description || 'Sem descrição.'}
          </p>
        )}
      </div>

      <div className="divide-y divide-line">
        <PropertyRow icon={<UserCircle size={16} strokeWidth={1.5} />} label="Responsável">
          {canManage ? (
            <Select value={post.assignee ?? ''} onChange={(e) => assignResponsible(e.target.value)}>
              <option value="">— Selecionar —</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}{m.team ? ` · ${m.team}` : ''}</option>
              ))}
            </Select>
          ) : (
            <Badge tone="steel">{members.find((m) => m.id === post.assignee)?.name ?? '—'}</Badge>
          )}
        </PropertyRow>

        <PropertyRow icon={<BadgeCheck size={16} strokeWidth={1.5} />} label="Status">
          <ToneChipSelect
            options={APPROVAL_OPTS}
            value={post.approval}
            onChange={(v) => set({ approval: v })}
            canManage={canManage}
          />
        </PropertyRow>

        <PropertyRow icon={<MessageSquare size={16} strokeWidth={1.5} />} label="Comentários">
          {canManage ? (
            <Textarea
              rows={2}
              value={post.comment ?? ''}
              onChange={(e) => set({ comment: e.target.value })}
              placeholder="Sem comentário"
            />
          ) : (
            <p className="text-body-s text-fg">{post.comment || <span className="text-faint">—</span>}</p>
          )}
        </PropertyRow>

        <PropertyRow icon={<CalendarDays size={16} strokeWidth={1.5} />} label="Data de publicação">
          {canManage ? (
            <DatePicker value={parseISO(post.date)} onChange={(d) => d && set({ date: toISO(d) })} />
          ) : (
            <span className="text-body-s capitalize text-fg">{longFmt.format(parseISO(post.date))}</span>
          )}
        </PropertyRow>

        <PropertyRow icon={<Send size={16} strokeWidth={1.5} />} label="Tipo">
          <ChipSelect
            options={STAGE_OPTS}
            value={post.stage}
            onChange={(v) => set({ stage: v })}
            canManage={canManage}
            readTone={stage.tone}
            readLabel={stage.label}
          />
        </PropertyRow>

        <PropertyRow icon={<LayoutTemplate size={16} strokeWidth={1.5} />} label="Formato">
          <ChipSelect
            options={FORMAT_OPTS}
            value={post.format}
            onChange={(v) => set({ format: v })}
            canManage={canManage}
            readTone={fmt.tone}
          />
        </PropertyRow>

        <PropertyRow icon={<Share2 size={16} strokeWidth={1.5} />} label="Mídia social">
          <ChipToggle
            options={CHANNEL_OPTS}
            selected={post.channels}
            onToggle={(v) => toggleIn('channels', v)}
            canManage={canManage}
            emptyTone="steel"
          />
        </PropertyRow>

        <PropertyRow icon={<Link2 size={16} strokeWidth={1.5} />} label="Link do upload">
          {canManage ? (
            <Input
              type="url"
              value={post.uploadUrl ?? ''}
              onChange={(e) => set({ uploadUrl: e.target.value })}
              placeholder="https://…"
            />
          ) : post.uploadUrl ? (
            <a
              href={post.uploadUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-body-s text-steel-300 hover:text-steel-400 focus-visible:outline-none focus-visible:shadow-focus"
            >
              <span className="truncate">{post.uploadUrl.replace(/^https?:\/\//, '')}</span>
              <ExternalLink size={13} strokeWidth={1.5} aria-hidden />
            </a>
          ) : (
            <span className="text-body-s text-faint">—</span>
          )}
        </PropertyRow>

        <PropertyRow icon={<ListTodo size={16} strokeWidth={1.5} />} label="Falta o quê?">
          <ChipToggle
            options={ASSET_OPTS}
            selected={post.pending}
            onToggle={(v) => toggleIn('pending', v)}
            canManage={canManage}
            emptyTone="danger"
          />
        </PropertyRow>

        <PropertyRow icon={<ListChecks size={16} strokeWidth={1.5} />} label="O que está pronto">
          <ChipToggle
            options={ASSET_OPTS}
            selected={post.ready}
            onToggle={(v) => toggleIn('ready', v)}
            canManage={canManage}
            emptyTone="success"
          />
        </PropertyRow>
      </div>

      {canManage && (
        <div className="mt-6 flex justify-end border-t border-line pt-4">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Trash2 size={16} strokeWidth={1.5} />}
            onClick={() => {
              removePost(clientId, post.id)
              toast.success('Postagem removida', post.title || 'Sem título')
              onClose()
            }}
            className="text-err hover:text-err"
          >
            Excluir postagem
          </Button>
        </div>
      )}
    </Modal>
  )
}

/* ---- Componente principal ---------------------------------------------- */

export function EditorialCalendar({ clientId, canManage }: { clientId: string; canManage: boolean }) {
  const { getPosts, addPost } = useEditorial()
  const posts = getPosts(clientId)

  const [tab, setTab] = useState<'calendario' | 'lista'>('calendario')
  const [view, setView] = useState<Date>(() => {
    const first = [...posts].sort((a, b) => a.date.localeCompare(b.date))[0]
    return first ? addMonths(parseISO(first.date), 0) : new Date()
  })
  const [openId, setOpenId] = useState<string | null>(null)

  const byDay = useMemo(() => {
    const map = new Map<string, EditorialPost[]>()
    for (const p of posts) {
      const list = map.get(p.date) ?? []
      list.push(p)
      map.set(p.date, list)
    }
    return map
  }, [posts])

  const openPost = openId ? posts.find((p) => p.id === openId) ?? null : null

  const createOn = async (iso: string) => {
    const id = await addPost(clientId, {
      date: iso,
      title: '',
      format: 'carrossel',
      channels: ['instagram'],
      stage: 'para-designer',
      approval: 'em-producao',
      pending: [],
      ready: [],
      cards: [],
    })
    if (id) setOpenId(id)
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        {/* Barra de controle */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <IconButton size="sm" aria-label="Mês anterior" onClick={() => setView((v) => addMonths(v, -1))}>
              <ChevronLeft size={18} strokeWidth={1.5} />
            </IconButton>
            <span className="min-w-44 text-center font-display text-h3 font-semibold capitalize text-strong sm:text-left">
              {monthFmt.format(view)}
            </span>
            <IconButton size="sm" aria-label="Próximo mês" onClick={() => setView((v) => addMonths(v, 1))}>
              <ChevronRight size={18} strokeWidth={1.5} />
            </IconButton>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView(new Date(parseISO(TODAY_ISO).getFullYear(), parseISO(TODAY_ISO).getMonth(), 1))}
            >
              Hoje
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Tabs value={tab} onValueChange={(v) => setTab(v as 'calendario' | 'lista')} variant="segmented">
              <TabList aria-label="Visualização do calendário">
                <Tab value="calendario">Calendário</Tab>
                <Tab value="lista">Lista</Tab>
              </TabList>
            </Tabs>
            {canManage && (
              <Button
                size="sm"
                leftIcon={<Plus size={16} strokeWidth={1.5} />}
                onClick={() => {
                  const todayInView = sameMonth(view, parseISO(TODAY_ISO)) ? TODAY_ISO : toISO(new Date(view.getFullYear(), view.getMonth(), 1))
                  createOn(todayInView)
                }}
              >
                Nova postagem
              </Button>
            )}
          </div>
        </div>

        {tab === 'calendario' ? (
          <MonthGrid view={view} byDay={byDay} canManage={canManage} onOpen={setOpenId} onAdd={createOn} />
        ) : (
          <PostList posts={posts} onOpen={setOpenId} />
        )}
      </Card>

      {!canManage && (
        <p className="text-body-s text-faint">
          Visualização — alterações no calendário ficam disponíveis para o time.
        </p>
      )}

      {openPost && (
        <PostDrawer
          clientId={clientId}
          post={openPost}
          canManage={canManage}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  )
}
