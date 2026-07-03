import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarClock, ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui'
import { cn } from '@/lib/cn'
import { useSession } from '@/lib/session'
import { usePermissions } from '@/lib/permissions'
import { useCrm, isActiveLead, fmtDateBR, type Lead } from './crm'
import type { AgendaEvent } from './agenda'

/* ----------------------------------------------------------------------------
   Follow-ups do CRM na visão geral e na Agenda
   ----------------------------------------------------------------------------
   Pedido do checkpoint 2026-07-03 (Gustavo/Gabriel/Jéssica): ao abrir a Central,
   o comercial quer ver "quantos follow-ups tem hoje" e os próximos, e abrir a
   ficha do lead direto. Follow-up é contato por mensagem/áudio (não é reunião em
   call) — por isso é só lembrete in-app, sem feed/agenda externa.
---------------------------------------------------------------------------- */

function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Follow-ups do responsável logado, em três grupos: `overdue` (atrasados),
 * `today` (de hoje) e `upcoming` (próximas datas).
 */
function useMyFollowups(): { overdue: Lead[]; today: Lead[]; upcoming: Lead[] } {
  const { user } = useSession()
  const { leads } = useCrm()
  const today = todayIso()
  return useMemo(() => {
    const mine = leads
      .filter((l) => l.ownerId === user.id && l.nextFollowupAt && isActiveLead(l.status))
      .sort((a, b) => (a.nextFollowupAt ?? '').localeCompare(b.nextFollowupAt ?? ''))
    return {
      overdue: mine.filter((l) => (l.nextFollowupAt as string) < today),
      today: mine.filter((l) => (l.nextFollowupAt as string) === today),
      upcoming: mine.filter((l) => (l.nextFollowupAt as string) > today),
    }
  }, [leads, user.id, today])
}

/* --------------------------------- follow-ups como eventos da Agenda nativa */

const FOLLOWUP_PREFIX = 'followup:'
/** Um id de evento da agenda é, na verdade, um follow-up derivado de lead? */
export const isFollowupEventId = (id: string) => id.startsWith(FOLLOWUP_PREFIX)
/** Extrai o id do lead de um id de evento de follow-up. */
export const followupLeadId = (id: string) => id.slice(FOLLOWUP_PREFIX.length)

/**
 * Follow-ups do responsável logado projetados como eventos (virtuais) da
 * Agenda — não geram linhas em agenda_events; são derivados dos leads e
 * atualizam sozinhos quando a data muda. Owner-scoped (decisão do usuário:
 * cada comercial vê só os seus) e gated por `manage_crm`.
 */
export function useMyFollowupEvents(): AgendaEvent[] {
  const { user } = useSession()
  const { can } = usePermissions()
  const { leads } = useCrm()
  const today = todayIso()
  const allowed = can('manage_crm')
  return useMemo(() => {
    if (!allowed) return []
    return leads
      .filter((l) => l.ownerId === user.id && l.nextFollowupAt && isActiveLead(l.status))
      .map<AgendaEvent>((l) => ({
        id: `${FOLLOWUP_PREFIX}${l.id}`,
        date: l.nextFollowupAt as string,
        time: null,
        title: `Follow-up: ${l.name}`,
        meta: l.status ?? null,
        category: (l.nextFollowupAt as string) < today ? 'danger' : 'sand',
        description: null,
        meetingUrl: null,
        location: null,
        clientId: null,
        people: l.ownerId ? [l.ownerId] : [],
      }))
  }, [leads, user.id, allowed, today])
}

/** Uma linha de follow-up no card (nome + data + seta p/ ficha do lead). */
function FollowupRow({ lead, overdue, onOpen }: { lead: Lead; overdue: boolean; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-center gap-3 rounded-sm py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:shadow-focus"
    >
      <span className="min-w-0 flex-1 truncate text-body-l font-medium text-strong">{lead.name}</span>
      <span className={cn('shrink-0 font-mono text-[11px] tabular-nums', overdue ? 'text-err' : 'text-muted')}>
        {fmtDateBR(lead.nextFollowupAt)}
      </span>
      <ArrowRight
        size={14}
        strokeWidth={1.5}
        className="shrink-0 text-faint transition-colors group-hover:text-steel-600"
        aria-hidden
      />
    </button>
  )
}

/** Uma seção rotulada (ATRASADOS · N) com suas linhas. Não renderiza se vazia. */
function FollowupSection({
  label,
  tone,
  leads,
  onOpen,
}: {
  label: string
  tone: 'overdue' | 'neutral'
  leads: Lead[]
  onOpen: (id: string) => void
}) {
  if (leads.length === 0) return null
  const shown = leads.slice(0, 8)
  return (
    <div className="pt-3 first:pt-0">
      <div
        className={cn(
          'mb-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider',
          tone === 'overdue' ? 'text-err' : 'text-faint',
        )}
      >
        {label} · {leads.length}
      </div>
      <ul className="flex flex-col">
        {shown.map((l, i) => (
          <li key={l.id} className={i < shown.length - 1 ? 'border-b border-subtle' : ''}>
            <FollowupRow lead={l} overdue={tone === 'overdue'} onOpen={() => onOpen(l.id)} />
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Card da Home: "Meus follow-ups" — Atrasados · Hoje · Próximos. */
export function FollowupsCard() {
  const navigate = useNavigate()
  const { overdue, today, upcoming } = useMyFollowups()
  const open = (id: string) => navigate(`/app/crm?lead=${id}`)
  const dueCount = overdue.length + today.length

  return (
    <Card className="border-sand-300 bg-sand-200">
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-md border border-steel-500/30 bg-slate-900 text-steel-600">
            <CalendarClock size={18} strokeWidth={1.5} aria-hidden />
          </span>
          <CardTitle>Meus follow-ups</CardTitle>
        </div>
        <span className="font-mono text-mono-data tabular-nums text-on-sand">{dueCount}</span>
      </CardHeader>

      {overdue.length === 0 && today.length === 0 && upcoming.length === 0 ? (
        <p className="py-4 text-body-s text-muted">Nenhum follow-up agendado. 🎉</p>
      ) : (
        <div className="flex flex-col divide-y divide-subtle">
          <FollowupSection label="Atrasados" tone="overdue" leads={overdue} onOpen={open} />
          <FollowupSection label="Hoje" tone="neutral" leads={today} onOpen={open} />
          <FollowupSection label="Próximos" tone="neutral" leads={upcoming} onOpen={open} />
        </div>
      )}

      <div className="mt-4">
        <button
          onClick={() => navigate('/app/crm')}
          className="inline-flex items-center gap-1.5 font-mono text-mono-data text-steel-700 transition-colors hover:text-steel-600 focus-visible:outline-none focus-visible:shadow-focus"
        >
          Abrir CRM
          <ArrowRight size={14} strokeWidth={1.5} aria-hidden />
        </button>
      </div>
    </Card>
  )
}
