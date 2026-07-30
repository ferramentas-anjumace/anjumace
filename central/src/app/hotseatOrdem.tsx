import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/lib/session'
import { SURVEY_QUESTIONS, answerDisplay, type SurveyAnswers } from './hotseatOrdemQuestions'

/* ----------------------------------------------------------------------------
   Hotseat "A Ordem" — leads + pesquisa (/aordem-captura), modelo de dados e provider
   ----------------------------------------------------------------------------
   Duas tabelas sem FK entre si (public.hotseat_ordem_leads e
   public.hotseat_ordem_pesquisa, migrations 0054/0059) — a pesquisa é um
   pop-up opcional pós-cadastro, pode nunca chegar pra um lead. O join é feito
   aqui em memória, por e-mail (já normalizado lower/trim pelas duas RPCs de
   escrita, então comparar string exata é seguro).
---------------------------------------------------------------------------- */

export interface HotseatOrdemSurvey {
  id: string
  email: string
  name: string | null
  phone: string | null
  answers: SurveyAnswers
  smsConsent: boolean
  createdAt: string
  updatedAt: string
}

export interface HotseatOrdemLead {
  id: string
  name: string
  email: string
  whatsapp: string
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  utmContent: string | null
  utmTerm: string | null
  referrer: string | null
  page: string | null
  signupCount: number
  createdAt: string
  lastSeenAt: string
  /** Respostas da pesquisa, se o lead chegou a responder. */
  survey: HotseatOrdemSurvey | null
}

interface LeadRow {
  id: string
  name: string | null
  email: string
  whatsapp: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null
  referrer: string | null
  page: string | null
  signup_count: number | null
  created_at: string
  last_seen_at: string
}

interface SurveyRow {
  id: string
  email: string
  name: string | null
  phone: string | null
  answers: SurveyAnswers | null
  sms_consent: boolean | null
  created_at: string
  updated_at: string
}

function rowToSurvey(r: SurveyRow): HotseatOrdemSurvey {
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    phone: r.phone,
    answers: r.answers ?? {},
    smsConsent: r.sms_consent ?? false,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function rowToLead(r: LeadRow, survey: HotseatOrdemSurvey | null): HotseatOrdemLead {
  return {
    id: r.id,
    name: r.name ?? '',
    email: r.email,
    whatsapp: r.whatsapp ?? '',
    utmSource: r.utm_source,
    utmMedium: r.utm_medium,
    utmCampaign: r.utm_campaign,
    utmContent: r.utm_content,
    utmTerm: r.utm_term,
    referrer: r.referrer,
    page: r.page,
    signupCount: r.signup_count ?? 1,
    createdAt: r.created_at,
    lastSeenAt: r.last_seen_at,
    survey,
  }
}

interface HotseatOrdemCtx {
  leads: HotseatOrdemLead[]
  loading: boolean
  /** Respostas de pesquisa sem lead correspondente (não deveria acontecer no
      fluxo normal, mas a RLS não impede escrita direta na pesquisa). */
  orphanSurveys: number
  removeLead: (id: string) => Promise<void>
}

const Context = createContext<HotseatOrdemCtx | null>(null)

export function HotseatOrdemProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const [leads, setLeads] = useState<HotseatOrdemLead[]>([])
  const [orphanSurveys, setOrphanSurveys] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    const [leadsRes, surveyRes] = await Promise.all([
      supabase.from('hotseat_ordem_leads').select('*').order('created_at', { ascending: false }),
      supabase.from('hotseat_ordem_pesquisa').select('*'),
    ])
    const leadRows = (leadsRes.data as LeadRow[] | null) ?? []
    const surveys = ((surveyRes.data as SurveyRow[] | null) ?? []).map(rowToSurvey)
    const byEmail = new Map(surveys.map((s) => [s.email, s]))
    const leadEmails = new Set(leadRows.map((r) => r.email))

    setLeads(leadRows.map((r) => rowToLead(r, byEmail.get(r.email) ?? null)))
    setOrphanSurveys(surveys.filter((s) => !leadEmails.has(s.email)).length)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (status === 'authed') {
      setLoading(true)
      fetchAll()
      const channel = supabase
        .channel('hotseat-ordem:sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'hotseat_ordem_leads' }, () => fetchAll())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'hotseat_ordem_pesquisa' }, () => fetchAll())
        .subscribe()
      return () => {
        supabase.removeChannel(channel)
      }
    } else if (status === 'anon') {
      setLeads([])
      setOrphanSurveys(0)
      setLoading(false)
    }
  }, [status, fetchAll])

  const removeLead = useCallback(async (id: string) => {
    setLeads((ls) => ls.filter((l) => l.id !== id))
    await supabase.from('hotseat_ordem_leads').delete().eq('id', id)
  }, [])

  const value = useMemo<HotseatOrdemCtx>(
    () => ({ leads, loading, orphanSurveys, removeLead }),
    [leads, loading, orphanSurveys, removeLead],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useHotseatOrdem() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useHotseatOrdem deve ser usado dentro de <HotseatOrdemProvider>')
  return ctx
}

/* ------------------------------------------------------------------- CSV */

/** timestamptz → "09/07/2026 14:32" no fuso local — reaproveitada pela página. */
export function fmtDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

/** Escapa célula CSV — mesma regra de `crm.tsx` (não exportada de lá, então
    duplicada aqui: vírgula/ponto-e-vírgula/aspas/quebra de linha). */
function csvCell(v: string | number | null | undefined): string {
  const s = v == null ? '' : String(v)
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** CSV achatado: dados do lead + uma coluna por pergunta da pesquisa (na
    ordem de SURVEY_QUESTIONS). Multi-escolha vira valores juntados com "; "
    dentro da própria célula (csvCell entre-aspas automaticamente). */
export function hotseatOrdemToCsv(leads: HotseatOrdemLead[]): string {
  const headers = [
    'Nome', 'E-mail', 'WhatsApp', 'Capturado em', 'Recapturas',
    'UTM Source', 'UTM Medium', 'UTM Campaign', 'UTM Content', 'UTM Term', 'Referrer',
    'Respondeu pesquisa', 'Data da resposta',
    ...SURVEY_QUESTIONS.map((q) => q.shortLabel),
  ]
  const lines = [headers.map(csvCell).join(',')]
  for (const l of leads) {
    const row = [
      l.name,
      l.email,
      l.whatsapp,
      fmtDateTime(l.createdAt),
      l.signupCount > 1 ? String(l.signupCount) : '',
      l.utmSource ?? '',
      l.utmMedium ?? '',
      l.utmCampaign ?? '',
      l.utmContent ?? '',
      l.utmTerm ?? '',
      l.referrer ?? '',
      l.survey ? 'Sim' : 'Não',
      l.survey ? fmtDateTime(l.survey.updatedAt) : '',
      ...SURVEY_QUESTIONS.map((q) => {
        const display = answerDisplay(l.survey?.answers, q.id)
        return display === '—' ? '' : display
      }),
    ]
    lines.push(row.map(csvCell).join(','))
  }
  return lines.join('\r\n')
}
