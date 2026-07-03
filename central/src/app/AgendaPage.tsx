import { useMemo, useState, useEffect } from 'react'
import { Plus, CalendarDays, Clock, MapPin, Video, Users, ExternalLink, Pencil, Trash2, Loader2 } from 'lucide-react'
import {
  SectionHeader,
  CardIcon,
  Button,
  AgendaRow,
  Avatar,
  AvatarGroup,
  Badge,
  Tabs,
  TabList,
  Tab,
  Input,
  Textarea,
  DatePicker,
  Checkbox,
  Switch,
  Divider,
  Modal,
  EmptyState,
  useToast,
} from '@/components/ui'
import { useNavigate } from 'react-router-dom'
import { usePermissions } from '@/lib/permissions'
import { useAgenda, type AgendaEvent, type AgendaCategory, type AgendaInput } from './agenda'
import { useProfiles } from './profiles'
import { useMyFollowupEvents, isFollowupEventId, followupLeadId } from './CrmFollowups'

/* ----------------------------------------------------------------- helpers */
const weekdayFmt = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' })
const monthShortFmt = new Intl.DateTimeFormat('pt-BR', { month: 'short' })

function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function dateToIso(d: Date | null): string {
  if (!d) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function todayIso() {
  return dateToIso(new Date())
}
const dayLabel = (iso: string) => iso.split('-')[2]
const monthLabel = (iso: string) => monthShortFmt.format(isoToDate(iso)).replace('.', '').toUpperCase()
const weekdayLabel = (iso: string) => {
  const w = weekdayFmt.format(isoToDate(iso))
  return w.charAt(0).toUpperCase() + w.slice(1)
}


/** Dias da semana (getDay: 0=Dom..6=Sáb), na ordem Seg→Dom. */
const WEEKDAYS: { n: number; label: string }[] = [
  { n: 1, label: 'Seg' },
  { n: 2, label: 'Ter' },
  { n: 3, label: 'Qua' },
  { n: 4, label: 'Qui' },
  { n: 5, label: 'Sex' },
  { n: 6, label: 'Sáb' },
  { n: 0, label: 'Dom' },
]

/** Soma dias a um ISO yyyy-mm-dd (sem fuso). */
function addDaysIso(iso: string, days: number): string {
  const d = isoToDate(iso)
  return dateToIso(new Date(d.getFullYear(), d.getMonth(), d.getDate() + days))
}

/** Gera as datas (ISO) de start até until (inclusive) que caem nos dias da
 *  semana escolhidos. Limite de segurança de 400 dias. */
function weeklyDates(startIso: string, untilIso: string, weekdays: number[]): string[] {
  if (!startIso || !untilIso || weekdays.length === 0) return []
  if (untilIso < startIso) return []
  const out: string[] = []
  let cur = startIso
  for (let i = 0; i < 400 && cur <= untilIso; i++) {
    if (weekdays.includes(isoToDate(cur).getDay())) out.push(cur)
    cur = addDaysIso(cur, 1)
  }
  return out
}

interface DayGroup {
  date: string
  items: AgendaEvent[]
}
function groupByDay(items: AgendaEvent[]): DayGroup[] {
  const order: DayGroup[] = []
  const map = new Map<string, DayGroup>()
  for (const ev of items) {
    let g = map.get(ev.date)
    if (!g) {
      g = { date: ev.date, items: [] }
      map.set(ev.date, g)
      order.push(g)
    }
    g.items.push(ev)
  }
  return order
}

/* ---------------------------------------------------- popup de detalhes ---- */
function MetaRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 text-body-s text-fg">
      <span className="shrink-0 text-steel-300">{icon}</span>
      <span className="min-w-0">{children}</span>
    </div>
  )
}

function EventModal({
  event,
  canManage,
  onClose,
  onEdit,
  onDelete,
}: {
  event: AgendaEvent | null
  canManage: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { getMember } = useProfiles()
  if (!event) return null
  const dot =
    event.category === 'sand' ? 'bg-sand-300'
    : event.category === 'success' ? 'bg-ok'
    : event.category === 'danger' ? 'bg-err'
    : 'bg-steel-400'

  return (
    <Modal
      open={!!event}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2.5">
          <span className={`size-2 shrink-0 rounded-full ${dot}`} aria-hidden />
          {event.title}
        </span>
      }
      description={`${weekdayLabel(event.date)}, ${dayLabel(event.date)} ${monthLabel(event.date).toLowerCase()}`}
      footer={
        <>
          {canManage && (
            <>
              <Button variant="ghost" leftIcon={<Trash2 size={16} strokeWidth={1.5} />} onClick={onDelete}>Excluir</Button>
              <Button variant="secondary" leftIcon={<Pencil size={16} strokeWidth={1.5} />} onClick={onEdit}>Editar</Button>
            </>
          )}
          {event.meetingUrl && (
            <Button
              leftIcon={<Video size={16} strokeWidth={1.5} />}
              onClick={() => window.open(event.meetingUrl!, '_blank', 'noopener,noreferrer')}
            >
              Entrar na chamada
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2.5">
          {event.time && <MetaRow icon={<Clock size={16} strokeWidth={1.5} />}>{event.time}</MetaRow>}
          {event.location && <MetaRow icon={<MapPin size={16} strokeWidth={1.5} />}>{event.location}</MetaRow>}
          {event.meetingUrl && (
            <MetaRow icon={<Video size={16} strokeWidth={1.5} />}>
              <a href={event.meetingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-steel-300 transition-colors hover:text-steel-400 focus-visible:outline-none focus-visible:shadow-focus">
                <span className="truncate">{event.meetingUrl.replace(/^https?:\/\//, '')}</span>
                <ExternalLink size={12} strokeWidth={1.5} aria-hidden />
              </a>
            </MetaRow>
          )}
        </div>

        {event.description && (
          <>
            <Divider />
            <div>
              <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-faint">Descrição</div>
              <p className="whitespace-pre-wrap text-body-s text-fg">{event.description}</p>
            </div>
          </>
        )}

        {event.people.length > 0 && (
          <>
            <Divider />
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Users size={15} strokeWidth={1.5} className="text-steel-300" aria-hidden />
                <span className="text-body-s font-medium text-strong">
                  Participantes <span className="text-faint">· {event.people.length}</span>
                </span>
              </div>
              <ul className="flex flex-col gap-2">
                {event.people.map((id) => {
                  const m = getMember(id)
                  return (
                    <li key={id} className="flex items-center gap-2.5">
                      <Avatar size="sm" name={m?.name ?? '?'} src={m?.avatar ?? undefined} />
                      <span className="text-body-s text-strong">{m?.name ?? 'Desconhecido'}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

/* ------------------------------------------------ formulário criar/editar -- */
type Draft = {
  date: string
  time: string
  title: string
  category: AgendaCategory
  meta: string
  location: string
  meetingUrl: string
  description: string
  people: string[]
  /** Recorrência semanal (só na criação). */
  repeat: boolean
  weekdays: number[]
  repeatUntil: string
}
const EMPTY: Draft = { date: '', time: '', title: '', category: 'steel', meta: '', location: '', meetingUrl: '', description: '', people: [], repeat: false, weekdays: [], repeatUntil: '' }

/** Quebra "09:00 – 09:30" em [início, fim] no formato HH:MM (aceita - ou –). */
function parseRange(v: string): [string, string] {
  if (!v) return ['', '']
  const norm = (t: string) => (/^\d{1,2}:\d{2}$/.test(t.trim()) ? t.trim().padStart(5, '0') : '')
  const parts = v.split(/[–-]/)
  return [norm(parts[0] ?? ''), norm(parts[1] ?? '')]
}

/** Campo de horário com seletor de relógio (dois <input type="time">). */
function TimeRangeField({
  value,
  onChange,
  label,
  optional,
}: {
  value: string
  onChange: (v: string) => void
  label: string
  optional?: boolean
}) {
  const [start, end] = parseRange(value)
  const set = (s: string, e: string) => onChange(s && e ? `${s} – ${e}` : s || '')
  const inputCls =
    'h-10 w-full rounded-xs border border-strong bg-slate-900 px-2 text-body text-strong transition-[border-color,box-shadow] duration-fast ease-out hover:border-line focus-visible:outline-none focus-visible:shadow-focus'
  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-body-s font-medium text-strong">
        {label}
        {optional && <span className="font-mono text-mono-label uppercase text-faint">opcional</span>}
      </span>
      <div className="flex items-center gap-2">
        <input
          type="time"
          value={start}
          onChange={(e) => set(e.target.value, end)}
          className={inputCls}
          aria-label="Horário de início"
        />
        <span className="shrink-0 text-faint">–</span>
        <input
          type="time"
          value={end}
          onChange={(e) => set(start, e.target.value)}
          className={inputCls}
          aria-label="Horário de término"
        />
      </div>
    </div>
  )
}

function AgendaFormModal({
  open,
  editing,
  onClose,
  onSubmit,
}: {
  open: boolean
  editing: AgendaEvent | null
  onClose: () => void
  onSubmit: (draft: Draft) => void
}) {
  const { members } = useProfiles()
  const [draft, setDraft] = useState<Draft>(EMPTY)

  useEffect(() => {
    if (!open) return
    setDraft(
      editing
        ? {
            date: editing.date,
            time: editing.time ?? '',
            title: editing.title,
            category: editing.category,
            meta: editing.meta ?? '',
            location: editing.location ?? '',
            meetingUrl: editing.meetingUrl ?? '',
            description: editing.description ?? '',
            people: [...editing.people],
            repeat: false,
            weekdays: [],
            repeatUntil: '',
          }
        : EMPTY,
    )
  }, [open, editing])

  const toggleWeekday = (n: number) =>
    setDraft((d) => ({
      ...d,
      weekdays: d.weekdays.includes(n) ? d.weekdays.filter((x) => x !== n) : [...d.weekdays, n],
    }))

  const togglePerson = (id: string) =>
    setDraft((d) => ({ ...d, people: d.people.includes(id) ? d.people.filter((x) => x !== id) : [...d.people, id] }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={editing ? 'Editar compromisso' : 'Novo compromisso'}
      description="Reuniões, prazos e cerimônias do time."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSubmit(draft)}>{editing ? 'Salvar' : 'Criar'}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input label="Título" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} placeholder="Ex.: Stand-up do time" autoFocus />
        <div className="grid gap-4 sm:grid-cols-2">
          <DatePicker label={draft.repeat ? 'A partir de' : 'Data'} value={draft.date ? isoToDate(draft.date) : null} onChange={(dt) => setDraft((d) => ({ ...d, date: dateToIso(dt) }))} />
          <TimeRangeField label="Horário" optional value={draft.time} onChange={(time) => setDraft((d) => ({ ...d, time }))} />
        </div>

        {!editing && (
          <div className="flex flex-col gap-3 rounded-md border border-line bg-slate-900 p-3">
            <Switch
              label="Repetir semanalmente"
              description="Cria o compromisso nos dias da semana escolhidos, no mesmo horário."
              checked={draft.repeat}
              onChange={(e) => {
                const on = e.target.checked
                setDraft((d) => ({
                  ...d,
                  repeat: on,
                  weekdays: on && d.weekdays.length === 0 && d.date ? [isoToDate(d.date).getDay()] : d.weekdays,
                  repeatUntil: on && !d.repeatUntil && d.date ? addDaysIso(d.date, 7 * 12) : d.repeatUntil,
                }))
              }}
            />
            {draft.repeat && (
              <>
                <div className="flex flex-col gap-1.5">
                  <span className="text-body-s font-medium text-strong">Dias da semana</span>
                  <div className="flex flex-wrap gap-1.5">
                    {WEEKDAYS.map((w) => {
                      const on = draft.weekdays.includes(w.n)
                      return (
                        <button
                          key={w.n}
                          type="button"
                          aria-pressed={on}
                          onClick={() => toggleWeekday(w.n)}
                          className={`rounded-md border px-3 py-1.5 text-body-s transition focus-visible:outline-none focus-visible:shadow-focus ${
                            on ? 'border-steel-500 bg-steel-500/15 text-strong' : 'border-strong text-muted hover:border-line'
                          }`}
                        >
                          {w.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <DatePicker
                  label="Repetir até"
                  value={draft.repeatUntil ? isoToDate(draft.repeatUntil) : null}
                  onChange={(dt) => setDraft((d) => ({ ...d, repeatUntil: dateToIso(dt) }))}
                />
                {draft.date && draft.repeatUntil && draft.weekdays.length > 0 && (
                  <p className="text-body-s text-muted">
                    {weeklyDates(draft.date, draft.repeatUntil, draft.weekdays).length} ocorrência(s) serão criadas.
                  </p>
                )}
              </>
            )}
          </div>
        )}
        <Input label="Link da chamada" optional value={draft.meetingUrl} onChange={(e) => setDraft((d) => ({ ...d, meetingUrl: e.target.value }))} placeholder="https://meet.google.com/…" leadingIcon={<Video size={16} strokeWidth={1.5} />} />
        <Textarea label="Descrição / pauta" optional rows={3} value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
        <div>
          <div className="mb-2 text-body-s font-medium text-strong">Participantes</div>
          {members.length === 0 ? (
            <p className="rounded-md border border-line bg-slate-900 p-3 text-body-s text-faint">Nenhum membro cadastrado.</p>
          ) : (
            <div className="grid max-h-40 grid-cols-1 gap-1 overflow-y-auto rounded-md border border-line bg-slate-900 p-2 sm:grid-cols-2">
              {members.map((m) => (
                <label key={m.id} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-slate-800">
                  <Checkbox checked={draft.people.includes(m.id)} onChange={() => togglePerson(m.id)} />
                  <Avatar size="xs" name={m.name} src={m.avatar ?? undefined} />
                  <span className="min-w-0 flex-1 truncate text-body-s text-strong">{m.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

/* ============================================================== página ===== */
export function AgendaPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const { can } = usePermissions()
  const { events, loading, addEvent, addEvents, updateEvent, removeEvent } = useAgenda()
  const { getMember } = useProfiles()
  const canManage = can('manage_resources')

  // Follow-ups do CRM entram como eventos (virtuais) da agenda — ver useMyFollowupEvents.
  const followupEvents = useMyFollowupEvents()

  const [scope, setScope] = useState('todos')
  const [openEvent, setOpenEvent] = useState<AgendaEvent | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AgendaEvent | null>(null)

  const today = todayIso()
  const groups = useMemo(() => {
    const all = [...events, ...followupEvents]
    const filtered = scope === 'hoje' ? all.filter((e) => e.date === today) : all.filter((e) => e.date >= today)
    return groupByDay(filtered)
  }, [events, followupEvents, scope, today])

  // Clique num evento: follow-up abre a ficha do lead; compromisso abre o detalhe.
  const openAgendaItem = (ev: AgendaEvent) => {
    if (isFollowupEventId(ev.id)) navigate(`/app/crm?lead=${followupLeadId(ev.id)}`)
    else setOpenEvent(ev)
  }

  const submit = async (draft: Draft) => {
    if (!draft.title.trim()) { toast.error('Informe um título'); return }
    if (!draft.date) { toast.error('Informe a data'); return }
    const base = {
      time: draft.time.trim() || undefined,
      title: draft.title.trim(),
      meta: draft.meta.trim() || undefined,
      category: draft.category,
      location: draft.location.trim() || undefined,
      meetingUrl: draft.meetingUrl.trim() || undefined,
      description: draft.description.trim() || undefined,
      people: draft.people,
    }

    // Recorrência semanal (apenas na criação): gera uma ocorrência por data.
    if (draft.repeat && !editing) {
      if (draft.weekdays.length === 0) { toast.error('Selecione ao menos um dia da semana'); return }
      if (!draft.repeatUntil) { toast.error('Informe até quando repetir'); return }
      const dates = weeklyDates(draft.date, draft.repeatUntil, draft.weekdays)
      if (dates.length === 0) { toast.error('Nenhuma data no período', 'Revise os dias da semana e a data final.'); return }
      const inputs: AgendaInput[] = dates.map((date) => ({ date, ...base }))
      const { error, count } = await addEvents(inputs)
      if (error) toast.error('Não foi possível salvar', error)
      else toast.success('Reuniões semanais criadas', `${count} ocorrência(s) de "${base.title}"`)
      setFormOpen(false)
      setEditing(null)
      return
    }

    const payload: AgendaInput = { date: draft.date, ...base }
    const { error } = editing ? await updateEvent(editing.id, payload) : await addEvent(payload)
    if (error) toast.error('Não foi possível salvar', error)
    else toast.success(editing ? 'Compromisso atualizado' : 'Compromisso criado', draft.title)
    setFormOpen(false)
    setEditing(null)
  }

  return (
    <div className="mx-auto max-w-screen-2xl px-6 py-8">
      <SectionHeader
        eyebrow="Operação"
        title="Agenda do time"
        description="Compromissos, prazos e cerimônias da equipe."
        icon={<CardIcon tone="gold"><CalendarDays size={18} strokeWidth={1.5} aria-hidden /></CardIcon>}
        className="mb-6"
        actions={
          canManage ? (
            <Button leftIcon={<Plus size={18} strokeWidth={1.5} />} onClick={() => { setEditing(null); setFormOpen(true) }}>
              Novo compromisso
            </Button>
          ) : undefined
        }
      />

      <div className="mb-6">
        <Tabs value={scope} onValueChange={setScope} variant="segmented">
          <TabList aria-label="Período">
            <Tab value="todos">Próximos</Tab>
            <Tab value="hoje">Hoje</Tab>
          </TabList>
        </Tabs>
      </div>

      {loading ? (
        <div className="grid place-items-center py-24">
          <Loader2 size={26} strokeWidth={1.5} className="animate-spin text-steel-300" aria-label="Carregando" />
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={22} strokeWidth={1.5} />}
          title="Nada por aqui"
          description={canManage ? 'Crie o primeiro compromisso do time.' : 'Não há compromissos no período.'}
          action={canManage ? <Button onClick={() => { setEditing(null); setFormOpen(true) }}>Novo compromisso</Button> : undefined}
        />
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map((g) => {
            const isToday = g.date === today
            return (
              <section key={g.date}>
                <div className="mb-3 flex items-baseline gap-3">
                  <h2 className="font-display text-h3 font-semibold text-strong">
                    {weekdayLabel(g.date)}, {dayLabel(g.date)} {monthLabel(g.date).toLowerCase()}
                  </h2>
                  {isToday && <Badge tone="steel" dot>hoje</Badge>}
                  <span className="font-mono text-mono-data text-faint">
                    {g.items.length} {g.items.length === 1 ? 'evento' : 'eventos'}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {g.items.map((ev) => (
                    <AgendaRow
                      key={ev.id}
                      day={dayLabel(ev.date)}
                      month={monthLabel(ev.date)}
                      time={ev.time ?? ''}
                      title={ev.title}
                      meta={ev.meta ?? ''}
                      category={ev.category}
                      interactive
                      onClick={() => openAgendaItem(ev)}
                      trailing={
                        ev.people.length > 0 ? (
                          <AvatarGroup max={4}>
                            {ev.people.map((id) => <Avatar key={id} size="sm" name={getMember(id)?.name ?? '?'} src={getMember(id)?.avatar ?? undefined} />)}
                          </AvatarGroup>
                        ) : undefined
                      }
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}

      <EventModal
        event={openEvent}
        canManage={canManage}
        onClose={() => setOpenEvent(null)}
        onEdit={() => { if (openEvent) { setEditing(openEvent); setOpenEvent(null); setFormOpen(true) } }}
        onDelete={() => {
          if (!openEvent) return
          removeEvent(openEvent.id)
          toast.success('Compromisso removido', openEvent.title)
          setOpenEvent(null)
        }}
      />
      <AgendaFormModal open={formOpen} editing={editing} onClose={() => { setFormOpen(false); setEditing(null) }} onSubmit={submit} />
    </div>
  )
}
