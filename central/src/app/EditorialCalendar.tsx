import { useEffect, useMemo, useState } from 'react'
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
  ChevronDown,
  Copy as CopyIcon,
  Check,
  RotateCcw,
  History,
  FileText,
  AlignLeft,
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
  DatePicker,
  EmptyState,
  Avatar,
  DropdownMenu,
  MenuItem,
  MenuSeparator,
  useToast,
} from '@/components/ui'
import {
  ASSET_META,
  CHANNEL_META,
  POST_APPROVAL_META,
  STAGE_META,
  TRACK_META,
  TRACK_STATUS_META,
  type ApprovalEvent,
  type ApprovalTrack,
  type EditorialAsset,
  type EditorialChannel,
  type EditorialPost,
  type EditorialStage,
  type PostApprovalState,
  type TrackStatus,
  formatDefaults,
  postApprovalState,
} from './data'
import { useEditorial } from './editorial'
import { useTasks } from './tasks'
import { useProfiles, type Member } from './profiles'
import { useCatalogs, CatalogBadge } from './catalogs'
import { CommentThread } from './CommentThread'
import { useSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'
import { Portal } from '@/lib/Portal'

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

// Ícone por formato (chave = value do catálogo). Formatos novos criados pelo
// gestor caem no ícone genérico (LayoutTemplate).
const FORMAT_ICON: Record<string, React.ReactNode> = {
  carrossel: <GalleryHorizontalEnd size={13} strokeWidth={1.5} />,
  reels: <Film size={13} strokeWidth={1.5} />,
  corte: <Scissors size={13} strokeWidth={1.5} />,
  imagem: <ImageIcon size={13} strokeWidth={1.5} />,
}
const formatIcon = (format: string) => FORMAT_ICON[format] ?? <LayoutTemplate size={13} strokeWidth={1.5} />

/** Badge de formato — lê rótulo/cor do catálogo `editorial_format`. */
function FormatBadge({ format, size = 'sm' }: { format: string; size?: 'sm' | 'md' }) {
  const { label, tone } = useCatalogs()
  return (
    <CatalogBadge size={size} tone={tone('editorial_format', format)}>
      {label('editorial_format', format)}
    </CatalogBadge>
  )
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

/** Labels curtos do estado de aprovação — versão de célula do calendário. */
const APPROVAL_SHORT: Record<PostApprovalState, string> = {
  aguardando: 'Aguardando',
  ajuste: 'Ajuste',
  aprovado: 'Aprovado',
}

function PostChip({
  post,
  onOpen,
  onContextMenu,
  draggable,
  onDragStart,
}: {
  post: EditorialPost
  onOpen: () => void
  onContextMenu?: (e: React.MouseEvent) => void
  draggable?: boolean
  onDragStart?: (e: React.DragEvent) => void
}) {
  const stage = STAGE_META[post.stage]
  const approval = postApprovalState(post)
  return (
    <button
      type="button"
      onClick={onOpen}
      onContextMenu={onContextMenu}
      draggable={draggable}
      onDragStart={onDragStart}
      className={`group/chip flex w-full flex-col gap-1.5 overflow-hidden rounded-md border border-line bg-slate-800 p-2 text-left transition-colors hover:border-strong hover:bg-slate-700 focus-visible:outline-none focus-visible:shadow-focus ${
        draggable ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
    >
      <span className="flex items-start gap-1.5">
        <span className="mt-0.5 shrink-0 text-faint group-hover/chip:text-steel-300">{formatIcon(post.format)}</span>
        <span className="line-clamp-2 text-body-s font-medium leading-snug text-strong">{post.title || 'Sem título'}</span>
      </span>
      {/* Situação num relance: formato · mídia · etapa · aprovação. */}
      <span className="flex min-w-0 flex-wrap items-center gap-1">
        <FormatBadge format={post.format} />
        {post.channels.map((ch) => (
          <Badge key={ch} tone={CHANNEL_META[ch].tone} size="sm" className="max-w-full">
            {CHANNEL_META[ch].label}
          </Badge>
        ))}
        <Badge tone={stage.tone} size="sm" className="max-w-full">{STAGE_SHORT[post.stage]}</Badge>
        <Badge tone={POST_APPROVAL_META[approval].tone} size="sm" dot className="max-w-full">
          {APPROVAL_SHORT[approval]}
        </Badge>
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
  onMove,
  onContext,
}: {
  view: Date
  byDay: Map<string, EditorialPost[]>
  canManage: boolean
  onOpen: (id: string) => void
  onAdd: (iso: string) => void
  onMove: (id: string, iso: string) => void
  onContext?: (post: EditorialPost, e: React.MouseEvent) => void
}) {
  const days = buildGrid(view)
  const [dragOver, setDragOver] = useState<string | null>(null)
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
                onDragOver={canManage ? (e) => { e.preventDefault(); setDragOver(iso) } : undefined}
                onDragLeave={canManage ? () => setDragOver((cur) => (cur === iso ? null : cur)) : undefined}
                onDrop={
                  canManage
                    ? (e) => {
                        e.preventDefault()
                        setDragOver(null)
                        const id = e.dataTransfer.getData('text/plain')
                        if (id) onMove(id, iso)
                      }
                    : undefined
                }
                className={`group/cell min-h-[8.5rem] border-b border-r border-line p-1.5 transition-colors ${
                  inMonth ? '' : 'bg-ink/40'
                } ${dragOver === iso ? 'bg-steel-tint ring-1 ring-inset ring-steel-500/40' : ''}`}
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
                    <PostChip
                      key={p.id}
                      post={p}
                      onOpen={() => onOpen(p.id)}
                      onContextMenu={onContext ? (e) => onContext(p, e) : undefined}
                      draggable={canManage}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', p.id)
                        e.dataTransfer.effectAllowed = 'move'
                      }}
                    />
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

/* ---- Menu de contexto do card (botão direito) --------------------------- */

function PostContextMenu({
  menu,
  canManage,
  onOpen,
  onDuplicate,
  onDelete,
  onClose,
}: {
  menu: { post: EditorialPost; x: number; y: number } | null
  canManage: boolean
  onOpen: () => void
  onDuplicate: () => void
  onDelete: () => void
  onClose: () => void
}) {
  useEffect(() => {
    if (!menu) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menu, onClose])

  if (!menu) return null
  // Mantém o menu dentro da janela mesmo com clique perto das bordas.
  const left = Math.min(menu.x, window.innerWidth - 210)
  const top = Math.min(menu.y, window.innerHeight - (canManage ? 150 : 60))
  return (
    <Portal>
      <div
        className="fixed inset-0 z-dropdown"
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault()
          onClose()
        }}
      >
        <div
          style={{ left, top }}
          className="absolute min-w-48 rounded-md border border-strong bg-slate-700 p-1 shadow-e2 animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          <MenuItem
            icon={<ExternalLink size={16} strokeWidth={1.5} />}
            onClick={() => {
              onOpen()
              onClose()
            }}
          >
            Abrir
          </MenuItem>
          {canManage && (
            <>
              <MenuItem
                icon={<CopyIcon size={16} strokeWidth={1.5} />}
                onClick={() => {
                  onDuplicate()
                  onClose()
                }}
              >
                Duplicar
              </MenuItem>
              <MenuSeparator />
              <MenuItem
                destructive
                icon={<Trash2 size={16} strokeWidth={1.5} />}
                onClick={() => {
                  onDelete()
                  onClose()
                }}
              >
                Excluir demanda
              </MenuItem>
            </>
          )}
        </div>
      </div>
    </Portal>
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
        const approval = postApprovalState(p)
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
                <FormatBadge format={p.format} />
                {p.channels.map((ch) => (
                  <Badge key={ch} tone={CHANNEL_META[ch].tone} size="sm">{CHANNEL_META[ch].label}</Badge>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <Badge tone={stage.tone}>{stage.label}</Badge>
              <Badge tone={POST_APPROVAL_META[approval].tone} size="sm" dot>
                {POST_APPROVAL_META[approval].label}
              </Badge>
            </div>
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

/** Seletor de responsável COM AVATAR. Substitui o <select> nativo (que não
 *  renderiza imagem): o gatilho e cada item mostram a foto + nome · time. */
function ResponsavelSelect({
  value,
  onChange,
  members,
}: {
  value: string | undefined
  onChange: (memberId: string) => void
  members: Member[]
}) {
  const current = members.find((m) => m.id === value)
  return (
    <DropdownMenu
      className="max-h-72 min-w-56 overflow-y-auto"
      trigger={
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-xs border border-strong bg-slate-900 pl-1.5 pr-2.5 text-body-s text-strong transition-[border-color,box-shadow] duration-fast ease-out hover:border-line focus-visible:shadow-focus focus-visible:outline-none"
        >
          {current ? (
            <>
              <Avatar size="xs" name={current.name} src={current.avatar ?? undefined} />
              <span>{current.name}</span>
            </>
          ) : (
            <span className="pl-1 text-faint">— Selecionar —</span>
          )}
          <ChevronDown size={16} strokeWidth={1.5} className="ml-1 text-muted" aria-hidden />
        </button>
      }
    >
      <MenuItem onClick={() => onChange('')}>
        <span className="text-muted">— Selecionar —</span>
      </MenuItem>
      {members.map((m) => (
        <MenuItem
          key={m.id}
          className="whitespace-nowrap"
          icon={<Avatar size="xs" name={m.name} src={m.avatar ?? undefined} />}
          shortcut={m.id === value ? '✓' : undefined}
          onClick={() => onChange(m.id)}
        >
          {m.name}
        </MenuItem>
      ))}
    </DropdownMenu>
  )
}

/* ---- Copy / Legenda / Aprovação em etapas ------------------------------ */

const histFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

/** Campo de texto (copy/legenda) com botão "Copiar". Editável para gestor,
 *  somente-leitura para o time. */
function CopyableField({
  icon,
  label,
  value,
  placeholder,
  canManage,
  onChange,
  rows = 4,
}: {
  icon: React.ReactNode
  label: string
  value: string
  placeholder: string
  canManage: boolean
  onChange: (v: string) => void
  rows?: number
}) {
  const toast = useToast()
  const copy = async () => {
    if (!value.trim()) return
    try {
      await navigator.clipboard.writeText(value)
      toast.success('Copiado', label)
    } catch {
      toast.error('Não foi possível copiar')
    }
  }
  return (
    <div className="mb-5">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-faint">
          <span aria-hidden>{icon}</span>
          {label}
        </div>
        {value.trim() && (
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted transition-colors hover:text-strong focus-visible:outline-none focus-visible:shadow-focus"
          >
            <CopyIcon size={12} strokeWidth={1.5} aria-hidden /> Copiar
          </button>
        )}
      </div>
      {canManage ? (
        <Textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      ) : value.trim() ? (
        <p className="whitespace-pre-wrap rounded-lg border border-line bg-slate-900 p-3 text-body-s leading-relaxed text-fg">
          {value}
        </p>
      ) : (
        <p className="text-body-s text-faint">—</p>
      )}
    </div>
  )
}

/** Uma etapa de aprovação (Copy ou Arte/Vídeo): status + ações de gestor. */
function ApprovalTrackRow({
  track,
  status,
  canManage,
  onApprove,
  onRequestChanges,
}: {
  track: ApprovalTrack
  status: TrackStatus
  canManage: boolean
  onApprove: () => void
  onRequestChanges: (note: string) => void
}) {
  const [asking, setAsking] = useState(false)
  const [note, setNote] = useState('')
  const meta = TRACK_STATUS_META[status]
  const submit = () => {
    const n = note.trim()
    if (!n) return
    onRequestChanges(n)
    setNote('')
    setAsking(false)
  }
  return (
    <div className="rounded-lg border border-line bg-slate-900 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-body-s font-medium text-strong">{TRACK_META[track].label}</span>
          <Badge tone={meta.tone} size="sm">{meta.label}</Badge>
        </div>
        {canManage && (
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<Check size={14} strokeWidth={1.5} />}
              onClick={onApprove}
              disabled={status === 'aprovado'}
            >
              Aprovar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<RotateCcw size={14} strokeWidth={1.5} />}
              onClick={() => setAsking((v) => !v)}
            >
              Pedir ajuste
            </Button>
          </div>
        )}
      </div>
      {asking && canManage && (
        <div className="mt-2.5 flex flex-col gap-2">
          <Textarea
            rows={2}
            autoFocus
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={`O que ajustar na ${TRACK_META[track].label.toLowerCase()}?`}
          />
          <div className="flex items-center justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => { setAsking(false); setNote('') }}>
              Cancelar
            </Button>
            <Button size="sm" onClick={submit} disabled={!note.trim()}>
              Enviar ajuste
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/** Linha do tempo das aprovações (mais recente primeiro). */
function ApprovalHistory({ log, members }: { log: ApprovalEvent[]; members: Member[] }) {
  const sorted = [...log].sort((a, b) => b.at.localeCompare(a.at))
  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-faint">
        <History size={12} strokeWidth={1.5} aria-hidden /> Histórico
      </div>
      <ul className="flex flex-col gap-2.5">
        {sorted.map((e) => {
          const who = members.find((m) => m.id === e.by)
          const verb = e.status === 'aprovado' ? 'aprovou' : 'pediu ajuste em'
          return (
            <li key={e.id} className="flex gap-2.5">
              <span className="mt-0.5 shrink-0">
                <Avatar size="xs" name={e.byName} src={who?.avatar ?? undefined} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-body-s text-fg">
                  <span className="font-medium text-strong">{e.byName}</span> {verb}{' '}
                  <span className="font-medium text-strong">{TRACK_META[e.track].label}</span>
                  <span className="ml-1.5 font-mono text-[11px] text-faint">{histFmt.format(new Date(e.at))}</span>
                </p>
                {e.note && (
                  <p className="mt-0.5 whitespace-pre-wrap rounded-md border border-line bg-slate-900 px-2.5 py-1.5 text-body-s text-muted">
                    {e.note}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/* ---- Drawer de detalhe / edição ---------------------------------------- */

// "Tipo" oferece só Design / Edição de vídeo / Anju (concluído saiu do fluxo —
// a conclusão é refletida no Status). Posts antigos com 'concluido' seguem
// renderizando via STAGE_META/readLabel.
const STAGE_OPTS = Object.entries(STAGE_META)
  .filter(([value]) => value !== 'concluido')
  .map(([value, m]) => ({ value: value as EditorialStage, label: m.label }))
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
  const { addTask, editTask, removeTask } = useTasks()
  const { members } = useProfiles()
  const { user } = useSession()
  const { items: catItems } = useCatalogs()
  const formatOpts = catItems('editorial_format').map((c) => ({ value: c.value, label: c.label }))
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
      await editTask(taskId, {
        title,
        assignees: [memberId],
        due: post.date || undefined,
        description: post.description ?? undefined,
      })
    } else {
      const id = await addTask({
        title,
        description: post.description ?? undefined,
        assignees: [memberId],
        due: post.date || undefined,
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

  const toggleIn = (key: 'channels', value: string) => {
    const list = post[key] as string[]
    const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
    set({ [key]: next } as Partial<EditorialPost>)
  }

  /** "Falta o quê?" e "O que está pronto" são mutuamente exclusivos: marcar um
   *  item numa lista tira o mesmo item da outra (pronto ⇒ não falta mais). */
  const toggleAsset = (key: 'pending' | 'ready', value: EditorialAsset) => {
    const other = key === 'pending' ? 'ready' : 'pending'
    const adding = !post[key].includes(value)
    const patch: Partial<EditorialPost> = {
      [key]: adding ? [...post[key], value] : post[key].filter((v) => v !== value),
    }
    if (adding && post[other].includes(value)) {
      patch[other] = post[other].filter((v) => v !== value)
    }
    set(patch)
  }

  /* Aprovação em etapas: registra o evento no histórico, move o status da etapa
     e — ao pedir ajuste — avisa o responsável (loop de revisão). */
  const pushApproval = async (track: ApprovalTrack, status: TrackStatus, note?: string) => {
    const event: ApprovalEvent = {
      id: crypto.randomUUID(),
      track,
      status,
      by: user.userId,
      byName: user.name,
      at: new Date().toISOString(),
      note: note?.trim() || undefined,
    }
    const statusPatch: Partial<EditorialPost> =
      track === 'copy' ? { copyStatus: status } : { artStatus: status }
    set({ ...statusPatch, approvalLog: [...(post.approvalLog ?? []), event] })
    // Avisa o responsável nas duas transições (pedido de ajuste e aprovação).
    if ((status === 'ajuste' || status === 'aprovado') && post.assignee && post.assignee !== user.userId) {
      const label = TRACK_META[track].label
      const title = post.title || 'Sem título'
      await supabase.from('notifications').insert(
        status === 'ajuste'
          ? {
              user_id: post.assignee,
              title: `Ajuste pedido — ${label}`,
              body: `${user.name} pediu ajuste em "${title}"${note ? `: ${note.slice(0, 80)}` : ''}`,
              task_id: post.taskId ?? null,
            }
          : {
              user_id: post.assignee,
              title: `${label} aprovada`,
              body: `${user.name} aprovou ${label.toLowerCase()} de "${title}".`,
              task_id: post.taskId ?? null,
            },
      )
    }
  }

  const stage = STAGE_META[post.stage]
  const approvalState = postApprovalState(post)

  return (
    <Modal open onClose={onClose} size="lg" className="max-w-3xl">
      {/* Cabeçalho fixo: formato + fechar */}
      <div className="sticky top-0 z-10 -mx-5 -mt-5 mb-12 flex items-center justify-between gap-2 border-b border-line bg-slate-900 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <FormatBadge format={post.format} size="md" />
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
            onBlur={(e) => {
              // Espelha a descrição na tarefa vinculada (se houver).
              if (post.taskId) editTask(post.taskId, { description: e.target.value || undefined })
            }}
            placeholder="Conteúdo da demanda — briefing, roteiro, instruções..."
          />
        ) : (
          <p className="whitespace-pre-wrap text-body-s leading-relaxed text-fg">
            {post.description || 'Sem descrição.'}
          </p>
        )}
      </div>

      {/* Conteúdo textual — copy e legenda geridas dentro da ferramenta */}
      <CopyableField
        icon={<FileText size={13} strokeWidth={1.5} />}
        label="Copy do post"
        value={post.copy ?? ''}
        placeholder="Texto do criativo — a copy que a Anju revisa…"
        canManage={canManage}
        onChange={(v) => set({ copy: v })}
        rows={5}
      />
      <CopyableField
        icon={<AlignLeft size={13} strokeWidth={1.5} />}
        label="Legenda"
        value={post.caption ?? ''}
        placeholder="Legenda do post…"
        canManage={canManage}
        onChange={(v) => set({ caption: v })}
        rows={3}
      />

      <div className="divide-y divide-line">
        <PropertyRow icon={<UserCircle size={16} strokeWidth={1.5} />} label="Responsável">
          {canManage ? (
            <ResponsavelSelect value={post.assignee} onChange={assignResponsible} members={members} />
          ) : (() => {
            const who = members.find((m) => m.id === post.assignee)
            return who ? (
              <span className="inline-flex items-center gap-2">
                <Avatar size="xs" name={who.name} src={who.avatar ?? undefined} />
                <span className="text-body-s text-strong">{who.name}</span>
              </span>
            ) : (
              <Badge tone="steel">—</Badge>
            )
          })()}
        </PropertyRow>

        {/* Status derivado das etapas de aprovação (copy + arte/vídeo) — não é editável. */}
        <PropertyRow icon={<BadgeCheck size={16} strokeWidth={1.5} />} label="Status">
          <Badge tone={POST_APPROVAL_META[approvalState].tone} size="sm" dot>
            {POST_APPROVAL_META[approvalState].label}
          </Badge>
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
          {canManage ? (
            <div className="flex flex-wrap gap-1.5">
              {formatOpts.map((o) => (
                <Tag
                  key={o.value}
                  selectable
                  selected={post.format === o.value}
                  onSelect={() => set({ format: o.value })}
                >
                  {o.label}
                </Tag>
              ))}
            </div>
          ) : (
            <FormatBadge format={post.format} size="md" />
          )}
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
            onToggle={(v) => toggleAsset('pending', v as EditorialAsset)}
            canManage={canManage}
            emptyTone="danger"
          />
        </PropertyRow>

        <PropertyRow icon={<ListChecks size={16} strokeWidth={1.5} />} label="O que está pronto">
          <ChipToggle
            options={ASSET_OPTS}
            selected={post.ready}
            onToggle={(v) => toggleAsset('ready', v as EditorialAsset)}
            canManage={canManage}
            emptyTone="success"
          />
        </PropertyRow>
      </div>

      {/* Aprovação em etapas — Copy e Arte/Vídeo aprovadas separadamente */}
      <div className="mt-6 border-t border-line pt-5">
        <div className="mb-1 flex items-center gap-2">
          <BadgeCheck size={15} strokeWidth={1.5} className="text-steel-300" aria-hidden />
          <span className="text-body-s font-medium text-strong">Aprovação por etapa</span>
        </div>
        <p className="mb-3 text-body-s text-faint">
          Copy e arte/vídeo são aprovadas separadamente. Pedir ajuste avisa o responsável.
        </p>
        <div className="flex flex-col gap-2">
          <ApprovalTrackRow
            track="copy"
            status={post.copyStatus ?? 'pendente'}
            canManage={canManage}
            onApprove={() => pushApproval('copy', 'aprovado')}
            onRequestChanges={(n) => pushApproval('copy', 'ajuste', n)}
          />
          <ApprovalTrackRow
            track="art"
            status={post.artStatus ?? 'pendente'}
            canManage={canManage}
            onApprove={() => pushApproval('art', 'aprovado')}
            onRequestChanges={(n) => pushApproval('art', 'ajuste', n)}
          />
        </div>
        {(post.approvalLog?.length ?? 0) > 0 && (
          <ApprovalHistory log={post.approvalLog ?? []} members={members} />
        )}
      </div>

      {/* Discussão do post (reaproveita o CommentThread genérico) */}
      <div className="mt-6 border-t border-line pt-5">
        <CommentThread
          entityType="editorial"
          entityId={post.id}
          notifyUserIds={post.assignee ? [post.assignee] : undefined}
          notifyLabel={post.title || 'Sem título'}
          taskId={post.taskId}
        />
      </div>

      {canManage && (
        <div className="mt-6 flex justify-end border-t border-line pt-4">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Trash2 size={16} strokeWidth={1.5} />}
            onClick={async () => {
              // Remove também a tarefa vinculada (se houver) — elas andam juntas.
              if (post.taskId) await removeTask(post.taskId)
              await removePost(clientId, post.id)
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

/** Prévia da automação do formato: mostra o que será pré-preenchido na demanda. */
function FormatDefaultsHint({ format }: { format: string }) {
  const d = formatDefaults(format)
  const parts = [
    `Tipo: ${STAGE_META[d.stage].label}`,
    d.channels.map((ch) => CHANNEL_META[ch].label).join(', '),
    d.pending.length > 0 ? `Falta: ${d.pending.map((a) => ASSET_META[a].label.toLowerCase()).join(', ')}` : null,
  ].filter(Boolean)
  return <span className="text-body-s text-muted">Já preenche — {parts.join(' · ')}</span>
}

/** Modal de criação de demanda — coleta título, data e formato e só persiste
 *  quando o usuário clica em "Criar" (evita criar por engano e ter que excluir). */
function NewPostModal({
  open,
  initialDate,
  formatOpts,
  onCancel,
  onCreate,
}: {
  open: boolean
  initialDate: string
  formatOpts: { value: string; label: string }[]
  onCancel: () => void
  onCreate: (draft: { title: string; date: string; format: string }) => Promise<void>
}) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(initialDate)
  const [format, setFormat] = useState(formatOpts[0]?.value ?? 'carrossel')
  const [saving, setSaving] = useState(false)

  // (Re)inicializa os campos sempre que o modal abre.
  useEffect(() => {
    if (!open) return
    setTitle('')
    setDate(initialDate)
    setFormat(formatOpts[0]?.value ?? 'carrossel')
    setSaving(false)
  }, [open, initialDate]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async () => {
    setSaving(true)
    try {
      await onCreate({ title: title.trim(), date, format })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Nova demanda"
      description="Preencha os dados e clique em Criar."
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} loading={saving}>
            Criar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex.: Carrossel | Intensidade x exaustão"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !saving) handleCreate()
          }}
        />
        <div className="flex flex-col gap-1.5">
          <span className="text-body-s font-medium text-strong">Data de publicação</span>
          <DatePicker value={parseISO(date)} onChange={(d) => d && setDate(toISO(d))} />
        </div>
        {formatOpts.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-body-s font-medium text-strong">Formato</span>
            <div className="flex flex-wrap gap-1.5">
              {formatOpts.map((o) => (
                <Tag
                  key={o.value}
                  selectable
                  selected={format === o.value}
                  onSelect={() => setFormat(o.value)}
                >
                  {o.label}
                </Tag>
              ))}
            </div>
            <FormatDefaultsHint format={format} />
          </div>
        )}
      </div>
    </Modal>
  )
}

/* ---- Filtro por estado de aprovação ------------------------------------ */

const APPROVAL_FILTERS: { value: PostApprovalState | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'aguardando', label: 'Aguardando aprovação' },
  { value: 'ajuste', label: 'Em ajuste' },
  { value: 'aprovado', label: 'Aprovado' },
]

/** Chips-filtro com contadores — dão visibilidade do que trava e filtram as
 *  duas visões (calendário e lista). Os contadores refletem TODOS os posts. */
function ApprovalFilterBar({
  posts,
  value,
  onChange,
}: {
  posts: EditorialPost[]
  value: PostApprovalState | 'todos'
  onChange: (v: PostApprovalState | 'todos') => void
}) {
  const counts = useMemo(() => {
    const c: Record<PostApprovalState | 'todos', number> = { todos: posts.length, aguardando: 0, ajuste: 0, aprovado: 0 }
    for (const p of posts) c[postApprovalState(p)]++
    return c
  }, [posts])
  return (
    <div className="mb-4 flex flex-wrap items-center gap-1.5">
      {APPROVAL_FILTERS.map((f) => {
        const active = value === f.value
        return (
          <button
            key={f.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(f.value)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-body-s transition-colors focus-visible:outline-none focus-visible:shadow-focus ${
              active
                ? 'border-strong bg-slate-800 text-strong'
                : 'border-line text-muted hover:border-strong hover:text-strong'
            }`}
          >
            {f.label}
            <span className="font-mono text-[11px] tabular-nums text-faint">{counts[f.value]}</span>
          </button>
        )
      })}
    </div>
  )
}

/* ---- Componente principal ---------------------------------------------- */

export function EditorialCalendar({ clientId, canManage }: { clientId: string; canManage: boolean }) {
  const { getPosts, addPost, updatePost, removePost } = useEditorial()
  const { editTask, removeTask } = useTasks()
  const toast = useToast()
  const posts = getPosts(clientId)

  /* Arrastar um card para outra data: muda a data de publicação do post e, se
     houver tarefa vinculada, atualiza o prazo dela junto. */
  const movePost = async (id: string, iso: string) => {
    const post = posts.find((p) => p.id === id)
    if (!post || post.date === iso) return
    await updatePost(clientId, id, { date: iso })
    if (post.taskId) await editTask(post.taskId, { due: iso })
  }

  const [tab, setTab] = useState<'calendario' | 'lista'>('calendario')
  const [view, setView] = useState<Date>(() => {
    const first = [...posts].sort((a, b) => a.date.localeCompare(b.date))[0]
    return first ? addMonths(parseISO(first.date), 0) : new Date()
  })
  const [openId, setOpenId] = useState<string | null>(null)
  /** Data da demanda em criação (null = modal fechado). */
  const [newDate, setNewDate] = useState<string | null>(null)
  /** Filtro por estado de aprovação (copy+arte). */
  const [approvalFilter, setApprovalFilter] = useState<PostApprovalState | 'todos'>('todos')
  const { items: catItems } = useCatalogs()
  const formatOpts = catItems('editorial_format').map((c) => ({ value: c.value, label: c.label }))

  const visiblePosts = useMemo(
    () => (approvalFilter === 'todos' ? posts : posts.filter((p) => postApprovalState(p) === approvalFilter)),
    [posts, approvalFilter],
  )

  const byDay = useMemo(() => {
    const map = new Map<string, EditorialPost[]>()
    for (const p of visiblePosts) {
      const list = map.get(p.date) ?? []
      list.push(p)
      map.set(p.date, list)
    }
    return map
  }, [visiblePosts])

  const openPost = openId ? posts.find((p) => p.id === openId) ?? null : null

  /** Menu de contexto (botão direito) sobre um card do calendário. */
  const [ctxMenu, setCtxMenu] = useState<{ post: EditorialPost; x: number; y: number } | null>(null)
  const openContext = (post: EditorialPost, e: React.MouseEvent) => {
    e.preventDefault()
    setCtxMenu({ post, x: e.clientX, y: e.clientY })
  }

  /** Duplica a demanda no mesmo dia — copia o conteúdo, zera aprovações/vínculos. */
  const duplicatePost = async (p: EditorialPost) => {
    const id = await addPost(clientId, {
      date: p.date,
      title: `${p.title || 'Sem título'} (cópia)`,
      format: p.format,
      channels: p.channels,
      stage: p.stage,
      approval: 'em-producao',
      description: p.description,
      copy: p.copy,
      caption: p.caption,
      cta: p.cta,
      pending: p.pending,
      ready: p.ready,
      cards: p.cards.map((c) => ({ ...c, id: crypto.randomUUID() })),
    })
    if (id) toast.success('Demanda duplicada', `${p.title || 'Sem título'} (cópia)`)
    else toast.error('Não foi possível duplicar')
  }

  /** Exclui a demanda e a tarefa vinculada (mesmo comportamento do drawer). */
  const deletePost = async (p: EditorialPost) => {
    if (p.taskId) await removeTask(p.taskId)
    await removePost(clientId, p.id)
    if (openId === p.id) setOpenId(null)
    toast.success('Demanda excluída', p.title || 'Sem título')
  }

  /** Abre o modal de criação (não cria nada ainda). */
  const openNew = (iso: string) => setNewDate(iso)

  /** Cria de fato a demanda — chamado pelo botão "Criar" do modal.
   *  O formato escolhido pré-preenche Tipo, Mídia social e "Falta o quê?". */
  const createPost = async (draft: { title: string; date: string; format: string }) => {
    const defaults = formatDefaults(draft.format)
    const id = await addPost(clientId, {
      date: draft.date,
      title: draft.title,
      format: draft.format,
      channels: defaults.channels,
      stage: defaults.stage,
      approval: 'em-producao',
      pending: defaults.pending,
      ready: [],
      cards: [],
    })
    setNewDate(null)
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
                  openNew(todayInView)
                }}
              >
                Nova postagem
              </Button>
            )}
          </div>
        </div>

        <ApprovalFilterBar posts={posts} value={approvalFilter} onChange={setApprovalFilter} />

        {tab === 'calendario' ? (
          <MonthGrid
            view={view}
            byDay={byDay}
            canManage={canManage}
            onOpen={setOpenId}
            onAdd={openNew}
            onMove={movePost}
            onContext={openContext}
          />
        ) : (
          <PostList posts={visiblePosts} onOpen={setOpenId} />
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

      <NewPostModal
        open={newDate !== null}
        initialDate={newDate ?? TODAY_ISO}
        formatOpts={formatOpts}
        onCancel={() => setNewDate(null)}
        onCreate={createPost}
      />

      <PostContextMenu
        menu={ctxMenu}
        canManage={canManage}
        onOpen={() => ctxMenu && setOpenId(ctxMenu.post.id)}
        onDuplicate={() => ctxMenu && duplicatePost(ctxMenu.post)}
        onDelete={() => ctxMenu && deletePost(ctxMenu.post)}
        onClose={() => setCtxMenu(null)}
      />
    </div>
  )
}
