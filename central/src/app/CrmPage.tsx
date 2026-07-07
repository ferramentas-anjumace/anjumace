import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Plus, Upload, Download, Trash2, CalendarClock, MessageSquarePlus, FileDown, Maximize2,
  Contact, ListChecks, Radar, Users, MessageCircle,
} from 'lucide-react'
import {
  Card, CardHeader, CardTitle, CardIcon, StatCard, Button, IconButton, Input, Textarea, Select,
  Combobox, DatePicker, Drawer, Modal, EmptyState, SearchField, Avatar,
  Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell,
  Tabs, TabList, Tab, TabPanel, useToast,
} from '@/components/ui'
import { cn } from '@/lib/cn'
import { useSession } from '@/lib/session'
import { usePermissions } from '@/lib/permissions'
import { useProfiles } from './profiles'
import { useCatalogs, CatalogBadge, type CatalogKey } from './catalogs'
import {
  useCrm, fmtBRL, fmtDateBR, waHref, isActiveLead, isWon, isLost, isInactive,
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
  catalog, value, onChange, label, placeholder, className, disabled,
}: {
  catalog: CatalogKey
  value?: string
  onChange: (v: string) => void
  label?: React.ReactNode
  placeholder?: string
  className?: string
  disabled?: boolean
}) {
  const { items } = useCatalogs()
  return (
    <Select
      label={label}
      className={className}
      value={value ?? ''}
      disabled={disabled}
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

/** Ícone-link que abre o WhatsApp da pessoa (wa.me). Nulo se não houver número. */
function WaLink({ whatsapp, size = 16, className }: { whatsapp?: string | null; size?: number; className?: string }) {
  const href = waHref(whatsapp)
  if (!href) return null
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      draggable={false}
      onClick={(e) => e.stopPropagation()}
      title="Abrir no WhatsApp"
      aria-label="Abrir no WhatsApp"
      className={cn(
        'inline-flex shrink-0 items-center text-ok transition-colors hover:text-ok/70 focus-visible:outline-none focus-visible:shadow-focus',
        className,
      )}
    >
      <MessageCircle size={size} strokeWidth={1.5} aria-hidden />
    </a>
  )
}

/* =========================================================================== */

type OwnerFilter = 'all' | 'me' | string

export function CrmPage() {
  const { user } = useSession()
  const { can } = usePermissions()
  const { members, getMember } = useProfiles()
  const { items } = useCatalogs()
  const { toast } = useToast()
  const {
    leads, loading, addLead, setLeadStatus, importLeads,
    lastContactAt, interactionCount,
  } = useCrm()

  const [tab, setTab] = useState('pipeline')
  const [owner, setOwner] = useState<OwnerFilter>('all')
  const [origin, setOrigin] = useState('all')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  // Deep-link vindo do widget "Meus follow-ups" da Home: /app/crm?lead=<id>.
  const [searchParams, setSearchParams] = useSearchParams()
  const leadParam = searchParams.get('lead')
  useEffect(() => {
    if (!leadParam) return
    setOpenId(leadParam)
    searchParams.delete('lead')
    setSearchParams(searchParams, { replace: true })
  }, [leadParam, searchParams, setSearchParams])

  const memberName = (id?: string | null) => (id ? getMember(id)?.name ?? '—' : '—')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    // Busca por telefone ignora formatação: compara só os dígitos, com e sem o 55 do país.
    const qDigits = q.replace(/\D/g, '')
    return leads.filter((l) => {
      if (owner === 'me' && l.ownerId !== user.id) return false
      if (owner !== 'all' && owner !== 'me' && l.ownerId !== owner) return false
      if (origin !== 'all' && l.origin !== origin) return false
      if (q) {
        const matchText = `${l.name} ${l.whatsapp ?? ''} ${l.email ?? ''}`.toLowerCase().includes(q)
        const leadDigits = (l.whatsapp ?? '').replace(/\D/g, '')
        const matchPhone = qDigits.length >= 2 && leadDigits.length > 0 && (
          leadDigits.includes(qDigits) ||
          (qDigits.startsWith('55') && leadDigits.includes(qDigits.slice(2))) ||
          `55${leadDigits}`.includes(qDigits)
        )
        if (!matchText && !matchPhone) return false
      }
      return true
    })
  }, [leads, owner, origin, query, user.id])

  // Todos veem o CRM; só quem tem `manage_crm` edita (o resto é só-leitura).
  const canManage = can('manage_crm')

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
        <div className="flex items-start gap-3">
          <CardIcon tone="gold" className="mt-0.5"><Contact size={18} strokeWidth={1.5} aria-hidden /></CardIcon>
          <div>
            <h1 className="font-display text-h1 font-semibold text-strong">Comercial · CRM</h1>
            <p className="mt-1 text-body-s text-muted">
              Pipeline de vendas, leads e histórico de contatos — tudo num só lugar.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canManage && (
            <Button variant="secondary" size="sm" leftIcon={<Upload size={16} strokeWidth={1.5} />} onClick={() => setImportOpen(true)}>
              Importar CSV
            </Button>
          )}
          <Button variant="secondary" size="sm" leftIcon={<Download size={16} strokeWidth={1.5} />} onClick={handleExport}>
            Exportar
          </Button>
          {canManage && (
            <Button size="sm" leftIcon={<Plus size={16} strokeWidth={1.5} />} onClick={handleNewLead}>
              Novo lead
            </Button>
          )}
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
        <Select value={origin} onChange={(e) => setOrigin(e.target.value)} className="w-48">
          <option value="all">Todas as origens</option>
          {items('crm_origin').map((o) => (
            <option key={o.id} value={o.value}>{o.label}</option>
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
          <Tab value="planilha">Planilha</Tab>
          <Tab value="dashboard">Dashboard</Tab>
        </TabList>

        <TabPanel value="pipeline">
          {loading ? (
            <p className="py-16 text-center text-body-s text-faint">Carregando…</p>
          ) : (
            <PipelineBoard
              columns={statusCols.map((s) => ({ value: s.value, label: s.label }))}
              leads={filtered}
              canManage={canManage}
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

        <TabPanel value="planilha">
          <SpreadsheetView leads={filtered} canManage={canManage} onOpen={setOpenId} />
        </TabPanel>

        <TabPanel value="dashboard">
          <Dashboard leads={filtered} memberName={memberName} />
        </TabPanel>
      </Tabs>

      {openId && (
        <LeadDrawer leadId={openId} onClose={() => setOpenId(null)} canManage={canManage} canDelete={canManage} />
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
  columns, leads, canManage, onOpen, onDrop, onQuickAdd, ...helpers
}: {
  columns: { value: string; label: string }[]
  leads: Lead[]
  canManage: boolean
  onOpen: (id: string) => void
  onDrop: (id: string, status: string) => void
  onQuickAdd: (status: string, name: string) => void
} & CardHelpers) {
  const [over, setOver] = useState<string | null>(null)

  // Arrastar-para-navegar (pan) horizontal do quadro. Usa refs para não
  // re-renderizar a cada mousemove. Ignora cliques em cards (role=button/
  // draggable) e controles, para não atrapalhar o arraste de card nem inputs.
  const scrollRef = useRef<HTMLDivElement>(null)
  const pan = useRef<{ x: number; left: number } | null>(null)

  function onPanDown(e: React.MouseEvent) {
    if (e.button !== 0) return
    if ((e.target as HTMLElement).closest('input, textarea, button, a, [role="button"], [draggable="true"]')) return
    const c = scrollRef.current
    if (!c) return
    pan.current = { x: e.pageX, left: c.scrollLeft }
    c.classList.add('cursor-grabbing', 'select-none')
  }
  function onPanMove(e: React.MouseEvent) {
    const c = scrollRef.current
    if (!pan.current || !c) return
    e.preventDefault()
    c.scrollLeft = pan.current.left - (e.pageX - pan.current.x)
  }
  function endPan() {
    if (!pan.current) return
    pan.current = null
    scrollRef.current?.classList.remove('cursor-grabbing', 'select-none')
  }

  return (
    <div
      ref={scrollRef}
      onMouseDown={onPanDown}
      onMouseMove={onPanMove}
      onMouseUp={endPan}
      onMouseLeave={endPan}
      className="flex cursor-grab gap-4 overflow-x-auto pb-2"
    >
      {columns.map((col) => {
        const items = leads.filter((l) => l.status === col.value)
        const total = items.reduce((s, l) => s + (l.potentialValue || 0), 0)
        return (
          <div
            key={col.value}
            onDragOver={canManage ? (e) => { e.preventDefault(); setOver(col.value) } : undefined}
            onDragLeave={canManage ? () => setOver((s) => (s === col.value ? null : s)) : undefined}
            onDrop={canManage ? (e) => {
              e.preventDefault()
              const id = e.dataTransfer.getData('text/plain')
              if (id) onDrop(id, col.value)
              setOver(null)
            } : undefined}
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
            {/* Lista de cards: altura limitada, rola por dentro (não estica a coluna). */}
            <div className="-mr-1 flex max-h-[calc(100vh-360px)] min-h-[80px] flex-col gap-2.5 overflow-y-auto pr-1">
              {items.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  canDrag={canManage}
                  onOpen={() => onOpen(lead.id)}
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', lead.id)}
                  {...helpers}
                />
              ))}
              {items.length === 0 && <p className="px-1 py-4 text-center text-body-s text-faint">Vazio.</p>}
            </div>
            {canManage && <QuickAddLead onAdd={(name) => onQuickAdd(col.value, name)} />}
          </div>
        )
      })}
    </div>
  )
}

function LeadCard({
  lead, canDrag, onOpen, onDragStart, interactionCount,
}: {
  lead: Lead
  canDrag: boolean
  onOpen: () => void
  onDragStart: (e: React.DragEvent) => void
} & CardHelpers) {
  const { getMember } = useProfiles()
  const owner = lead.ownerId ? getMember(lead.ownerId) : undefined
  const followupOverdue = lead.nextFollowupAt && isActiveLead(lead.status) && lead.nextFollowupAt <= todayIso()
  const nInteractions = interactionCount(lead.id)
  return (
    <div
      draggable={canDrag}
      onDragStart={canDrag ? onDragStart : undefined}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen() } }}
      className={cn(
        'group flex select-none flex-col gap-2.5 rounded-lg border border-line bg-slate-900 p-3 transition-colors hover:border-strong focus-visible:outline-none focus-visible:shadow-focus',
        canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
      )}
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
          <WaLink whatsapp={lead.whatsapp} size={14} />
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
              <TableCell className="font-medium text-strong">
                <span className="inline-flex items-center gap-2">
                  {l.name}
                  <WaLink whatsapp={l.whatsapp} size={15} />
                </span>
              </TableCell>
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

/* --------------------------------------------------- planilha (grade editável) */

// Célula editável genérica: input transparente que "acende" ao focar.
const GRID_INPUT = 'w-full min-w-0 bg-transparent px-2 py-1.5 text-body-s text-fg rounded-sm focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-steel-500'

function GridText({ value, onChange, type = 'text', align, disabled }: {
  value: string
  onChange: (v: string) => void
  type?: string
  align?: 'right'
  disabled?: boolean
}) {
  return (
    <input
      type={type}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={cn(GRID_INPUT, align === 'right' && 'text-right tabular-nums', disabled && 'cursor-default')}
    />
  )
}

function GridDate({ value, onChange, disabled }: { value?: string | null; onChange: (v: string | null) => void; disabled?: boolean }) {
  return (
    <input
      type="date"
      value={value ?? ''}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value || null)}
      className={cn(GRID_INPUT, 'tabular-nums [color-scheme:dark]', disabled && 'cursor-default')}
    />
  )
}

function GridCatSelect({ catalog, value, onChange, disabled }: { catalog: CatalogKey; value?: string; onChange: (v: string) => void; disabled?: boolean }) {
  const { items } = useCatalogs()
  return (
    <select value={value ?? ''} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={cn(GRID_INPUT, disabled ? 'cursor-default' : 'cursor-pointer')}>
      <option value="">—</option>
      {items(catalog).map((it) => (
        <option key={it.id} value={it.value}>{it.label}</option>
      ))}
    </select>
  )
}

function SpreadsheetView({ leads, canManage, onOpen }: { leads: Lead[]; canManage: boolean; onOpen: (id: string) => void }) {
  const { updateLead, setLeadStatus, removeLead, lastContactAt, interactionCount } = useCrm()
  const ro = !canManage
  const { members } = useProfiles()
  const { items } = useCatalogs()
  const statusOpts = items('crm_status')

  if (leads.length === 0) {
    return <EmptyState className="my-8" title="Nenhum lead" description="Adicione um lead ou importe a base por CSV." />
  }

  const th = 'whitespace-nowrap border-b border-line px-2 py-2 text-left font-mono text-[11px] uppercase text-muted'
  const td = 'border-b border-r border-subtle align-middle'

  const resultOf = (status: string) => {
    if (isWon(status)) return <CatalogChip label="Ganho" tone="success" />
    if (isLost(status)) return <CatalogChip label="Perdido" tone="danger" />
    if (isInactive(status)) return <CatalogChip label="Inativo" tone="neutral" />
    return <span className="px-2 text-faint">—</span>
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="min-w-[2000px] border-collapse">
        <thead className="bg-ink-deep/50">
          <tr>
            <th className={cn(th, 'w-10 text-center')}>#</th>
            <th className={cn(th, 'border-r border-subtle')}>Nome</th>
            <th className={th}>WhatsApp</th>
            <th className={th}>E-mail</th>
            <th className={th}>Origem</th>
            <th className={th}>Produto/Serviço</th>
            <th className={cn(th, 'text-right')}>Valor (R$)</th>
            <th className={th}>Etapa do Funil</th>
            <th className={th}>Status</th>
            <th className={th}>Responsável</th>
            <th className={th}>1º Contato</th>
            <th className={th}>Últ. Contato</th>
            <th className={th}>Próx. Follow-up</th>
            <th className={cn(th, 'text-right')}>Qtd.</th>
            <th className={th}>Canal</th>
            <th className={th}>Interesse</th>
            <th className={th}>Objeção Principal</th>
            <th className={th}>Histórico / Observações</th>
            <th className={th}>Fechamento</th>
            <th className={th}>Resultado</th>
            <th className={cn(th, 'w-16 text-center')}></th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l, idx) => {
            const set = (patch: Partial<Lead>) => updateLead(l.id, patch)
            return (
              <tr key={l.id} className="hover:bg-slate-900/40">
                <td className={cn(td, 'px-2 text-center font-mono text-[11px] text-faint tabular-nums')}>{idx + 1}</td>
                <td className={cn(td, 'min-w-[180px] border-r-line')}>
                  <GridText value={l.name} disabled={ro} onChange={(v) => set({ name: v })} />
                </td>
                <td className={cn(td, 'min-w-[150px]')}>
                  <div className="flex items-center gap-1">
                    <GridText value={l.whatsapp ?? ''} disabled={ro} onChange={(v) => set({ whatsapp: v })} />
                    <WaLink whatsapp={l.whatsapp} size={14} className="pr-1" />
                  </div>
                </td>
                <td className={cn(td, 'min-w-[180px]')}><GridText type="email" value={l.email ?? ''} disabled={ro} onChange={(v) => set({ email: v })} /></td>
                <td className={cn(td, 'min-w-[120px]')}><GridCatSelect catalog="crm_origin" value={l.origin} disabled={ro} onChange={(v) => set({ origin: v })} /></td>
                <td className={cn(td, 'min-w-[130px]')}><GridCatSelect catalog="crm_product" value={l.product} disabled={ro} onChange={(v) => set({ product: v })} /></td>
                <td className={cn(td, 'min-w-[110px]')}>
                  <GridText align="right" type="number" value={l.potentialValue ? String(l.potentialValue) : ''} disabled={ro} onChange={(v) => set({ potentialValue: Number(v) || 0 })} />
                </td>
                <td className={cn(td, 'min-w-[130px]')}><GridCatSelect catalog="crm_funnel_stage" value={l.funnelStage} disabled={ro} onChange={(v) => set({ funnelStage: v })} /></td>
                <td className={cn(td, 'min-w-[150px]')}>
                  <select value={l.status} disabled={ro} onChange={(e) => setLeadStatus(l.id, e.target.value)} className={cn(GRID_INPUT, 'font-medium', ro ? 'cursor-default' : 'cursor-pointer')}>
                    {statusOpts.map((it) => <option key={it.id} value={it.value}>{it.label}</option>)}
                  </select>
                </td>
                <td className={cn(td, 'min-w-[130px]')}>
                  <select value={l.ownerId ?? ''} disabled={ro} onChange={(e) => set({ ownerId: e.target.value || null })} className={cn(GRID_INPUT, ro ? 'cursor-default' : 'cursor-pointer')}>
                    <option value="">—</option>
                    {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </td>
                <td className={cn(td, 'min-w-[130px]')}><GridDate value={l.firstContactAt} disabled={ro} onChange={(v) => set({ firstContactAt: v })} /></td>
                <td className={cn(td, 'min-w-[110px] px-2 font-mono text-mono-data text-faint tabular-nums')}>{fmtDateBR(lastContactAt(l)) || '—'}</td>
                <td className={cn(td, 'min-w-[130px]')}><GridDate value={l.nextFollowupAt} disabled={ro} onChange={(v) => set({ nextFollowupAt: v })} /></td>
                <td className={cn(td, 'px-2 text-right font-mono text-mono-data text-muted tabular-nums')}>{interactionCount(l.id)}</td>
                <td className={cn(td, 'min-w-[130px]')}><GridCatSelect catalog="crm_channel" value={l.contactChannel} disabled={ro} onChange={(v) => set({ contactChannel: v })} /></td>
                <td className={cn(td, 'min-w-[100px]')}><GridCatSelect catalog="crm_interest" value={l.interest} disabled={ro} onChange={(v) => set({ interest: v })} /></td>
                <td className={cn(td, 'min-w-[200px]')}><GridText value={l.mainObjection ?? ''} disabled={ro} onChange={(v) => set({ mainObjection: v })} /></td>
                <td className={cn(td, 'min-w-[280px]')}><GridText value={l.notes ?? ''} disabled={ro} onChange={(v) => set({ notes: v })} /></td>
                <td className={cn(td, 'min-w-[130px]')}><GridDate value={l.closedAt} disabled={ro} onChange={(v) => set({ closedAt: v })} /></td>
                <td className={cn(td, 'min-w-[110px] px-1')}>{resultOf(l.status)}</td>
                <td className={cn(td, 'border-r-0 px-1')}>
                  <div className="flex items-center justify-center gap-0.5">
                    <IconButton aria-label="Abrir ficha" size="sm" onClick={() => onOpen(l.id)}>
                      <Maximize2 size={14} strokeWidth={1.5} aria-hidden />
                    </IconButton>
                    {canManage && (
                      <IconButton aria-label="Excluir lead" size="sm" onClick={() => { if (confirm(`Excluir "${l.name}"?`)) removeLead(l.id) }}>
                        <Trash2 size={14} strokeWidth={1.5} aria-hidden />
                      </IconButton>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/** Chip compacto para a coluna Resultado (não-editável). */
function CatalogChip({ label, tone }: { label: string; tone: 'success' | 'danger' | 'neutral' }) {
  return <CatalogBadge tone={tone} size="sm">{label}</CatalogBadge>
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
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <CardIcon tone="gold"><ListChecks size={18} strokeWidth={1.5} aria-hidden /></CardIcon>
              <CardTitle className="text-h3">Leads por status</CardTitle>
            </div>
          </CardHeader>
          <div className="flex flex-col gap-3">
            {items('crm_status').map((s) => {
              const b = byStatus[s.value] ?? { count: 0, value: 0 }
              return <DistRow key={s.id} label={<CatBadge catalog="crm_status" value={s.value} />} count={b.count} value={b.value} total={kpis.total} hex={hexOf('crm_status', s.value)} />
            })}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <CardIcon tone="gold"><Radar size={18} strokeWidth={1.5} aria-hidden /></CardIcon>
              <CardTitle className="text-h3">Leads por origem</CardTitle>
            </div>
          </CardHeader>
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
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <CardIcon tone="gold"><Users size={18} strokeWidth={1.5} aria-hidden /></CardIcon>
            <CardTitle className="text-h3">Desempenho por responsável</CardTitle>
          </div>
        </CardHeader>
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

function LeadDrawer({ leadId, onClose, canManage, canDelete }: { leadId: string; onClose: () => void; canManage: boolean; canDelete: boolean }) {
  const { leads, updateLead, removeLead } = useCrm()
  const { members } = useProfiles()
  const { toast } = useToast()
  const lead = leads.find((l) => l.id === leadId)
  const [confirmDel, setConfirmDel] = useState(false)

  if (!lead) return null
  const ro = !canManage
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
          <Input value={lead.name} disabled={ro} onChange={(e) => set({ name: e.target.value })} placeholder="Nome do lead" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="WhatsApp">
            <div className="flex items-center gap-2">
              <Input value={lead.whatsapp ?? ''} disabled={ro} onChange={(e) => set({ whatsapp: e.target.value })} placeholder="+55…" className="flex-1" />
              <WaLink
                whatsapp={lead.whatsapp}
                size={18}
                className="grid size-10 place-items-center rounded-xs border border-line hover:border-strong hover:bg-slate-800"
              />
            </div>
          </Field>
          <Field label="E-mail">
            <Input value={lead.email ?? ''} disabled={ro} onChange={(e) => set({ email: e.target.value })} placeholder="email@…" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <CatalogSelect catalog="crm_origin" label="Origem" value={lead.origin} disabled={ro} onChange={(v) => set({ origin: v })} />
          <CatalogSelect catalog="crm_product" label="Produto/Serviço" value={lead.product} disabled={ro} onChange={(v) => set({ product: v })} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor potencial (R$)">
            <Input
              type="number" min={0} step={1}
              value={lead.potentialValue || ''}
              disabled={ro}
              onChange={(e) => set({ potentialValue: Number(e.target.value) || 0 })}
              placeholder="0"
            />
          </Field>
          <CatalogSelect catalog="crm_interest" label="Interesse" value={lead.interest} disabled={ro} onChange={(v) => set({ interest: v })} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <CatalogSelect catalog="crm_funnel_stage" label="Etapa do funil" value={lead.funnelStage} disabled={ro} onChange={(v) => set({ funnelStage: v })} />
          <CatalogSelect catalog="crm_status" label="Status" value={lead.status} disabled={ro} onChange={(v) => set({ status: v })} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Responsável">
            <Combobox
              options={ownerOptions}
              value={lead.ownerId ?? null}
              disabled={ro}
              onChange={(v) => set({ ownerId: v })}
              placeholder="Sem responsável"
            />
          </Field>
          <CatalogSelect catalog="crm_channel" label="Canal de contato" value={lead.contactChannel} disabled={ro} onChange={(v) => set({ contactChannel: v })} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="1º contato">
            <DatePicker value={isoToDate(lead.firstContactAt)} disabled={ro} onChange={(d) => set({ firstContactAt: dateToIso(d) })} />
          </Field>
          <Field label="Próximo follow-up">
            <DatePicker value={isoToDate(lead.nextFollowupAt)} disabled={ro} onChange={(d) => set({ nextFollowupAt: dateToIso(d) })} />
          </Field>
        </div>

        <Field label="Objeção principal">
          <Input value={lead.mainObjection ?? ''} disabled={ro} onChange={(e) => set({ mainObjection: e.target.value })} placeholder="Ex.: preço, timing…" />
        </Field>

        <Field label="Histórico / observações">
          <Textarea rows={3} value={lead.notes ?? ''} disabled={ro} onChange={(e) => set({ notes: e.target.value })} placeholder="Contexto, combinados, detalhes…" />
        </Field>

        <InteractionsSection leadId={lead.id} canManage={canManage} />

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

function InteractionsSection({ leadId, canManage }: { leadId: string; canManage: boolean }) {
  const { user } = useSession()
  const { interactionsFor, addInteraction, removeInteraction } = useCrm()
  const list = interactionsFor(leadId)
  const [adding, setAdding] = useState(false)

  return (
    <div className="rounded-lg border border-line bg-ink-deep/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-body font-semibold text-strong">Histórico de interações</h3>
        {canManage && !adding && (
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
          <InteractionItem key={it.id} it={it} canManage={canManage} onRemove={() => removeInteraction(it.id)} />
        ))}
      </ul>
    </div>
  )
}

function InteractionItem({ it, canManage, onRemove }: { it: LeadInteraction; canManage: boolean; onRemove: () => void }) {
  const { getMember } = useProfiles()
  return (
    <li className="group flex flex-col gap-1.5 rounded-md border border-subtle bg-slate-900 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-mono-data tabular-nums text-muted">{fmtDateBR(it.date)}</span>
          <CatBadge catalog="crm_interaction_type" value={it.type} />
          <CatBadge catalog="crm_channel" value={it.channel} />
        </div>
        {canManage && (
          <IconButton aria-label="Excluir interação" size="sm" className="opacity-0 group-hover:opacity-100" onClick={onRemove}>
            <Trash2 size={14} strokeWidth={1.5} aria-hidden />
          </IconButton>
        )}
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
