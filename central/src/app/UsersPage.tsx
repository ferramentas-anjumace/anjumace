import { useMemo, useState } from 'react'
import { Plus, MoreHorizontal, Pencil, UserX, Loader2, Trash2 } from 'lucide-react'
import {
  SectionHeader,
  Button,
  SearchField,
  Tabs,
  TabList,
  Tab,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  TableEmpty,
  Badge,
  Avatar,
  EmptyState,
  DropdownMenu,
  MenuItem,
  MenuSeparator,
  IconButton,
  Modal,
  Input,
  Select,
  useToast,
} from '@/components/ui'
import { useSession, ROLE_LABEL } from '@/lib/session'
import { usePermissions } from '@/lib/permissions'
import { useProfiles, type Member, type MemberRole, type MemberStatus } from './profiles'
import { AvatarUploader } from './AvatarUploader'

const ROLE_TONE: Record<MemberRole, 'steel' | 'success' | 'neutral' | 'sand' | 'warning' | 'danger'> = {
  admin: 'steel',
  lideranca: 'success',
  comercial: 'sand',
  crm: 'danger',
  social: 'warning',
  design: 'neutral',
}
/** Administrador e Liderança são gestores — recebem o ponto de destaque. */
const MANAGER_ROLES: MemberRole[] = ['admin', 'lideranca']

/* ----------------------------------------------------------- modal de edição */
function EditMemberModal({
  member,
  onClose,
  onSave,
  onAvatarChange,
  onAvatarError,
}: {
  member: Member | null
  onClose: () => void
  onSave: (id: string, patch: { name: string; role: MemberRole; status: MemberStatus }) => void
  onAvatarChange: (id: string, avatar: string | null) => void | Promise<void>
  onAvatarError: (message: string) => void
}) {
  const [name, setName] = useState('')
  const [role, setRole] = useState<MemberRole>('design')

  useMemo(() => {
    if (member) {
      setName(member.name)
      setRole(member.role)
    }
  }, [member])

  if (!member) return null
  return (
    <Modal
      open={!!member}
      onClose={onClose}
      title="Editar usuário"
      description={member.email ?? undefined}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSave(member.id, { name, role, status: member.status })}>Salvar</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <AvatarUploader
          name={name || member.name}
          src={member.avatar}
          onChange={(dataUrl) => onAvatarChange(member.id, dataUrl)}
          onError={onAvatarError}
        />
        <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} />
        <Select label="Papel" value={role} onChange={(e) => setRole(e.target.value as MemberRole)}>
          <option value="design">Design</option>
          <option value="comercial">Comercial</option>
          <option value="crm">CRM</option>
          <option value="social">Social Media</option>
          <option value="lideranca">Liderança</option>
          <option value="admin">Administrador</option>
        </Select>
      </div>
    </Modal>
  )
}

/* ----------------------------------------------------------- modal de criação */
function CreateUserModal({
  open,
  onClose,
  onCreate,
  creating,
}: {
  open: boolean
  onClose: () => void
  onCreate: (input: { email: string; password: string; name: string; role: MemberRole }) => void
  creating: boolean
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // Sem papel padrão: obriga a escolher explicitamente.
  const [role, setRole] = useState<MemberRole | ''>('')

  useMemo(() => {
    if (open) { setName(''); setEmail(''); setPassword(''); setRole('') }
  }, [open])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Novo usuário"
      description="A pessoa entra com este e-mail e senha. Sem cadastro aberto."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button loading={creating} disabled={!role} onClick={() => role && onCreate({ email, password, name, role })}>
            Criar usuário
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da pessoa" autoFocus />
        <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="pessoa@empresa.com" />
        <Input label="Senha provisória" type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="mínimo 6 caracteres" helperText="A pessoa pode trocar depois." />
        <Select label="Papel" placeholder="Selecione o papel" value={role} onChange={(e) => setRole(e.target.value as MemberRole)}>
          <option value="design">Design</option>
          <option value="comercial">Comercial</option>
          <option value="crm">CRM</option>
          <option value="social">Social Media</option>
          <option value="lideranca">Liderança</option>
          <option value="admin">Administrador</option>
        </Select>
      </div>
    </Modal>
  )
}

/* ============================================================== página ===== */
export function UsersPage() {
  const toast = useToast()
  const { user } = useSession()
  const { can } = usePermissions()
  const { members, loading, updateMember, setMemberAvatar, createUser, removeUser } = useProfiles()
  const isAdmin = can('manage_users')

  const [query, setQuery] = useState('')
  const [roleTab, setRoleTab] = useState<'todos' | MemberRole>('todos')
  const [editing, setEditing] = useState<Member | null>(null)
  const [deleting, setDeleting] = useState<Member | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return members.filter((u) => {
      const matchQ = !q || u.name.toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q)
      const matchRole = roleTab === 'todos' || u.role === roleTab
      return matchQ && matchRole
    })
  }, [members, query, roleTab])

  const counts = {
    todos: members.length,
    admin: members.filter((u) => u.role === 'admin').length,
    lideranca: members.filter((u) => u.role === 'lideranca').length,
    comercial: members.filter((u) => u.role === 'comercial').length,
    crm: members.filter((u) => u.role === 'crm').length,
    social: members.filter((u) => u.role === 'social').length,
    design: members.filter((u) => u.role === 'design').length,
  }

  const save = async (id: string, patch: { name: string; role: MemberRole; status: MemberStatus }) => {
    const { error } = await updateMember(id, patch)
    if (error) toast.error('Falha ao salvar', error)
    else toast.success('Usuário atualizado', patch.name)
    setEditing(null)
  }

  const changeAvatar = async (id: string, avatar: string | null) => {
    const { error } = await setMemberAvatar(id, avatar)
    if (error) toast.error('Falha ao salvar foto', error)
    else toast.success(avatar ? 'Foto atualizada' : 'Foto removida')
  }

  const remove = async (member: Member) => {
    setRemovingId(member.id)
    const { error } = await removeUser(member.id)
    setRemovingId(null)
    if (error) toast.error('Não foi possível excluir', error)
    else {
      toast.success('Usuário excluído', member.name || member.email || undefined)
      setDeleting(null)
    }
  }

  const create = async (input: { email: string; password: string; name: string; role: MemberRole }) => {
    if (!input.email.trim() || !input.password) {
      toast.error('Informe e-mail e senha')
      return
    }
    setCreating(true)
    const { error } = await createUser({
      email: input.email.trim(),
      password: input.password,
      name: input.name.trim(),
      role: input.role,
    })
    setCreating(false)
    if (error) toast.error('Não foi possível criar', error)
    else {
      toast.success('Usuário criado', input.email)
      setCreateOpen(false)
    }
  }

  return (
    <div className="mx-auto max-w-screen-2xl px-6 py-8">
      <SectionHeader
        eyebrow="Operação"
        title="Usuários"
        description="Gerencie o time, papéis e status de acesso."
        className="mb-6"
        actions={
          isAdmin ? (
            <Button leftIcon={<Plus size={18} strokeWidth={1.5} />} onClick={() => setCreateOpen(true)}>
              Novo usuário
            </Button>
          ) : undefined
        }
      />

      <Tabs value={roleTab} onValueChange={(v) => setRoleTab(v as typeof roleTab)} className="mb-4">
        <TabList aria-label="Filtrar por papel">
          <Tab value="todos" badge={<Badge tone="neutral">{counts.todos}</Badge>}>Todos</Tab>
          <Tab value="admin" badge={<Badge tone="steel">{counts.admin}</Badge>}>Administradores</Tab>
          <Tab value="lideranca" badge={<Badge tone="success">{counts.lideranca}</Badge>}>Liderança</Tab>
          <Tab value="comercial" badge={<Badge tone="sand">{counts.comercial}</Badge>}>Comercial</Tab>
          <Tab value="crm" badge={<Badge tone="danger">{counts.crm}</Badge>}>CRM</Tab>
          <Tab value="social" badge={<Badge tone="warning">{counts.social}</Badge>}>Social Media</Tab>
          <Tab value="design" badge={<Badge tone="neutral">{counts.design}</Badge>}>Design</Tab>
        </TabList>
      </Tabs>

      <div className="mb-4 max-w-md">
        <SearchField
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClear={() => setQuery('')}
          placeholder="Buscar por nome ou e-mail"
          aria-label="Buscar usuários"
        />
      </div>

      {loading ? (
        <div className="grid place-items-center py-24">
          <Loader2 size={26} strokeWidth={1.5} className="animate-spin text-steel-300" aria-label="Carregando" />
        </div>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Usuário</TableHeaderCell>
              <TableHeaderCell>Papel</TableHeaderCell>
              {isAdmin && <TableHeaderCell className="w-12" align="right">Ações</TableHeaderCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableEmpty colSpan={isAdmin ? 3 : 2}>
                <EmptyState
                  className="border-0 bg-transparent py-0"
                  icon={<UserX size={22} strokeWidth={1.5} />}
                  title="Nenhum usuário encontrado"
                  description={members.length === 0 ? 'Crie o primeiro usuário do time.' : 'Ajuste a busca ou o filtro.'}
                />
              </TableEmpty>
            ) : (
              filtered.map((u) => {
                const isSelf = u.id === user.userId
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar size="sm" name={u.name} src={u.avatar ?? undefined} />
                        <div className="min-w-0">
                          <div className="font-medium text-strong">{u.name || '—'}</div>
                          <div className="font-mono text-[11px] text-faint">{u.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge tone={ROLE_TONE[u.role]} dot={MANAGER_ROLES.includes(u.role)}>{ROLE_LABEL[u.role]}</Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell align="right">
                        <DropdownMenu
                          align="end"
                          trigger={
                            <IconButton size="sm" aria-label={`Ações de ${u.name}`}>
                              <MoreHorizontal size={16} strokeWidth={1.5} />
                            </IconButton>
                          }
                        >
                          <MenuItem icon={<Pencil size={16} strokeWidth={1.5} />} onClick={() => setEditing(u)}>
                            Editar
                          </MenuItem>
                          <MenuSeparator />
                          <MenuItem
                            icon={<Trash2 size={16} strokeWidth={1.5} />}
                            destructive
                            disabled={isSelf}
                            onClick={() => setDeleting(u)}
                          >
                            {isSelf ? 'Excluir (você)' : 'Excluir usuário'}
                          </MenuItem>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      )}

      <EditMemberModal
        member={editing ? members.find((m) => m.id === editing.id) ?? editing : null}
        onClose={() => setEditing(null)}
        onSave={save}
        onAvatarChange={changeAvatar}
        onAvatarError={(msg) => toast.error('Imagem inválida', msg)}
      />
      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} onCreate={create} creating={creating} />

      <Modal
        open={!!deleting}
        onClose={() => removingId ? undefined : setDeleting(null)}
        title="Excluir usuário"
        description={deleting?.email ?? undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)} disabled={!!removingId}>Cancelar</Button>
            <Button variant="danger" loading={!!removingId} onClick={() => deleting && remove(deleting)}>
              Excluir
            </Button>
          </>
        }
      >
        <p className="text-body-s text-muted">
          Tem certeza que deseja excluir <span className="font-medium text-strong">{deleting?.name || 'este usuário'}</span>?
          A conta de acesso é removida e a pessoa perde o login. Esta ação não pode ser desfeita.
        </p>
      </Modal>
    </div>
  )
}
