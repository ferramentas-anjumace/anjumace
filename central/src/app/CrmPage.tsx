import { useMemo, useRef, useState } from 'react'
import {
  Plus, Upload, Download, Trash2, CalendarClock, MessageSquarePlus, FileDown,
} from 'lucide-react'
import {
  Card, CardHeader, CardTitle, StatCard, Button, IconButton, Input, Textarea, Select,
  Combobox, DatePicker, Drawer, Modal, EmptyState, SearchField, Avatar,
  Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell,
  Tabs, TabList, Tab, TabPanel, useToast,
} from '@/components/ui'
import { cn } from '@/lib/cn'
import { useSession } from '@/lib/session'
import { useProfiles } from './profiles'
import { useCatalogs, CatalogBadge, type CatalogKey } from './catalogs'
import {
  useCrm, fmtBRL, fmtDateBR, isActiveLead,
  buildKpis, breakdownBy, ownerStats,
  parseLeadsCsv, leadsToCsv, leadsCsvTemplate, downloadText,
  type Lead, type LeadInteraction,
} from './crm'

/* ----------------------------------------------------------------------------
   CRM Comercial — Pipeline (kanban por status) · Leads (tabela) · Dashboard
   ----------------------------------------------------------------------------
   Substitui a planilha do comercial (checkpoint 2026-07-02). O kanban organiza
   os leads pelo `status` (catálogo crm_status); arrastar move de etapa. Cada
   lead abre num drawer com o formulário completo e o Histórico de Interações.
   Import/Export CSV compatível com o layout da planilha. Os KPIs do Dashboard
   são derivados dos leads em memória.
---------------------------------------------------------------------------- */

/* ------------------------------------------------------------- helpers de data */

function isoToDate(iso?: string | null): Date | null {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}
function dateToIso(d: Date | null): string | null {
  if (!d) return null
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function todayIso(): string {
  return dateToIso(new Date())!
}

/* ------------------------------------------------------------- select de catálogo */

function CatalogSelect({
  catalog, value, onChange, label, placeholder, className,
}: {
  catalog: CatalogKey
  value?: string
  onChange: (v: string) => void
  label?: React.ReactNode
  placeholder?: string
  className?: string
}) {
  const { items } = useCatalogs()
  return (
    <Select
      label={label}
      className={className}
      value={value ?? ''}
      placeholder={placeholder ?? 'Selecione…'}
      onChange={(e) => onChange(e.target.value)}
    >
      {items(catalog).map((it) => (
        <option key={it.id} value={it.value}>{it.label}</option>
      ))}
    </Select>
  )
}

/** Badge colorido de um valor de catálogo (usa o tom definido em Catálogos). */
function CatBadge({ catalog, value, size = 'sm' }: { catalog: CatalogKey; value?: string; size?: 'sm' | 'md' }) {
  const { tone, label } = useCatalogs()
  if (!value) return null
  return <CatalogBadge tone={tone(catalog, value)} size={size}>{label(catalog, value)}</CatalogBadge>
}

/* =========================================================================== */

type OwnerFilter = 'all' | 'me' | string

export function CrmPage() {
  const { user, isManager } = useSession()
  const { members, getMember } = useProfiles()
  const { items } = useCatalogs()
  const { toast } = useToast()
  const {
    leads, loading, addLead, setLeadStatus, importLeads,
    lastContactAt, interactionCount,
  } = useCrm()

  const [tab, setTab] = useState('pipeline')
  const [owner, setOwner] = useState<OwnerFilter>('all')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  const memberName = (id?: string | null) => (id ? getMember(id)?.name ?? '—' : '—')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return leads.filter((l) => {
      if (owner === 'me' && l.ownerId !== user.id) return false
      if (owner !== 'all' && owner !== 'me' && l.ownerId !== owner) return false
      if (q && !(`${l.name} ${l.whatsapp ?? ''} ${l.email ?? ''}`.toLowerCase().includes(q))) return false
      return true
    })
  }, [leads, owner, query, user.id])

  const statusCols = items('crm_status')

  const handleExport = () => {
    const csv = leadsToCsv(filtered, { memberName, lastContactAt, interactionCount })
    downloadText(`crm-leads-${todayIso()}.csv`, csv)
    toast({ title: 'CSV exportado', description: `${filtered.length} lead(s) baixados.`, tone: 'success' })
  }

  const handleNewLead = async () => {
    const { id, error } = await addLead({ name: 'Novo lead', status: 'Novo', ownerId: user.id })
    if (error) toast({ title: 'Erro ao criar lead', description: error, tone: 'error' })
    else if (id) setOpenId(id)
  }

  return (
    <div className="mx-auto flex max-w-screen-2xl flex-col gap-6 px-6 py-8">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-h1 font-semibold text-strong">Comercial · CRM</h1>
          <p className="mt-1 text-body-s text-muted">
            Pipeline de vendas, leads e histórico de contatos — tudo num só lugar.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" leftIcon={<Upload size={16} strokeWidth={1.5} />} onClick={() => setImportOpen(true)}>
            Importar CSV
          </Button>
          <Button variant="secondary" size="sm" leftIcon={<Download size={16} strokeWidth={1.5} />} onClick={handleExport}>
            Exportar
          </Button>
          <Button size="sm" leftIcon={<Plus size={16} strokeWidth={1.5} />} onClick={handleNewLead}>
            Novo lead
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchField
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome, WhatsApp ou e-mail…"
          className="w-full max-w-xs"
        />
        <Select value={owner} onChange={(e) => setOwner(e.target.value as OwnerFilter)} className="w-52">
          <option value="all">Todos os responsáveis</option>
          <option value="me">Meus leads</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </Select>
        <span className="ml-auto font-mono text-mono-data text-faint tabular-nums">
          {filtered.length} lead(s)
        </span>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabList aria-label="Visões do CRM">
          <Tab value="pipeline">Pipeline</Tab>
          <Tab value="leads">Leads</Tab>
          <Tab value="dashboard">Dashboard</Tab>
        </TabList>

        <TabPanel value="pipeline">
          {loading ? (
            <p className="py-16 text-center text-body-s text-faint">Carregando…</p>
          ) : (
            <PipelineBoard
              columns={statusCols.map((s) => ({ value: s.value, label: s.label }))}
              leads={filtered}
              memberName={memberName}
              lastContactAt={lastContactAt}
              interactionCount={interactionCount}
              onOpen={setOpenId}
              onDrop={setLeadStatus}
              onQuickAdd={async (statusValue, name) => {
                await addLead({ name, status: statusValue, ownerId: user.id })
              }}
            />
          )}
        </TabPanel>

        <TabPanel value="leads">
          <LeadsTable
            leads={filtered}
            memberName={memberName}
            lastContactAt={lastContactAt}
            interactionCount={interactionCount}
            onOpen={setOpenId}
          />
        </TabPanel>

        <TabPanel value="dashboard">
          <Dashboard leads={filtered} memberName={memberName} />
        </TabPanel>
      </Tabs>

      {openId && (
        <LeadDrawer leadId={openId} onClose={() => setOpenId(null)} canDelete={isManager} />
      )}

      {importOpen && (
        <ImportModal
          onClose={() => setImportOpen(false)}
          onImport={async (rows) => {
            const { count, error } = await importLeads(rows)
            if (error) toast({ title: 'Erro na importação', description: error, tone: 'error' })
            else toast({ title: 'Leads importados', description: `${count} lead(s) adicionados.`, tone: 'success' })
            setImportOpen(false)
          }}
          members={members}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------- Kanban board */

interface CardHelpers {
  memberName: (id?: string | null) => string
  lastContactAt: (l: Lead) => string | null
  interactionCount: (id: string) => number
}

function PipelineBoard({
  columns, leads, onOpen, onDrop, onQuickAdd, ...helpers
}: {
  columns: { value: string; label: string }[]
  leads: Lead[]
  onOpen: (id: string) => void
  onDrop: (id: string, status: string) => void
  onQuickAdd: (status: string, name: string) => void
} & CardHelpers) {
  const [over, setOver] = useState<string | null>(null)
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {columns.map((col) => {
        const items = leads.filter((l) => l.status === col.value)
        const total = items.reduce((s, l) => s + (l.potentialValue || 0), 0)
        return (
          <div
            key={col.value}
            onDragOver={(e) => { e.preventDefault(); setOver(col.value) }}
            onDragLeave={() => setOver((s) => (s === col.value ? null : s))}
            onDrop={(e) => {
              e.preventDefault()
              const id = e.dataTransfer.getData('text/plain')
              if (id) onDrop(id, col.value)
              setOver(null)
            }}
            className={cn(
              'flex w-72 shrink-0 flex-col gap-2.5 rounded-xl border p-3 transition-colors',
              over === col.value ? 'border-steel-500 bg-steel-tint/40' : 'border-subtle bg-ink-deep/30',
            )}
          >
            <div className="flex items-center justify-between px-1">
              <CatBadge catalog="crm_status" value={col.value} />
              <span className="font-mono text-mono-data text-faint tabular-nums">{items.length}</span>
            </div>
            {total > 0 && (
              <div className="px-1 font-mono text-[11px] text-faint tabular-nums">{fmtBRL(total)} em potencial</div>
            )}
            {items.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onOpen={() => onOpen(lead.id)}
                onDragStart={(e) => e.dataTransfer.setData('text/plain', lead.id)}
                {...helpers}
              />
            ))}
            {items.length === 0 && <p className="px-1 py-4 text-center text-body-s text-faint">Vazio.</p>}
            <QuickAddLead onAdd={(name) => onQuickAdd(col.value, name)} />
          </div>
        )
      })}
    </div>
  )
}

function LeadCard({
  lead, onOpen, onDragStart, interactionCount,
}: {
  lead: Lead
  onOpen: () => void
  onDragStart: (e: React.DragEvent) => void
} & CardHelpers) {
  const { getMember } = useProfiles()
  const owner = lead.ownerId ? getMember(lead.ownerId) : undefined
  const followupOverdue = lead.nextFollowupAt && isActiveLead(lead.status) && lead.nextFollowupAt <= todayIso()
  const nInteractions = interactionCount(lead.id)
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen() } }}
      className="group flex cursor-grab select-none flex-col gap-2.5 rounded-lg border border-line bg-slate-900 p-3 transition-colors hover:border-strong focus-visible:outline-none focus-visible:shadow-focus active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 flex-1 truncate text-body-s font-medium text-strong">{lead.name}</span>
        {lead.potentialValue > 0 && (
          <span className="shrink-0 font-mono text-[11px] text-ok tabular-nums">{fmtBRL(lead.potentialValue)}</span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <CatBadge catalog="crm_origin" value={lead.origin} />
        <CatBadge catalog="crm_interest" value={lead.interest} />
      </div>
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="flex items-center gap-2 text-faint">
          {owner && <Avatar size="xs" name={owner.name} src={owner.avatar ?? undefined} />}
          {nInteractions > 0 && (
            <span className="font-mono text-[11px] tabular-nums">{nInteractions}×</span>
          )}
        </div>
        {lead.nextFollowupAt && (
          <span className={cn('inline-flex items-center gap-1 font-mono text-[11px] tabular-nums', followupOverdue ? 'text-err' : 'text-faint')}>
            <CalendarClock size={12} strokeWidth={1.5} aria-hidden />
            {fmtDateBR(lead.nextFollowupAt)}
          </span>
        )}
      </div>
    </div>
  )
}

function QuickAddLead({ onAdd }: { onAdd: (name: string) => void }) {
  const [val, setVal] = useState('')
  const submit = () => {
    const t = val.trim()
    if (!t) return
    onAdd(t)
    setVal('')
  }
  return (
    <input
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
      onBlur={submit}
      placeholder="+ Adicionar lead"
      className="w-full rounded-md border border-dashed border-line bg-transparent px-2.5 py-1.5 text-body-s text-strong placeholder:text-faint focus:border-steel-500 focus:outline-none"
    />
  )
}

/* ------------------------------------------------------------- tabela de leads */

function LeadsTable({
  leads, onOpen, memberName, lastContactAt, interactionCount,
}: {
  leads: Lead[]
  onOpen: (id: string) => void
} & CardHelpers) {
  if (leads.length === 0) {
    return <EmptyState className="my-8" title="Nenhum lead" description="Adicione um lead ou importe a base por CSV." />
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Nome</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Origem</TableHeaderCell>
            <TableHeaderCell>Produto</TableHeaderCell>
            <TableHeaderCell className="text-right">Valor</TableHeaderCell>
            <TableHeaderCell>Responsável</TableHeaderCell>
            <TableHeaderCell>Últ. contato</TableHeaderCell>
            <TableHeaderCell>Follow-up</TableHeaderCell>
            <TableHeaderCell className="text-right">Interações</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {leads.map((l) => (
            <TableRow key={l.id} className="cursor-pointer" onClick={() => onOpen(l.id)}>
              <TableCell className="font-medium text-strong">{l.name}</TableCell>
              <TableCell><CatBadge catalog="crm_status" value={l.status} /></TableCell>
              <TableCell><CatBadge catalog="crm_origin" value={l.origin} /></TableCell>
              <TableCell className="text-muted">{l.product ?? '—'}</TableCell>
              <TableCell className="text-right font-mono tabular-nums text-fg">{l.potentialValue ? fmtBRL(l.potentialValue) : '—'}</TableCell>
              <TableCell className="text-muted">{memberName(l.ownerId)}</TableCell>
              <TableCell className="font-mono text-mono-data tabular-nums text-muted">{fmtDateBR(lastContactAt(l)) || '—'}</TableCell>
              <TableCell className="font-mono text-mono-data tabular-nums text-muted">{fmtDateBR(l.nextFollowupAt) || '—'}</TableCell>
              <TableCell className="text-right font-mono tabular-nums text-muted">{interactionCount(l.id)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

/* ------------------------------------------------------------- dashboard */

function DistRow({ label, count, value, total, hex }: { label: React.ReactNode; count: number; value: number; total: number; hex: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="flex w-44 shrink-0 items-center gap-2 truncate text-body-s text-fg">{label}</span>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-ink-deep/60">
        <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct}%`, backgroundColor: hex }} aria-hidden />
      </div>
      <span className="w-10 shrink-0 text-right font-mono text-mono-data tabular-nums text-strong">{count}</span>
      <span className="w-24 shrink-0 text-right font-mono text-mono-data tabular-nums text-faint">{value > 0 ? fmtBRL(value) : '—'}</span>
    </div>
  )
}

function Dashboard({ leads, memberName }: { leads: Lead[]; memberName: (id?: string | null) => string }) {
  const { items, tone } = useCatalogs()
  const kpis = useMemo(() => buildKpis(leads), [leads])
  const byStatus = useMemo(() => breakdownBy(leads, 'status'), [leads])
  const byOrigin = useMemo(() => breakdownBy(leads, 'origin'), [leads])
  const owners = useMemo(() => ownerStats(leads), [leads])

  const TONE_HEX: Record<string, string> = {
    steel: '#9eab87', sand: '#d8c6a8', success: '#5a9e6f', warning: '#cc9a3a', danger: '#c0574f',
    neutral: '#5b6470', blue: '#3f6fa6', teal: '#2f9c9c', purple: '#7a5bb0', pink: '#c45c93', orange: '#cc7836', graphite: '#5b6470',
  }
  const hexOf = (catalog: CatalogKey, value: string) => TONE_HEX[tone(catalog, value)] ?? '#5b6470'

  if (leads.length === 0) {
    return <EmptyState className="my-8" title="Sem dados" description="Cadastre leads para ver os indicadores." />
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total de leads" value={kpis.total} />
        <StatCard label="Ativos" value={kpis.active} />
        <StatCard label="Ganhos" value={kpis.won} />
        <StatCard label="Perdidos" value={kpis.lost} />
        <StatCard label="Valor potencial" value={fmtBRL(kpis.potentialTotal)} />
        <StatCard label="Valor ganho" value={fmtBRL(kpis.wonValue)} active={kpis.wonValue > 0} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-h3">Leads por status</CardTitle></CardHeader>
          <div className="flex flex-col gap-3">
            {items('crm_status').map((s) => {
              const b = byStatus[s.value] ?? { count: 0, value: 0 }
              return <DistRow key={s.id} label={<CatBadge catalog="crm_status" value={s.value} />} count={b.count} value={b.value} total={kpis.total} hex={hexOf('crm_status', s.value)} />
            })}
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-h3">Leads por origem</CardTitle></CardHeader>
          <div className="flex flex-col gap-3">
            {items('crm_origin').map((o) => {
              const b = byOrigin[o.value] ?? { count: 0, value: 0 }
              if (b.count === 0) return null
              return <DistRow key={o.id} label={<CatBadge catalog="crm_origin" value={o.value} />} count={b.count} value={b.value} total={kpis.total} hex={hexOf('crm_origin', o.value)} />
            })}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-h3">Desempenho por responsável</CardTitle></CardHeader>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Responsável</TableHeaderCell>
              <TableHeaderCell className="text-right">Total</TableHeaderCell>
              <TableHeaderCell className="text-right">Ganhos</TableHeaderCell>
              <TableHeaderCell className="text-right">Perdidos</TableHeaderCell>
              <TableHeaderCell className="text-right">Conversão</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {owners.map((o) => (
              <TableRow key={o.ownerId ?? 'none'}>
                <TableCell className="text-fg">{o.ownerId ? memberName(o.ownerId) : 'Sem responsável'}</TableCell>
                <TableCell className="text-right font-mono tabular-nums text-muted">{o.total}</TableCell>
                <TableCell className="text-right font-mono tabular-nums text-ok">{o.won}</TableCell>
                <TableCell className="text-right font-mono tabular-nums text-err">{o.lost}</TableCell>
                <TableCell className="text-right font-mono tabular-nums text-strong">{Math.round(o.conversion * 100)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------- drawer do lead */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-mono-label font-mono uppercase text-muted">{label}</span>
      {children}
    </label>
  )
}

function LeadDrawer({ leadId, onClose, canDelete }: { leadId: string; onClose: () => void; canDelete: boolean }) {
  const { leads, updateLead, removeLead } = useCrm()
  const { members } = useProfiles()
  const { toast } = useToast()
  const lead = leads.find((l) => l.id === leadId)
  const [confirmDel, setConfirmDel] = useState(false)

  if (!lead) return null
  const set = (patch: Partial<Lead>) => updateLead(lead.id, patch)

  const ownerOptions = members.map((m) => ({
    value: m.id,
    label: m.name,
    icon: <Avatar size="xs" name={m.name} src={m.avatar ?? undefined} />,
  }))

  return (
    <Drawer open onClose={onClose} width={560} title={lead.name || 'Lead'} description="Ficha do lead e histórico de contatos">
      <div className="flex flex-col gap-5">
        <Field label="Nome">
          <Input value={lead.name} onChange={(e) => set({ name: e.target.value })} placeholder="Nome do lead" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="WhatsApp">
            <Input value={lead.whatsapp ?? ''} onChange={(e) => set({ whatsapp: e.target.value })} placeholder="+55…" />
          </Field>
          <Field label="E-mail">
            <Input value={lead.email ?? ''} onChange={(e) => set({ email: e.target.value })} placeholder="email@…" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <CatalogSelect catalog="crm_origin" label="Origem" value={lead.origin} onChange={(v) => set({ origin: v })} />
          <CatalogSelect catalog="crm_product" label="Produto/Serviço" value={lead.product} onChange={(v) => set({ product: v })} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor potencial (R$)">
            <Input
              type="number" min={0} step={1}
              value={lead.potentialValue || ''}
              onChange={(e) => set({ potentialValue: Number(e.target.value) || 0 })}
              placeholder="0"
            />
          </Field>
          <CatalogSelect catalog="crm_interest" label="Interesse" value={lead.interest} onChange={(v) => set({ interest: v })} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <CatalogSelect catalog="crm_funnel_stage" label="Etapa do funil" value={lead.funnelStage} onChange={(v) => set({ funnelStage: v })} />
          <CatalogSelect catalog="crm_status" label="Status" value={lead.status} onChange={(v) => set({ status: v })} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Responsável">
            <Combobox
              options={ownerOptions}
              value={lead.ownerId ?? null}
              onChange={(v) => set({ ownerId: v })}
              placeholder="Sem responsável"
            />
          </Field>
          <CatalogSelect catalog="crm_channel" label="Canal de contato" value={lead.contactChannel} onChange={(v) => set({ contactChannel: v })} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="1º contato">
            <DatePicker value={isoToDate(lead.firstContactAt)} onChange={(d) => set({ firstContactAt: dateToIso(d) })} />
          </Field>
          <Field label="Próximo follow-up">
            <DatePicker value={isoToDate(lead.nextFollowupAt)} onChange={(d) => set({ nextFollowupAt: dateToIso(d) })} />
          </Field>
        </div>

        <Field label="Objeção principal">
          <Input value={lead.mainObjection ?? ''} onChange={(e) => set({ mainObjection: e.target.value })} placeholder="Ex.: preço, timing…" />
        </Field>

        <Field label="Histórico / observações">
          <Textarea rows={3} value={lead.notes ?? ''} onChange={(e) => set({ notes: e.target.value })} placeholder="Contexto, combinados, detalhes…" />
        </Field>

        <InteractionsSection leadId={lead.id} />

        <div className="flex items-center justify-between border-t border-line pt-4">
          {canDelete ? (
            confirmDel ? (
              <div className="flex items-center gap-2">
                <span className="text-body-s text-muted">Excluir?</span>
                <Button variant="danger" size="sm" onClick={async () => { await removeLead(lead.id); toast({ title: 'Lead excluído', tone: 'success' }); onClose() }}>Confirmar</Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDel(false)}>Cancelar</Button>
              </div>
            ) : (
              <Button variant="danger" size="sm" leftIcon={<Trash2 size={16} strokeWidth={1.5} />} onClick={() => setConfirmDel(true)}>Excluir lead</Button>
            )
          ) : <span />}
          <Button variant="secondary" size="sm" onClick={onClose}>Fechar</Button>
        </div>
      </div>
    </Drawer>
  )
}

/* ------------------------------------------------------- histórico de interações */

function InteractionsSection({ leadId }: { leadId: string }) {
  const { user } = useSession()
  const { interactionsFor, addInteraction, removeInteraction } = useCrm()
  const list = interactionsFor(leadId)
  const [adding, setAdding] = useState(false)

  return (
    <div className="rounded-lg border border-line bg-ink-deep/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-body font-semibold text-strong">Histórico de interações</h3>
        {!adding && (
          <Button variant="ghost" size="sm" leftIcon={<MessageSquarePlus size={16} strokeWidth={1.5} />} onClick={() => setAdding(true)}>
            Registrar
          </Button>
        )}
      </div>

      {adding && (
        <AddInteractionForm
          onCancel={() => setAdding(false)}
          onSave={async (draft) => {
            await addInteraction({ leadId, ownerId: user.id, ...draft })
            setAdding(false)
          }}
        />
      )}

      {list.length === 0 && !adding && (
        <p className="py-2 text-body-s text-faint">Nenhuma interação registrada ainda.</p>
      )}

      <ul className="flex flex-col gap-3">
        {list.map((it) => (
          <InteractionItem key={it.id} it={it} onRemove={() => removeInteraction(it.id)} />
        ))}
      </ul>
    </div>
  )
}

function InteractionItem({ it, onRemove }: { it: LeadInteraction; onRemove: () => void }) {
  const { getMember } = useProfiles()
  return (
    <li className="group flex flex-col gap-1.5 rounded-md border border-subtle bg-slate-900 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-mono-data tabular-nums text-muted">{fmtDateBR(it.date)}</span>
          <CatBadge catalog="crm_interaction_type" value={it.type} />
          <CatBadge catalog="crm_channel" value={it.channel} />
        </div>
        <IconButton aria-label="Excluir interação" size="sm" className="opacity-0 group-hover:opacity-100" onClick={onRemove}>
          <Trash2 size={14} strokeWidth={1.5} aria-hidden />
        </IconButton>
      </div>
      {it.summary && <p className="text-body-s text-fg">{it.summary}</p>}
      {it.nextAction && (
        <p className="text-body-s text-muted"><span className="font-mono text-[11px] uppercase text-faint">Próxima ação:</span> {it.nextAction}</p>
      )}
      {it.ownerId && <span className="text-[11px] text-faint">{getMember(it.ownerId)?.name}</span>}
    </li>
  )
}

function AddInteractionForm({
  onSave, onCancel,
}: {
  onSave: (draft: { date: string; type?: string; channel?: string; summary?: string; nextAction?: string }) => void
  onCancel: () => void
}) {
  const [date, setDate] = useState<Date | null>(new Date())
  const [type, setType] = useState('')
  const [channel, setChannel] = useState('')
  const [summary, setSummary] = useState('')
  const [nextAction, setNextAction] = useState('')

  return (
    <div className="mb-3 flex flex-col gap-3 rounded-md border border-line bg-slate-900 p-3">
      <div className="grid grid-cols-3 gap-2">
        <Field label="Data">
          <DatePicker value={date} onChange={setDate} />
        </Field>
        <CatalogSelect catalog="crm_interaction_type" label="Tipo" value={type} onChange={setType} />
        <CatalogSelect catalog="crm_channel" label="Canal" value={channel} onChange={setChannel} />
      </div>
      <Field label="Resumo">
        <Textarea rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="O que aconteceu no contato…" />
      </Field>
      <Field label="Próxima ação">
        <Input value={nextAction} onChange={(e) => setNextAction(e.target.value)} placeholder="Ex.: enviar proposta em 2 dias" />
      </Field>
      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>
        <Button
          size="sm"
          onClick={() => onSave({
            date: dateToIso(date) ?? todayIso(),
            type: type || undefined,
            channel: channel || undefined,
            summary: summary || undefined,
            nextAction: nextAction || undefined,
          })}
        >
          Salvar interação
        </Button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- importação CSV */

function ImportModal({
  onClose, onImport, members,
}: {
  onClose: () => void
  onImport: (rows: ReturnType<typeof parseLeadsCsv>) => void
  members: { id: string; name: string }[]
}) {
  const [parsed, setParsed] = useState<ReturnType<typeof parseLeadsCsv> | null>(null)
  const [fileName, setFileName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    const text = await file.text()
    setFileName(file.name)
    setParsed(parseLeadsCsv(text, members))
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Importar leads (CSV)"
      description="Envie a planilha exportada. As colunas são reconhecidas pelo cabeçalho (Nome, WhatsApp, Origem, Status, Responsável…)."
      footer={
        <>
          <Button variant="ghost" size="sm" leftIcon={<FileDown size={16} strokeWidth={1.5} />} onClick={() => downloadText('modelo-crm.csv', leadsCsvTemplate())}>
            Baixar modelo
          </Button>
          <div className="flex-1" />
          <Button variant="secondary" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" disabled={!parsed || parsed.length === 0} onClick={() => parsed && onImport(parsed)}>
            Importar {parsed && parsed.length > 0 ? `${parsed.length} lead(s)` : ''}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
        <button
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line bg-ink-deep/30 p-8 text-center transition-colors hover:border-steel-500"
        >
          <Upload size={24} strokeWidth={1.5} className="text-muted" aria-hidden />
          <span className="text-body-s text-fg">{fileName || 'Clique para escolher um arquivo CSV'}</span>
        </button>

        {parsed && (
          <div className="rounded-lg border border-line">
            <div className="border-b border-line px-3 py-2 text-body-s text-muted">
              {parsed.length} lead(s) reconhecido(s){parsed.length > 0 ? ' — prévia dos primeiros:' : '.'}
            </div>
            {parsed.length > 0 && (
              <ul className="max-h-52 divide-y divide-subtle overflow-y-auto">
                {parsed.slice(0, 8).map((l, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 px-3 py-2 text-body-s">
                    <span className="truncate text-strong">{l.name}</span>
                    <span className="shrink-0 font-mono text-[11px] text-faint">{l.status ?? 'Novo'}{l.potentialValue ? ` · ${fmtBRL(l.potentialValue)}` : ''}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
