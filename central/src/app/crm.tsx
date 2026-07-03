import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/lib/session'

/* ----------------------------------------------------------------------------
   CRM Comercial — modelo de dados, provider e utilidades (CSV, agregação)
   ----------------------------------------------------------------------------
   Traz o CRM da planilha para dentro da Central (checkpoint 2026-07-02). Dois
   conjuntos: leads (public.crm_leads) e o histórico de interações por lead
   (public.crm_interactions). Compartilhado por todo o time via Supabase +
   Realtime. As edições no drawer são otimistas e persistidas com debounce por
   lead (mesmo padrão do editorial); o arraste no kanban persiste na hora.

   Tudo que o painel exibe (KPIs, quebras por status/origem/responsável) é
   DERIVADO dos leads em memória. "Último contato" e "Qtd. de interações" —
   preenchidos à mão na planilha — aqui são calculados a partir das interações.
---------------------------------------------------------------------------- */

export interface Lead {
  id: string
  name: string
  whatsapp?: string
  email?: string
  origin?: string
  product?: string
  potentialValue: number
  funnelStage?: string
  status: string
  ownerId?: string | null
  firstContactAt?: string | null // yyyy-mm-dd
  nextFollowupAt?: string | null
  contactChannel?: string
  interest?: string
  mainObjection?: string
  notes?: string
  closedAt?: string | null
  sort: number
  createdAt: string
}

export interface LeadInteraction {
  id: string
  leadId: string
  date: string // yyyy-mm-dd
  ownerId?: string | null
  channel?: string
  type?: string
  summary?: string
  nextAction?: string
  createdAt: string
}

/** Campos aceitos ao criar/atualizar um lead (sem os derivados). */
export type LeadInput = Partial<Omit<Lead, 'id' | 'sort' | 'createdAt'>> & { name: string }
export type LeadPatch = Partial<Omit<Lead, 'id' | 'createdAt'>>
export type InteractionInput = Partial<Omit<LeadInteraction, 'id' | 'createdAt'>> & { leadId: string }

/* --------------------------------------------------- classificação de status */
/* Os KPIs identificam o desfecho pelo TEXTO do status (o gestor pode renomear
   os catálogos). Convenção documentada na migration: manter as palavras. */

export const isWon = (status?: string) => /ganho/i.test(status ?? '')
export const isLost = (status?: string) => /perdid/i.test(status ?? '')
export const isInactive = (status?: string) => /inativ/i.test(status ?? '')
export const isClosed = (status?: string) => isWon(status) || isLost(status) || isInactive(status)
/** Lead "ativo" = ainda no pipeline (nem ganho, nem perdido, nem inativo). */
export const isActiveLead = (status?: string) => !isClosed(status)

/* ------------------------------------------------------------- formatadores */

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })
export const fmtBRL = (n: number) => brl.format(Math.round(n || 0))

/** yyyy-mm-dd → dd/mm/aaaa (vazio se nulo). */
export function fmtDateBR(iso?: string | null): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

/**
 * Monta o link wa.me a partir de um número em qualquer formato. Remove tudo que
 * não é dígito; quando vem só com DDD + número (10 ou 11 dígitos), assume Brasil
 * e prefixa 55. Retorna null se não houver dígitos suficientes.
 */
export function waHref(whatsapp?: string | null): string | null {
  if (!whatsapp) return null
  let digits = whatsapp.replace(/\D/g, '')
  if (digits.length < 8) return null
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`
  return `https://wa.me/${digits}`
}

/* ------------------------------------------------------- mapeadores do banco */

interface LeadRow {
  id: string
  name: string
  whatsapp: string | null
  email: string | null
  origin: string | null
  product: string | null
  potential_value: number | string | null
  funnel_stage: string | null
  status: string
  owner_id: string | null
  first_contact_at: string | null
  next_followup_at: string | null
  contact_channel: string | null
  interest: string | null
  main_objection: string | null
  notes: string | null
  closed_at: string | null
  sort: number | null
  created_at: string
}

function rowToLead(r: LeadRow): Lead {
  return {
    id: r.id,
    name: r.name ?? '',
    whatsapp: r.whatsapp ?? undefined,
    email: r.email ?? undefined,
    origin: r.origin ?? undefined,
    product: r.product ?? undefined,
    potentialValue: Number(r.potential_value) || 0,
    funnelStage: r.funnel_stage ?? undefined,
    status: r.status ?? 'Novo',
    ownerId: r.owner_id,
    firstContactAt: r.first_contact_at,
    nextFollowupAt: r.next_followup_at,
    contactChannel: r.contact_channel ?? undefined,
    interest: r.interest ?? undefined,
    mainObjection: r.main_objection ?? undefined,
    notes: r.notes ?? undefined,
    closedAt: r.closed_at,
    sort: r.sort ?? 0,
    createdAt: r.created_at,
  }
}

/** Converte um patch (camelCase) nas colunas da tabela (snake_case). */
function leadPatchToRow(patch: LeadPatch): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (patch.name !== undefined) row.name = patch.name
  if (patch.whatsapp !== undefined) row.whatsapp = patch.whatsapp || null
  if (patch.email !== undefined) row.email = patch.email || null
  if (patch.origin !== undefined) row.origin = patch.origin || null
  if (patch.product !== undefined) row.product = patch.product || null
  if (patch.potentialValue !== undefined) row.potential_value = patch.potentialValue || 0
  if (patch.funnelStage !== undefined) row.funnel_stage = patch.funnelStage || null
  if (patch.status !== undefined) row.status = patch.status
  if (patch.ownerId !== undefined) row.owner_id = patch.ownerId || null
  if (patch.firstContactAt !== undefined) row.first_contact_at = patch.firstContactAt || null
  if (patch.nextFollowupAt !== undefined) row.next_followup_at = patch.nextFollowupAt || null
  if (patch.contactChannel !== undefined) row.contact_channel = patch.contactChannel || null
  if (patch.interest !== undefined) row.interest = patch.interest || null
  if (patch.mainObjection !== undefined) row.main_objection = patch.mainObjection || null
  if (patch.notes !== undefined) row.notes = patch.notes || null
  if (patch.closedAt !== undefined) row.closed_at = patch.closedAt || null
  if (patch.sort !== undefined) row.sort = patch.sort
  return row
}

interface InteractionRow {
  id: string
  lead_id: string
  date: string
  owner_id: string | null
  channel: string | null
  type: string | null
  summary: string | null
  next_action: string | null
  created_at: string
}

function rowToInteraction(r: InteractionRow): LeadInteraction {
  return {
    id: r.id,
    leadId: r.lead_id,
    date: r.date,
    ownerId: r.owner_id,
    channel: r.channel ?? undefined,
    type: r.type ?? undefined,
    summary: r.summary ?? undefined,
    nextAction: r.next_action ?? undefined,
    createdAt: r.created_at,
  }
}

/* ============================================================================
   Provider
   ============================================================================ */

interface CrmCtx {
  leads: Lead[]
  interactions: LeadInteraction[]
  loading: boolean
  addLead: (input: LeadInput) => Promise<{ id: string | null; error: string | null }>
  updateLead: (id: string, patch: LeadPatch) => void
  setLeadStatus: (id: string, status: string) => Promise<void>
  removeLead: (id: string) => Promise<void>
  importLeads: (inputs: LeadInput[]) => Promise<{ count: number; error: string | null }>
  addInteraction: (input: InteractionInput) => Promise<{ error: string | null }>
  removeInteraction: (id: string) => Promise<void>
  /** Interações de um lead, mais recentes primeiro. */
  interactionsFor: (leadId: string) => LeadInteraction[]
  /** Nº de interações registradas para o lead. */
  interactionCount: (leadId: string) => number
  /** Data do último contato (última interação, ou o 1º contato). */
  lastContactAt: (lead: Lead) => string | null
}

const Context = createContext<CrmCtx | null>(null)

const DEBOUNCE_MS = 450

export function CrmProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const [leads, setLeads] = useState<Lead[]>([])
  const [interactions, setInteractions] = useState<LeadInteraction[]>([])
  const [loading, setLoading] = useState(true)

  // Persistência adiada por lead (coalesce de edições rápidas no drawer).
  const pending = useRef<Record<string, LeadPatch>>({})
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const fetchAll = useCallback(async () => {
    const [l, i] = await Promise.all([
      supabase.from('crm_leads').select('*').order('sort', { ascending: true }).order('created_at', { ascending: true }),
      supabase.from('crm_interactions').select('*').order('date', { ascending: false }),
    ])
    if (!l.error && l.data) setLeads((l.data as LeadRow[]).map(rowToLead))
    if (!i.error && i.data) setInteractions((i.data as InteractionRow[]).map(rowToInteraction))
    setLoading(false)
  }, [])

  useEffect(() => {
    if (status === 'authed') {
      setLoading(true)
      fetchAll()
      const channel = supabase
        .channel('crm:sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'crm_leads' }, () => {
          // Não recarrega no meio de uma edição local (evita "pular" o cursor).
          if (Object.keys(timers.current).length === 0) fetchAll()
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'crm_interactions' }, () => fetchAll())
        .subscribe()
      return () => {
        supabase.removeChannel(channel)
      }
    } else if (status === 'anon') {
      setLeads([])
      setInteractions([])
      setLoading(false)
    }
  }, [status, fetchAll])

  const addLead = useCallback(async (input: LeadInput) => {
    const maxSort = leads.reduce((m, l) => (l.status === input.status ? Math.max(m, l.sort) : m), -1)
    const { data, error } = await supabase
      .from('crm_leads')
      .insert({ status: 'Novo', sort: maxSort + 1, ...leadPatchToRow({ ...input, status: input.status ?? 'Novo' }) })
      .select('*')
      .single()
    if (error || !data) return { id: null, error: error?.message ?? 'Falha ao criar o lead.' }
    const created = rowToLead(data as LeadRow)
    setLeads((ls) => [...ls, created])
    return { id: created.id, error: null }
  }, [leads])

  const flush = useCallback((id: string) => {
    const patch = pending.current[id]
    delete pending.current[id]
    delete timers.current[id]
    if (patch && Object.keys(patch).length > 0) {
      supabase.from('crm_leads').update(leadPatchToRow(patch)).eq('id', id).then(() => {})
    }
  }, [])

  const updateLead = useCallback(
    (id: string, patch: LeadPatch) => {
      setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)))
      pending.current[id] = { ...pending.current[id], ...patch }
      clearTimeout(timers.current[id])
      timers.current[id] = setTimeout(() => flush(id), DEBOUNCE_MS)
    },
    [flush],
  )

  const setLeadStatus = useCallback(
    async (id: string, status: string) => {
      // Envia para o fim da coluna de destino; fecha/reabre a data de fechamento.
      const maxSort = leads.reduce((m, l) => (l.status === status ? Math.max(m, l.sort) : m), -1)
      const patch: LeadPatch = { status, sort: maxSort + 1 }
      const today = new Date()
      const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      const target = leads.find((l) => l.id === id)
      if (isClosed(status) && target && !target.closedAt) patch.closedAt = iso
      if (!isClosed(status)) patch.closedAt = null
      setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)))
      await supabase.from('crm_leads').update(leadPatchToRow(patch)).eq('id', id)
    },
    [leads],
  )

  const removeLead = useCallback(async (id: string) => {
    clearTimeout(timers.current[id])
    delete timers.current[id]
    delete pending.current[id]
    setLeads((ls) => ls.filter((l) => l.id !== id))
    setInteractions((is) => is.filter((i) => i.leadId !== id))
    await supabase.from('crm_leads').delete().eq('id', id)
  }, [])

  const importLeads = useCallback(async (inputs: LeadInput[]) => {
    if (inputs.length === 0) return { count: 0, error: null }
    const rows = inputs.map((inp, idx) => ({
      status: 'Novo',
      sort: idx,
      ...leadPatchToRow({ ...inp, status: inp.status ?? 'Novo' }),
    }))
    const { data, error } = await supabase.from('crm_leads').insert(rows).select('*')
    if (error) return { count: 0, error: error.message }
    const created = (data as LeadRow[]).map(rowToLead)
    setLeads((ls) => [...ls, ...created])
    return { count: created.length, error: null }
  }, [])

  const addInteraction = useCallback(async (input: InteractionInput) => {
    const row = {
      lead_id: input.leadId,
      date: input.date ?? null,
      owner_id: input.ownerId || null,
      channel: input.channel || null,
      type: input.type || null,
      summary: input.summary || null,
      next_action: input.nextAction || null,
    }
    const { data, error } = await supabase.from('crm_interactions').insert(row).select('*').single()
    if (error || !data) return { error: error?.message ?? 'Falha ao registrar a interação.' }
    setInteractions((is) => [rowToInteraction(data as InteractionRow), ...is])
    return { error: null }
  }, [])

  const removeInteraction = useCallback(async (id: string) => {
    setInteractions((is) => is.filter((i) => i.id !== id))
    await supabase.from('crm_interactions').delete().eq('id', id)
  }, [])

  const interactionsFor = useCallback(
    (leadId: string) =>
      interactions
        .filter((i) => i.leadId === leadId)
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
    [interactions],
  )
  const interactionCount = useCallback(
    (leadId: string) => interactions.reduce((n, i) => (i.leadId === leadId ? n + 1 : n), 0),
    [interactions],
  )
  const lastContactAt = useCallback(
    (lead: Lead) => {
      const own = interactions.filter((i) => i.leadId === lead.id)
      if (own.length > 0) return own.reduce((max, i) => (i.date > max ? i.date : max), own[0].date)
      return lead.firstContactAt ?? null
    },
    [interactions],
  )

  const value = useMemo<CrmCtx>(
    () => ({
      leads,
      interactions,
      loading,
      addLead,
      updateLead,
      setLeadStatus,
      removeLead,
      importLeads,
      addInteraction,
      removeInteraction,
      interactionsFor,
      interactionCount,
      lastContactAt,
    }),
    [leads, interactions, loading, addLead, updateLead, setLeadStatus, removeLead, importLeads, addInteraction, removeInteraction, interactionsFor, interactionCount, lastContactAt],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useCrm() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useCrm deve ser usado dentro de <CrmProvider>')
  return ctx
}

/* ============================================================================
   Agregação do Dashboard — tudo derivado dos leads em memória
   ============================================================================ */

export interface CrmKpis {
  total: number
  active: number
  won: number
  lost: number
  inactive: number
  potentialTotal: number
  wonValue: number
}

export interface Breakdown {
  key: string
  count: number
  value: number
}

export interface OwnerStat {
  ownerId: string | null
  total: number
  won: number
  lost: number
  conversion: number // won / (won + lost)
}

export function buildKpis(leads: Lead[]): CrmKpis {
  let active = 0, won = 0, lost = 0, inactive = 0, potentialTotal = 0, wonValue = 0
  for (const l of leads) {
    potentialTotal += l.potentialValue || 0
    if (isWon(l.status)) { won++; wonValue += l.potentialValue || 0 }
    else if (isLost(l.status)) lost++
    else if (isInactive(l.status)) inactive++
    else active++
  }
  return { total: leads.length, active, won, lost, inactive, potentialTotal, wonValue }
}

/** Quebra por um campo do lead (status, origem...), somando valor potencial. */
export function breakdownBy(leads: Lead[], field: 'status' | 'origin'): Record<string, Breakdown> {
  const map: Record<string, Breakdown> = {}
  for (const l of leads) {
    const key = (field === 'status' ? l.status : l.origin) || '—'
    const b = (map[key] ??= { key, count: 0, value: 0 })
    b.count++
    b.value += l.potentialValue || 0
  }
  return map
}

export function ownerStats(leads: Lead[]): OwnerStat[] {
  const map = new Map<string | null, OwnerStat>()
  for (const l of leads) {
    const id = l.ownerId ?? null
    const s = map.get(id) ?? { ownerId: id, total: 0, won: 0, lost: 0, conversion: 0 }
    s.total++
    if (isWon(l.status)) s.won++
    else if (isLost(l.status)) s.lost++
    map.set(id, s)
  }
  const list = [...map.values()]
  for (const s of list) s.conversion = s.won + s.lost > 0 ? s.won / (s.won + s.lost) : 0
  return list.sort((a, b) => b.total - a.total)
}

/* ============================================================================
   CSV — importação e exportação (compatível com a planilha da equipe)
   ============================================================================ */

/** Remove acentos e normaliza para casar cabeçalhos da planilha. */
function norm(s: string): string {
  return s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/** Parser de CSV que respeita campos entre aspas; detecta , ou ; como separador. */
function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, '') // remove BOM
  const firstLine = clean.slice(0, clean.indexOf('\n') >= 0 ? clean.indexOf('\n') : clean.length)
  const delim = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ','
  const rows: string[][] = []
  let field = ''
  let row: string[] = []
  let inQuotes = false
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i]
    if (inQuotes) {
      if (c === '"') {
        if (clean[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else field += c
    } else if (c === '"') {
      inQuotes = true
    } else if (c === delim) {
      row.push(field); field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && clean[i + 1] === '\n') i++
      row.push(field); field = ''
      if (row.some((v) => v.trim() !== '')) rows.push(row)
      row = []
    } else field += c
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    if (row.some((v) => v.trim() !== '')) rows.push(row)
  }
  return rows
}

/** "R$ 497,00" / "127,00" → 497 / 127. */
function parseMoney(raw: string): number {
  if (!raw) return 0
  const cleaned = raw.replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return Number.isFinite(n) ? n : 0
}

/** "26/06/2026" / "26/06" → "2026-06-26" (ano omitido = ano corrente). */
function parseDateBR(raw: string): string | null {
  const m = raw.trim().match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/)
  if (!m) {
    // Aceita também já em ISO (yyyy-mm-dd).
    const iso = raw.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
    return iso ? raw.trim() : null
  }
  const d = m[1].padStart(2, '0')
  const mo = m[2].padStart(2, '0')
  let y = m[3] ?? String(new Date().getFullYear())
  if (y.length === 2) y = `20${y}`
  return `${y}-${mo}-${d}`
}

/** Mapa cabeçalho-normalizado → campo do lead. */
const HEADER_MAP: Record<string, keyof LeadInput | 'ownerName'> = {
  nome: 'name',
  whatsapp: 'whatsapp',
  telefone: 'whatsapp',
  'e-mail': 'email',
  email: 'email',
  origem: 'origin',
  'produto/servico': 'product',
  produto: 'product',
  'valor potencial (r$)': 'potentialValue',
  'valor potencial': 'potentialValue',
  valor: 'potentialValue',
  'etapa do funil': 'funnelStage',
  etapa: 'funnelStage',
  status: 'status',
  responsavel: 'ownerName',
  '1o contato': 'firstContactAt',
  '1 contato': 'firstContactAt',
  'primeiro contato': 'firstContactAt',
  'proximo follow-up': 'nextFollowupAt',
  'proximo followup': 'nextFollowupAt',
  'follow-up': 'nextFollowupAt',
  'canal de contato': 'contactChannel',
  canal: 'contactChannel',
  interesse: 'interest',
  'objecao principal': 'mainObjection',
  objecao: 'mainObjection',
  'historico / observacoes': 'notes',
  'historico/observacoes': 'notes',
  observacoes: 'notes',
  historico: 'notes',
  'data de fechamento': 'closedAt',
  fechamento: 'closedAt',
}

/**
 * Limpa rótulos genéricos da planilha do Everfit/consultoria ("Cliente",
 * "Mobile", "Cliente Mobile") que poluem o nome no import — pedido do Gabriel
 * (checkpoint 2026-07-03) para a base não virar "cliente, cliente, cliente".
 * Se sobrar vazio (a linha só tinha o rótulo), devolve o nome original para não
 * descartar um lead que ainda tem telefone.
 */
function cleanLeadName(raw: string): string {
  const cleaned = raw
    .replace(/\b(cliente|mobile)\b/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s,;-]+|[\s,;-]+$/g, '')
    .trim()
  return cleaned || raw.trim()
}

/**
 * Mapeia status antigos da planilha para as etapas novas do pipeline
 * (migration 0036). Valores desconhecidos passam intactos.
 */
const STATUS_ALIASES: Record<string, string> = {
  'em andamento': 'Conexão',
  conexao: 'Conexão',
  'proposta enviada': 'Proposta / Negociação',
  negociacao: 'Proposta / Negociação',
  'proposta / negociacao': 'Proposta / Negociação',
  'primeira mensagem enviada': 'Primeira mensagem enviada',
}

/**
 * Converte o texto de um CSV em leads. Resolve "Responsável" para o id do
 * membro pelo nome (quando bate). Colunas desconhecidas são ignoradas; a coluna
 * Nome é obrigatória (linhas sem nome são descartadas).
 */
export function parseLeadsCsv(text: string, members: { id: string; name: string }[]): LeadInput[] {
  const rows = parseCsv(text)
  if (rows.length < 2) return []
  const header = rows[0].map((h) => norm(h))
  const cols = header.map((h) => HEADER_MAP[h] ?? null)
  const memberByName = new Map(members.map((m) => [norm(m.name), m.id]))

  const out: LeadInput[] = []
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r]
    const lead: LeadInput = { name: '' }
    let ownerName = ''
    cols.forEach((field, ci) => {
      if (!field) return
      const raw = (cells[ci] ?? '').trim()
      if (!raw) return
      switch (field) {
        case 'name': lead.name = cleanLeadName(raw); break
        case 'status': lead.status = STATUS_ALIASES[norm(raw)] ?? raw; break
        case 'potentialValue': lead.potentialValue = parseMoney(raw); break
        case 'firstContactAt': lead.firstContactAt = parseDateBR(raw); break
        case 'nextFollowupAt': lead.nextFollowupAt = parseDateBR(raw); break
        case 'closedAt': lead.closedAt = parseDateBR(raw); break
        case 'ownerName': ownerName = raw; break
        default: (lead as Record<string, unknown>)[field] = raw
      }
    })
    if (!lead.name.trim()) continue
    if (ownerName) {
      const id = memberByName.get(norm(ownerName))
      if (id) lead.ownerId = id
    }
    out.push(lead)
  }
  return out
}

/** Escapa um valor para célula CSV. */
function csvCell(v: string | number | null | undefined): string {
  const s = v == null ? '' : String(v)
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Gera o CSV dos leads no mesmo layout da planilha (para exportar/baixar). */
export function leadsToCsv(
  leads: Lead[],
  opts: { memberName: (id?: string | null) => string; lastContactAt: (l: Lead) => string | null; interactionCount: (id: string) => number },
): string {
  const headers = [
    'Nome', 'WhatsApp', 'E-mail', 'Origem', 'Produto/Serviço', 'Valor Potencial (R$)',
    'Etapa do Funil', 'Status', 'Responsável', '1º Contato', 'Último Contato',
    'Próximo Follow-up', 'Qtd. Interações', 'Canal de Contato', 'Interesse',
    'Objeção Principal', 'Histórico / Observações', 'Data de Fechamento',
  ]
  const lines = [headers.map(csvCell).join(',')]
  for (const l of leads) {
    lines.push([
      l.name,
      l.whatsapp ?? '',
      l.email ?? '',
      l.origin ?? '',
      l.product ?? '',
      l.potentialValue ? String(l.potentialValue).replace('.', ',') : '',
      l.funnelStage ?? '',
      l.status,
      opts.memberName(l.ownerId),
      fmtDateBR(l.firstContactAt),
      fmtDateBR(opts.lastContactAt(l)),
      fmtDateBR(l.nextFollowupAt),
      String(opts.interactionCount(l.id)),
      l.contactChannel ?? '',
      l.interest ?? '',
      l.mainObjection ?? '',
      l.notes ?? '',
      fmtDateBR(l.closedAt),
    ].map(csvCell).join(','))
  }
  return lines.join('\r\n')
}

/** Modelo de CSV (só cabeçalho) para a equipe preencher e importar. */
export function leadsCsvTemplate(): string {
  return [
    'Nome', 'WhatsApp', 'E-mail', 'Origem', 'Produto/Serviço', 'Valor Potencial (R$)',
    'Etapa do Funil', 'Status', 'Responsável', '1º Contato', 'Próximo Follow-up',
    'Canal de Contato', 'Interesse', 'Objeção Principal', 'Histórico / Observações',
  ].join(',') + '\r\n'
}

/** Dispara o download de um arquivo texto no navegador. */
export function downloadText(filename: string, text: string, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob(['﻿' + text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
