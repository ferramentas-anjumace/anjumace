import { useMemo, useState } from 'react'
import { Mic2, Trash2, Download } from 'lucide-react'
import {
  Card, CardIcon, StatCard, Button, IconButton, Modal, Drawer, SearchField, Badge,
  Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell, TableEmpty,
  useToast,
} from '@/components/ui'
import { cn } from '@/lib/cn'
import { usePermissions } from '@/lib/permissions'
import { useHotseatOrdem, hotseatOrdemToCsv, fmtDateTime, type HotseatOrdemLead } from './hotseatOrdem'
import { SURVEY_QUESTIONS, answerDisplay } from './hotseatOrdemQuestions'
import { ScaleHistogramCard, CategoryDistributionCard, TextAnswersCard } from './HotseatOrdemCharts'
import { downloadText } from './crm'

/* ----------------------------------------------------------------------------
   Comercial · Hotseat "A Ordem" — capturas + pesquisa da landing /aordem-captura
   ----------------------------------------------------------------------------
   Leads (nome/e-mail/whatsapp) e as respostas da pesquisa pós-cadastro, com
   gráficos por pergunta, filtros e exportação CSV. Pesquisa opcional — nem
   todo lead respondeu (a pesquisa é sequencial em 4 telas, dá pra abandonar
   no meio), por isso os gráficos usam como denominador quem respondeu cada
   pergunta específica, não o total de leads.
---------------------------------------------------------------------------- */

const PERIODS = [
  { key: 7, label: '7 dias' },
  { key: 15, label: '15 dias' },
  { key: 30, label: '30 dias' },
  { key: 90, label: '90 dias' },
  { key: 0, label: 'Tudo' },
] as const

const SURVEY_FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'answered', label: 'Respondeu' },
  { key: 'not-answered', label: 'Não respondeu' },
] as const

function daysAgo(iso: string): number {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return Infinity
  return Math.floor((Date.now() - then) / (24 * 60 * 60 * 1000))
}

/** Resumo da atribuição: "instagram · bio" / referrer / "—" — mesmo padrão de FunnelPage. */
function fmtOrigem(l: HotseatOrdemLead): string {
  const parts = [l.utmSource, l.utmCampaign ?? l.utmMedium].filter(Boolean)
  if (parts.length > 0) return parts.join(' · ')
  if (l.referrer) {
    try { return new URL(l.referrer).hostname.replace(/^www\./, '') } catch { return l.referrer }
  }
  return '—'
}

/** Drawer com as 12 perguntas + respostas de um lead específico. */
function SurveyDrawer({ lead, onClose }: { lead: HotseatOrdemLead; onClose: () => void }) {
  return (
    <Drawer open onClose={onClose} title={lead.name || lead.email} description={lead.email} width={480}>
      <div className="flex flex-col gap-5">
        {!lead.survey ? (
          <p className="py-6 text-center text-body-s text-muted">Esse lead ainda não respondeu a pesquisa.</p>
        ) : (
          SURVEY_QUESTIONS.map((q) => (
            <div key={q.id} className="flex flex-col gap-1 border-b border-line pb-4 last:border-0 last:pb-0">
              <span className="font-mono text-mono-label uppercase text-faint">{q.shortLabel}</span>
              <span className="text-body-s text-fg">{answerDisplay(lead.survey?.answers, q.id)}</span>
            </div>
          ))
        )}
      </div>
    </Drawer>
  )
}

export function HotseatOrdemPage() {
  const { can } = usePermissions()
  const { toast } = useToast()
  const { leads, loading, removeLead } = useHotseatOrdem()

  const [query, setQuery] = useState('')
  const [period, setPeriod] = useState<(typeof PERIODS)[number]['key']>(0)
  const [surveyFilter, setSurveyFilter] = useState<(typeof SURVEY_FILTERS)[number]['key']>('all')
  const [detail, setDetail] = useState<HotseatOrdemLead | null>(null)
  const [toDelete, setToDelete] = useState<HotseatOrdemLead | null>(null)

  const canManage = can('manage_crm')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return leads.filter((l) => {
      if (q && !`${l.name} ${l.email} ${l.utmSource ?? ''} ${l.utmCampaign ?? ''}`.toLowerCase().includes(q)) return false
      if (period !== 0 && daysAgo(l.createdAt) > period) return false
      if (surveyFilter === 'answered' && !l.survey) return false
      if (surveyFilter === 'not-answered' && l.survey) return false
      return true
    })
  }, [leads, query, period, surveyFilter])

  const kpis = useMemo(() => {
    const now = Date.now()
    const sevenDays = 7 * 24 * 60 * 60 * 1000
    let last7 = 0
    let answered = 0
    let recaptures = 0
    for (const l of leads) {
      if (now - new Date(l.createdAt).getTime() <= sevenDays) last7++
      if (l.survey) answered++
      if (l.signupCount > 1) recaptures++
    }
    return {
      total: leads.length,
      last7,
      answered,
      answeredPct: leads.length > 0 ? Math.round((answered / leads.length) * 100) : 0,
      recaptures,
    }
  }, [leads])

  const handleExport = () => {
    const csv = hotseatOrdemToCsv(filtered)
    downloadText(`hotseat-a-ordem-${new Date().toISOString().slice(0, 10)}.csv`, csv)
  }

  const handleDelete = async () => {
    if (!toDelete) return
    await removeLead(toDelete.id)
    setToDelete(null)
    toast({ title: 'Lead excluído', tone: 'success' })
  }

  return (
    <div className="mx-auto flex max-w-screen-2xl flex-col gap-6 px-6 py-8">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-3">
          <CardIcon tone="sage" className="mt-0.5"><Mic2 size={18} strokeWidth={1.5} aria-hidden /></CardIcon>
          <div>
            <h1 className="font-display text-h1 font-semibold text-strong">Comercial · Hotseat — A Ordem</h1>
            <p className="mt-1 text-body-s text-muted">
              Capturas da página /aordem-captura e as respostas da pesquisa pós-cadastro.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SearchField
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, e-mail ou origem…"
            className="w-72"
          />
          <Button variant="secondary" leftIcon={<Download size={15} strokeWidth={1.5} />} onClick={handleExport}>
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total de leads" value={kpis.total} />
        <StatCard label="Responderam a pesquisa" value={kpis.answered} delta={{ value: `${kpis.answeredPct}% dos leads`, direction: 'neutral' }} />
        <StatCard label="Novos · últimos 7 dias" value={kpis.last7} />
        <StatCard label="Recapturas" value={kpis.recaptures} />
      </div>

      {/* Filtros de período e de pesquisa */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border border-line bg-slate-900 p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={cn(
                'shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 font-mono text-mono-data uppercase transition-colors focus-visible:outline-none focus-visible:shadow-focus',
                period === p.key ? 'bg-steel-500 text-accent-fg' : 'text-muted hover:text-strong',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border border-line bg-slate-900 p-1">
          {SURVEY_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setSurveyFilter(f.key)}
              className={cn(
                'shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 font-mono text-mono-data uppercase transition-colors focus-visible:outline-none focus-visible:shadow-focus',
                surveyFilter === f.key ? 'bg-steel-500 text-accent-fg' : 'text-muted hover:text-strong',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gráficos — um card por pergunta da pesquisa, na ordem do formulário. */}
      {filtered.length === 0 ? (
        <p className="py-10 text-center text-body-s text-muted">
          {leads.length === 0 ? 'Nenhuma captura ainda — os leads de /aordem-captura aparecem aqui.' : 'Nenhum lead bate com os filtros.'}
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {SURVEY_QUESTIONS.map((q) => {
            if (q.type === 'scale') return <ScaleHistogramCard key={q.id} leads={filtered} question={q} />
            if (q.type === 'text') return <TextAnswersCard key={q.id} leads={filtered} question={q} />
            return <CategoryDistributionCard key={q.id} leads={filtered} question={q} />
          })}
        </div>
      )}

      {/* Tabela — só a partir de md; em telas estreitas vira lista de cards abaixo. */}
      <Table wrapperClassName="hidden md:block">
        <TableHead>
          <TableRow>
            <TableHeaderCell>Nome</TableHeaderCell>
            <TableHeaderCell>E-mail</TableHeaderCell>
            <TableHeaderCell>WhatsApp</TableHeaderCell>
            <TableHeaderCell>Origem (UTM)</TableHeaderCell>
            <TableHeaderCell>Capturado em</TableHeaderCell>
            <TableHeaderCell>Pesquisa</TableHeaderCell>
            <TableHeaderCell align="right">Ações</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableEmpty colSpan={7}>
              <span className="text-body-s text-muted">Carregando capturas…</span>
            </TableEmpty>
          ) : filtered.length === 0 ? (
            <TableEmpty colSpan={7}>
              <span className="text-body-s text-muted">
                {leads.length === 0 ? 'Nenhuma captura ainda.' : 'Nenhum lead bate com os filtros.'}
              </span>
            </TableEmpty>
          ) : (
            filtered.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="font-medium text-strong">{l.name}</TableCell>
                <TableCell mono>{l.email}</TableCell>
                <TableCell mono>{l.whatsapp || '—'}</TableCell>
                <TableCell>
                  <span className="font-mono text-mono-data text-muted" title={l.referrer ?? undefined}>{fmtOrigem(l)}</span>
                </TableCell>
                <TableCell mono>{fmtDateTime(l.createdAt)}</TableCell>
                <TableCell>
                  {l.survey
                    ? <Badge tone="success" variant="soft" size="sm">Respondeu</Badge>
                    : <Badge tone="steel" variant="soft" size="sm">Não respondeu</Badge>}
                </TableCell>
                <TableCell align="right">
                  <span className="inline-flex items-center gap-1.5">
                    <Button size="sm" variant="secondary" onClick={() => setDetail(l)}>Ver respostas</Button>
                    {canManage && (
                      <IconButton size="sm" variant="ghost" aria-label="Excluir lead" title="Excluir lead" onClick={() => setToDelete(l)}>
                        <Trash2 size={15} strokeWidth={1.5} />
                      </IconButton>
                    )}
                  </span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Cards — abaixo de md substituem a tabela. */}
      <div className="flex flex-col gap-3 md:hidden">
        {loading ? (
          <p className="py-10 text-center text-body-s text-muted">Carregando capturas…</p>
        ) : filtered.length === 0 ? null : (
          filtered.map((l) => (
            <Card key={l.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-body-l font-semibold text-strong">{l.name}</p>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-faint">{l.email}</p>
                </div>
                {l.survey
                  ? <Badge tone="success" variant="soft" size="sm" className="shrink-0">Respondeu</Badge>
                  : <Badge tone="steel" variant="soft" size="sm" className="shrink-0">Não respondeu</Badge>}
              </div>
              <div className="mt-3 flex flex-col gap-1.5 text-body-s">
                {l.whatsapp && (
                  <div className="flex items-center gap-2">
                    <span className="w-24 shrink-0 font-mono text-mono-label uppercase text-faint">WhatsApp</span>
                    <span className="font-mono text-muted">{l.whatsapp}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="w-24 shrink-0 font-mono text-mono-label uppercase text-faint">Origem</span>
                  <span className="min-w-0 truncate font-mono text-muted" title={l.referrer ?? undefined}>{fmtOrigem(l)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-24 shrink-0 font-mono text-mono-label uppercase text-faint">Capturado</span>
                  <span className="font-mono text-muted">{fmtDateTime(l.createdAt)}</span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
                <Button size="sm" variant="secondary" className="flex-1" onClick={() => setDetail(l)}>Ver respostas</Button>
                {canManage && (
                  <IconButton size="sm" variant="ghost" aria-label="Excluir lead" onClick={() => setToDelete(l)}>
                    <Trash2 size={15} strokeWidth={1.5} />
                  </IconButton>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Detalhe da pesquisa de um lead */}
      {detail && <SurveyDrawer lead={detail} onClose={() => setDetail(null)} />}

      {/* Confirmação de exclusão */}
      <Modal
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title="Excluir lead do Hotseat"
        description={toDelete ? `Excluir "${toDelete.name}"? Essa ação não pode ser desfeita.` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setToDelete(null)}>Cancelar</Button>
            <Button variant="danger" onClick={handleDelete}>Excluir</Button>
          </>
        }
      />
    </div>
  )
}
