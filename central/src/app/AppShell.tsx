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
  Plug,
  Settings2,
  Bell,
  LogOut,
  UserCog,
  ChevronDown,
} from 'lucide-react'
import {
  Sidebar,
  SidebarGroup,
  SidebarItem,
  Topbar,
  SearchField,
  ThemeToggle,
  BrandSwitcher,
  IconButton,
  Avatar,
  Badge,
  DropdownMenu,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  Modal,
  Button,
  useToast,
} from '@/components/ui'
import { useSession } from '@/lib/session'
import { useProfiles } from './profiles'
import { AvatarUploader } from './AvatarUploader'

interface NavLink {
  to: string
  label: string
  icon: React.ReactNode
  /** Item visível apenas para administradores. */
  adminOnly?: boolean
}

const NAV: { group: string; items: NavLink[]; adminOnly?: boolean }[] = [
  {
    group: 'Operação',
    items: [
      { to: '/app', label: 'Visão geral', icon: <LayoutGrid size={18} strokeWidth={1.5} /> },
      { to: '/app/editorial', label: 'Editorial', icon: <CalendarRange size={18} strokeWidth={1.5} /> },
      { to: '/app/tarefas', label: 'Tarefas', icon: <ListChecks size={18} strokeWidth={1.5} /> },
      { to: '/app/agenda', label: 'Agenda', icon: <CalendarDays size={18} strokeWidth={1.5} /> },
      { to: '/app/conteudo', label: 'Conteúdo', icon: <FolderOpen size={18} strokeWidth={1.5} /> },
      { to: '/app/acessos', label: 'Acessos', icon: <KeyRound size={18} strokeWidth={1.5} /> },
    ],
  },
  {
    group: 'Sistema',
    adminOnly: true,
    items: [
      { to: '/app/usuarios', label: 'Equipe', icon: <Users size={18} strokeWidth={1.5} /> },
      { to: '/app/integracoes', label: 'Integrações', icon: <Plug size={18} strokeWidth={1.5} /> },
      { to: '/app/config', label: 'Configurações', icon: <Settings2 size={18} strokeWidth={1.5} /> },
    ],
  },
]

export function AppShell() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { isManager, user, signOut } = useSession()
  const { members, setMemberAvatar } = useProfiles()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [accountOpen, setAccountOpen] = useState(false)
  const isAdmin = isManager

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

  const nav = NAV.filter((g) => !g.adminOnly || isAdmin).map((g) => ({
    ...g,
    items: g.items.filter((i) => !i.adminOnly || isAdmin),
  }))

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
            className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:shadow-focus"
          >
            <span className="grid size-7 place-items-center rounded-md bg-steel-500 font-display text-body-s font-bold text-accent-fg">
              A
            </span>
            <span className="font-display text-h3 font-semibold tracking-tight text-strong">Anju Mace</span>
          </button>
        }
        center={
          <div className="mx-auto w-full max-w-md">
            <SearchField
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch('')}
              placeholder="Buscar usuários, registros, ações…"
              aria-label="Buscar"
            />
          </div>
        }
        trailing={
          <>
            <BrandSwitcher />
            <ThemeToggle />
            <IconButton aria-label="Notificações" className="relative">
              <Bell size={18} strokeWidth={1.5} />
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-steel-400" aria-hidden />
            </IconButton>
            <DropdownMenu
              align="end"
              trigger={
                <button className="flex items-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:shadow-focus">
                  <Avatar size="sm" name={user.name} src={myAvatar} status="online" />
                  <ChevronDown size={16} strokeWidth={1.5} className="text-muted" aria-hidden />
                </button>
              }
            >
              <MenuLabel>
                <span className="flex flex-col">
                  <span className="text-strong">{user.name}</span>
                  <span className="font-mono text-[11px] text-faint">{user.email} · {user.roleLabel}</span>
                </span>
              </MenuLabel>
              <MenuItem icon={<UserCog size={16} strokeWidth={1.5} />} onClick={() => setAccountOpen(true)}>
                Conta
              </MenuItem>
              <MenuItem icon={<Settings2 size={16} strokeWidth={1.5} />}>Preferências</MenuItem>
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
