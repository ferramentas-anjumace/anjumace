import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, ArrowUpRight, Trash2, ExternalLink } from 'lucide-react'
import {
  CardIcon, StatCard, Button, IconButton, Modal, SearchField, Badge,
  Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell, TableEmpty,
  useToast,
} from '@/components/ui'
import { usePermissions } from '@/lib/permissions'
import { useFunnel, type FunnelLead } from './funnel'
import { useCrm } from './crm'

/* ----------------------------------------------------------------------------
   Comercial · Leads do Guia — capturas da landing /guia (e-book Cinco Falhas)
   ----------------------------------------------------------------------------
   Topo de funil frio, com UTMs de atribuição (de onde o lead veio). A nutrição
   acontece pelo ActiveCampaign; quando o lead esquentar, "Promover pro CRM"
   cria o card no pipeline (origem 'Guia') — mesmo desenho da Lista de Espera.
---------------------------------------------------------------------------- */

/** timestamptz → "09/07/2026 14:32" no fuso local. */
function fmtDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('pt-BR') + ' ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

/** Resumo da atribuição: "instagram · bio" / referrer / "—". */
function fmtOrigem(l: FunnelLead): string {
  const parts = [l.utmSource, l.utmCampaign ?? l.utmMedium].filter(Boolean)
  if (parts.length > 0) return parts.join(' · ')
  if (l.referrer) {
    try { return new URL(l.referrer).hostname.replace(/^www\./, '') } catch { return l.referrer }
  }
  return '—'
}

export function FunnelPage() {
  const navigate = useNavigate()
  const { can } = usePermissions()
  const { toast } = useToast()
  const { leads, loading, removeLead, markPromoted } = useFunnel()
  const { addLead } = useCrm()

  const [query, setQuery] = useState('')
  const [toDelete, setToDelete] = useState<FunnelLead | null>(null)
  const [promoting, setPromoting] = useState<string | null>(null)

  // Todos veem; só quem tem `manage_crm` promove/exclui (igual ao CRM).
  const canManage = can('manage_crm')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return leads
    return leads.filter((l) =>
      `${l.name} ${l.email} ${l.utmSource ?? ''} ${l.utmCampaign ?? ''}`.toLowerCase().includes(q),
    )
  }, [leads, query])

  const kpis = useMemo(() => {
    const now = Date.now()
    const sevenDays = 7 * 24 * 60 * 60 * 1000
    let last7 = 0
    let promoted = 0
    for (const l of leads) {
      if (now - new Date(l.createdAt).getTime() <= sevenDays) last7++
      if (l.promotedAt) promoted++
    }
    return { total: leads.length, last7, promoted, nurturing: leads.length - promoted }
  }, [leads])

  const handlePromote = async (lead: FunnelLead) => {
    setPromoting(lead.id)
    const origem = fmtOrigem(lead)
    const { id, error } = await addLead({
      name: lead.name,
      email: lead.email,
      origin: 'Guia',
      status: 'Novo',
      notes:
        `Baixou o guia "Os cinco tipos de falha" em ${fmtDateTime(lead.createdAt)}.` +
        (origem !== '—' ? ` Atribuição: ${origem}.` : ''),
    })
    if (error || !id) {
      setPromoting(null)
      toast({ title: 'Erro ao promover', description: error ?? 'Falha ao criar o lead no CRM.', tone: 'error' })
      return
    }
    const { error: markError } = await markPromoted(lead.id, id)
    setPromoting(null)
    if (markError) {
      toast({ title: 'Lead criado, mas a captura não foi marcada', description: markError, tone: 'error' })
      return
    }
    toast({ title: 'Lead promovido pro CRM', description: `${lead.name} entrou no pipeline como "Novo".`, tone: 'success' })
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
          <CardIcon tone="sage" className="mt-0.5"><BookOpen size={18} strokeWidth={1.5} aria-hidden /></CardIcon>
          <div>
            <h1 className="font-display text-h1 font-semibold text-strong">Comercial · Leads do Guia</h1>
            <p className="mt-1 text-body-s text-muted">
              Capturas da página do e-book "Os cinco tipos de falha", com a origem de cada lead. A nutrição roda no Active; quando esquentar, promova pro CRM.
            </p>
          </div>
        </div>
        <SearchField
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome, e-mail ou origem…"
          className="w-72"
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Em nutrição" value={kpis.nurturing} />
        <StatCard label="Novos · últimos 7 dias" value={kpis.last7} />
        <StatCard label="Promovidos pro CRM" value={kpis.promoted} />
        <StatCard label="Total de capturas" value={kpis.total} />
      </div>

      {/* Tabela */}
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Nome</TableHeaderCell>
            <TableHeaderCell>E-mail</TableHeaderCell>
            <TableHeaderCell>Origem (UTM)</TableHeaderCell>
            <TableHeaderCell>Capturado em</TableHeaderCell>
            <TableHeaderCell>Recapturas</TableHeaderCell>
            <TableHeaderCell>Situação</TableHeaderCell>
            {canManage && <TableHeaderCell align="right">Ações</TableHeaderCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableEmpty colSpan={canManage ? 7 : 6}>
              <span className="text-body-s text-muted">Carregando capturas…</span>
            </TableEmpty>
          ) : filtered.length === 0 ? (
            <TableEmpty colSpan={canManage ? 7 : 6}>
              <span className="text-body-s text-muted">
                {leads.length === 0
                  ? 'Nenhuma captura ainda — os leads da página /guia aparecem aqui.'
                  : 'Nenhum lead bate com a busca.'}
              </span>
            </TableEmpty>
          ) : (
            filtered.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="font-medium text-strong">{l.name}</TableCell>
                <TableCell mono>{l.email}</TableCell>
                <TableCell>
                  <span className="font-mono text-mono-data text-muted" title={l.referrer ?? undefined}>
                    {fmtOrigem(l)}
                  </span>
                </TableCell>
                <TableCell mono>{fmtDateTime(l.createdAt)}</TableCell>
                <TableCell mono>{l.signupCount > 1 ? `${l.signupCount}×` : '—'}</TableCell>
                <TableCell>
                  {l.promotedAt ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Badge tone="success" variant="soft" size="sm">Promovido</Badge>
                      {l.crmLeadId && (
                        <button
                          type="button"
                          onClick={() => navigate(`/app/crm?lead=${l.crmLeadId}`)}
                          title="Abrir o lead no CRM"
                          aria-label="Abrir o lead no CRM"
                          className="inline-flex text-muted transition-colors hover:text-strong focus-visible:outline-none focus-visible:shadow-focus"
                        >
                          <ExternalLink size={14} strokeWidth={1.5} aria-hidden />
                        </button>
                      )}
                    </span>
                  ) : (
                    <Badge tone="steel" variant="soft" size="sm">Em nutrição</Badge>
                  )}
                </TableCell>
                {canManage && (
                  <TableCell align="right">
                    <span className="inline-flex items-center gap-1.5">
                      {!l.promotedAt && (
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={promoting === l.id}
                          leftIcon={<ArrowUpRight size={15} strokeWidth={1.5} />}
                          onClick={() => handlePromote(l)}
                        >
                          Promover pro CRM
                        </Button>
                      )}
                      <IconButton
                        size="sm"
                        variant="ghost"
                        aria-label="Excluir lead"
                        title="Excluir lead"
                        onClick={() => setToDelete(l)}
                      >
                        <Trash2 size={15} strokeWidth={1.5} />
                      </IconButton>
                    </span>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Confirmação de exclusão */}
      <Modal
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title="Excluir lead do guia"
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
