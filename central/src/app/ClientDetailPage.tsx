import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Building2, Mail, MoreHorizontal, Pause, Trash2, CalendarDays, ChevronDown, Check, Camera, Loader2 } from 'lucide-react'
import {
  Breadcrumb,
  Button,
  IconButton,
  Avatar,
  Badge,
  Card,
  CardTitle,
  StatCard,
  Divider,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  ProgressBar,
  AvatarGroup,
  EmptyState,
  DropdownMenu,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  useToast,
} from '@/components/ui'
import { CLIENT_STATUS_META, type ClientStatus } from './data'
import { useClients } from './clients'
import { useProfiles } from './profiles'
import { ClientAvatar } from './ClientAvatar'
import { ClientAccess } from './ClientAccess'
import { useSession } from '@/lib/session'

const STATUS_DOT: Record<'success' | 'steel' | 'warning', string> = {
  success: 'bg-ok',
  steel: 'bg-steel-400',
  warning: 'bg-warn',
}
const STATUS_ORDER: ClientStatus[] = ['ativo', 'onboarding', 'pausado']

/** Badge de status; para admin, vira um seletor para alterar o status. */
function StatusControl({
  status,
  canEdit,
  onChange,
}: {
  status: ClientStatus
  canEdit: boolean
  onChange: (s: ClientStatus) => void
}) {
  const meta = CLIENT_STATUS_META[status]
  if (!canEdit) {
    return (
      <Badge tone={meta.tone} dot>
        {meta.label}
      </Badge>
    )
  }
  return (
    <DropdownMenu
      align="start"
      trigger={
        <button className="inline-flex h-6 items-center gap-1.5 rounded-md border border-strong bg-slate-800 pl-2 pr-1.5 transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:shadow-focus">
          <span className={`size-1.5 rounded-full ${STATUS_DOT[meta.tone]}`} aria-hidden />
          <span className="font-mono text-mono-label uppercase text-strong">{meta.label}</span>
          <ChevronDown size={14} strokeWidth={1.5} className="text-muted" aria-hidden />
        </button>
      }
    >
      <MenuLabel>Alterar status</MenuLabel>
      {STATUS_ORDER.map((s) => (
        <MenuItem
          key={s}
          onClick={() => onChange(s)}
          icon={
            <span className="grid size-4 place-items-center">
              {s === status && <Check size={14} strokeWidth={2} aria-hidden />}
            </span>
          }
        >
          {CLIENT_STATUS_META[s].label}
        </MenuItem>
      ))}
    </DropdownMenu>
  )
}

export function ClientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { role } = useSession()
  const { getClient, setClientStatus, setClientAvatar, removeClient, loading } = useClients()
  const { members } = useProfiles()
  const client = getClient(id)
  const [tab, setTab] = useState('visao')
  const fileRef = useRef<HTMLInputElement>(null)

  const onPickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // permite reenviar o mesmo arquivo
    if (!file || !client) return
    if (!file.type.startsWith('image/')) {
      toast.error('Arquivo inválido', 'Selecione uma imagem.')
      return
    }
    if (file.size > 1_500_000) {
      toast.error('Imagem muito grande', 'Use uma foto de até 1,5 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setClientAvatar(client.id, String(reader.result))
      toast.success('Foto atualizada', client.name)
    }
    reader.onerror = () => toast.error('Falha ao ler o arquivo')
    reader.readAsDataURL(file)
  }

  if (loading && !client) {
    return (
      <div className="mx-auto grid max-w-3xl place-items-center px-6 py-24">
        <Loader2 size={26} strokeWidth={1.5} className="animate-spin text-steel-300" aria-label="Carregando" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <EmptyState
          icon={<Building2 size={22} strokeWidth={1.5} />}
          title="Cliente não encontrado"
          description={`Não há registro para "${id}".`}
          action={<Button onClick={() => navigate('/app/clientes')}>Voltar à lista</Button>}
        />
      </div>
    )
  }

  const tone = client.status === 'pausado' ? 'warning' : 'steel'

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <Breadcrumb
        className="mb-6"
        items={[{ label: 'Clientes', href: '/app/clientes' }, { label: client.name }]}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label={client.avatar ? 'Trocar foto do cliente' : 'Enviar foto do cliente'}
              className="group relative block overflow-hidden rounded-xl focus-visible:outline-none focus-visible:shadow-focus"
            >
              <ClientAvatar src={client.avatar ?? undefined} name={client.name} className="size-14 rounded-xl" iconSize={26} />
              <span className="absolute inset-0 grid place-items-center bg-ink/60 text-strong opacity-0 transition-opacity duration-fast group-hover:opacity-100">
                <Camera size={18} strokeWidth={1.5} aria-hidden />
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onPickAvatar}
              className="hidden"
            />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-h1 font-semibold text-strong">{client.name}</h1>
              <StatusControl
                status={client.status}
                canEdit={role === 'admin'}
                onChange={(s) => {
                  setClientStatus(client.id, s)
                  toast.success('Status atualizado', CLIENT_STATUS_META[s].label)
                }}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" leftIcon={<Mail size={18} strokeWidth={1.5} />}>
            Contatar
          </Button>
          <Button leftIcon={<CalendarDays size={18} strokeWidth={1.5} />} onClick={() => navigate('/app/agenda')}>
            Agendar
          </Button>
          {role === 'admin' && (
          <DropdownMenu
            align="end"
            trigger={
              <IconButton aria-label="Mais ações">
                <MoreHorizontal size={18} strokeWidth={1.5} />
              </IconButton>
            }
          >
            <MenuItem
              icon={<Pause size={16} strokeWidth={1.5} />}
              onClick={() => { setClientStatus(client.id, 'pausado'); toast.info('Conta pausada', client.name) }}
            >
              Pausar conta
            </MenuItem>
            <MenuSeparator />
            <MenuItem
              icon={<Trash2 size={16} strokeWidth={1.5} />}
              destructive
              onClick={() => { removeClient(client.id); toast.success('Cliente removido', client.name); navigate('/app/clientes') }}
            >
              Remover cliente
            </MenuItem>
          </DropdownMenu>
          )}
        </div>
      </div>

      <Divider className="my-6" />

      <Tabs value={tab} onValueChange={setTab}>
        <TabList aria-label="Seções do cliente">
          <Tab value="visao">Visão geral</Tab>
          <Tab value="acessos">Acessos</Tab>
          <Tab value="agenda">Agenda</Tab>
        </TabList>

        {/* VISÃO GERAL */}
        <TabPanel value="visao">
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Fase do projeto" value={client.phase} active />
            <StatCard label="Cliente desde" value={client.since} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardTitle className="mb-4">Progresso do projeto</CardTitle>
              <ProgressBar value={client.progress} showValue label="Concluído" tone={tone} />
              <p className="mt-4 text-body-s text-muted">
                {client.status === 'onboarding'
                  ? 'Conta em onboarding — configurando acessos e primeiros fluxos.'
                  : client.status === 'pausado'
                    ? 'Conta pausada — implantação retomará após reativação.'
                    : 'Conta ativa e saudável. Acompanhamento mensal.'}
              </p>
            </Card>

            <Card>
              <CardTitle className="mb-1">Time responsável</CardTitle>
              <p className="mb-4 text-body-s text-muted">Todo o time acompanha este cliente.</p>
              <div className="flex items-center gap-3">
                {members.length > 0 ? (
                  <>
                    <AvatarGroup max={5}>
                      {members.map((u) => (
                        <Avatar key={u.id} size="md" name={u.name} status="online" />
                      ))}
                    </AvatarGroup>
                    <span className="font-mono text-mono-data text-faint">{members.length} pessoas</span>
                  </>
                ) : (
                  <span className="text-body-s text-faint">Nenhum membro cadastrado.</span>
                )}
              </div>
              <Divider className="my-4" />
              <dl className="flex flex-col gap-3 text-body-s">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">Contato</dt>
                  <dd className="truncate font-medium text-strong">{client.contact}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">Desde</dt>
                  <dd className="font-medium text-strong">{client.since}</dd>
                </div>
              </dl>
            </Card>
          </div>
        </TabPanel>

        {/* ACESSOS */}
        <TabPanel value="acessos">
          <ClientAccess clientId={client.id} canManage={role === 'admin'} />
        </TabPanel>

        {/* AGENDA */}
        <TabPanel value="agenda">
          <EmptyState
            icon={<CalendarDays size={22} strokeWidth={1.5} />}
            title="Sem compromissos"
            description="Compromissos vinculados a este cliente aparecerão aqui."
            action={<Button onClick={() => navigate('/app/agenda')}>Abrir agenda</Button>}
          />
        </TabPanel>
      </Tabs>
    </div>
  )
}
