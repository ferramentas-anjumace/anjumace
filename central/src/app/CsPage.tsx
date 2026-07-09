import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HeartHandshake, CalendarClock, Trash2, ExternalLink, MessageCircle, Import,
} from 'lucide-react'
import {
  CardIcon, StatCard, Button, Select, Textarea, DatePicker, Drawer, Modal,
  SearchField, Avatar, useToast,
} from '@/components/ui'
import { cn } from '@/lib/cn'
import { useSession } from '@/lib/session'
import { usePermissions } from '@/lib/permissions'
import { useProfiles } from './profiles'
import { useCatalogs, CatalogBadge, type CatalogKey } from './catalogs'
import { useCrm, fmtBRL, fmtDateBR, waHref, isWon, type Lead } from './crm'
import { useCs, isCsClosed, type CsCase } from './cs'

/* ----------------------------------------------------------------------------
   Comercial · CS (pós-venda) — kanban dos clientes ganhos
   ----------------------------------------------------------------------------
   Quando o comercial move um lead para "Fechado - Ganho" no CRM, um trigger
   no banco cria o caso aqui automaticamente (migration 0042). O CS segue a
   tratativa pelas etapas do catálogo cs_status (Onboarding → Acompanhamento →
   Renovação → Encerrado). O contato do cliente vem do lead do CRM (join por
   lead_id); o caso guarda só o que é do CS: etapa, responsável, notas e a
   próxima ação.
---------------------------------------------------------------------------- */

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

/** Rótulo + controle — mesmo padrão do drawer do CRM. */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-mono-label uppercase text-muted">{label}</span>
      {children}
    </label>
  )
}

/** Badge colorido de um valor de catálogo (tom definido em Catálogos). */
function CatBadge({ catalog, value, size = 'sm' }: { catalog: CatalogKey; value?: string; size?: 'sm' | 'md' }) {
  const { tone, label } = useCatalogs()
  if (!value) return null
  return <CatalogBadge tone={tone(catalog, value)} size={size}>{label(catalog, value)}</CatalogBadge>
}

/** Ícone-link que abre o WhatsApp do cliente (wa.me). */
function WaLink({ whatsapp, size = 16 }: { whatsapp?: string | null; size?: number }) {
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
      className="inline-flex shrink-0 items-center text-ok transition-colors hover:text-ok/70 focus-visible:outline-none focus-visible:shadow-focus"
    >
      <MessageCircle size={size} strokeWidth={1.5} aria-hidden />
    </a>
  )
}

type OwnerFilter = 'all' | 'me' | string

export function CsPage() {
  const { can } = usePermissions()
  const { members, getMember } = useProfiles()
  const { items } = useCatalogs()
  const { toast } = useToast()
  const { leads } = useCrm()
  const { cases, loading, setCaseStatus, addCasesForLeads } = useCs()
  const { user } = useSession()

  const [owner, setOwner] = useState<OwnerFilter>('all')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  const canManage = can('manage_crm')

  const leadById = useMemo(() => new Map(leads.map((l) => [l.id, l])), [leads])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return cases.filter((c) => {
      if (owner === 'me' && c.ownerId !== user?.id) return false
      if (owner !== 'all' && owner !== 'me' && c.ownerId !== owner) return false
      if (q) {
        const lead = leadById.get(c.leadId)
        const hay = `${lead?.name ?? ''} ${lead?.whatsapp ?? ''} ${lead?.email ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [cases, owner, query, user?.id, leadById])

  const kpis = useMemo(() => {
    const monthStart = todayIso().slice(0, 7)
    let active = 0, closed = 0, newThisMonth = 0
    for (const c of cases) {
      if (isCsClosed(c.status)) closed++
      else active++
      if (c.createdAt.slice(0, 7) === monthStart) newThisMonth++
    }
    return { active, closed, newThisMonth, total: cases.length }
  }, [cases])

  // Leads ganhos que ainda não têm caso — ganhos de antes do trigger existir.
  const wonWithoutCase = useMemo(() => {
    const withCase = new Set(cases.map((c) => c.leadId))
    return leads.filter((l) => isWon(l.status) && !withCase.has(l.id))
  }, [leads, cases])

  const handleBackfill = async () => {
    const { count, error } = await addCasesForLeads(wonWithoutCase.map((l) => l.id))
    if (error) toast({ title: 'Erro ao trazer os ganhos', description: error, tone: 'error' })
    else toast({ title: 'Clientes trazidos pro CS', description: `${count} caso(s) criados no Onboarding.`, tone: 'success' })
  }

  const statusCols = items('cs_status')
  const openCase = openId ? cases.find((c) => c.id === openId) ?? null : null

  return (
    <div className="mx-auto flex max-w-screen-2xl flex-col gap-6 px-6 py-8">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-3">
          <CardIcon tone="gold" className="mt-0.5"><HeartHandshake size={18} strokeWidth={1.5} aria-hidden /></CardIcon>
          <div>
            <h1 className="font-display text-h1 font-semibold text-strong">Comercial · CS</h1>
            <p className="mt-1 text-body-s text-muted">
              Pós-venda dos clientes ganhos — todo lead que fecha no CRM cai aqui automaticamente.
            </p>
          </div>
        </div>
        {canManage && wonWithoutCase.length > 0 && (
          <Button variant="secondary" size="sm" leftIcon={<Import size={16} strokeWidth={1.5} />} onClick={handleBackfill}>
            Trazer {wonWithoutCase.length} ganho(s) sem caso
          </Button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Em acompanhamento" value={kpis.active} />
        <StatCard label="Novos · este mês" value={kpis.newThisMonth} />
        <StatCard label="Encerrados" value={kpis.closed} />
        <StatCard label="Total de casos" value={kpis.total} />
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
          <option value="me">Meus casos</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </Select>
        <span className="ml-auto font-mono text-mono-data text-faint tabular-nums">
          {filtered.length} caso(s)
        </span>
      </div>

      {/* Kanban */}
      {loading ? (
        <p className="py-16 text-center text-body-s text-faint">Carregando…</p>
      ) : (
        <CsBoard
          columns={statusCols.map((s) => ({ value: s.value, label: s.label }))}
          cases={filtered}
          leadById={leadById}
          getMember={getMember}
          canManage={canManage}
          onOpen={setOpenId}
          onDrop={setCaseStatus}
        />
      )}

      {openCase && (
        <CsDrawer
          csCase={openCase}
          lead={leadById.get(openCase.leadId)}
          canManage={canManage}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------- Kanban board */

function CsBoard({
  columns, cases, leadById, getMember, canManage, onOpen, onDrop,
}: {
  columns: { value: string; label: string }[]
  cases: CsCase[]
  leadById: Map<string, Lead>
  getMember: (id: string) => { name: string; avatar?: string | null } | undefined
  canManage: boolean
  onOpen: (id: string) => void
  onDrop: (id: string, status: string) => void
}) {
  const [over, setOver] = useState<string | null>(null)

  // Pan horizontal do quadro — mesmo padrão do kanban do CRM.
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
        const colCases = cases.filter((c) => c.status === col.value)
        const total = colCases.reduce((s, c) => s + (leadById.get(c.leadId)?.potentialValue || 0), 0)
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
              <CatBadge catalog="cs_status" value={col.value} />
              <span className="font-mono text-mono-data text-faint tabular-nums">{colCases.length}</span>
            </div>
            {total > 0 && (
              <div className="px-1 font-mono text-[11px] text-faint tabular-nums">{fmtBRL(total)} em contratos</div>
            )}
            <div className="-mr-1 flex max-h-[calc(100vh-360px)] min-h-[80px] flex-col gap-2.5 overflow-y-auto pr-1">
              {colCases.map((c) => (
                <CsCard
                  key={c.id}
                  csCase={c}
                  lead={leadById.get(c.leadId)}
                  getMember={getMember}
                  canDrag={canManage}
                  onOpen={() => onOpen(c.id)}
                />
              ))}
              {colCases.length === 0 && <p className="px-1 py-4 text-center text-body-s text-faint">Vazio.</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CsCard({
  csCase, lead, getMember, canDrag, onOpen,
}: {
  csCase: CsCase
  lead?: Lead
  getMember: (id: string) => { name: string; avatar?: string | null } | undefined
  canDrag: boolean
  onOpen: () => void
}) {
  const owner = csCase.ownerId ? getMember(csCase.ownerId) : undefined
  const actionOverdue = csCase.nextActionAt && !isCsClosed(csCase.status) && csCase.nextActionAt <= todayIso()
  return (
    <div
      draggable={canDrag}
      onDragStart={canDrag ? (e) => e.dataTransfer.setData('text/plain', csCase.id) : undefined}
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
        <span className="min-w-0 flex-1 truncate text-body-s font-medium text-strong">{lead?.name ?? '(lead removido)'}</span>
        {(lead?.potentialValue ?? 0) > 0 && (
          <span className="shrink-0 font-mono text-[11px] text-ok tabular-nums">{fmtBRL(lead!.potentialValue)}</span>
        )}
      </div>
      {lead?.product && (
        <div className="flex flex-wrap items-center gap-1.5">
          <CatBadge catalog="crm_product" value={lead.product} />
        </div>
      )}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="flex items-center gap-2 text-faint">
          {owner && <Avatar size="xs" name={owner.name} src={owner.avatar ?? undefined} />}
          <WaLink whatsapp={lead?.whatsapp} size={14} />
        </div>
        {csCase.nextActionAt && (
          <span className={cn('inline-flex items-center gap-1 font-mono text-[11px] tabular-nums', actionOverdue ? 'text-err' : 'text-faint')}>
            <CalendarClock size={12} strokeWidth={1.5} aria-hidden />
            {fmtDateBR(csCase.nextActionAt)}
          </span>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- drawer do caso */

function CsDrawer({
  csCase, lead, canManage, onClose,
}: {
  csCase: CsCase
  lead?: Lead
  canManage: boolean
  onClose: () => void
}) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { members } = useProfiles()
  const { items } = useCatalogs()
  const { updateCase, removeCase } = useCs()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const ro = !canManage
  const set = (patch: Parameters<typeof updateCase>[1]) => updateCase(csCase.id, patch)

  const handleDelete = async () => {
    await removeCase(csCase.id)
    setConfirmDelete(false)
    onClose()
    toast({ title: 'Caso excluído', tone: 'success' })
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={lead?.name ?? 'Caso de CS'}
      description="Caso de pós-venda — o contato do cliente vem do lead no CRM."
      width={460}
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          {canManage ? (
            <Button variant="danger" size="sm" leftIcon={<Trash2 size={15} strokeWidth={1.5} />} onClick={() => setConfirmDelete(true)}>
              Excluir caso
            </Button>
          ) : <span />}
          <Button variant="secondary" size="sm" onClick={onClose}>Fechar</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Contato — vem do CRM (somente leitura aqui). */}
        <div className="flex flex-col gap-2 rounded-lg border border-line bg-slate-900 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-mono-label uppercase text-muted">Cliente</span>
            {lead && (
              <button
                type="button"
                onClick={() => navigate(`/app/crm?lead=${lead.id}`)}
                className="inline-flex items-center gap-1.5 text-body-s text-steel-300 transition-colors hover:text-strong focus-visible:outline-none focus-visible:shadow-focus"
              >
                Ver no CRM <ExternalLink size={13} strokeWidth={1.5} aria-hidden />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 text-body text-strong">
            {lead?.name ?? '(lead removido do CRM)'}
            <WaLink whatsapp={lead?.whatsapp} size={15} />
          </div>
          {lead?.whatsapp && <span className="font-mono text-mono-data text-muted">{lead.whatsapp}</span>}
          {lead?.email && <span className="font-mono text-mono-data text-muted">{lead.email}</span>}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <CatBadge catalog="crm_product" value={lead?.product} />
            {(lead?.potentialValue ?? 0) > 0 && (
              <span className="font-mono text-[11px] text-ok tabular-nums">{fmtBRL(lead!.potentialValue)}</span>
            )}
          </div>
        </div>

        <Field label="Etapa">
          <Select value={csCase.status} disabled={ro} onChange={(e) => set({ status: e.target.value })}>
            {items('cs_status').map((s) => (
              <option key={s.id} value={s.value}>{s.label}</option>
            ))}
          </Select>
        </Field>

        <Field label="Responsável (CS)">
          <Select value={csCase.ownerId ?? ''} disabled={ro} onChange={(e) => set({ ownerId: e.target.value || null })}>
            <option value="">Sem responsável</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </Select>
        </Field>

        <Field label="Próxima ação">
          <DatePicker value={isoToDate(csCase.nextActionAt)} disabled={ro} onChange={(d) => set({ nextActionAt: dateToIso(d) })} />
        </Field>

        <Field label="Notas do CS">
          <Textarea
            value={csCase.notes ?? ''}
            disabled={ro}
            rows={6}
            placeholder="Histórico da tratativa, combinados, contexto do cliente…"
            onChange={(e) => set({ notes: e.target.value })}
          />
        </Field>

        <span className="font-mono text-[11px] text-faint">
          No CS desde {fmtDateBR(csCase.createdAt.slice(0, 10))}
        </span>
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Excluir caso de CS"
        description={`Excluir o caso de "${lead?.name ?? 'cliente'}"? O lead continua no CRM; só a tratativa de CS é removida.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
            <Button variant="danger" onClick={handleDelete}>Excluir</Button>
          </>
        }
      />
    </Drawer>
  )
}
