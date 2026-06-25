import { useNavigate } from 'react-router-dom'
import {
  Plus,
  ArrowRight,
  CalendarDays,
  CalendarRange,
  FolderOpen,
  KeyRound,
  ListTodo,
} from 'lucide-react'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  StatCard,
  Badge,
  Avatar,
  AvatarGroup,
  AgendaRow,
  ProgressBar,
  Checkbox,
} from '@/components/ui'
import { useSession } from '@/lib/session'
import { useTasks } from './tasks'
import { useProfiles } from './profiles'
import { useAgenda, type AgendaEvent } from './agenda'
import {
  TASK_TAG_TONE,
  type UserStatus,
} from './data'

/* -------------------------------------------------- ecossistema (atalhos) */

const ECOSYSTEM: { to: string; label: string; hint: string; icon: React.ReactNode }[] = [
  { to: '/app/editorial', label: 'Editorial', hint: 'Calendário de criativos', icon: <CalendarRange size={18} strokeWidth={1.5} /> },
  { to: '/app/conteudo', label: 'Conteúdo', hint: 'Bancos e biblioteca', icon: <FolderOpen size={18} strokeWidth={1.5} /> },
  { to: '/app/acessos', label: 'Acessos', hint: 'Credenciais das plataformas', icon: <KeyRound size={18} strokeWidth={1.5} /> },
]

/** Atalhos para as áreas do ecossistema da Anju. */
function EcossistemaCard() {
  const navigate = useNavigate()
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ecossistema Anju</CardTitle>
      </CardHeader>
      <ul className="flex flex-col gap-1">
        {ECOSYSTEM.map((it) => (
          <li key={it.to}>
            <button
              onClick={() => navigate(it.to)}
              className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:shadow-focus"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-md border border-line bg-slate-900 text-steel-300">
                {it.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-body-s font-medium text-strong">{it.label}</div>
                <div className="truncate font-mono text-[11px] text-faint">{it.hint}</div>
              </div>
              <ArrowRight size={14} strokeWidth={1.5} className="shrink-0 text-faint" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  )
}

/* -------------------------------------------------------------- compartilhado */

const AV_STATUS: Record<UserStatus, 'online' | 'away' | 'busy'> = {
  ativo: 'online',
  convidado: 'away',
  suspenso: 'busy',
}
const PRESENCE_LABEL: Record<UserStatus, string> = {
  ativo: 'online',
  convidado: 'convidado',
  suspenso: 'ausente',
}

const dateFmt = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

/* Helpers de data para a agenda (que agora vem do banco com `date` ISO). */
const _monthFmt = new Intl.DateTimeFormat('pt-BR', { month: 'short' })
function isoToDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
const dayOf = (iso: string) => iso.split('-')[2]
const monthOf = (iso: string) => _monthFmt.format(isoToDate(iso)).replace('.', '').toUpperCase()
function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Linha de evento da agenda (resolve participantes para nomes). */
function EventRow({ event, onClick }: { event: AgendaEvent; onClick: () => void }) {
  const { getMember } = useProfiles()
  return (
    <AgendaRow
      day={dayOf(event.date)}
      month={monthOf(event.date)}
      time={event.time ?? ''}
      title={event.title}
      meta={event.meta ?? ''}
      category={event.category}
      interactive
      onClick={onClick}
      trailing={
        event.people.length > 0 ? (
          <AvatarGroup max={3}>
            {event.people.map((id) => (
              <Avatar key={id} size="sm" name={getMember(id)?.name ?? '?'} />
            ))}
          </AvatarGroup>
        ) : undefined
      }
    />
  )
}

function greetingFor() {
  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  return { greeting, dateLabel: dateFmt.format(now) }
}

/* =========================================================================== */
/* ROTEADOR DE PERFIL                                                          */
/* =========================================================================== */

export function DashboardPage() {
  const { role } = useSession()
  return role === 'admin' ? <AdminDashboard /> : <CollaboratorDashboard />
}

/* =========================================================================== */
/* ADMIN — gestão completa                                                     */
/* =========================================================================== */

function WelcomeBanner({
  name,
  onPrimary,
  onAgenda,
  agendaCount,
}: {
  name: string
  onPrimary: () => void
  onAgenda: () => void
  agendaCount: number
}) {
  const { greeting, dateLabel } = greetingFor()
  const { members } = useProfiles()
  const active = members.filter((u) => u.status === 'ativo')

  return (
    <section className="relative overflow-hidden rounded-2xl border border-line bg-slate-900 p-6 sm:p-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-glow-steel" aria-hidden />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="font-mono text-mono-label uppercase capitalize text-steel-400">{dateLabel}</div>
          <h1 className="mt-2 font-display text-display-l font-semibold leading-tight text-strong">
            {greeting}, {name}
          </h1>
          <p className="mt-2 max-w-xl text-body-l text-muted">
            Você tem {agendaCount} {agendaCount === 1 ? 'compromisso' : 'compromissos'} hoje. Bom trabalho.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button leftIcon={<Plus size={18} strokeWidth={1.5} />} onClick={onPrimary}>
              Novo usuário
            </Button>
            <Button variant="secondary" leftIcon={<CalendarDays size={18} strokeWidth={1.5} />} onClick={onAgenda}>
              Ver agenda
            </Button>
          </div>
        </div>

        {active.length > 0 && (
          <div className="flex shrink-0 items-center gap-4 rounded-xl border border-line bg-ink-deep/40 px-5 py-4">
            <AvatarGroup max={4}>
              {active.map((u) => (
                <Avatar key={u.id} size="md" name={u.name} status="online" />
              ))}
            </AvatarGroup>
            <div className="leading-tight">
              <div className="font-display text-h2 font-semibold tabular-nums text-strong">{active.length}</div>
              <div className="font-mono text-mono-label uppercase text-faint">no time</div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function AdminDashboard() {
  const navigate = useNavigate()
  const { user } = useSession()
  const { members: team } = useProfiles()
  const { tasks } = useTasks()
  const firstName = user.name.split(' ')[0]
  const tarefasAbertas = tasks.filter((t) => t.status !== 'concluida').length
  const ativos = team.filter((u) => u.status === 'ativo').length
  const { events } = useAgenda()
  const todayAgenda = events.filter((e) => e.date === todayIso())

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8">
      <WelcomeBanner
        name={firstName}
        onPrimary={() => navigate('/app/usuarios')}
        onAgenda={() => navigate('/app/agenda')}
        agendaCount={todayAgenda.length}
      />

      {/* Métricas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <button onClick={() => navigate('/app/tarefas')} className="text-left focus-visible:outline-none">
          <StatCard label="Tarefas abertas" value={String(tarefasAbertas)} className="h-full transition-colors hover:border-strong" />
        </button>
        <button onClick={() => navigate('/app/usuarios')} className="text-left focus-visible:outline-none">
          <StatCard label="Time" value={String(ativos)} delta={{ value: `de ${team.length}`, direction: 'neutral' }} className="h-full transition-colors hover:border-strong" />
        </button>
        <button onClick={() => navigate('/app/agenda')} className="text-left focus-visible:outline-none">
          <StatCard label="Compromissos hoje" value={String(todayAgenda.length)} active className="h-full transition-colors hover:border-strong" />
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Coluna principal */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* Agenda do time */}
          <Card>
            <CardHeader>
              <CardTitle>Agenda do time</CardTitle>
              <Button
                size="sm"
                variant="ghost"
                rightIcon={<ArrowRight size={16} strokeWidth={1.5} />}
                onClick={() => navigate('/app/agenda')}
              >
                Calendário
              </Button>
            </CardHeader>
            <div className="flex flex-col gap-2">
              {todayAgenda.length === 0 && (
                <p className="py-4 text-body-s text-faint">Nenhum compromisso hoje.</p>
              )}
              {todayAgenda.map((ev) => (
                <EventRow key={ev.id} event={ev} onClick={() => navigate('/app/agenda')} />
              ))}
            </div>
          </Card>
        </div>

        {/* Coluna lateral */}
        <div className="flex flex-col gap-4">
          {/* Integrantes do time */}
          <Card>
            <CardHeader>
              <CardTitle>Time</CardTitle>
              <button
                onClick={() => navigate('/app/usuarios')}
                className="font-mono text-mono-data text-steel-300 transition-colors hover:text-steel-400 focus-visible:outline-none focus-visible:shadow-focus"
              >
                ver todos
              </button>
            </CardHeader>
            <ul className="flex flex-col gap-1">
              {team.length === 0 && (
                <li className="px-2 py-3 text-body-s text-faint">Nenhum usuário cadastrado ainda.</li>
              )}
              {team.slice(0, 6).map((u) => (
                <li key={u.id}>
                  <button
                    onClick={() => navigate('/app/usuarios')}
                    className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:shadow-focus"
                  >
                    <Avatar size="sm" name={u.name} status={AV_STATUS[u.status]} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-body-s font-medium text-strong">{u.name}</div>
                      <div className="truncate font-mono text-[11px] text-faint">
                        {u.role === 'admin' ? 'Admin' : 'Colaborador'}{u.team ? ` · ${u.team}` : ''}
                      </div>
                    </div>
                    <span className="shrink-0 font-mono text-[11px] uppercase text-muted">
                      {PRESENCE_LABEL[u.status]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          {/* Ecossistema Anju — atalhos */}
          <EcossistemaCard />
        </div>
      </div>
    </div>
  )
}

/* =========================================================================== */
/* COLABORADOR — visão do dia a dia                                            */
/* =========================================================================== */

function CollaboratorDashboard() {
  const navigate = useNavigate()
  const { user } = useSession()
  const { tasks: allTasks, moveTask } = useTasks()
  const firstName = user.name.split(' ')[0]
  const { greeting, dateLabel } = greetingFor()

  // Tarefas atribuídas ao colaborador logado — pendentes primeiro.
  const tasks = allTasks
    .filter((t) => t.assignees.includes(user.id))
    .sort((a, b) => Number(a.status === 'concluida') - Number(b.status === 'concluida'))
  const doneCount = tasks.filter((t) => t.status === 'concluida').length
  const pending = tasks.length - doneCount
  const toggle = (id: string, status: string) =>
    moveTask(id, status === 'concluida' ? 'a-fazer' : 'concluida')

  const { events } = useAgenda()
  const todayAgenda = events.filter((e) => e.date === todayIso() && e.people.includes(user.id))

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8">
      {/* Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-line bg-slate-900 p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-glow-steel" aria-hidden />
        <div className="relative">
          <div className="font-mono text-mono-label uppercase capitalize text-steel-400">{dateLabel}</div>
          <h1 className="mt-2 font-display text-display-l font-semibold leading-tight text-strong">
            {greeting}, {firstName}
          </h1>
          <p className="mt-2 max-w-xl text-body-l text-muted">
            Você tem {pending} {pending === 1 ? 'tarefa' : 'tarefas'} e {todayAgenda.length}{' '}
            {todayAgenda.length === 1 ? 'reunião' : 'reuniões'} hoje. Bom trabalho.
          </p>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Coluna principal */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* Minhas tarefas */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <ListTodo size={18} strokeWidth={1.5} className="text-steel-300" aria-hidden />
                <CardTitle>Minhas tarefas de hoje</CardTitle>
              </div>
              <span className="font-mono text-mono-data text-muted tabular-nums">
                {doneCount}/{tasks.length}
              </span>
            </CardHeader>
            <ProgressBar
              value={tasks.length ? (doneCount / tasks.length) * 100 : 0}
              tone="success"
              className="mb-4"
            />
            {tasks.length === 0 ? (
              <p className="py-4 text-body-s text-faint">Nenhuma tarefa atribuída a você.</p>
            ) : (
              <ul className="flex flex-col">
                {tasks.map((t, i) => {
                  const done = t.status === 'concluida'
                  return (
                    <li
                      key={t.id}
                      className={i < tasks.length - 1 ? 'border-b border-subtle py-3 first:pt-0' : 'py-3 first:pt-0'}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={done}
                          onChange={() => toggle(t.id, t.status)}
                          label={
                            <span className={done ? 'text-faint line-through' : 'text-strong'}>{t.title}</span>
                          }
                        />
                        <div className="ml-auto flex shrink-0 items-center justify-end gap-1.5">
                          {t.tag && (
                            <Badge size="sm" tone={TASK_TAG_TONE[t.tag]}>
                              {t.tag}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
            <button
              onClick={() => navigate('/app/tarefas')}
              className="mt-4 inline-flex items-center gap-1.5 self-start font-mono text-mono-data text-steel-300 transition-colors hover:text-steel-400 focus-visible:outline-none focus-visible:shadow-focus"
            >
              Ver todas as tarefas
              <ArrowRight size={14} strokeWidth={1.5} aria-hidden />
            </button>
          </Card>

          {/* Reuniões de hoje */}
          <Card>
            <CardHeader>
              <CardTitle>Reuniões de hoje</CardTitle>
              <Button
                size="sm"
                variant="ghost"
                rightIcon={<ArrowRight size={16} strokeWidth={1.5} />}
                onClick={() => navigate('/app/agenda')}
              >
                Minha agenda
              </Button>
            </CardHeader>
            <div className="flex flex-col gap-2">
              {todayAgenda.length === 0 && (
                <p className="py-4 text-body-s text-faint">Nenhuma reunião sua hoje.</p>
              )}
              {todayAgenda.map((ev) => (
                <EventRow key={ev.id} event={ev} onClick={() => navigate('/app/agenda')} />
              ))}
            </div>
          </Card>
        </div>

        {/* Coluna lateral */}
        <div className="flex flex-col gap-4">
          {/* Ecossistema Anju — atalhos */}
          <EcossistemaCard />
        </div>
      </div>
    </div>
  )
}
