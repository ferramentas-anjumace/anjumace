import { useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Button } from '../Button/Button'
import { QuizProgress } from './QuizProgress'
import { QuizQuestion } from './QuizQuestion'
import { QuizOption } from './QuizOption'

/**
 * Quiz — fluxo completo de quiz (controlado internamente).
 *
 * - questions: [{ id, question, help?, multi?, options: [{ value, label, description?, emoji?, icon? }] }]
 * - onComplete(answers): chamado ao finalizar; `answers` = { [questionId]: value | value[] }
 * - renderResult(answers): ReactNode da tela de resultado (use <QuizResult/>)
 * - progressVariant: 'bar' | 'dots'
 *
 * Avança automaticamente em perguntas single-choice; multi usa o botão "Próximo".
 */
export function Quiz({ questions = [], onComplete, renderResult, progressVariant = 'bar', className }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [done, setDone] = useState(false)

  const q = questions[step]
  const isLast = step === questions.length - 1
  const current = answers[q?.id]
  const hasAnswer = q?.multi ? Array.isArray(current) && current.length > 0 : current != null

  function select(value) {
    if (q.multi) {
      const set = new Set(Array.isArray(current) ? current : [])
      set.has(value) ? set.delete(value) : set.add(value)
      setAnswers((a) => ({ ...a, [q.id]: [...set] }))
    } else {
      const next = { ...answers, [q.id]: value }
      setAnswers(next)
      // auto-advance em single-choice
      setTimeout(() => goNext(next), 220)
    }
  }

  function goNext(state = answers) {
    if (isLast) {
      setDone(true)
      onComplete?.(state)
    } else {
      setStep((s) => Math.min(s + 1, questions.length - 1))
    }
  }

  function goBack() {
    if (done) { setDone(false); return }
    setStep((s) => Math.max(s - 1, 0))
  }

  if (done && renderResult) {
    return <div className={cn('mx-auto w-full max-w-2xl', className)}>{renderResult(answers)}</div>
  }

  return (
    <div className={cn('mx-auto flex w-full max-w-2xl flex-col gap-8', className)}>
      <QuizProgress step={step + 1} total={questions.length} variant={progressVariant} />

      <QuizQuestion question={q.question} help={q.help}>
        {q.options.map((opt) => {
          const selected = q.multi
            ? Array.isArray(current) && current.includes(opt.value)
            : current === opt.value
          return (
            <QuizOption
              key={opt.value}
              label={opt.label}
              description={opt.description}
              emoji={opt.emoji}
              icon={opt.icon}
              multi={q.multi}
              selected={selected}
              onSelect={() => select(opt.value)}
            />
          )
        })}
      </QuizQuestion>

      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={goBack}
          disabled={step === 0}
          leftIcon={<ArrowLeft className="size-4" strokeWidth={1.5} />}
        >
          Voltar
        </Button>
        {/* Botão Próximo só aparece em multi (single avança sozinho) */}
        {q.multi && (
          <Button
            onClick={() => goNext()}
            disabled={!hasAnswer}
            rightIcon={<ArrowRight className="size-4" strokeWidth={1.5} />}
          >
            {isLast ? 'Ver resultado' : 'Próximo'}
          </Button>
        )}
      </div>
    </div>
  )
}
