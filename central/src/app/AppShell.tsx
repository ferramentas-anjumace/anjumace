import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutGrid,
  Users,
  CalendarDays,
  CalendarRange,
  FolderOpen,
  KeyRound,
  ListChecks,
  BarChart3,
  Settings2,
  LogOut,
  UserCog,
  ChevronDown,
} from 'lucide-react'
import {
  Sidebar,
  SidebarGroup,
  SidebarItem,
  Topbar,
  ThemeToggle,
  BrandSwitcher,
  Avatar,
  Badge,
  DropdownMenu,
  MenuItem,
  MenuSeparator,
  Modal,
  Button,
  useToast,
} from '@/components/ui'
import { useSession } from '@/lib/session'
import { usePermissions, type Capability } from '@/lib/permissions'
import { useProfiles } from './profiles'
import { AvatarUploader } from './AvatarUploader'
import { NotificationsBell } from './NotificationsBell'
import { GlobalSearch } from './GlobalSearch'
import { Logo } from '@/components/Logo'

interface NavLink {
  to: string
  label: string
  icon: React.ReactNode
  /** Capacidade exigida para ver o item (sem `need` = todos veem). */
  need?: Capability
  /** Restringe o item a gestores (Administrador/Liderança). */
  managerOnly?: boolean
}

const NAV: { group: string; items: NavLink[] }[] = [
  {
    group: 'Operação',
    items: [
      { to: '/app', label: 'Visão geral', icon: <LayoutGrid size={18} strokeWidth={1.5} /> },
      { to: '/app/editorial', label: 'Editorial', icon: <CalendarRange size={18} strokeWidth={1.5} /> },
      { to: '/app/tarefas', label: 'Tarefas', icon: <ListChecks size={18} strokeWidth={1.5} /> },
      { to: '/app/agenda', label: 'Agenda', icon: <CalendarDays size={18} strokeWidth={1.5} /> },
      { to: '/app/relatorios', label: 'Relatórios', icon: <BarChart3 size={18} strokeWidth={1.5} />, managerOnly: true },
      { to: '/app/conteudo', label: 'Conteúdo', icon: <FolderOpen size={18} strokeWidth={1.5} /> },
      { to: '/app/acessos', label: 'Acessos', icon: <KeyRound size={18} strokeWidth={1.5} /> },
    ],
  },
  {
    group: 'Configurações',
    items: [
      { to: '/app/usuarios', label: 'Equipe', icon: <Users size={18} strokeWidth={1.5} />, need: 'manage_users' },
      { to: '/app/config', label: 'Permissões', icon: <Settings2 size={18} strokeWidth={1.5} />, need: 'manage_users' },
    ],
  },
]

export function AppShell() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user, signOut, isManager } = useSession()
  const { can } = usePermissions()
  const { members, setMemberAvatar } = useProfiles()
  const toast = useToast()
  const [accountOpen, setAccountOpen] = useState(false)

  // Foto do próprio usuário vem da linha em profiles (casada pelo uuid do Auth).
  const myAvatar = members.find((m) => m.id === user.userId)?.avatar ?? undefined

  const changeMyAvatar = async (dataUrl: string | null) => {
    const { error } = await setMemberAvatar(user.userId, dataUrl)
    if (error) toast.error('Falha ao salvar foto', error)
    else toast.success(dataUrl ? 'Foto atualizada' : 'Foto removida')
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  const isActive = (to: string) => (to === '/app' ? pathname === '/app' : pathname.startsWith(to))

  const nav = NAV.map((g) => ({
    ...g,
    items: g.items.filter((i) => (!i.need || can(i.need)) && (!i.managerOnly || isManager)),
  })).filter((g) => g.items.length > 0)

  const go = (to: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    navigate(to)
  }

  return (
    <div className="flex h-screen flex-col bg-ink text-fg">
      <Topbar
        className="relative z-sticky"
        leading={
          <button
            onClick={go('/app')}
            className="flex items-center rounded-md focus-visible:outline-none focus-visible:shadow-focus"
            aria-label="Anju Mace — início"
          >
            <Logo className="h-4 w-auto text-strong" />
          </button>
        }
        center={<GlobalSearch />}
        trailing={
          <>
            <BrandSwitcher />
            <ThemeToggle />
            <NotificationsBell />
            <DropdownMenu
              align="end"
              trigger={
                <button className="flex items-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:shadow-focus">
                  <Avatar size="sm" name={user.name} src={myAvatar} />
                  <ChevronDown size={16} strokeWidth={1.5} className="text-muted" aria-hidden />
                </button>
              }
            >
              {/* Cabeçalho da conta — caixa normal (sem uppercase do MenuLabel). */}
              <div className="flex flex-col gap-1 px-2.5 pb-2 pt-2.5">
                <span className="text-body-l font-semibold leading-tight text-strong">{user.name}</span>
                <span className="text-caption text-faint">{user.email} · {user.roleLabel}</span>
              </div>
              <MenuItem icon={<UserCog size={16} strokeWidth={1.5} />} onClick={() => setAccountOpen(true)}>
                Conta
              </MenuItem>
              <MenuSeparator />
              <MenuItem icon={<LogOut size={16} strokeWidth={1.5} />} destructive onClick={handleSignOut}>
                Sair
              </MenuItem>
            </DropdownMenu>
          </>
        }
      />

      <div className="flex min-h-0 flex-1">
        <Sidebar className="hidden md:flex">
          {nav.map((g) => (
            <SidebarGroup key={g.group} label={g.group}>
              {g.items.map((item) => (
                <SidebarItem
                  key={item.to}
                  href={item.to}
                  icon={item.icon}
                  active={isActive(item.to)}
                  onClick={go(item.to)}
                >
                  {item.label}
                </SidebarItem>
              ))}
            </SidebarGroup>
          ))}
          <div className="mt-auto px-2">
            <a
              href="/styleguide"
              className="flex items-center gap-2 rounded-md px-2 py-2 text-body-s text-faint transition-colors hover:bg-slate-800 hover:text-strong focus-visible:outline-none focus-visible:shadow-focus"
            >
              <Badge tone="steel">DS</Badge>
              Voltar ao styleguide
            </a>
          </div>
        </Sidebar>

        <main className="min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <Modal
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        title="Sua conta"
        description="Atualize sua foto de perfil."
        footer={<Button onClick={() => setAccountOpen(false)}>Fechar</Button>}
      >
        <div className="flex flex-col gap-5">
          <AvatarUploader
            name={user.name}
            src={myAvatar ?? null}
            onChange={changeMyAvatar}
            onError={(msg) => toast.error('Imagem inválida', msg)}
          />
          <div className="flex flex-col gap-1 border-t border-line pt-4">
            <span className="text-strong">{user.name}</span>
            <span className="font-mono text-[11px] text-faint">{user.email} · {user.roleLabel}</span>
          </div>
        </div>
      </Modal>
    </div>
  )
}
