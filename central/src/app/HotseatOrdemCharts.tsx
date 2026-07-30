import { useMemo } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList,
} from 'recharts'
import { Gauge, ListChecks, CircleDot, MessageSquareText } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardIcon } from '@/components/ui'
import type { HotseatOrdemLead } from './hotseatOrdem'
import { type SurveyQuestionDef, hasAnswered, respondedCount, tallyAnswers, answerDisplay } from './hotseatOrdemQuestions'

/* ----------------------------------------------------------------------------
   Hotseat "A Ordem" — cards de gráfico por tipo de pergunta da pesquisa
   ----------------------------------------------------------------------------
   Não usa o <ChartFrame> existente em @/components/ui: ele desenha uma grade
   decorativa via CSS pensada pra receber um gráfico feito à mão por cima. O
   Recharts já desenha sua própria grade SVG (<CartesianGrid>) — sobrepor as
   duas gera ruído visual. Aqui a moldura é só Card+CardHeader+CardIcon, igual
   ao padrão do Dashboard em CrmPage.tsx.
---------------------------------------------------------------------------- */

/** Mesma paleta hex de `TONE_HEX` em CrmPage.tsx (não exportada de lá, então
    duplicada aqui) — mantém os gráficos na mesma linguagem visual do resto do
    app. */
const HOTSEAT_TONES = ['#9eab87', '#cc9a3a', '#3f6fa6', '#2f9c9c', '#7a5bb0', '#c45c93', '#cc7836', '#5b6470']

const GRID_STROKE = 'rgba(40, 40, 40, 0.12)'

function truncateLabel(label: string, max = 26): string {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label
}

/** Pergunta `scale` (só a "18" hoje) — histograma 1–10 com média no cabeçalho. */
export function ScaleHistogramCard({ leads, question }: { leads: HotseatOrdemLead[]; question: SurveyQuestionDef }) {
  const { data, average, respondedN } = useMemo(() => {
    const counts = new Map<number, number>()
    for (let n = 1; n <= 10; n++) counts.set(n, 0)
    let sum = 0
    let n = 0
    for (const lead of leads) {
      const raw = lead.survey?.answers?.[question.id]
      if (raw == null) continue
      const value = Number(Array.isArray(raw) ? raw[0] : raw)
      if (!Number.isFinite(value) || value < 1 || value > 10) continue
      counts.set(value, (counts.get(value) ?? 0) + 1)
      sum += value
      n += 1
    }
    return {
      data: Array.from(counts, ([value, count]) => ({ value: String(value), count })),
      average: n > 0 ? sum / n : null,
      respondedN: n,
    }
  }, [leads, question])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <CardIcon tone="sage"><Gauge size={18} strokeWidth={1.5} aria-hidden /></CardIcon>
          <div>
            <CardTitle className="text-h3">{question.shortLabel}</CardTitle>
            <p className="mt-0.5 text-body-s text-muted">
              {respondedN > 0 ? `Média ${average!.toFixed(1)} · ${respondedN} respostas` : 'Nenhuma resposta ainda'}
            </p>
          </div>
        </div>
      </CardHeader>
      <div style={{ width: '100%', height: 200 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            <XAxis dataKey="value" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} formatter={(value) => [`${value}`, 'Respostas']} labelFormatter={(label) => `Nota ${label}`} />
            <Bar dataKey="count" fill={HOTSEAT_TONES[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

/** Perguntas `multi` (checkbox) e `single` (rádio) — distribuição por opção em
    barra horizontal. O denominador do % é quem respondeu ESSA pergunta, não o
    total de leads (a pesquisa é sequencial em 4 telas; quem abandona no meio
    tem resposta parcial). */
export function CategoryDistributionCard({ leads, question }: { leads: HotseatOrdemLead[]; question: SurveyQuestionDef }) {
  const total = useMemo(() => respondedCount(leads, question.id), [leads, question])
  const data = useMemo(
    () => tallyAnswers(leads, question).map((t) => ({ ...t, pct: total > 0 ? Math.round((t.count / total) * 100) : 0 })),
    [leads, question, total],
  )
  const height = Math.max(160, data.length * 40)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <CardIcon tone={question.type === 'single' ? 'gold' : 'sage'}>
            {question.type === 'single'
              ? <CircleDot size={18} strokeWidth={1.5} aria-hidden />
              : <ListChecks size={18} strokeWidth={1.5} aria-hidden />}
          </CardIcon>
          <div>
            <CardTitle className="text-h3">{question.shortLabel}</CardTitle>
            <p className="mt-0.5 text-body-s text-muted">
              {total > 0 ? `${total} respostas` : 'Nenhuma resposta ainda'}
              {question.type === 'multi' && total > 0 ? ' · múltipla escolha, soma pode passar de 100%' : ''}
            </p>
          </div>
        </div>
      </CardHeader>
      {total === 0 ? (
        <p className="py-6 text-center text-body-s text-muted">Nenhuma resposta ainda.</p>
      ) : (
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer>
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 32, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="option"
                width={168}
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => truncateLabel(String(value))}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} formatter={(value) => [`${value}`, 'Respostas']} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {data.map((entry, i) => (
                  <Cell key={entry.option} fill={HOTSEAT_TONES[i % HOTSEAT_TONES.length]} />
                ))}
                <LabelList dataKey="pct" position="right" formatter={(value) => `${value}%`} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}

/** Perguntas `text` — sem gráfico (texto livre não se presta a distribuição).
    Contador de resposta + preview das mais recentes; não é substituto do
    detalhe completo por lead (drawer na página). */
export function TextAnswersCard({ leads, question }: { leads: HotseatOrdemLead[]; question: SurveyQuestionDef }) {
  const responded = useMemo(() => leads.filter((l) => hasAnswered(l, question.id)), [leads, question])
  const recent = useMemo(
    () => [...responded]
      .sort((a, b) => (b.survey?.updatedAt ?? '').localeCompare(a.survey?.updatedAt ?? ''))
      .slice(0, 6),
    [responded],
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <CardIcon tone="gold"><MessageSquareText size={18} strokeWidth={1.5} aria-hidden /></CardIcon>
          <div>
            <CardTitle className="text-h3">{question.shortLabel}</CardTitle>
            <p className="mt-0.5 text-body-s text-muted">{responded.length} de {leads.length} leads responderam</p>
          </div>
        </div>
      </CardHeader>
      {responded.length === 0 ? (
        <p className="py-6 text-center text-body-s text-muted">Nenhuma resposta ainda.</p>
      ) : (
        <div className="flex max-h-64 flex-col gap-3 overflow-y-auto pr-1">
          {recent.map((lead) => (
            <div key={lead.id} className="border-b border-line pb-3 last:border-0 last:pb-0">
              <p className="font-mono text-mono-label uppercase text-faint">{lead.name || lead.email}</p>
              <p className="mt-1 line-clamp-2 text-body-s text-fg">{answerDisplay(lead.survey?.answers, question.id)}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
