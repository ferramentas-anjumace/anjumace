import { useState } from 'react'
import { User, Mail, Phone, RotateCcw, Sparkles } from 'lucide-react'
import {
  Input, Select, Textarea, Checkbox, Button, Card,
  Quiz, QuizResult, ProgressRing, Badge,
} from '../../components'
import { ShowcaseSection } from '../ui'

const QUESTIONS = [
  {
    id: 'objetivo',
    question: 'Qual seu principal objetivo agora?',
    help: 'Escolha o que mais ressoa com este momento.',
    options: [
      { value: 'forca', label: 'Ganhar força', description: 'Performance e potência', emoji: '💪' },
      { value: 'emagrecer', label: 'Emagrecer com saúde', description: 'Composição corporal', emoji: '🔥' },
      { value: 'energia', label: 'Mais energia e disposição', description: 'Bem-estar diário', emoji: '✨' },
    ],
  },
  {
    id: 'nivel',
    question: 'Como você descreveria seu nível?',
    options: [
      { value: 'iniciante', label: 'Iniciante', description: 'Pouca ou nenhuma experiência', emoji: '🌱' },
      { value: 'intermediario', label: 'Intermediário', description: 'Treino com alguma regularidade', emoji: '⚡' },
      { value: 'avancado', label: 'Avançado', description: 'Busco refinamento técnico', emoji: '🏆' },
    ],
  },
  {
    id: 'foco',
    question: 'Em quais áreas quer focar?',
    help: 'Pode escolher mais de uma.',
    multi: true,
    options: [
      { value: 'inferior', label: 'Inferior', emoji: '🦵' },
      { value: 'superior', label: 'Superior', emoji: '💪' },
      { value: 'core', label: 'Core', emoji: '🎯' },
      { value: 'mobilidade', label: 'Mobilidade', emoji: '🧘' },
    ],
  },
]

export function FormsSection() {
  const [quizKey, setQuizKey] = useState(0)
  const [contactErr, setContactErr] = useState(true)

  return (
    <div className="space-y-20">
      {/* FORMULÁRIO de captura/contato com validação */}
      <ShowcaseSection id="form-validation" title="Formulário com validação">
        <Card variant="elevated" padding="lg" className="max-w-xl">
          <form
            className="flex flex-col gap-5"
            onSubmit={(e) => { e.preventDefault(); setContactErr((v) => !v) }}
          >
            <div className="flex flex-col gap-1">
              <h3 className="text-h4">Agende sua avaliação</h3>
              <p className="text-body-sm text-content-muted">Resposta em até 24h úteis.</p>
            </div>
            <Input label="Nome completo" required placeholder="Como devemos te chamar?" leftIcon={<User className="size-4" strokeWidth={1.5} />} />
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="E-mail" type="email" required placeholder="voce@email.com" leftIcon={<Mail className="size-4" strokeWidth={1.5} />}
                error={contactErr ? 'E-mail inválido.' : undefined}
                success={!contactErr ? 'E-mail válido!' : undefined} />
              <Input label="WhatsApp" placeholder="(00) 00000-0000" leftIcon={<Phone className="size-4" strokeWidth={1.5} />} />
            </div>
            <Select label="Objetivo principal" placeholder="Selecione" required
              options={[{ value: 'forca', label: 'Força' }, { value: 'emagrecimento', label: 'Emagrecimento' }, { value: 'energia', label: 'Energia & bem-estar' }]} />
            <Textarea label="Conte um pouco sobre você" rows={3} hint="Opcional, mas ajuda muito." />
            <Checkbox required label="Aceito receber contato e a política de privacidade." />
            <Button type="submit" size="lg" fullWidth>Quero minha avaliação</Button>
          </form>
        </Card>
        <p className="text-caption">Clique em enviar para alternar entre estado de erro/sucesso do e-mail.</p>
      </ShowcaseSection>

      {/* QUIZ completo */}
      <ShowcaseSection id="quiz" title="Quiz (fluxo completo)">
        <Card variant="surface" padding="lg" className="max-w-2xl mx-auto">
          <Quiz
            key={quizKey}
            questions={QUESTIONS}
            renderResult={(answers) => (
              <QuizResult
                tone="accent"
                eyebrow="Seu perfil"
                title="Construtora de Força"
                description="Com base nas suas respostas, montamos uma trilha focada em performance, progressão inteligente e constância."
                media={<ProgressRing value={92} size={104} stroke={9}><Sparkles className="size-6 text-accent-text" strokeWidth={1.5} /></ProgressRing>}
                meta={
                  <div className="flex flex-wrap justify-center gap-2">
                    {Object.values(answers).flat().map((v) => (
                      <Badge key={String(v)} variant="surface" className="bg-surface" >{String(v)}</Badge>
                    ))}
                  </div>
                }
                actions={
                  <>
                    <Button size="lg">Ver minha trilha</Button>
                    <Button size="lg" variant="ghost" leftIcon={<RotateCcw className="size-4" strokeWidth={1.5} />} onClick={() => setQuizKey((k) => k + 1)}>
                      Refazer
                    </Button>
                  </>
                }
              />
            )}
          />
        </Card>
        <p className="text-caption text-center">Single-choice avança sozinho; a última pergunta é múltipla escolha.</p>
      </ShowcaseSection>
    </div>
  )
}
