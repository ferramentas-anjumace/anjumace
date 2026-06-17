import { Search, Mail, ArrowRight, Play, Star } from 'lucide-react'
import {
  Button, Badge, Avatar, Divider, Chip, Tooltip,
  Input, Textarea, Select, Checkbox, Radio, Toggle,
} from '../../components'
import { ShowcaseSection, Row } from '../ui'

export function BaseSection() {
  return (
    <div className="space-y-20">
      <ShowcaseSection id="buttons" title="Button">
        <Row label="Variantes">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="danger">Danger</Button>
        </Row>
        <Row label="Tamanhos">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </Row>
        <Row label="Com ícone">
          <Button leftIcon={<Mail className="size-4" strokeWidth={1.5} />}>Inscrever</Button>
          <Button variant="outline" rightIcon={<ArrowRight className="size-4" strokeWidth={1.5} />}>Saber mais</Button>
          <Button iconOnly aria-label="Play" variant="secondary"><Play className="size-4" strokeWidth={1.5} /></Button>
        </Row>
        <Row label="Estados">
          <Button loading>Enviando</Button>
          <Button disabled>Disabled</Button>
          <Button fullWidth className="max-w-xs">Full width</Button>
        </Row>
      </ShowcaseSection>

      <ShowcaseSection id="badges" title="Badge · Chip · Avatar">
        <Row label="Badges">
          <Badge>Neutral</Badge>
          <Badge variant="accent">Sálvia</Badge>
          <Badge variant="accent-2">Dourado</Badge>
          <Badge variant="solid">Solid</Badge>
          <Badge variant="success">Ativo</Badge>
          <Badge variant="warning">Pendente</Badge>
          <Badge variant="danger">Erro</Badge>
          <Badge variant="solid-2" uppercase>VIP</Badge>
        </Row>
        <Row label="Chips">
          <Chip icon={<Star className="size-3" strokeWidth={2} />}>Intermediário</Chip>
          <Chip onRemove={() => {}}>Filtro removível</Chip>
          <div className="rounded-2xl bg-graphite-800 p-3"><Chip glass>45 minutos</Chip></div>
        </Row>
        <Row label="Avatar">
          <Avatar name="Anju Mace" size="sm" />
          <Avatar name="Anju Mace" />
          <Avatar name="Anju Mace" size="lg" vip />
          <Avatar name="Bia Lima" status="online" />
        </Row>
      </ShowcaseSection>

      <ShowcaseSection id="forms" title="Formulários">
        <div className="grid gap-6 md:grid-cols-2 max-w-3xl">
          <Input label="Nome" placeholder="Seu nome" required />
          <Input label="E-mail" type="email" placeholder="voce@email.com" leftIcon={<Mail className="size-4" strokeWidth={1.5} />} hint="Nunca compartilhamos seu e-mail." />
          <Input label="Busca" placeholder="Buscar treino" leftIcon={<Search className="size-4" strokeWidth={1.5} />} />
          <Input label="Senha" type="password" defaultValue="123" error="Mínimo de 8 caracteres." />
          <Select label="Objetivo" placeholder="Selecione" options={[{ value: 'forca', label: 'Força' }, { value: 'hipertrofia', label: 'Hipertrofia' }, { value: 'emagrecimento', label: 'Emagrecimento' }]} />
          <Input label="Disponível" defaultValue="Confirmado" success="Tudo certo!" />
          <Textarea className="md:col-span-2" label="Mensagem" placeholder="Conte seu objetivo…" hint="Opcional." />
        </div>
        <Row label="Seleção">
          <Checkbox label="Aceito os termos" description="Li e concordo com a política." defaultChecked />
          <Radio name="plano" label="Mensal" defaultChecked />
          <Radio name="plano" label="Anual" />
          <Toggle label="Notificações" defaultChecked />
        </Row>
      </ShowcaseSection>

      <ShowcaseSection id="misc" title="Divider · Tooltip">
        <Divider label="ou" />
        <Divider dashed />
        <Row label="Tooltip">
          <Tooltip content="Dica acessível em hover/foco">
            <Button variant="outline">Passe o mouse</Button>
          </Tooltip>
        </Row>
      </ShowcaseSection>
    </div>
  )
}
