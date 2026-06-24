import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Building2, ArrowRight, Loader2 } from 'lucide-react'
import {
  SectionHeader,
  Button,
  Card,
  Badge,
  Avatar,
  AvatarGroup,
  ProgressBar,
  SearchField,
  Tabs,
  TabList,
  Tab,
  EmptyState,
  Modal,
  Input,
  Select,
  useToast,
} from '@/components/ui'
import { CLIENT_STATUS_META, type ClientStatus } from './data'
import { useClients, type ClientInput } from './clients'
import { useProfiles } from './profiles'
import { ClientAvatar } from './ClientAvatar'
import { useSession } from '@/lib/session'

const STATUS_ORDER: ClientStatus[] = ['onboarding', 'ativo', 'pausado']

type Draft = { name: string; segment: string; phase: string; status: ClientStatus; contact: string; since: string }
const EMPTY: Draft = { name: '', segment: '', phase: '', status: 'onboarding', contact: '', since: '' }

function CreateClientModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (d: Draft) => void }) {
  const [draft, setDraft] = useState<Draft>(EMPTY)
  useMemo(() => { if (open) setDraft(EMPTY) }, [open])
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Novo cliente"
      description="Cadastre uma nova conta."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onCreate(draft)}>Criar cliente</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input label="Nome" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Nome do cliente" autoFocus />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Segmento" optional value={draft.segment} onChange={(e) => setDraft((d) => ({ ...d, segment: e.target.value }))} placeholder="Ex.: Saúde & fitness" />
          <Select label="Status" value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as ClientStatus }))}>
            {STATUS_ORDER.map((s) => <option key={s} value={s}>{CLIENT_STATUS_META[s].label}</option>)}
          </Select>
          <Input label="Fase" optional value={draft.phase} onChange={(e) => setDraft((d) => ({ ...d, phase: e.target.value }))} placeholder="Ex.: Onboarding" />
          <Input label="Desde" optional value={draft.since} onChange={(e) => setDraft((d) => ({ ...d, since: e.target.value }))} placeholder="Ex.: jun 2026" />
        </div>
        <Input label="Contato" optional value={draft.contact} onChange={(e) => setDraft((d) => ({ ...d, contact: e.target.value }))} placeholder="e-mail de contato" />
      </div>
    </Modal>
  )
}

export function ClientsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { clients, loading, addClient } = useClients()
  const { members } = useProfiles()
  const { role } = useSession()
  const isAdmin = role === 'admin'
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'todos' | ClientStatus>('todos')
  const [createOpen, setCreateOpen] = useState(false)

  const counts = {
    todos: clients.length,
    ativo: clients.filter((c) => c.status === 'ativo').length,
    onboarding: clients.filter((c) => c.status === 'onboarding').length,
    pausado: clients.filter((c) => c.status === 'pausado').length,
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return clients.filter((c) => {
      const matchQ = !q || c.name.toLowerCase().includes(q)
      const matchStatus = status === 'todos' || c.status === status
      return matchQ && matchStatus
    })
  }, [clients, query, status])

  const create = async (d: Draft) => {
    if (!d.name.trim()) { toast.error('Informe o nome'); return }
    const payload: ClientInput = {
      name: d.name.trim(),
      segment: d.segment.trim() || undefined,
      phase: d.phase.trim() || undefined,
      status: d.status,
      contact: d.contact.trim() || undefined,
      since: d.since.trim() || undefined,
    }
    const { error } = await addClient(payload)
    if (error) toast.error('Falha ao criar', error)
    else { toast.success('Cliente criado', d.name); setCreateOpen(false) }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <SectionHeader
        eyebrow="Operação"
        title="Clientes"
        description="Contas e progresso de implantação."
        className="mb-6"
        actions={
          isAdmin ? (
            <Button leftIcon={<Plus size={18} strokeWidth={1.5} />} onClick={() => setCreateOpen(true)}>
              Novo cliente
            </Button>
          ) : undefined
        }
      />

      {isAdmin && (
        <>
          <Tabs value={status} onValueChange={(v) => setStatus(v as typeof status)} className="mb-4">
            <TabList aria-label="Filtrar por status">
              <Tab value="todos" badge={<Badge tone="neutral">{counts.todos}</Badge>}>Todos</Tab>
              <Tab value="ativo" badge={<Badge tone="success">{counts.ativo}</Badge>}>Ativos</Tab>
              <Tab value="onboarding" badge={<Badge tone="steel">{counts.onboarding}</Badge>}>Onboarding</Tab>
              <Tab value="pausado" badge={<Badge tone="warning">{counts.pausado}</Badge>}>Pausados</Tab>
            </TabList>
          </Tabs>

          <div className="mb-5 max-w-md">
            <SearchField
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClear={() => setQuery('')}
              placeholder="Buscar cliente"
              aria-label="Buscar clientes"
            />
          </div>
        </>
      )}

      {loading ? (
        <div className="grid place-items-center py-24">
          <Loader2 size={26} strokeWidth={1.5} className="animate-spin text-steel-300" aria-label="Carregando" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Building2 size={22} strokeWidth={1.5} />}
          title={clients.length === 0 ? 'Nenhum cliente ainda' : 'Nenhum cliente encontrado'}
          description={clients.length === 0 ? 'Cadastre o primeiro cliente.' : 'Ajuste a busca ou o filtro.'}
          action={
            isAdmin && clients.length === 0 ? (
              <Button leftIcon={<Plus size={18} strokeWidth={1.5} />} onClick={() => setCreateOpen(true)}>Novo cliente</Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const meta = CLIENT_STATUS_META[c.status]
            return (
              <Card
                key={c.id}
                variant="interactive"
                tabIndex={0}
                role="button"
                onClick={() => navigate(`/app/clientes/${c.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    navigate(`/app/clientes/${c.id}`)
                  }
                }}
                className="group flex flex-col gap-4"
              >
                <div className="flex items-center gap-3">
                  <ClientAvatar src={c.avatar ?? undefined} name={c.name} className="size-10 rounded-md" iconSize={18} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-h3 font-semibold text-strong">{c.name}</div>
                    <div className="truncate text-body-s text-muted">{c.phase}</div>
                  </div>
                  <Badge tone={meta.tone} dot>{meta.label}</Badge>
                </div>

                <ProgressBar
                  label="Projeto"
                  value={c.progress}
                  showValue
                  tone={c.status === 'pausado' ? 'warning' : 'steel'}
                />

                <div className="mt-auto flex items-center justify-between gap-2 border-t border-subtle pt-3">
                  <div className="flex items-center gap-2">
                    {members.length > 0 ? (
                      <>
                        <AvatarGroup max={3}>
                          {members.map((u) => (
                            <Avatar key={u.id} size="xs" name={u.name} />
                          ))}
                        </AvatarGroup>
                        <span className="text-body-s text-muted">Time</span>
                      </>
                    ) : null}
                  </div>
                  <span className="inline-flex items-center gap-1 font-mono text-mono-data text-faint transition-colors group-hover:text-steel-300">
                    Abrir
                    <ArrowRight size={14} strokeWidth={1.5} aria-hidden />
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <CreateClientModal open={createOpen} onClose={() => setCreateOpen(false)} onCreate={create} />
    </div>
  )
}
