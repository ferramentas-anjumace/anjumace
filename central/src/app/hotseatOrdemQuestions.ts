/* ----------------------------------------------------------------------------
   Hotseat "A Ordem" — dicionário da pesquisa pós-cadastro
   ----------------------------------------------------------------------------
   Cópia manual de `SURVEY_QUESTIONS` em
   design-system/src/landing/aordem/AppAordemCaptura.jsx (linhas ~485-498, cópia
   feita em 30/07). Os dois projetos não compartilham build — se a pesquisa da
   landing mudar (pergunta nova, opção renomeada, id trocado), este arquivo
   PRECISA ser atualizado manualmente, ou os gráficos aqui divergem em
   silêncio (uma opção que não existe mais em `options` cai no bucket "Outro").
---------------------------------------------------------------------------- */

export type SurveyQuestionType = 'scale' | 'multi' | 'single' | 'text'

export interface SurveyQuestionDef {
  id: string
  step: 1 | 2 | 3 | 4
  type: SurveyQuestionType
  /** Pergunta integral — usada em tooltip/detalhe por lead. */
  question: string
  /** Rótulo curto — título de card, cabeçalho de coluna no CSV. */
  shortLabel: string
  /** Presente só em `multi` e `single`. */
  options?: string[]
}

export const SURVEY_QUESTIONS: SurveyQuestionDef[] = [
  {
    id: '18', step: 1, type: 'scale',
    shortLabel: 'Satisfação com o treino (0–10)',
    question: 'De zero a dez, o quanto você está satisfeita com o que o seu treino vem entregando hoje?',
  },
  {
    id: '31', step: 1, type: 'multi',
    shortLabel: 'O que atrapalhou o treino',
    question: 'Nas últimas quatro semanas, o que fez você faltar ou encurtar um treino? Marque quantas quiser.',
    options: ['Cansaço no fim do dia', 'A rotina de trabalho', 'Filhos, casa ou família', 'A vontade não apareceu naquele dia', 'Dor ou desconforto físico', 'Não faltei nem encurtei nenhum treino', 'Outro motivo'],
  },
  {
    id: '32', step: 1, type: 'multi',
    shortLabel: 'Dificuldade técnica',
    question: 'Em quais destes movimentos você sente mais dificuldade de executar com técnica?',
    options: ['Agachamento e suas variações', 'Levantamento terra e puxadas', 'Exercícios de glúteo', 'Membros superiores (ombro, costas, braço)', 'Abdômen e core', 'Sinto dificuldade em quase tudo', 'Não sinto dificuldade em nenhum'],
  },
  {
    id: '21', step: 2, type: 'text',
    shortLabel: 'O que incomoda hoje',
    question: 'O que mais te incomoda hoje quando você pensa no seu treino? Escreva do jeito que vier.',
  },
  {
    id: '22', step: 2, type: 'text',
    shortLabel: 'Se desse certo, o que mudaria',
    question: 'Se o seu treino desse exatamente certo, o que teria mudado na sua vida daqui a um ano? Vale o que você estaria fazendo, como estaria se sentindo e o que estaria vendo. Pode escrever do jeito mais honesto: aqui não existe resposta errada nem resposta',
  },
  {
    id: '33', step: 2, type: 'multi',
    shortLabel: 'O que importa num treino',
    question: 'O que é importante para você em um treino? (marque quantas quiser)',
    options: ['Executar os movimentos com técnica', 'Voltar a evoluir depois de um período parada no mesmo lugar', 'Manter a constância sem sumir', 'Treinar sem dor', 'Ter mais energia no dia a dia', 'Gostar mais do que eu vejo no espelho'],
  },
  {
    id: '23', step: 2, type: 'text',
    shortLabel: 'O que já tentou e não funcionou',
    question: 'Conte alguma coisa que você já tentou e que não funcionou. O que aconteceu?',
  },
  {
    id: '34', step: 3, type: 'multi',
    shortLabel: 'Objeções ao investimento',
    question: 'Pensando em investir num acompanhamento de treino, o quanto cada uma destas coisas pesa para você?',
    options: ['Medo de começar e não dar conta', 'Já investi antes e me arrependi', 'O valor do investimento', 'A minha rotina não deixa', 'Receio de receber algo genérico, igual para todo mundo', 'Acredito que consigo por conta própria'],
  },
  {
    id: '24', step: 3, type: 'text',
    shortLabel: 'Pergunta à Anju',
    question: 'Se você pudesse fazer uma pergunta à Anju na noite do encontro, qual seria? As perguntas mais frequentes entram no bloco ao vivo do final.',
  },
  {
    id: '35', step: 3, type: 'multi',
    shortLabel: 'Formato de acompanhamento',
    question: 'Se você fosse contratar um acompanhamento de treino hoje, o que ele precisaria ter para você considerar que valeu? Marque até três. É a ordem de prioridade que interessa, não a lista completa.',
    options: ['Um programa montado para o meu nível e a minha frequência', 'Alguém que olhe como eu executo e me corrija', 'Vídeo de cada exercício, com o porquê de cada detalhe', 'Contato direto com quem prescreve, para tirar dúvida', 'Uma prescrição feita para o meu corpo, e não para um corpo qualquer', 'Um grupo de mulheres treinando junto comigo', 'Poder testar antes de me comprometer', 'Outro'],
  },
  {
    id: '26', step: 4, type: 'single',
    shortLabel: 'Onde busca informação',
    question: 'Quando você procura informação sobre treino, onde você olha primeiro?',
    options: ['Instagram', 'YouTube', 'TikTok', 'Busca no Google', 'Pergunto a alguém na academia', 'Pergunto a uma amiga'],
  },
  {
    id: '27', step: 4, type: 'single',
    shortLabel: 'Fase de vida atual',
    question: 'Qual destas fases você está vivendo hoje? Escolha a que mais pesa na sua rotina.',
    options: ['Gestação', 'Pós-parto, até dois anos', 'Rotina com filhos pequenos', 'Perimenopausa ou menopausa', 'Nenhuma dessas no momento', 'Prefiro não responder'],
  },
]

export type SurveyAnswers = Record<string, string | string[]>

/** Formato mínimo aceito pelos helpers abaixo — evita importar o tipo completo
    de lead (que por sua vez importaria este arquivo), sem depender de nada
    fora deste módulo. */
interface LeadLike {
  survey: { answers: SurveyAnswers } | null
}

function rawAnswer(lead: LeadLike, questionId: string): string | string[] | undefined {
  return lead.survey?.answers?.[questionId]
}

/** Um lead "respondeu" a pergunta se o valor não é vazio (string não-branca,
    ou array com pelo menos uma opção marcada). */
export function hasAnswered(lead: LeadLike, questionId: string): boolean {
  const v = rawAnswer(lead, questionId)
  if (v == null) return false
  return Array.isArray(v) ? v.length > 0 : v.trim().length > 0
}

/** Quantos leads (do array já filtrado) responderam a essa pergunta —
    denominador correto pra distribuição por pergunta (a pesquisa é sequencial
    em 4 telas, então perguntas de steps mais tardios têm menos respostas que
    o total de leads). */
export function respondedCount(leads: LeadLike[], questionId: string): number {
  return leads.reduce((n, l) => n + (hasAnswered(l, questionId) ? 1 : 0), 0)
}

export interface AnswerTally {
  option: string
  count: number
}

/** Conta respostas de uma pergunta `multi`/`single` por opção. Opções que não
    batem com `question.options` (opções desatualizadas — ver aviso no topo do
    arquivo) caem num bucket "Outro" em vez de serem descartadas. Ordenado por
    contagem decrescente. */
export function tallyAnswers(leads: LeadLike[], question: SurveyQuestionDef): AnswerTally[] {
  const counts = new Map<string, number>()
  for (const opt of question.options ?? []) counts.set(opt, 0)
  let otherCount = 0

  for (const lead of leads) {
    const raw = rawAnswer(lead, question.id)
    if (raw == null) continue
    const values = Array.isArray(raw) ? raw : [raw]
    for (const v of values) {
      const value = String(v).trim()
      if (!value) continue
      if (counts.has(value)) counts.set(value, (counts.get(value) ?? 0) + 1)
      else otherCount += 1
    }
  }

  const result: AnswerTally[] = Array.from(counts, ([option, count]) => ({ option, count }))
  if (otherCount > 0) result.push({ option: 'Outro', count: otherCount })
  return result.sort((a, b) => b.count - a.count)
}

/** Formata uma resposta pra exibição (tabela/drawer de detalhe) — arrays
    viram uma lista separada por "; ", vazio vira "—". */
export function answerDisplay(answers: SurveyAnswers | null | undefined, questionId: string): string {
  const v = answers?.[questionId]
  if (v == null) return '—'
  if (Array.isArray(v)) return v.length > 0 ? v.join('; ') : '—'
  const s = v.trim()
  return s || '—'
}
