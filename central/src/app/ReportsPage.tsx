import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  BarChart3, CalendarCheck, ListChecks, Flag, Tags, Layers, BadgeCheck, Users, Contact, Headset,
} from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardIcon,
  StatCard,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  TableEmpty,
  Avatar,
  Badge,
} from '@/components/ui'
import { cn } from '@/lib/cn'
import { useSession, ROLE_LABEL } from '@/lib/session'
import { useTasks } from './tasks'
import { useEditorial } from './editorial'
import { useProfiles } from './profiles'
import { useCrm, fmtBRL, isWon, isLost } from './crm'
import { useCs, isTicketResolved } from './cs'
import { useCatalogs, isExtraTone, EXTRA_TONE_HEX } from './catalogs'
import { ANJU_ID } from '@/lib/tenant'
import {
  TASK_STATUS_ORDER,
  TASK_STATUS_META,
  TASK_PRIORITY_ORDER,
  TASK_PRIORITY_META,
  STAGE_META,
  POST_APPROVAL_META,
  postApprovalState,
  taskExecutors,
  type TaskStatus,
  type EditorialStage,
  type PostApprovalState,
} from './data'

/* ----------------------------------------------------------------------------
   Relatórios — visão executiva (somente gestores)
   ----------------------------------------------------------------------------
   Painel derivado dos dados que já vivem nos providers (tarefas, editorial,
   equipe). Nenhuma tabela nova: tudo é agregação em memória. Um seletor de
   janela ajusta as métricas sensíveis a período (concluídas e throughput).
---------------------------------------------------------------------------- */

type Tone = 'neutral' | 'steel' | 'warning' | 'success' | 'danger' | 'sand'

/** Mapa de tom → cor de preenchimento das barras. */
const TONE_BG: Record<Tone, string> = {
  neutral: 'bg-slate-600',
  steel: 'bg-steel-500',
  warning: 'bg-warn',
  success: 'bg-ok',
  danger: 'bg-err',
  sand: 'bg-sand-300',
}

/** Janelas de período para as métricas sensíveis a tempo. A "Quinzena" é o
 *  padrão — a página é a pauta da reunião quinzenal com a Ana Júlia. */
const PERIODS = [
  { key: 7, label: '7 dias' },
  { key: 15, label: 'Quinzena' },
  { key: 30, label: '30 dias' },
  { key: 90, label: '90 dias' },
  { key: 0, label: 'Tudo' },
] as const

/* ----------------------------------------------------------------- helpers */

const DAY_MS = 24 * 60 * 60 * 1000

function daysAgo(iso: string | undefined): number {
  if (!iso) return Infinity
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return Infinity
  return Math.floor((Date.now() - then) / DAY_MS)
}

/** Barra horizontal de distribuição (rótulo · barra · valor). `color` (hex)
 *  sobrepõe o tom do DS — usado por cores de catálogo fora da paleta. */
function DistBar({ label, value, total, tone, color }: { label: string; value: number; total: number; tone: Tone; color?: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-36 shrink-0 truncate text-body-s text-fg">{label}</span>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-ink-deep/60">
        <span
          className={cn('absolute inset-y-0 left-0 rounded-full transition-[width]', !color && TONE_BG[tone])}
          style={{ width: `${pct}%`, ...(color ? { backgroundColor: color } : {}) }}
          aria-hidden
        />
      </div>
      <span className="w-7 shrink-0 text-right font-mono text-mono-data tabular-nums text-muted">{value}</span>
    </div>
  )
}

/** Rótulo de seção do relatório — separa Comercial / CS / Operação. */
function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mt-2 flex items-center gap-2 font-mono text-mono-label uppercase text-steel-400">
      {icon}
      {children}
    </div>
  )
}

/** Card com um título e uma lista de barras de distribuição. */
function DistCard({
  title,
  icon,
  rows,
  empty,
}: {
  title: string
  icon: React.ReactNode
  rows: { label: string; value: number; tone: Tone; color?: string }[]
  empty: string
}) {
  const total = rows.reduce((s, r) => s + r.value, 0)
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <CardIcon tone="gold">{icon}</CardIcon>
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      {total === 0 ? (
        <p className="py-3 text-body-s text-faint">{empty}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((r) => (
            <DistBar key={r.label} label={r.label} value={r.value} total={total} tone={r.tone} color={r.color} />
          ))}
        </div>
      )}
    </Card>
  )
}

/* =========================================================================== */

export function ReportsPage() {
  const { isManager } = useSession()
  const { tasks } = useTasks()
  const { getPosts } = useEditorial()
  const { members } = useProfiles()
  const { items: catalogItems, tone: catTone } = useCatalogs()
  const { leads } = useCrm()
  const { cases, tickets } = useCs()
  const categories = catalogItems('task_category')
  const origins = catalogItems('crm_origin')
  const [period, setPeriod] = useState<number>(15)

  const posts = getPosts(ANJU_ID)

  // Comercial + CS/Suporte — os números da pauta quinzenal.
  const business = useMemo(() => {
    const within = (iso: string | null | undefined) => period === 0 || daysAgo(iso ?? undefined) <= period

    // CRM: entrada e desfechos do período (ganho/perdido pelo closedAt).
    const newLeads = leads.filter((l) => within(l.createdAt))
    const won = leads.filter((l) => isWon(l.status) && within(l.closedAt ?? undefined))
    const lost = leads.filter((l) => isLost(l.status) && within(l.closedAt ?? undefined))
    const wonValue = won.reduce((s, l) => s + (l.potentialValue || 0), 0)
    const conversion = won.length + lost.length > 0 ? Math.round((won.length / (won.length + lost.length)) * 100) : 0

    // Origem dos leads novos do período — onde investir tráfego/conteúdo.
    const byOrigin = origins
      .map((o) => {
        const t = catTone('crm_origin', o.value)
        const extra = isExtraTone(t)
        return {
          label: o.label,
          value: newLeads.filter((l) => l.origin === o.value).length,
          tone: (extra ? 'neutral' : t) as Tone,
          color: extra ? EXTRA_TONE_HEX[t].bg : undefined,
        }
      })
      .filter((r) => r.value > 0)

    // CS: novas alunas no pós-venda; Suporte: volume e resolução.
    const newCases = cases.filter((c) => within(c.createdAt))
    const periodTickets = tickets.filter((t) => within(t.openedAt))
    const resolvedTickets = periodTickets.filter((t) => isTicketResolved(t.status))
    let resolvedMs = 0, resolvedCount = 0
    for (const t of resolvedTickets) {
      if (!t.resolvedAt) continue
      const ms = new Date(t.resolvedAt).getTime() - new Date(t.openedAt).getTime()
      if (ms > 0) { resolvedMs += ms; resolvedCount++ }
    }
    const avgH = resolvedCount > 0 ? resolvedMs / resolvedCount / 3_600_000 : null
    const avgResolution = avgH === null ? '—' : avgH < 1 ? `${Math.max(Math.round(avgH * 60), 1)}min` : avgH < 48 ? `${Math.round(avgH)}h` : `${Math.round(avgH / 24)}d`
    const openTickets = tickets.filter((t) => !isTicketResolved(t.status)).length

    return {
      newLeads: newLeads.length,
      won: won.length,
      wonValue,
      conversion,
      byOrigin,
      newCases: newCases.length,
      ticketCount: periodTickets.length,
      resolvedCount: resolvedTickets.length,
      avgResolution,
      openTickets,
    }
  }, [leads, cases, tickets, origins, period, catTone])

  const metrics = useMemo(() => {
    const within = (iso: string | undefined) => period === 0 || daysAgo(iso) <= period

    const open = tasks.filter((t) => t.status !== 'concluida')
    const completed = tasks.filter((t) => t.status === 'concluida')
    const completedInPeriod = completed.filter((t) => within(t.completedAt))
    const conclusionRate = tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0

    // Tarefas por status.
    const byStatus = TASK_STATUS_ORDER.map((s) => ({
      label: TASK_STATUS_META[s].label,
      value: tasks.filter((t) => t.status === s).length,
      tone: TASK_STATUS_META[s].tone as Tone,
      key: s as TaskStatus,
    }))

    // Tarefas por categoria (catálogo task_category). Cores extras (fora do DS)
    // entram como cor explícita na barra.
    const byTag = categories
      .map((c) => {
        const t = catTone('task_category', c.value)
        const extra = isExtraTone(t)
        return {
          label: c.label,
          value: tasks.filter((tk) => tk.tag === c.value).length,
          tone: (extra ? 'neutral' : t) as Tone,
          color: extra ? EXTRA_TONE_HEX[t].bg : undefined,
        }
      })
      .filter((r) => r.value > 0)

    // Tarefas abertas por prioridade.
    const byPriority = TASK_PRIORITY_ORDER.map((p) => ({
      label: TASK_PRIORITY_META[p].label,
      value: open.filter((t) => t.priority === p).length,
      tone: TASK_PRIORITY_META[p].tone as Tone,
    })).filter((r) => r.value > 0)

    // Editorial por etapa e por aprovação.
    const stages = Object.keys(STAGE_META) as EditorialStage[]
    const byStage = stages.map((s) => ({
      label: STAGE_META[s].label,
      value: posts.filter((p) => p.stage === s).length,
      tone: STAGE_META[s].tone as Tone,
    }))
    const approvals = Object.keys(POST_APPROVAL_META) as PostApprovalState[]
    const byApproval = approvals.map((a) => ({
      label: POST_APPROVAL_META[a].label,
      value: posts.filter((p) => postApprovalState(p) === a).length,
      tone: POST_APPROVAL_META[a].tone as Tone,
    }))
    // "Aguardando Anju" = a bola está com ela (etapa do fluxo), não o status de aprovação.
    const awaitingAnju = posts.filter((p) => p.stage === 'para-anju').length

    // Carga por membro (tarefas atribuídas). Em revisão conta para o executor.
    const workload = members
      .map((m) => {
        const mine = tasks.filter((t) => taskExecutors(t).includes(m.id))
        return {
          member: m,
          open: mine.filter((t) => t.status !== 'concluida').length,
          review: mine.filter((t) => t.status === 'em-revisao').length,
          done: mine.filter((t) => t.status === 'concluida').length,
          total: mine.length,
        }
      })
      .filter((w) => w.total > 0)
      .sort((a, b) => b.open - a.open)

    // Throughput: tarefas concluídas por semana (últimas 8 semanas).
    const WEEKS = 8
    const buckets = Array.from({ length: WEEKS }, () => 0)
    for (const t of completed) {
      const d = daysAgo(t.completedAt)
      if (!Number.isFinite(d)) continue
      const wk = Math.floor(d / 7)
      if (wk >= 0 && wk < WEEKS) buckets[WEEKS - 1 - wk] += 1 // mais antiga à esquerda
    }
    const throughputMax = Math.max(1, ...buckets)

    return {
      open,
      completedInPeriod,
      conclusionRate,
      awaitingAnju,
      byStatus,
      byTag,
      byPriority,
      byStage,
      byApproval,
      workload,
      buckets,
      throughputMax,
    }
  }, [tasks, posts, members, period, categories, catTone])

  // Restrito a gestores — colaboradores voltam para a visão geral.
  if (!isManager) return <Navigate to="/app" replace />

  const periodLabel = PERIODS.find((p) => p.key === period)?.label ?? '30 dias'

  return (
    <div className="mx-auto flex max-w-screen-2xl flex-col gap-4 px-6 py-8">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-3">
          <CardIcon tone="gold" className="mt-0.5"><BarChart3 size={18} strokeWidth={1.5} aria-hidden /></CardIcon>
          <div>
            <div className="flex items-center gap-2 font-mono text-mono-label uppercase text-steel-400">
              <BarChart3 size={14} strokeWidth={1.5} aria-hidden />
              Operação
            </div>
            <h1 className="mt-1.5 font-display text-display-l font-semibold leading-tight text-strong">Resultados do Time</h1>
          </div>
        </div>

        {/* Seletor de período (segmentado) */}
        <div className="flex items-center gap-1 rounded-lg border border-line bg-slate-900 p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={cn(
                'rounded-md px-3 py-1.5 font-mono text-mono-data uppercase transition-colors focus-visible:outline-none focus-visible:shadow-focus',
                period === p.key ? 'bg-steel-500 text-accent-fg' : 'text-muted hover:text-strong',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Comercial — vendas e funil do período. */}
      <SectionLabel icon={<Contact size={14} strokeWidth={1.5} aria-hidden />}>Comercial · {periodLabel}</SectionLabel>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Leads novos" value={String(business.newLeads)} />
        <StatCard label="Vendas fechadas" value={String(business.won)} active={business.won > 0} />
        <StatCard label="Valor ganho" value={fmtBRL(business.wonValue)} />
        <StatCard label="Conversão (ganho × perdido)" value={`${business.conversion}%`} />
      </div>
      {business.byOrigin.length > 0 && (
        <DistCard
          title={`Origem dos leads novos · ${periodLabel}`}
          icon={<Contact size={18} strokeWidth={1.5} aria-hidden />}
          rows={business.byOrigin}
          empty="Nenhum lead novo no período."
        />
      )}

      {/* CS & Suporte — pós-venda e atendimentos. */}
      <SectionLabel icon={<Headset size={14} strokeWidth={1.5} aria-hidden />}>CS & Suporte · {periodLabel}</SectionLabel>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Alunas novas no CS" value={String(business.newCases)} />
        <StatCard label="Atendimentos" value={String(business.ticketCount)} />
        <StatCard label="Resolvidos" value={String(business.resolvedCount)} />
        <StatCard label="Tempo médio de resolução" value={business.avgResolution} />
      </div>

      {/* Métricas-chave da operação */}
      <SectionLabel icon={<ListChecks size={14} strokeWidth={1.5} aria-hidden />}>Operação · tarefas e editorial</SectionLabel>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tarefas abertas" value={String(metrics.open.length)} />
        <StatCard label={`Concluídas · ${periodLabel}`} value={String(metrics.completedInPeriod.length)} />
        <StatCard label="Taxa de conclusão" value={`${metrics.conclusionRate}%`} active />
        <StatCard label="Aguardando Anju" value={String(metrics.awaitingAnju)} />
      </div>

      {/* Throughput semanal */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <CardIcon tone="gold"><CalendarCheck size={18} strokeWidth={1.5} aria-hidden /></CardIcon>
            <CardTitle>Tarefas concluídas por semana</CardTitle>
          </div>
          <span className="font-mono text-mono-label uppercase text-faint">últimas 8 semanas</span>
        </CardHeader>
        <div className="flex items-end gap-2" style={{ height: 160 }}>
          {metrics.buckets.map((v, i) => {
            const h = Math.round((v / metrics.throughputMax) * 100)
            const weeksAgo = metrics.buckets.length - 1 - i
            return (
              <div key={i} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
                <span className="font-mono text-[11px] tabular-nums text-muted">{v || ''}</span>
                <div
                  className="w-full rounded-t-sm bg-steel-500 transition-[height]"
                  style={{ height: `${Math.max(v > 0 ? 6 : 0, h)}%` }}
                  aria-hidden
                />
                <span className="font-mono text-[10px] uppercase text-faint">
                  {weeksAgo === 0 ? 'agora' : `-${weeksAgo}s`}
                </span>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Distribuições de tarefas */}
      <div className="grid gap-4 lg:grid-cols-3">
        <DistCard
          title="Tarefas por status"
          icon={<ListChecks size={18} strokeWidth={1.5} aria-hidden />}
          rows={metrics.byStatus}
          empty="Nenhuma tarefa ainda."
        />
        <DistCard
          title="Abertas por prioridade"
          icon={<Flag size={18} strokeWidth={1.5} aria-hidden />}
          rows={metrics.byPriority}
          empty="Nenhuma tarefa aberta."
        />
        <DistCard
          title="Tarefas por categoria"
          icon={<Tags size={18} strokeWidth={1.5} aria-hidden />}
          rows={metrics.byTag}
          empty="Sem categorias atribuídas."
        />
      </div>

      {/* Editorial */}
      <div className="grid gap-4 lg:grid-cols-2">
        <DistCard
          title="Editorial por etapa"
          icon={<Layers size={18} strokeWidth={1.5} aria-hidden />}
          rows={metrics.byStage}
          empty="Nenhum post no calendário."
        />
        <DistCard
          title="Editorial por aprovação"
          icon={<BadgeCheck size={18} strokeWidth={1.5} aria-hidden />}
          rows={metrics.byApproval}
          empty="Nenhum post no calendário."
        />
      </div>

      {/* Carga do time */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <CardIcon tone="gold"><Users size={18} strokeWidth={1.5} aria-hidden /></CardIcon>
            <CardTitle>Carga do time</CardTitle>
          </div>
          <span className="font-mono text-mono-label uppercase text-faint">tarefas por pessoa</span>
        </CardHeader>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Pessoa</TableHeaderCell>
              <TableHeaderCell align="right">Abertas</TableHeaderCell>
              <TableHeaderCell align="right">Em revisão</TableHeaderCell>
              <TableHeaderCell align="right">Concluídas</TableHeaderCell>
              <TableHeaderCell align="right">Total</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {metrics.workload.length === 0 ? (
              <TableEmpty colSpan={5}>Nenhuma tarefa atribuída ainda.</TableEmpty>
            ) : (
              metrics.workload.map((w) => (
                <TableRow key={w.member.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar size="sm" name={w.member.name} src={w.member.avatar ?? undefined} />
                      <div className="min-w-0">
                        <div className="truncate text-body-s font-medium text-strong">{w.member.name}</div>
                        <div className="truncate font-mono text-[11px] text-faint">{ROLE_LABEL[w.member.role]}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell align="right">
                    {w.open > 0 ? (
                      <span className="font-mono tabular-nums text-strong">{w.open}</span>
                    ) : (
                      <span className="text-faint">—</span>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {w.review > 0 ? (
                      <Badge size="sm" tone="warning">{w.review}</Badge>
                    ) : (
                      <span className="text-faint">—</span>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <span className="font-mono tabular-nums text-muted">{w.done}</span>
                  </TableCell>
                  <TableCell align="right">
                    <span className="font-mono tabular-nums text-strong">{w.total}</span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
