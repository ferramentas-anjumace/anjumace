import { useState } from 'react'
import {
  Button, Modal, Drawer, useToast, Checkbox, Input,
  ChecklistTemplate, SlideCover, SlideContent, SlideQuote, SlideClosing,
  SocialCard,
} from '../../components'
import { ShowcaseSection, Row } from '../ui'

const CHECK_ITEMS = [
  { label: 'Sleep', description: 'Dormi pelo menos 7h de qualidade? Energia começa no descanso.' },
  { label: 'Move', description: 'Fiz minha primeira ativação do dia? Mobilidade ou mini cardio.' },
  { label: 'Hydrate', description: 'Tomei meu primeiro copo d’água? Hidratação = performance.' },
  { label: 'Fuel', description: 'Café da manhã pensado para energia real? Proteína + fibras.' },
  { label: 'Mindset', description: 'Fiz 2 minutos de respiração ou foco mental?' },
]

export function TemplatesSection() {
  const [modal, setModal] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const toast = useToast()

  return (
    <div className="space-y-20">
      {/* OVERLAYS */}
      <ShowcaseSection id="overlays" title="Overlays — Modal · Drawer · Toast">
        <Row label="Disparar">
          <Button onClick={() => setModal(true)}>Abrir Modal</Button>
          <Button variant="outline" onClick={() => setDrawer(true)}>Abrir Drawer</Button>
          <Button variant="secondary" onClick={() => toast({ title: 'Treino salvo!', description: 'Seu progresso foi registrado.', variant: 'success' })}>
            Toast sucesso
          </Button>
          <Button variant="ghost" onClick={() => toast({ title: 'Atenção', description: 'Você tem 1 treino pendente.', variant: 'warning' })}>
            Toast aviso
          </Button>
          <Button variant="danger" onClick={() => toast({ title: 'Erro ao salvar', description: 'Tente novamente.', variant: 'danger' })}>
            Toast erro
          </Button>
        </Row>

        <Modal
          open={modal}
          onClose={() => setModal(false)}
          title="Confirmar avaliação"
          description="Você receberá um e-mail com os próximos passos."
          footer={
            <>
              <Button variant="ghost" onClick={() => setModal(false)}>Cancelar</Button>
              <Button onClick={() => { setModal(false); toast({ title: 'Confirmado!', variant: 'success' }) }}>Confirmar</Button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <Input label="E-mail" type="email" placeholder="voce@email.com" />
            <Checkbox label="Quero receber lembretes por WhatsApp." />
          </div>
        </Modal>

        <Drawer
          open={drawer}
          onClose={() => setDrawer(false)}
          title="Filtrar treinos"
          footer={
            <>
              <Button variant="ghost" fullWidth onClick={() => setDrawer(false)}>Limpar</Button>
              <Button fullWidth onClick={() => setDrawer(false)}>Aplicar</Button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <Checkbox label="Força" defaultChecked />
            <Checkbox label="Cardio" />
            <Checkbox label="Mobilidade" />
            <Checkbox label="Até 30 minutos" />
          </div>
        </Drawer>
      </ShowcaseSection>

      {/* DOC TEMPLATE */}
      <ShowcaseSection id="docs" title="Documento — Checklist A4">
        <div className="max-w-sm">
          <ChecklistTemplate
            title={<>Morning Fitness <strong className="text-graphite-800">Checklist</strong></>}
            intro="Um checklist matinal pensado para alinhar corpo e mente logo cedo. Pequenos hábitos que preparam você para treinar melhor."
            items={CHECK_ITEMS}
            footer="anjumace.com · Consistency isn’t intensity — it’s repetition."
          />
        </div>
      </ShowcaseSection>

      {/* SLIDES */}
      <ShowcaseSection id="slides" title="Slides de aula (16:9)">
        <div className="grid gap-6 lg:grid-cols-2">
          <SlideCover kicker="Aula 01" title="Fundamentos do movimento consciente" subtitle="Como treinar com intenção e precisão técnica." />
          <SlideContent kicker="Conceito" title="Os 3 pilares">
            <ul className="flex flex-col gap-2">
              <li>1 — Ativação antes da carga</li>
              <li>2 — Amplitude com controle</li>
              <li>3 — Progressão consistente</li>
            </ul>
          </SlideContent>
          <SlideQuote quote="O movimento é a forma mais pura de evolução." author="Anju Mace" />
          <SlideClosing title="Vamos começar?" subtitle="Sua trilha personalizada espera por você." cta="Acessar aula" />
        </div>
      </ShowcaseSection>

      {/* SOCIAL */}
      <ShowcaseSection id="social" title="Criativos sociais">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <SocialCard tone="cream" kicker="Mindset" title="O movimento é um privilégio." />
          <SocialCard tone="graphite" kicker="Método" title="Disciplina é liberdade." />
          <SocialCard tone="sage" kicker="Lembrete" title="Consistência vence intensidade." />
          <SocialCard tone="photo" image="https://picsum.photos/id/1062/600/750?grayscale" kicker="Treino do dia" title="Comece agora." />
        </div>
      </ShowcaseSection>
    </div>
  )
}
