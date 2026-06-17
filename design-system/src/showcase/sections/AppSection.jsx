import { useState } from 'react'
import { Home, Dumbbell, Camera, Users, Plus, Flame } from 'lucide-react'
import {
  ProfileHeader, CalendarStrip, WorkoutCard, BottomNav, ListItem,
  ProgressBar, ProgressRing, CommunityPost, Badge, Divider,
} from '../../components'
import { ShowcaseSection } from '../ui'
import { PhoneFrame } from '../PhoneFrame'

const DAYS = [
  { date: 10, weekday: 1 }, { date: 11, weekday: 2 }, { date: 12, weekday: 3 },
  { date: 13, weekday: 4 }, { date: 14, weekday: 5, done: true }, { date: 15, weekday: 6 }, { date: 16, weekday: 0 },
]

const EXERCISES = [
  { title: 'Agachamento livre', subtitle: 'Pernas · força', meta: '4×12', done: true },
  { title: 'Levantamento terra', subtitle: 'Posterior', meta: '4×10', done: true },
  { title: 'Desenvolvimento', subtitle: 'Ombros', meta: '3×12' },
  { title: 'Remada curvada', subtitle: 'Costas', meta: '3×12' },
]

export function AppSection() {
  const [nav, setNav] = useState('home')
  const [day, setDay] = useState(4)

  const navItems = [
    { id: 'home', label: 'Início', icon: <Home className="size-5" strokeWidth={1.5} /> },
    { id: 'treino', label: 'Treino', icon: <Dumbbell className="size-5" strokeWidth={1.5} /> },
    { id: 'add', label: 'Registrar', icon: <Plus className="size-6" strokeWidth={2} />, action: true },
    { id: 'fotos', label: 'Progresso', icon: <Camera className="size-5" strokeWidth={1.5} /> },
    { id: 'comunidade', label: 'Comunidade', icon: <Users className="size-5" strokeWidth={1.5} /> },
  ]

  return (
    <div className="space-y-20">
      {/* TELA COMPLETA num phone frame */}
      <ShowcaseSection id="app-screen" title="Tela — Meu treino (composição)">
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          <PhoneFrame>
            <div className="flex min-h-full flex-col px-5 pt-10 pb-28">
              <ProfileHeader
                name="Anju Mace"
                vip
                greeting="Terça, 19 Jul"
                title="Meu treino"
                notifications={3}
              />
              <div className="mt-5">
                <CalendarStrip days={DAYS} selected={day} todayIndex={4} onSelect={setDay} />
              </div>
              <div className="mt-6">
                <WorkoutCard
                  image="https://picsum.photos/id/1062/600/800?grayscale"
                  duration="45 minutos"
                  kicker="TREINO DE"
                  title="Força & mobilidade"
                  description="Ativação completa com estímulo metabólico."
                />
              </div>
              <div className="mt-6 flex items-center justify-between">
                <h2 className="text-h5">Exercícios</h2>
                <Badge variant="accent" size="sm">2/4 feitos</Badge>
              </div>
              <div className="mt-3 flex flex-col gap-2">
                {EXERCISES.map((e, i) => (
                  <ListItem
                    key={i}
                    media={<Dumbbell className="size-5" strokeWidth={1.5} />}
                    title={e.title}
                    subtitle={e.subtitle}
                    meta={e.meta}
                    done={e.done}
                    onClick={() => {}}
                  />
                ))}
              </div>
            </div>

            {/* bottom nav flutuante dentro da tela */}
            <div className="sticky bottom-4 px-4">
              <BottomNav items={navItems} active={nav} onChange={setNav} />
            </div>
          </PhoneFrame>

          {/* Componentes isolados ao lado */}
          <div className="flex-1 space-y-10 w-full">
            <div>
              <p className="text-label text-content-muted mb-3">ProfileHeader</p>
              <ProfileHeader name="Anju Mace" vip greeting="Terça, 19 Jul" title="Meu treino" notifications={3} />
            </div>
            <Divider />
            <div>
              <p className="text-label text-content-muted mb-3">CalendarStrip</p>
              <CalendarStrip days={DAYS} selected={day} todayIndex={4} onSelect={setDay} />
            </div>
            <Divider />
            <div className="max-w-md space-y-4">
              <p className="text-label text-content-muted">Progress</p>
              <ProgressBar value={65} showLabel />
              <ProgressBar value={40} tone="accent-2" showLabel />
              <div className="flex items-center gap-6">
                <ProgressRing value={75}>75%</ProgressRing>
                <ProgressRing value={48} tone="accent-2" size={88} stroke={8}>
                  <span className="flex flex-col items-center"><Flame className="size-4 text-accent-2-text" strokeWidth={1.5} /><span className="text-caption">5 dias</span></span>
                </ProgressRing>
              </div>
            </div>
          </div>
        </div>
      </ShowcaseSection>

      {/* WORKOUT CARD variações */}
      <ShowcaseSection id="workout-cards" title="WorkoutCard">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl">
          <WorkoutCard image="https://picsum.photos/id/1074/600/800?grayscale" duration="30 min" kicker="CARDIO" title="HIIT metabólico" />
          <WorkoutCard image="https://picsum.photos/id/103/600/800?grayscale" duration="50 min" kicker="FORÇA" title="Inferior completo" ratio="portrait" />
          <WorkoutCard image="https://picsum.photos/id/1080/600/800?grayscale" duration="20 min" kicker="MOBILIDADE" title="Recovery & alongamento" />
        </div>
      </ShowcaseSection>

      {/* COMUNIDADE */}
      <ShowcaseSection id="community" title="CommunityPost">
        <div className="grid gap-4 md:grid-cols-2 max-w-3xl">
          <CommunityPost author="Marina Alves" role="Aluna VIP" time="2h" text="Primeira semana completa! Energia totalmente diferente. 🙌" likes={42} comments={8} liked />
          <CommunityPost author="Duda Sá" role="Aluna" time="ontem" text="Recorde no agachamento hoje. Obrigada Anju!" image="https://picsum.photos/id/1067/600/340?grayscale" likes={128} comments={23} />
        </div>
      </ShowcaseSection>
    </div>
  )
}
