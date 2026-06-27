import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { BarChart3 } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
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
import { ANJU_ID } from '@/lib/tenant'
import {
  TASK_STATUS_ORDER,
  TASK_STATUS_META,
  TASK_TAG_TONE,
  TASK_PRIORITY_ORDER,
  TASK_PRIORITY_META,
  STAGE_META,
  APPROVAL_META,
  taskExecutors,
  type TaskTag,
  type TaskStatus,
  type EditorialStage,
  type EditorialApproval,
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

/** Janelas de período para as métricas sensíveis a tempo. */
const PERIODS = [
  { key: 7, label: '7 dias' },
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

/** Barra horizontal de distribuição (rótulo · barra · valor). */
function DistBar({ label, value, total, tone }: { label: string; value: number; total: number; tone: Tone }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-36 shrink-0 truncate text-body-s text-fg">{label}</span>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-ink-deep/60">
        <span
          className={cn('absolute inset-y-0 left-0 rounded-full transition-[width]', TONE_BG[tone])}
          style={{ width: `${pct}%` }}
          aria-hidden
        />
      </div>
      <span className="w-7 shrink-0 text-right font-mono text-mono-data tabular-nums text-muted">{value}</span>
    </div>
  )
}

/** Card com um título e uma lista de barras de distribuição. */
function DistCard({
  title,
  rows,
  empty,
}: {
  title: string
  rows: { label: string; value: number; tone: Tone }[]
  empty: string
}) {
  const total = rows.reduce((s, r) => s + r.value, 0)
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      {total === 0 ? (
        <p className="py-3 text-body-s text-faint">{empty}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((r) => (
            <DistBar key={r.label} label={r.label} value={r.value} total={total} tone={r.tone} />
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
  const [period, setPeriod] = useState<number>(30)

  const posts = getPosts(ANJU_ID)

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

    // Tarefas por categoria.
    const tags = Object.keys(TASK_TAG_TONE) as TaskTag[]
    const byTag = tags
      .map((tag) => ({ label: tag, value: tasks.filter((t) => t.tag === tag).length, tone: TASK_TAG_TONE[tag] as Tone }))
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
    const approvals = Object.keys(APPROVAL_META) as EditorialApproval[]
    const byApproval = approvals.map((a) => ({
      label: APPROVAL_META[a].label,
      value: posts.filter((p) => p.approval === a).length,
      tone: APPROVAL_META[a].tone as Tone,
    }))
    const awaitingAnju = posts.filter((p) => p.approval === 'em-revisao').length

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
  }, [tasks, posts, members, period])

  // Restrito a gestores — colaboradores voltam para a visão geral.
  if (!isManager) return <Navigate to="/app" replace />

  const periodLabel = PERIODS.find((p) => p.key === period)?.label ?? '30 dias'

  return (
    <div className="mx-auto flex max-w-screen-2xl flex-col gap-4 px-6 py-8">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-mono-label uppercase text-steel-400">
            <BarChart3 size={14} strokeWidth={1.5} aria-hidden />
            Visão executiva
          </div>
          <h1 className="mt-1.5 font-display text-display-l font-semibold leading-tight text-strong">Relatórios</h1>
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

      {/* Métricas-chave */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tarefas abertas" value={String(metrics.open.length)} />
        <StatCard label={`Concluídas · ${periodLabel}`} value={String(metrics.completedInPeriod.length)} />
        <StatCard label="Taxa de conclusão" value={`${metrics.conclusionRate}%`} active />
        <StatCard label="Aguardando Anju" value={String(metrics.awaitingAnju)} />
      </div>

      {/* Throughput semanal */}
      <Card>
        <CardHeader>
          <CardTitle>Tarefas concluídas por semana</CardTitle>
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
          rows={metrics.byStatus}
          empty="Nenhuma tarefa ainda."
        />
        <DistCard
          title="Abertas por prioridade"
          rows={metrics.byPriority}
          empty="Nenhuma tarefa aberta."
        />
        <DistCard
          title="Tarefas por categoria"
          rows={metrics.byTag}
          empty="Sem categorias atribuídas."
        />
      </div>

      {/* Editorial */}
      <div className="grid gap-4 lg:grid-cols-2">
        <DistCard
          title="Editorial por etapa"
          rows={metrics.byStage}
          empty="Nenhum post no calendário."
        />
        <DistCard
          title="Editorial por aprovação"
          rows={metrics.byApproval}
          empty="Nenhum post no calendário."
        />
      </div>

      {/* Carga do time */}
      <Card>
        <CardHeader>
          <CardTitle>Carga do time</CardTitle>
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
