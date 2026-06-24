import { useMemo, useState } from 'react'
import {
  Plus,
  ArrowRight,
  Trash2,
  Settings2,
  Sparkles,
  MoreHorizontal,
  Mail,
  LayoutGrid,
  Users,
  Calendar,
  FolderKanban,
  Building2,
  Bell,
  Copy,
  Pencil,
  Info,
  FolderOpen,
} from 'lucide-react'
import {
  Button,
  IconButton,
  Badge,
  Tag,
  Avatar,
  AvatarGroup,
  Skeleton,
  ProgressBar,
  Divider,
  SectionHeader,
  EmptyState,
  ChartFrame,
  Card,
  CardHeader,
  CardTitle,
  CardFooter,
  StatCard,
  SandCard,
  Input,
  Textarea,
  Select,
  SearchField,
  Checkbox,
  Radio,
  RadioGroup,
  Switch,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Stepper,
  Combobox,
  DatePicker,
  type ComboboxOption,
  Breadcrumb,
  Pagination,
  Sidebar,
  SidebarGroup,
  SidebarItem,
  Topbar,
  ThemeTogglePlaceholder,
  AgendaRow,
  Tooltip,
  DropdownMenu,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  Modal,
  Drawer,
  useToast,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  TableFooter,
  TableEmpty,
} from '@/components/ui'
import { cn } from '@/lib/cn'

/* --------------------------------------------------------- helpers de layout */

export function GalleryBlock({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="scroll-mt-20 border-t border-subtle pt-12">
      <SectionHeader eyebrow={eyebrow} title={title} description={description} className="mb-8" />
      {children}
    </section>
  )
}

function Specimen({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-slate-900 p-5">
      <span className="font-mono text-mono-label uppercase text-faint">{label}</span>
      <div className={cn('flex flex-wrap items-center gap-3', className)}>{children}</div>
    </div>
  )
}

/* ----------------------------------------------------------------- Buttons */

function ButtonsSection() {
  return (
    <GalleryBlock
      eyebrow="Componentes · 01"
      title="Button & IconButton"
      description="Cinco variantes; a sand é a assinatura quente. Tamanhos sm/md/lg, ícones, loading e disabled."
    >
      <div className="flex flex-col gap-4">
        <Specimen label="variantes">
          <Button variant="primary">Criar projeto</Button>
          <Button variant="secondary">Ver detalhes</Button>
          <Button variant="ghost">Cancelar</Button>
          <Button variant="sand" leftIcon={<Sparkles size={18} strokeWidth={1.5} />}>
            Destacar
          </Button>
          <Button variant="danger" leftIcon={<Trash2 size={18} strokeWidth={1.5} />}>
            Excluir
          </Button>
        </Specimen>
        <Specimen label="tamanhos, ícones e estados">
          <Button size="sm">Pequeno</Button>
          <Button size="md" leftIcon={<Plus size={18} strokeWidth={1.5} />}>
            Adicionar
          </Button>
          <Button size="lg" rightIcon={<ArrowRight size={20} strokeWidth={1.5} />}>
            Continuar
          </Button>
          <Button loading>Salvando</Button>
          <Button disabled>Desabilitado</Button>
        </Specimen>
        <Specimen label="IconButton">
          <IconButton aria-label="Adicionar" variant="primary">
            <Plus size={18} strokeWidth={1.5} />
          </IconButton>
          <IconButton aria-label="Configurações" variant="secondary">
            <Settings2 size={18} strokeWidth={1.5} />
          </IconButton>
          <IconButton aria-label="Mais ações">
            <MoreHorizontal size={18} strokeWidth={1.5} />
          </IconButton>
          <IconButton aria-label="Excluir" variant="danger">
            <Trash2 size={18} strokeWidth={1.5} />
          </IconButton>
          <IconButton aria-label="Carregando" loading />
        </Specimen>
      </div>
    </GalleryBlock>
  )
}

/* ------------------------------------------------------ Badges, Tags, Avatar */

function StatusSection() {
  const [tags, setTags] = useState(['Design', 'IA', 'Operações'])
  const [filters, setFilters] = useState<Record<string, boolean>>({ ativos: true, arquivados: false })

  return (
    <GalleryBlock
      eyebrow="Componentes · 02"
      title="Badge, Tag e Avatar"
      description="Status em mono uppercase; chips removíveis e de filtro; avatares com fallback e status."
    >
      <div className="flex flex-col gap-4">
        <Specimen label="Badge / StatusPill">
          <Badge tone="neutral">rascunho</Badge>
          <Badge tone="steel" dot>
            em andamento
          </Badge>
          <Badge tone="success" dot>
            entregue
          </Badge>
          <Badge tone="danger" dot>
            atrasado
          </Badge>
          <Badge tone="warning" dot>
            em revisão
          </Badge>
        </Specimen>

        <Specimen label="Tag / Chip — removível">
          {tags.map((t) => (
            <Tag key={t} onRemove={() => setTags((cur) => cur.filter((x) => x !== t))}>
              {t}
            </Tag>
          ))}
          {tags.length === 0 && <span className="text-body-s text-faint">todas removidas</span>}
        </Specimen>

        <Specimen label="Tag / Chip — filtro (selecionável)">
          {(['ativos', 'arquivados'] as const).map((k) => (
            <Tag
              key={k}
              selectable
              selected={filters[k]}
              onSelect={(v) => setFilters((cur) => ({ ...cur, [k]: v }))}
            >
              {k}
            </Tag>
          ))}
        </Specimen>

        <Specimen label="Avatar — tamanhos, status e grupo">
          <Avatar size="xs" name="Ana Lima" />
          <Avatar size="sm" name="Bruno Sá" status="online" />
          <Avatar size="md" name="Carla Reis" status="busy" />
          <Avatar size="lg" name="Diego Melo" status="away" />
          <Avatar size="xl" name="Eva Nunes" />
          <AvatarGroup max={3} className="ml-2">
            <Avatar size="md" name="Ana Lima" />
            <Avatar size="md" name="Bruno Sá" />
            <Avatar size="md" name="Carla Reis" />
            <Avatar size="md" name="Diego Melo" />
            <Avatar size="md" name="Eva Nunes" />
          </AvatarGroup>
        </Specimen>
      </div>
    </GalleryBlock>
  )
}

/* ----------------------------------------------------------------- Forms */

function FormsSection() {
  const [search, setSearch] = useState('')
  const [plano, setPlano] = useState('mensal')

  return (
    <GalleryBlock
      eyebrow="Componentes · 03"
      title="Formulários"
      description="Campos com ícone líder, ajuda e erro. Estados default, focus, error e disabled."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="flex flex-col gap-4">
            <Input label="Nome do projeto" placeholder="Ex.: Onboarding Acme" helperText="Aparece no topo da central do cliente." />
            <Input
              label="E-mail de contato"
              type="email"
              placeholder="voce@empresa.com"
              leadingIcon={<Mail size={18} strokeWidth={1.5} />}
            />
            <Input
              label="Orçamento"
              defaultValue="abc"
              error="Informe um valor numérico válido."
              trailing={<span className="font-mono text-mono-data text-faint">BRL</span>}
            />
            <Input label="Campo desabilitado" placeholder="Indisponível" disabled />
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-4">
            <SearchField
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch('')}
              placeholder="Buscar clientes"
              aria-label="Buscar clientes"
            />
            <Select
              label="Status"
              placeholder="Selecione um status"
              defaultValue=""
            >
              <option value="ativo">Ativo</option>
              <option value="pausado">Pausado</option>
              <option value="arquivado">Arquivado</option>
            </Select>
            <Textarea
              label="Observações"
              optional
              placeholder="Anote o contexto do cliente…"
              helperText="Visível só para o time interno."
            />
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-3">
            <span className="font-mono text-mono-label uppercase text-faint">seleção</span>
            <Checkbox label="Receber resumo diário" description="Enviado às 8h, dias úteis." defaultChecked />
            <Checkbox label="Estado indeterminado" indeterminate />
            <Checkbox label="Opção desabilitada" disabled />
            <Divider className="my-1" />
            <Switch label="Notificações push" defaultChecked />
            <Switch label="Modo concentração" description="Silencia alertas não urgentes." />
          </div>
        </Card>

        <Card>
          <RadioGroup name="plano" value={plano} onChange={setPlano} label="Plano de cobrança">
            <Radio value="mensal" label="Mensal" description="Cobrado todo dia 1º." />
            <Radio value="trimestral" label="Trimestral" description="10% de desconto." />
            <Radio value="anual" label="Anual" description="Dois meses grátis." />
          </RadioGroup>
        </Card>
      </div>
    </GalleryBlock>
  )
}

/* ----------------------------------------------------------------- Cards */

function CardsSection() {
  return (
    <GalleryBlock
      eyebrow="Componentes · 04"
      title="Cards & métricas"
      description="Superfície base, interativa, métrica com delta e o SandCard de ênfase."
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Projetos ativos" value="24" delta={{ value: '+3 esta semana', direction: 'up' }} />
          <StatCard label="Reuniões hoje" value="07" delta={{ value: '-2 vs. ontem', direction: 'down' }} />
          <StatCard label="Horas faturáveis" value="186" delta={{ value: 'meta: 200', direction: 'neutral' }} active />
          <SandCard className="flex flex-col justify-between">
            <div className="font-mono text-mono-label uppercase opacity-70">Em destaque</div>
            <div className="mt-3 font-display text-h2 font-semibold leading-tight">
              Onboarding Acme
            </div>
            <p className="mt-1 text-body-s opacity-80">A assinatura quente — uma por view.</p>
          </SandCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Card base</CardTitle>
              <Badge tone="neutral">UPS-0429</Badge>
            </CardHeader>
            <p className="text-body-s text-muted">
              Superfície padrão com hairline. Composável com header, conteúdo e footer.
            </p>
            <CardFooter>
              <Button size="sm" variant="ghost">
                Abrir
              </Button>
              <Button size="sm" variant="secondary">
                Compartilhar
              </Button>
            </CardFooter>
          </Card>

          <Card variant="interactive" tabIndex={0}>
            <CardHeader>
              <CardTitle>Card interativo</CardTitle>
              <Badge tone="steel" dot>
                ativo
              </Badge>
            </CardHeader>
            <p className="text-body-s text-muted">
              Passe o mouse ou foque com o teclado — a borda e a superfície respondem.
            </p>
          </Card>
        </div>
      </div>
    </GalleryBlock>
  )
}

/* ----------------------------------------------------------------- Table */

interface RowData {
  id: string
  cliente: string
  responsavel: string
  horas: number
  status: { tone: 'steel' | 'success' | 'danger' | 'warning'; label: string }
}

const DATA: RowData[] = [
  { id: 'UPS-0429', cliente: 'Acme Co.', responsavel: 'Ana Lima', horas: 42, status: { tone: 'steel', label: 'em andamento' } },
  { id: 'UPS-0430', cliente: 'Bravo Ltda', responsavel: 'Bruno Sá', horas: 18, status: { tone: 'success', label: 'entregue' } },
  { id: 'UPS-0431', cliente: 'Cosmos SA', responsavel: 'Carla Reis', horas: 7, status: { tone: 'warning', label: 'em revisão' } },
  { id: 'UPS-0432', cliente: 'Delta Inc', responsavel: 'Diego Melo', horas: 63, status: { tone: 'danger', label: 'atrasado' } },
]

function TableSection() {
  const [sortDir, setSortDir] = useState<'asc' | 'desc' | false>('asc')
  const [selected, setSelected] = useState<Set<string>>(new Set(['UPS-0430']))
  const [page, setPage] = useState(1)
  const [empty, setEmpty] = useState(false)

  const rows = useMemo(() => {
    if (empty) return []
    const sorted = [...DATA]
    if (sortDir) sorted.sort((a, b) => (sortDir === 'asc' ? a.horas - b.horas : b.horas - a.horas))
    return sorted
  }, [sortDir, empty])

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id))
  const someSelected = rows.some((r) => selected.has(r.id))

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)))
  const toggleOne = (id: string) =>
    setSelected((cur) => {
      const next = new Set(cur)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  return (
    <GalleryBlock
      eyebrow="Componentes · 05"
      title="Table"
      description="Header sticky e ordenável (labels em mono), seleção de linhas, célula de status, empty state e rodapé de paginação."
    >
      <div className="mb-4 flex items-center gap-2">
        <Button size="sm" variant="secondary" onClick={() => setEmpty((v) => !v)}>
          {empty ? 'Mostrar dados' : 'Simular vazio'}
        </Button>
        {someSelected && (
          <span className="font-mono text-mono-data text-steel-300">
            {[...selected].length} selecionada(s)
          </span>
        )}
      </div>

      <div className="max-h-80 overflow-auto rounded-lg border border-line">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell className="w-10">
                <Checkbox
                  aria-label="Selecionar todas"
                  checked={allSelected}
                  indeterminate={someSelected && !allSelected}
                  onChange={toggleAll}
                />
              </TableHeaderCell>
              <TableHeaderCell>ID</TableHeaderCell>
              <TableHeaderCell>Cliente</TableHeaderCell>
              <TableHeaderCell>Responsável</TableHeaderCell>
              <TableHeaderCell
                align="right"
                sortable
                sortDirection={sortDir}
                onSort={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
              >
                Horas
              </TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableEmpty colSpan={6}>
                <EmptyState
                  className="border-0 bg-transparent py-0"
                  icon={<FolderOpen size={22} strokeWidth={1.5} />}
                  title="Nenhum projeto por aqui"
                  description="Crie o primeiro projeto para começar a acompanhar horas e status."
                  action={
                    <Button size="sm" leftIcon={<Plus size={16} strokeWidth={1.5} />}>
                      Novo projeto
                    </Button>
                  }
                />
              </TableEmpty>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id} selected={selected.has(r.id)} interactive>
                  <TableCell>
                    <Checkbox
                      aria-label={`Selecionar ${r.id}`}
                      checked={selected.has(r.id)}
                      onChange={() => toggleOne(r.id)}
                    />
                  </TableCell>
                  <TableCell mono>{r.id}</TableCell>
                  <TableCell className="font-medium text-strong">{r.cliente}</TableCell>
                  <TableCell>{r.responsavel}</TableCell>
                  <TableCell align="right" mono>
                    {r.horas}h
                  </TableCell>
                  <TableCell>
                    <Badge tone={r.status.tone} dot>
                      {r.status.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <TableFooter className="mt-0 rounded-b-lg">
        <Pagination page={page} pageCount={8} onPageChange={setPage} totalItems={76} pageSize={10} />
      </TableFooter>
    </GalleryBlock>
  )
}

/* ----------------------------------------------------- Tabs / Breadcrumb */

function NavSection() {
  const [tab, setTab] = useState('visao')
  const [segTab, setSegTab] = useState('semana')

  return (
    <GalleryBlock
      eyebrow="Componentes · 06"
      title="Tabs & Breadcrumb"
      description="Abas underline e segmented; trilha de navegação com página atual."
    >
      <div className="flex flex-col gap-6">
        <Specimen label="Breadcrumb">
          <Breadcrumb
            items={[
              { label: 'Clientes', href: '#' },
              { label: 'Acme Co.', href: '#' },
              { label: 'Projetos' },
            ]}
          />
        </Specimen>

        <div className="rounded-lg border border-line bg-slate-900 p-5">
          <Tabs value={tab} onValueChange={setTab}>
            <TabList aria-label="Seções do cliente">
              <Tab value="visao">Visão geral</Tab>
              <Tab value="projetos" badge={<Badge tone="neutral">12</Badge>}>
                Projetos
              </Tab>
              <Tab value="agenda">Agenda</Tab>
              <Tab value="arquivos">Arquivos</Tab>
            </TabList>
            <TabPanel value="visao">
              <p className="text-body-s text-muted">Resumo do cliente e indicadores principais.</p>
            </TabPanel>
            <TabPanel value="projetos">
              <p className="text-body-s text-muted">Lista de projetos ativos e arquivados.</p>
            </TabPanel>
            <TabPanel value="agenda">
              <p className="text-body-s text-muted">Reuniões e marcos da semana.</p>
            </TabPanel>
            <TabPanel value="arquivos">
              <p className="text-body-s text-muted">Documentos e entregáveis compartilhados.</p>
            </TabPanel>
          </Tabs>
        </div>

        <Specimen label="Tabs — segmented">
          <Tabs value={segTab} onValueChange={setSegTab} variant="segmented">
            <TabList aria-label="Período">
              <Tab value="dia">Dia</Tab>
              <Tab value="semana">Semana</Tab>
              <Tab value="mes">Mês</Tab>
            </TabList>
          </Tabs>
        </Specimen>
      </div>
    </GalleryBlock>
  )
}

/* --------------------------------- Accordion / Stepper / Combobox / Date */

const FUSOS: ComboboxOption[] = [
  { value: 'sp', label: 'São Paulo (GMT-3)' },
  { value: 'rec', label: 'Recife (GMT-3)' },
  { value: 'mao', label: 'Manaus (GMT-4)' },
  { value: 'lis', label: 'Lisboa (GMT+1)' },
  { value: 'mad', label: 'Madri (GMT+1)' },
  { value: 'nyc', label: 'Nova York (GMT-5)' },
  { value: 'tok', label: 'Tóquio (GMT+9)', disabled: true },
]

function ExtrasSection() {
  const [tz, setTz] = useState<string | null>('sp')
  const [date, setDate] = useState<Date | null>(null)
  const [step, setStep] = useState(1)
  const STEPS = [
    { label: 'Conta', description: 'Dados de acesso' },
    { label: 'Perfil', description: 'Informações básicas' },
    { label: 'Equipe', description: 'Convidar membros' },
    { label: 'Revisão', description: 'Conferir e enviar' },
  ]

  return (
    <GalleryBlock
      eyebrow="Componentes · 11"
      title="Accordion, Stepper, Combobox & DatePicker"
      description="Seções expansíveis, progresso por etapas, autocomplete filtrável e seletor de data — todos com teclado e foco corretos."
    >
      <div className="flex flex-col gap-6">
        <div className="rounded-lg border border-line bg-slate-900 p-5">
          <span className="mb-4 block font-mono text-mono-label uppercase text-faint">Stepper</span>
          <Stepper steps={STEPS} current={step} onStepClick={setStep} />
          <div className="mt-6 flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              Voltar
            </Button>
            <Button size="sm" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))} disabled={step === STEPS.length - 1}>
              Avançar
            </Button>
            <span className="ml-2 font-mono text-mono-data text-faint">
              etapa {step + 1} de {STEPS.length}
            </span>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <span className="mb-4 block font-mono text-mono-label uppercase text-faint">Combobox & DatePicker</span>
            <div className="flex flex-col gap-4">
              <Combobox
                label="Fuso horário"
                options={FUSOS}
                value={tz}
                onChange={setTz}
                helperText="Digite para filtrar a lista."
                placeholder="Buscar fuso…"
              />
              <DatePicker
                label="Data de início"
                value={date}
                onChange={setDate}
                optional
                helperText="Use as setas do teclado para navegar."
              />
            </div>
          </Card>

          <div>
            <span className="mb-4 block font-mono text-mono-label uppercase text-faint">Accordion</span>
            <Accordion type="single" defaultValue="a" collapsible>
              <AccordionItem value="a">
                <AccordionTrigger>O que é a camada white-label?</AccordionTrigger>
                <AccordionContent>
                  Um subconjunto temável de tokens — só o accent. Trocar a marca sobrescreve o
                  accent sem tocar no chrome (superfícies, texto e linhas).
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="b">
                <AccordionTrigger>Funciona nos dois temas?</AccordionTrigger>
                <AccordionContent>
                  Sim. Tema e marca se compõem: claro ou escuro, cada marca define seu accent para
                  os dois.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="c">
                <AccordionTrigger>Como adicionar uma nova marca?</AccordionTrigger>
                <AccordionContent>
                  Copie o bloco [data-brand] em tokens.css e ajuste só os valores de steel-* e
                  --accent-fg para o tema escuro e o claro.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </GalleryBlock>
  )
}

/* --------------------------------------------------- Sidebar + Topbar mini */

function ShellSection() {
  return (
    <GalleryBlock
      eyebrow="Componentes · 07"
      title="Sidebar & Topbar"
      description="A casca de navegação: grupos com label em mono, item ativo com steel-tint e indicador à esquerda."
    >
      <div className="overflow-hidden rounded-xl border border-line bg-ink">
        <Topbar
          leading={
            <span className="font-display text-h3 font-semibold tracking-tight text-strong">Anju Mace</span>
          }
          center={
            <div className="max-w-sm flex-1">
              <SearchField placeholder="Buscar em tudo" aria-label="Buscar" />
            </div>
          }
          trailing={
            <>
              <ThemeTogglePlaceholder>
                <Bell size={18} strokeWidth={1.5} />
              </ThemeTogglePlaceholder>
              <Avatar size="sm" name="Você" status="online" />
            </>
          }
        />
        <div className="flex h-80">
          <Sidebar className="h-full">
            <SidebarGroup label="Operação">
              <SidebarItem href="#" icon={<LayoutGrid size={18} strokeWidth={1.5} />} active>
                Visão geral
              </SidebarItem>
              <SidebarItem href="#" icon={<FolderKanban size={18} strokeWidth={1.5} />} badge="12">
                Projetos
              </SidebarItem>
              <SidebarItem href="#" icon={<Calendar size={18} strokeWidth={1.5} />} badge="3">
                Agenda
              </SidebarItem>
            </SidebarGroup>
            <SidebarGroup label="Relacionamento">
              <SidebarItem href="#" icon={<Users size={18} strokeWidth={1.5} />}>
                Time
              </SidebarItem>
              <SidebarItem href="#" icon={<Building2 size={18} strokeWidth={1.5} />} badge="28">
                Clientes
              </SidebarItem>
            </SidebarGroup>
          </Sidebar>
          <div className="flex-1 p-6">
            <SectionHeader eyebrow="Hoje" title="Visão geral" description="Conteúdo da área principal entra aqui." />
          </div>
        </div>
      </div>
    </GalleryBlock>
  )
}

/* ------------------------------------------------------------- Overlays */

function OverlaysSection() {
  const [modal, setModal] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const toast = useToast()

  return (
    <GalleryBlock
      eyebrow="Componentes · 08"
      title="Overlays"
      description="Dropdown, modal, drawer, tooltip e toasts — com foco aprisionado, Escape e clique-fora."
    >
      <Specimen label="gatilhos">
        <DropdownMenu
          align="start"
          trigger={
            <Button variant="secondary" rightIcon={<MoreHorizontal size={18} strokeWidth={1.5} />}>
              Ações
            </Button>
          }
        >
          <MenuLabel>Projeto</MenuLabel>
          <MenuItem icon={<Pencil size={16} strokeWidth={1.5} />} shortcut="E">
            Editar
          </MenuItem>
          <MenuItem icon={<Copy size={16} strokeWidth={1.5} />} shortcut="D">
            Duplicar
          </MenuItem>
          <MenuSeparator />
          <MenuItem icon={<Trash2 size={16} strokeWidth={1.5} />} destructive>
            Excluir
          </MenuItem>
        </DropdownMenu>

        <Button onClick={() => setModal(true)}>Abrir modal</Button>
        <Button variant="secondary" onClick={() => setDrawer(true)}>
          Abrir drawer
        </Button>

        <Tooltip content="Cria um novo projeto (atalho: N)">
          <Button variant="ghost" leftIcon={<Info size={18} strokeWidth={1.5} />}>
            Com tooltip
          </Button>
        </Tooltip>

        <Button variant="ghost" onClick={() => toast.success('Projeto criado', 'UPS-0433 já está na lista.')}>
          Toast sucesso
        </Button>
        <Button variant="ghost" onClick={() => toast.error('Falha ao salvar', 'Tente novamente em instantes.')}>
          Toast erro
        </Button>
        <Button variant="ghost" onClick={() => toast.info('Sincronizando', 'Buscando atualizações…')}>
          Toast info
        </Button>
      </Specimen>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Criar projeto"
        description="Defina o básico — você ajusta o resto depois."
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setModal(false)}>Criar</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input label="Nome do projeto" placeholder="Ex.: Onboarding Acme" />
          <Select label="Cliente" placeholder="Selecione" defaultValue="">
            <option value="acme">Acme Co.</option>
            <option value="bravo">Bravo Ltda</option>
          </Select>
        </div>
      </Modal>

      <Drawer
        open={drawer}
        onClose={() => setDrawer(false)}
        title="Detalhes do projeto"
        description="UPS-0429 · Acme Co."
        footer={
          <Button variant="secondary" onClick={() => setDrawer(false)}>
            Fechar
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Badge tone="steel" dot>
              em andamento
            </Badge>
            <Badge tone="neutral">42h</Badge>
          </div>
          <p className="text-body-s text-muted">
            Painéis laterais entram pela borda, com a mesma trava de foco e scroll do modal.
          </p>
        </div>
      </Drawer>
    </GalleryBlock>
  )
}

/* ----------------------------------------------------- Feedback / progresso */

function FeedbackSection() {
  return (
    <GalleryBlock
      eyebrow="Componentes · 09"
      title="Feedback & progresso"
      description="Barras de progresso, skeletons de carregamento e empty state orientado à ação."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex flex-col gap-4">
            <ProgressBar label="Horas usadas" value={74} showValue />
            <ProgressBar label="Cobertura de testes" value={92} tone="success" showValue />
            <ProgressBar label="Orçamento consumido" value={88} tone="warning" showValue />
            <ProgressBar label="SLA estourado" value={31} tone="danger" showValue />
          </div>
        </Card>

        <Card>
          <span className="font-mono text-mono-label uppercase text-faint">Skeleton</span>
          <div className="mt-4 flex items-center gap-3">
            <Skeleton shape="circle" className="size-10" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="w-1/2" />
              <Skeleton className="w-3/4" />
            </div>
          </div>
          <Skeleton shape="block" className="mt-4 h-24 w-full" />
        </Card>
      </div>

      <div className="mt-4">
        <EmptyState
          icon={<FolderOpen size={22} strokeWidth={1.5} />}
          title="Nenhum cliente ainda"
          description="Adicione o primeiro cliente para criar a central individual dele."
          action={
            <Button leftIcon={<Plus size={18} strokeWidth={1.5} />}>Adicionar cliente</Button>
          }
        />
      </div>
    </GalleryBlock>
  )
}

/* ------------------------------------------------- Dados / agenda / chart */

function DataSection() {
  return (
    <GalleryBlock
      eyebrow="Componentes · 10"
      title="Agenda, gráfico e divisores"
      description="Linha de agenda com barra de categoria, contêiner de gráfico (placeholder) e SectionHeader."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-mono-label uppercase text-faint">AgendaRow</span>
          <AgendaRow
            day="18"
            month="JUN"
            time="14:30 – 15:00"
            title="Reunião de kickoff · Acme"
            meta="Sala virtual · 4 participantes"
            category="steel"
            interactive
            trailing={
              <AvatarGroup max={3}>
                <Avatar size="sm" name="Ana Lima" />
                <Avatar size="sm" name="Bruno Sá" />
                <Avatar size="sm" name="Carla Reis" />
              </AvatarGroup>
            }
          />
          <AgendaRow
            day="19"
            month="JUN"
            time="09:00 – 09:30"
            title="Daily do time"
            meta="Recorrente"
            category="sand"
          />
          <AgendaRow
            day="20"
            month="JUN"
            time="16:00"
            title="Entrega final · Bravo"
            meta="Prazo"
            category="danger"
          />
        </div>

        <ChartFrame
          eyebrow="Últimos 7 dias"
          title="Horas faturáveis"
          height={200}
          yTicks={['200', '150', '100', '50', '0']}
          xTicks={['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']}
        />
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <Divider label="seção" />
        <SectionHeader
          eyebrow="Configurações"
          title="Preferências do time"
          description="Cabeçalho de seção com eyebrow em mono e ações à direita."
          actions={
            <Button size="sm" variant="secondary">
              Editar
            </Button>
          }
        />
        <Divider />
      </div>
    </GalleryBlock>
  )
}

/* --------------------------------------------------------------- export */

export function ComponentsGallery() {
  return (
    <div className="flex flex-col gap-16">
      <ButtonsSection />
      <StatusSection />
      <FormsSection />
      <CardsSection />
      <TableSection />
      <NavSection />
      <ExtrasSection />
      <ShellSection />
      <OverlaysSection />
      <FeedbackSection />
      <DataSection />
    </div>
  )
}
