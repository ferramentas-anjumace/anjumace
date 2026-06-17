import { cn } from '../../lib/cn'

/**
 * QuizQuestion — invólucro de uma pergunta: título + ajuda + opções.
 * Layout puro; o estado/seleção vem de fora (ver componente Quiz).
 *
 * - question: enunciado
 * - help: texto de apoio
 * - children: as QuizOption(s)
 */
export function QuizQuestion({ question, help, className, children, ...props }) {
  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <div className="flex flex-col gap-2">
        <h2 className="text-h3 text-content text-balance">{question}</h2>
        {help && <p className="text-body text-content-muted">{help}</p>}
      </div>
      <div className="flex flex-col gap-3" role="group">
        {children}
      </div>
    </div>
  )
}
