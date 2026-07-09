import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { HeartHandshake, ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui'
import { cn } from '@/lib/cn'
import { useCrm, fmtDateBR, type Lead } from './crm'
import { useCs, isCsClosed, type CsCase } from './cs'
import { CS_ITEMS, CS_MONITORED, daysInCs } from './csPlaybook'

/* ----------------------------------------------------------------------------
   CS na visão geral — lembrete de alunas novas e pendências do pós-venda
   ----------------------------------------------------------------------------
   Pedido 2026-07-09: quem abre a Central precisa ver o que o CS tem pra hoje
   sem entrar na aba. Cada caso aparece UMA vez, na seção mais urgente:

     1. Escalonar        — D7+ com 2+ itens do monitoramento pendentes
     2. Boas-vindas      — a mensagem do dia do acesso ainda não foi enviada
     3. Ação pendente    — próxima ação de hoje ou atrasada
     4. Alunas novas     — chegaram há até 2 dias (D0–D2), só consciência

   Clique abre o caso direto (/app/cs?case=<id>).
---------------------------------------------------------------------------- */

function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface CsBuckets {
  escalate: CsCase[]
  welcome: CsCase[]
  action: CsCase[]
  fresh: CsCase[]
}

function useCsBuckets(): CsBuckets {
  const { cases, checksFor } = useCs()
  const today = todayIso()
  return useMemo(() => {
    const buckets: CsBuckets = { escalate: [], welcome: [], action: [], fresh: [] }
    for (const c of cases) {
      if (isCsClosed(c.status)) continue
      const done = new Set(checksFor(c.id).map((k) => k.item))
      const days = daysInCs(c.createdAt)
      const pendingMonitored = CS_MONITORED.filter((i) => !done.has(i)).length
      if (days >= 7 && pendingMonitored >= 2) buckets.escalate.push(c)
      else if (!done.has(CS_ITEMS.boasVindas)) buckets.welcome.push(c)
      else if (c.nextActionAt && c.nextActionAt <= today) buckets.action.push(c)
      else if (days <= 2) buckets.fresh.push(c)
    }
    // Mais antigas primeiro dentro de cada grupo (quem espera há mais tempo).
    const byAge = (a: CsCase, b: CsCase) => a.createdAt.localeCompare(b.createdAt)
    buckets.escalate.sort(byAge)
    buckets.welcome.sort(byAge)
    buckets.action.sort((a, b) => (a.nextActionAt ?? '').localeCompare(b.nextActionAt ?? ''))
    buckets.fresh.sort(byAge).reverse() // novas: a mais recente primeiro
    return buckets
  }, [cases, checksFor, today])
}

function CsRow({
  lead, trailing, urgent, onOpen,
}: {
  lead?: Lead
  trailing: string
  urgent: boolean
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-center gap-3 rounded-sm py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:shadow-focus"
    >
      <span className="min-w-0 flex-1 truncate text-body-l font-medium text-strong">
        {lead?.name ?? '(lead removido)'}
      </span>
      <span className={cn('shrink-0 font-mono text-[11px] tabular-nums', urgent ? 'text-err' : 'text-muted')}>
        {trailing}
      </span>
      <ArrowRight
        size={14}
        strokeWidth={1.5}
        className="shrink-0 text-faint transition-colors group-hover:text-steel-600"
        aria-hidden
      />
      <span className="sr-only">Abrir caso de {lead?.name ?? 'cliente'}</span>
    </button>
  )
}

function CsSection({
  label, tone, cases, trailing, onOpen,
}: {
  label: string
  tone: 'urgent' | 'neutral'
  cases: CsCase[]
  trailing: (c: CsCase) => string
  onOpen: (id: string) => void
}) {
  const { leads } = useCrm()
  if (cases.length === 0) return null
  const leadById = new Map(leads.map((l) => [l.id, l]))
  const shown = cases.slice(0, 6)
  return (
    <div className="pt-3 first:pt-0">
      <div
        className={cn(
          'mb-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider',
          tone === 'urgent' ? 'text-err' : 'text-faint',
        )}
      >
        {label} · {cases.length}
      </div>
      <ul className="flex flex-col">
        {shown.map((c, i) => (
          <li key={c.id} className={i < shown.length - 1 ? 'border-b border-subtle' : ''}>
            <CsRow
              lead={leadById.get(c.leadId)}
              trailing={trailing(c)}
              urgent={tone === 'urgent'}
              onOpen={() => onOpen(c.id)}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Card da Home: "CS · Pós-venda" — escalonar, boas-vindas, ações e novas. */
export function CsHomeCard() {
  const navigate = useNavigate()
  const { escalate, welcome, action, fresh } = useCsBuckets()
  const open = (id: string) => navigate(`/app/cs?case=${id}`)
  // O contador do topo soma só o acionável (novas são consciência, não tarefa).
  const dueCount = escalate.length + welcome.length + action.length

  return (
    <Card className="border-steel-500/30 bg-steel-300/45">
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-md border border-steel-500/30 bg-slate-900 text-steel-600">
            <HeartHandshake size={18} strokeWidth={1.5} aria-hidden />
          </span>
          <CardTitle>CS · Pós-venda</CardTitle>
        </div>
        <span className="font-mono text-mono-data tabular-nums text-strong">{dueCount}</span>
      </CardHeader>

      {dueCount === 0 && fresh.length === 0 ? (
        <p className="py-4 text-body-s text-muted">Nenhuma pendência no pós-venda. 🎉</p>
      ) : (
        <div className="flex flex-col divide-y divide-subtle">
          <CsSection
            label="Escalonar (D7+)"
            tone="urgent"
            cases={escalate}
            trailing={(c) => `D${daysInCs(c.createdAt)}`}
            onOpen={open}
          />
          <CsSection
            label="Boas-vindas pendente"
            tone={welcome.some((c) => daysInCs(c.createdAt) >= 1) ? 'urgent' : 'neutral'}
            cases={welcome}
            trailing={(c) => `D${daysInCs(c.createdAt)}`}
            onOpen={open}
          />
          <CsSection
            label="Ação pendente"
            tone="neutral"
            cases={action}
            trailing={(c) => fmtDateBR(c.nextActionAt)}
            onOpen={open}
          />
          <CsSection
            label="Alunas novas"
            tone="neutral"
            cases={fresh}
            trailing={(c) => `D${daysInCs(c.createdAt)}`}
            onOpen={open}
          />
        </div>
      )}

      <div className="mt-4">
        <button
          onClick={() => navigate('/app/cs')}
          className="inline-flex items-center gap-1.5 font-mono text-mono-data text-steel-700 transition-colors hover:text-steel-600 focus-visible:outline-none focus-visible:shadow-focus"
        >
          Abrir CS
          <ArrowRight size={14} strokeWidth={1.5} aria-hidden />
        </button>
      </div>
    </Card>
  )
}
