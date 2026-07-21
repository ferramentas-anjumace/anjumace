import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Hourglass, ArrowUpRight, Trash2, ExternalLink } from 'lucide-react'
import {
  CardIcon, StatCard, Button, IconButton, Modal, SearchField, Badge, Switch,
  Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell, TableEmpty,
  useToast,
} from '@/components/ui'
import { usePermissions } from '@/lib/permissions'
import { useWaitlist, type WaitlistLead } from './waitlist'
import { useCrm, waHref } from './crm'
import { MessageCircle } from 'lucide-react'

/* ----------------------------------------------------------------------------
   Comercial · Lista de Espera — inscrições da landing /lista-de-espera
   ----------------------------------------------------------------------------
   Separada do CRM de propósito (pedido 2026-07-09): o CRM guarda leads em
   negociação; aqui ficam os leads em AQUECIMENTO. Quando a conversa esquenta,
   "Promover pro CRM" cria o card no pipeline (origem 'Lista de Espera') e a
   inscrição fica marcada como promovida, com atalho para o lead no CRM.
---------------------------------------------------------------------------- */

/** timestamptz → "09/07/2026 14:32" no fuso local. */
function fmtDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('pt-BR') + ' ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function WaitlistPage() {
  const navigate = useNavigate()
  const { can } = usePermissions()
  const { toast } = useToast()
  const { entries, loading, removeEntry, markPromoted } = useWaitlist()
  const { addLead } = useCrm()

  const [query, setQuery] = useState('')
  const [showPromoted, setShowPromoted] = useState(false)
  const [toDelete, setToDelete] = useState<WaitlistLead | null>(null)
  const [promoting, setPromoting] = useState<string | null>(null)

  // Todos veem; só quem tem `manage_crm` promove/exclui (igual ao CRM).
  const canManage = can('manage_crm')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const qDigits = q.replace(/\D/g, '')
    return entries.filter((e) => {
      if (!showPromoted && e.promotedAt) return false
      if (!q) return true
      const matchText = `${e.name} ${e.email ?? ''} ${e.whatsapp ?? ''}`.toLowerCase().includes(q)
      const digits = (e.whatsapp ?? '').replace(/\D/g, '')
      const matchPhone = qDigits.length >= 2 && digits.includes(qDigits)
      return matchText || matchPhone
    })
  }, [entries, query, showPromoted])

  const kpis = useMemo(() => {
    const now = Date.now()
    const sevenDays = 7 * 24 * 60 * 60 * 1000
    let last7 = 0
    let promoted = 0
    for (const e of entries) {
      if (now - new Date(e.createdAt).getTime() <= sevenDays) last7++
      if (e.promotedAt) promoted++
    }
    return { total: entries.length, last7, promoted, waiting: entries.length - promoted }
  }, [entries])

  const handlePromote = async (entry: WaitlistLead) => {
    setPromoting(entry.id)
    const { id, error } = await addLead({
      name: entry.name,
      email: entry.email,
      whatsapp: entry.whatsapp,
      origin: 'Lista de Espera',
      status: 'Novo',
      notes: entry.notes,
    })
    if (error || !id) {
      setPromoting(null)
      toast({ title: 'Erro ao promover', description: error ?? 'Falha ao criar o lead no CRM.', tone: 'error' })
      return
    }
    const { error: markError } = await markPromoted(entry.id, id)
    setPromoting(null)
    if (markError) {
      toast({ title: 'Lead criado, mas a inscrição não foi marcada', description: markError, tone: 'error' })
      return
    }
    toast({ title: 'Lead promovido pro CRM', description: `${entry.name} entrou no pipeline como "Novo".`, tone: 'success' })
  }

  const handleDelete = async () => {
    if (!toDelete) return
    await removeEntry(toDelete.id)
    setToDelete(null)
    toast({ title: 'Inscrição excluída', tone: 'success' })
  }

  return (
    <div className="mx-auto flex max-w-screen-2xl flex-col gap-6 px-6 py-8">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-3">
          <CardIcon tone="sage" className="mt-0.5"><Hourglass size={18} strokeWidth={1.5} aria-hidden /></CardIcon>
          <div>
            <h1 className="font-display text-h1 font-semibold text-strong">Comercial · Lista de Espera</h1>
            <p className="mt-1 text-body-s text-muted">
              Leads em aquecimento vindos da página de lista de espera. Quando a conversa esquentar, promova pro CRM.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Switch
            checked={showPromoted}
            onChange={(e) => setShowPromoted(e.target.checked)}
            label="Mostrar promovidos"
          />
          <SearchField
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, e-mail ou telefone…"
            className="w-72"
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Na lista" value={kpis.waiting} />
        <StatCard label="Novas · últimos 7 dias" value={kpis.last7} />
        <StatCard label="Promovidos pro CRM" value={kpis.promoted} />
        <StatCard label="Total de inscrições" value={kpis.total} />
      </div>

      {/* Tabela */}
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Nome</TableHeaderCell>
            <TableHeaderCell>WhatsApp</TableHeaderCell>
            <TableHeaderCell>E-mail</TableHeaderCell>
            <TableHeaderCell>Entrou em</TableHeaderCell>
            <TableHeaderCell>Observações</TableHeaderCell>
            <TableHeaderCell>Situação</TableHeaderCell>
            {canManage && <TableHeaderCell align="right">Ações</TableHeaderCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableEmpty colSpan={canManage ? 7 : 6}>
              <span className="text-body-s text-muted">Carregando inscrições…</span>
            </TableEmpty>
          ) : filtered.length === 0 ? (
            <TableEmpty colSpan={canManage ? 7 : 6}>
              <span className="text-body-s text-muted">
                {entries.length === 0
                  ? 'Nenhuma inscrição ainda — os leads da página de lista de espera aparecem aqui.'
                  : !showPromoted && kpis.waiting === 0
                    ? 'Todos os leads foram promovidos pro CRM. Ative "Mostrar promovidos" pra ver o histórico.'
                    : 'Nenhuma inscrição bate com a busca.'}
              </span>
            </TableEmpty>
          ) : (
            filtered.map((e) => {
              const wa = waHref(e.whatsapp)
              return (
                <TableRow key={e.id}>
                  <TableCell className="font-medium text-strong">{e.name}</TableCell>
                  <TableCell mono>
                    <span className="inline-flex items-center gap-2">
                      {e.whatsapp ?? '—'}
                      {wa && (
                        <a
                          href={wa}
                          target="_blank"
                          rel="noreferrer"
                          title="Abrir no WhatsApp"
                          aria-label="Abrir no WhatsApp"
                          className="inline-flex text-ok transition-colors hover:text-ok/70 focus-visible:outline-none focus-visible:shadow-focus"
                        >
                          <MessageCircle size={15} strokeWidth={1.5} aria-hidden />
                        </a>
                      )}
                    </span>
                  </TableCell>
                  <TableCell mono>{e.email ?? '—'}</TableCell>
                  <TableCell mono>{fmtDateTime(e.createdAt)}</TableCell>
                  <TableCell className="max-w-56">
                    <span className="block truncate text-body-s text-muted" title={e.notes ?? undefined}>
                      {e.notes ?? '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {e.promotedAt ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Badge tone="success" variant="soft" size="sm">Promovido</Badge>
                        {e.promotedLeadId && (
                          <button
                            type="button"
                            onClick={() => navigate(`/app/crm?lead=${e.promotedLeadId}`)}
                            title="Abrir o lead no CRM"
                            aria-label="Abrir o lead no CRM"
                            className="inline-flex text-muted transition-colors hover:text-strong focus-visible:outline-none focus-visible:shadow-focus"
                          >
                            <ExternalLink size={14} strokeWidth={1.5} aria-hidden />
                          </button>
                        )}
                      </span>
                    ) : (
                      <Badge tone="steel" variant="soft" size="sm">Na lista</Badge>
                    )}
                  </TableCell>
                  {canManage && (
                    <TableCell align="right">
                      <span className="inline-flex items-center gap-1.5">
                        {!e.promotedAt && (
                          <Button
                            size="sm"
                            variant="secondary"
                            loading={promoting === e.id}
                            leftIcon={<ArrowUpRight size={15} strokeWidth={1.5} />}
                            onClick={() => handlePromote(e)}
                          >
                            Promover pro CRM
                          </Button>
                        )}
                        <IconButton
                          size="sm"
                          variant="ghost"
                          aria-label="Excluir inscrição"
                          title="Excluir inscrição"
                          onClick={() => setToDelete(e)}
                        >
                          <Trash2 size={15} strokeWidth={1.5} />
                        </IconButton>
                      </span>
                    </TableCell>
                  )}
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>

      {/* Confirmação de exclusão */}
      <Modal
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title="Excluir inscrição"
        description={toDelete ? `Excluir "${toDelete.name}" da lista de espera? Essa ação não pode ser desfeita.` : undefined}
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
