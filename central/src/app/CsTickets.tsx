import { useEffect, useMemo, useState } from 'react'
import { Headset, Plus, Pencil, Trash2, MoreHorizontal, CheckCheck } from 'lucide-react'
import {
  StatCard, Button, Select, Textarea, DatePicker, Modal, SearchField, Avatar,
  Input, Combobox, IconButton, DropdownMenu, MenuItem, MenuSeparator, EmptyState,
  Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell, useToast,
} from '@/components/ui'
import { cn } from '@/lib/cn'
import { useSession } from '@/lib/session'
import { usePermissions } from '@/lib/permissions'
import { useProfiles } from './profiles'
import { useCatalogs, CatalogBadge, type CatalogKey } from './catalogs'
import { useCrm, type Lead } from './crm'
import { useCs, isTicketResolved, type CsTicket, type CsTicketInput } from './cs'

/* ----------------------------------------------------------------------------
   CS · Atendimentos — registro do suporte (substitui a planilha da Keila)
   ----------------------------------------------------------------------------
   Cada atendimento guarda quando chegou, por onde (catálogo support_channel),
   o tema, quem atendeu e o status da resolução (support_status). A aluna pode
   vir do CRM (join por lead_id) ou ser um contato livre. "Resolvido" marca a
   hora da resolução — daí sai o tempo médio de resposta dos KPIs.
---------------------------------------------------------------------------- */

function CatBadge({ catalog, value }: { catalog: CatalogKey; value?: string | null }) {
  const { tone, label } = useCatalogs()
  if (!value) return null
  return <CatalogBadge tone={tone(catalog, value)} size="sm">{label(catalog, value)}</CatalogBadge>
}

/** ISO → "dd/mm · hh:mm" (hora local). */
function fmtWhen(iso: string): string {
  const d = new Date(iso)
  const date = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${date} · ${time}`
}

/** Duração legível: 45min, 6h, 3d. */
function fmtDuration(ms: number): string {
  const min = Math.round(ms / 60_000)
  if (min < 60) return `${Math.max(min, 1)}min`
  const h = Math.round(min / 60)
  if (h < 48) return `${h}h`
  return `${Math.round(h / 24)}d`
}

/** Nome exibido do atendimento: aluna do CRM ou contato livre. */
function ticketName(t: CsTicket, leadById: Map<string, Lead>): string {
  if (t.leadId) return leadById.get(t.leadId)?.name ?? '(lead removido)'
  return t.contact || '(sem contato)'
}

export function CsTickets() {
  const { toast } = useToast()
  const { user } = useSession()
  const { members, getMember } = useProfiles()
  const { items } = useCatalogs()
  const { leads } = useCrm()
  const { tickets, addTicket, updateTicket, removeTicket } = useCs()

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [channelFilter, setChannelFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CsTicket | null>(null)

  const { can } = usePermissions()
  const canManage = can('manage_crm')

  const leadById = useMemo(() => new Map(leads.map((l) => [l.id, l])), [leads])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tickets.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      if (channelFilter !== 'all' && t.channel !== channelFilter) return false
      if (q) {
        const hay = `${ticketName(t, leadById)} ${t.summary ?? ''} ${t.topic ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [tickets, query, statusFilter, channelFilter, leadById])

  const kpis = useMemo(() => {
    const month = new Date().toISOString().slice(0, 7)
    let open = 0, resolvedMonth = 0, totalMonth = 0
    let resolvedMs = 0, resolvedCount = 0
    for (const t of tickets) {
      const resolved = isTicketResolved(t.status)
      if (!resolved) open++
      if (t.openedAt.slice(0, 7) === month) totalMonth++
      if (resolved && (t.resolvedAt ?? t.openedAt).slice(0, 7) === month) resolvedMonth++
      if (resolved && t.resolvedAt) {
        const ms = new Date(t.resolvedAt).getTime() - new Date(t.openedAt).getTime()
        if (ms > 0) { resolvedMs += ms; resolvedCount++ }
      }
    }
    return {
      open,
      resolvedMonth,
      totalMonth,
      avg: resolvedCount > 0 ? fmtDuration(resolvedMs / resolvedCount) : '—',
    }
  }, [tickets])

  const statuses = items('support_status')
  const channels = items('support_channel')

  const resolveNow = async (t: CsTicket) => {
    const resolvedValue = statuses.find((s) => isTicketResolved(s.value))?.value ?? 'Resolvido'
    const { error } = await updateTicket(t.id, {
      ...t,
      status: resolvedValue,
      resolvedAt: t.resolvedAt ?? new Date().toISOString(),
    })
    if (error) toast({ title: 'Erro ao resolver', description: error, tone: 'error' })
    else toast({ title: 'Atendimento resolvido', tone: 'success' })
  }

  const handleDelete = async (t: CsTicket) => {
    await removeTicket(t.id)
    toast({ title: 'Atendimento excluído', tone: 'success' })
  }

  const handleSave = async (input: CsTicketInput) => {
    const { error } = editing ? await updateTicket(editing.id, input) : await addTicket(input)
    if (error) { toast({ title: 'Erro ao salvar', description: error, tone: 'error' }); return }
    toast({ title: editing ? 'Atendimento atualizado' : 'Atendimento registrado', tone: 'success' })
    setModalOpen(false)
    setEditing(null)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* KPIs — os números que a reunião quinzenal pede. */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Abertos" value={kpis.open} active={kpis.open > 0} />
        <StatCard label="Resolvidos · este mês" value={kpis.resolvedMonth} />
        <StatCard label="Atendimentos · este mês" value={kpis.totalMonth} />
        <StatCard label="Tempo médio de resolução" value={kpis.avg} />
      </div>

      {/* Filtros + ação */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchField
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por aluna, tema ou resumo…"
          className="w-full max-w-xs"
        />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-44">
          <option value="all">Todos os status</option>
          {statuses.map((s) => <option key={s.id} value={s.value}>{s.label}</option>)}
        </Select>
        <Select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)} className="w-44">
          <option value="all">Todos os canais</option>
          {channels.map((c) => <option key={c.id} value={c.value}>{c.label}</option>)}
        </Select>
        <span className="font-mono text-mono-data text-faint tabular-nums">{filtered.length} atendimento(s)</span>
        {canManage && (
          <Button size="sm" leftIcon={<Plus size={16} strokeWidth={1.5} />} className="ml-auto" onClick={() => { setEditing(null); setModalOpen(true) }}>
            Registrar atendimento
          </Button>
        )}
      </div>

      {/* Tabela */}
      {tickets.length === 0 ? (
        <EmptyState
          icon={<Headset size={22} strokeWidth={1.5} />}
          title="Nenhum atendimento registrado"
          description="Registre aqui cada atendimento do suporte — data, canal, tema e resolução. Adeus, planilha."
        />
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-body-s text-faint">Nenhum atendimento nesse filtro.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Quando</TableHeaderCell>
                <TableHeaderCell>Aluna / contato</TableHeaderCell>
                <TableHeaderCell>Canal</TableHeaderCell>
                <TableHeaderCell>Tema</TableHeaderCell>
                <TableHeaderCell>Resumo</TableHeaderCell>
                <TableHeaderCell>Atendeu</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell aria-label="Ações" />
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((t) => {
                const owner = t.ownerId ? getMember(t.ownerId) : undefined
                const resolved = isTicketResolved(t.status)
                return (
                  <TableRow key={t.id}>
                    <TableCell className="whitespace-nowrap font-mono text-mono-data text-muted tabular-nums">
                      {fmtWhen(t.openedAt)}
                    </TableCell>
                    <TableCell className="max-w-44 truncate font-medium text-strong">{ticketName(t, leadById)}</TableCell>
                    <TableCell><CatBadge catalog="support_channel" value={t.channel} /></TableCell>
                    <TableCell><CatBadge catalog="support_topic" value={t.topic} /></TableCell>
                    <TableCell className="max-w-72">
                      <span className="line-clamp-2 text-body-s text-muted">{t.summary || '—'}</span>
                    </TableCell>
                    <TableCell>
                      {owner ? (
                        <span className="flex items-center gap-1.5 text-body-s text-muted">
                          <Avatar size="xs" name={owner.name} src={owner.avatar ?? undefined} />
                          {owner.name.split(' ')[0]}
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <CatBadge catalog="support_status" value={t.status} />
                        {resolved && t.resolvedAt && (
                          <span className="font-mono text-[10px] text-faint tabular-nums">
                            em {fmtDuration(Math.max(new Date(t.resolvedAt).getTime() - new Date(t.openedAt).getTime(), 0))}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="w-10">
                      {canManage && (
                        <DropdownMenu
                          align="end"
                          trigger={
                            <IconButton size="sm" aria-label={`Ações do atendimento de ${ticketName(t, leadById)}`}>
                              <MoreHorizontal size={16} strokeWidth={1.5} />
                            </IconButton>
                          }
                        >
                          {!resolved && (
                            <MenuItem icon={<CheckCheck size={16} strokeWidth={1.5} />} onClick={() => resolveNow(t)}>
                              Marcar resolvido
                            </MenuItem>
                          )}
                          <MenuItem icon={<Pencil size={16} strokeWidth={1.5} />} onClick={() => { setEditing(t); setModalOpen(true) }}>
                            Editar
                          </MenuItem>
                          <MenuSeparator />
                          <MenuItem icon={<Trash2 size={16} strokeWidth={1.5} />} destructive onClick={() => handleDelete(t)}>
                            Excluir
                          </MenuItem>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <TicketModal
        open={modalOpen}
        editing={editing}
        leads={leads}
        members={members}
        defaultOwnerId={user?.userId ?? ''}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSave={handleSave}
      />
    </div>
  )
}

/* --------------------------------------------------------------- modal */

interface TicketDraft {
  leadId: string | null
  contact: string
  date: Date | null
  time: string // HH:mm
  channel: string
  topic: string
  status: string
  ownerId: string
  summary: string
}

function nowDraftTime(): { date: Date; time: string } {
  const d = new Date()
  return { date: d, time: d.toTimeString().slice(0, 5) }
}

function TicketModal({
  open, editing, leads, members, defaultOwnerId, onClose, onSave,
}: {
  open: boolean
  editing: CsTicket | null
  leads: Lead[]
  members: { id: string; name: string; avatar: string | null; status: string }[]
  defaultOwnerId: string
  onClose: () => void
  onSave: (input: CsTicketInput) => void
}) {
  const { items } = useCatalogs()
  const statuses = items('support_status')
  const channels = items('support_channel')
  const topics = items('support_topic')

  const [draft, setDraft] = useState<TicketDraft | null>(null)

  useEffect(() => {
    if (!open) { setDraft(null); return }
    if (editing) {
      const opened = new Date(editing.openedAt)
      setDraft({
        leadId: editing.leadId ?? null,
        contact: editing.contact ?? '',
        date: opened,
        time: opened.toTimeString().slice(0, 5),
        channel: editing.channel,
        topic: editing.topic ?? '',
        status: editing.status,
        ownerId: editing.ownerId ?? '',
        summary: editing.summary ?? '',
      })
    } else {
      const { date, time } = nowDraftTime()
      setDraft({
        leadId: null,
        contact: '',
        date,
        time,
        channel: channels[0]?.value ?? 'WhatsApp',
        topic: '',
        status: statuses[0]?.value ?? 'Aberto',
        ownerId: defaultOwnerId,
        summary: '',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing])

  if (!draft) {
    return <Modal open={false} onClose={onClose} title="Atendimento" />
  }

  const set = (patch: Partial<TicketDraft>) => setDraft((d) => (d ? { ...d, ...patch } : d))

  const leadOptions = [...leads]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((l) => ({ value: l.id, label: l.name }))

  const submit = () => {
    const base = draft.date ?? new Date()
    const [h, m] = draft.time.split(':').map(Number)
    const opened = new Date(base.getFullYear(), base.getMonth(), base.getDate(), h || 0, m || 0)
    const resolved = isTicketResolved(draft.status)
    onSave({
      leadId: draft.leadId,
      contact: draft.contact,
      channel: draft.channel,
      topic: draft.topic || null,
      summary: draft.summary,
      status: draft.status,
      ownerId: draft.ownerId || null,
      openedAt: opened.toISOString(),
      // Resolvido agora ganha o carimbo; voltar pra aberto limpa.
      resolvedAt: resolved ? (editing?.resolvedAt ?? new Date().toISOString()) : null,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar atendimento' : 'Registrar atendimento'}
      description="Data, canal, tema e status da resolução — o registro do suporte."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit}>{editing ? 'Salvar' : 'Registrar'}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Combobox
          label="Aluna (CRM)"
          optional
          clearable
          options={leadOptions}
          value={draft.leadId}
          onChange={(v) => set({ leadId: v })}
          placeholder="Buscar aluna…"
          emptyText="Nenhuma aluna encontrada."
        />
        {!draft.leadId && (
          <Input
            label="Contato"
            optional
            value={draft.contact}
            onChange={(e) => set({ contact: e.target.value })}
            placeholder="Nome de quem procurou o suporte (se não estiver no CRM)"
          />
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-mono-label uppercase text-muted">Data</span>
            <DatePicker value={draft.date} onChange={(d) => set({ date: d })} />
          </label>
          <Input label="Hora" type="time" value={draft.time} onChange={(e) => set({ time: e.target.value })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Canal" value={draft.channel} onChange={(e) => set({ channel: e.target.value })}>
            {channels.map((c) => <option key={c.id} value={c.value}>{c.label}</option>)}
          </Select>
          <Select label="Tema" value={draft.topic} onChange={(e) => set({ topic: e.target.value })}>
            <option value="">— Sem tema —</option>
            {topics.map((t) => <option key={t.id} value={t.value}>{t.label}</option>)}
          </Select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Status" value={draft.status} onChange={(e) => set({ status: e.target.value })}>
            {statuses.map((s) => <option key={s.id} value={s.value}>{s.label}</option>)}
          </Select>
          <Select label="Quem atendeu" value={draft.ownerId} onChange={(e) => set({ ownerId: e.target.value })}>
            <option value="">— Sem responsável —</option>
            {members.filter((m) => m.status !== 'suspenso').map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </Select>
        </div>
        <label className={cn('flex flex-col gap-1.5')}>
          <span className="font-mono text-mono-label uppercase text-muted">Resumo</span>
          <Textarea
            rows={4}
            value={draft.summary}
            onChange={(e) => set({ summary: e.target.value })}
            placeholder="O que a aluna trouxe e como foi resolvido…"
          />
        </label>
      </div>
    </Modal>
  )
}
