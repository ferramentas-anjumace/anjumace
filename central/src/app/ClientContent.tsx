import { useState } from 'react'
import {
  CalendarDays,
  FileText,
  Users,
  ListChecks,
  BookText,
  Scaling,
  SquarePen,
  Link as LinkIcon,
  Plus,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Trash2,
  LayoutGrid,
} from 'lucide-react'
import {
  Card,
  Button,
  Badge,
  Input,
  Select,
  Modal,
  EmptyState,
  DropdownMenu,
  MenuItem,
  MenuSeparator,
  useToast,
} from '@/components/ui'
import {
  CONTENT_SECTION_META,
  CONTENT_SECTION_ORDER,
  type ContentItem,
  type ContentSection,
  type ContentIcon,
} from './data'
import { useContent } from './content'

/** Mapa de ícone (string no dado) → componente lucide. */
const ICON: Record<ContentIcon, React.ReactNode> = {
  calendar: <CalendarDays size={16} strokeWidth={1.5} />,
  document: <FileText size={16} strokeWidth={1.5} />,
  users: <Users size={16} strokeWidth={1.5} />,
  list: <ListChecks size={16} strokeWidth={1.5} />,
  book: <BookText size={16} strokeWidth={1.5} />,
  expand: <Scaling size={16} strokeWidth={1.5} />,
  edit: <SquarePen size={16} strokeWidth={1.5} />,
  link: <LinkIcon size={16} strokeWidth={1.5} />,
}

const ICON_LABEL: Record<ContentIcon, string> = {
  calendar: 'Calendário',
  document: 'Documento',
  users: 'Pessoas',
  list: 'Lista',
  book: 'Livro / módulos',
  expand: 'Expansão',
  edit: 'Edição / copy',
  link: 'Link',
}

/** Capa branded "Anju Mace" — recriada em CSS (sem asset de imagem). */
function ContentCover() {
  return (
    <div className="relative grid h-32 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-ink-deep to-slate-900 ring-1 ring-inset ring-line">
      <div className="flex flex-col items-center gap-1">
        <span className="font-display text-2xl font-bold uppercase tracking-tight text-strong">
          Anju Mace
        </span>
        <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-faint">
          we mentor brands to their next chapter
        </span>
      </div>
    </div>
  )
}

type Draft = Omit<ContentItem, 'id'>

const EMPTY_DRAFT: Draft = { title: '', section: 'conteudo', icon: 'document', url: '' }

/** Card de um item da biblioteca. Clique abre o link (ou avisa "em breve"). */
function ContentCard({
  item,
  canManage,
  onOpen,
  onEdit,
  onDelete,
}: {
  item: ContentItem
  canManage: boolean
  onOpen: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="group relative flex flex-col gap-3 rounded-xl border border-line bg-slate-900 p-3 transition-colors hover:border-strong hover:bg-slate-800">
      <button
        type="button"
        onClick={onOpen}
        className="flex flex-col gap-3 text-left focus-visible:outline-none focus-visible:shadow-focus rounded-lg"
      >
        <ContentCover />
        <div className="flex items-center gap-2 px-1">
          <span className="shrink-0 text-steel-300">{ICON[item.icon]}</span>
          <span className="min-w-0 flex-1 truncate font-medium text-strong">{item.title}</span>
          {item.url && (
            <ExternalLink
              size={14}
              strokeWidth={1.5}
              className="shrink-0 text-faint transition-colors group-hover:text-steel-300"
              aria-hidden
            />
          )}
        </div>
      </button>
      <div className="px-1">
        <Badge tone="neutral">{CONTENT_SECTION_META[item.section].label}</Badge>
      </div>

      {canManage && (
        <div className="absolute right-2 top-2 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          <DropdownMenu
            align="end"
            trigger={
              <button
                type="button"
                aria-label={`Ações de ${item.title}`}
                className="grid size-7 place-items-center rounded-md border border-line bg-slate-800/90 text-muted backdrop-blur transition-colors hover:text-strong focus-visible:outline-none focus-visible:shadow-focus"
              >
                <MoreHorizontal size={16} strokeWidth={1.5} />
              </button>
            }
          >
            <MenuItem icon={<Pencil size={16} strokeWidth={1.5} />} onClick={onEdit}>
              Editar
            </MenuItem>
            <MenuSeparator />
            <MenuItem icon={<Trash2 size={16} strokeWidth={1.5} />} destructive onClick={onDelete}>
              Excluir
            </MenuItem>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}

/** Aba "Conteúdo Anju" — biblioteca de materiais em galeria, agrupada por seção. */
export function ClientContent({ clientId, canManage }: { clientId: string; canManage: boolean }) {
  const toast = useToast()
  const { getItems, addItem, updateItem, removeItem } = useContent()
  const items = getItems(clientId)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ContentItem | null>(null)
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)

  const openCreate = () => {
    setEditing(null)
    setDraft(EMPTY_DRAFT)
    setOpen(true)
  }
  const openEdit = (item: ContentItem) => {
    setEditing(item)
    setDraft({ title: item.title, section: item.section, icon: item.icon, url: item.url ?? '' })
    setOpen(true)
  }

  const save = () => {
    const title = draft.title.trim()
    if (!title) {
      toast.error('Informe um título')
      return
    }
    const payload: Draft = {
      title,
      section: draft.section,
      icon: draft.icon,
      url: draft.url?.trim() || undefined,
    }
    if (editing) {
      updateItem(clientId, editing.id, payload)
      toast.success('Conteúdo atualizado', title)
    } else {
      addItem(clientId, payload)
      toast.success('Conteúdo adicionado', title)
    }
    setOpen(false)
  }

  const openItem = (item: ContentItem) => {
    if (item.url) window.open(item.url, '_blank', 'noopener,noreferrer')
    else toast.info('Sem link', 'Adicione um link a este conteúdo.')
  }

  if (items.length === 0) {
    return (
      <>
        <Card className="text-center">
          <EmptyState
            icon={<LayoutGrid size={22} strokeWidth={1.5} />}
            title="Nenhum conteúdo ainda"
            description="A biblioteca de conteúdo deste cliente está vazia."
            action={
              canManage ? (
                <Button leftIcon={<Plus size={18} strokeWidth={1.5} />} onClick={openCreate}>
                  Adicionar conteúdo
                </Button>
              ) : undefined
            }
          />
        </Card>
        <ContentForm
          open={open}
          editing={editing}
          draft={draft}
          setDraft={setDraft}
          onClose={() => setOpen(false)}
          onSave={save}
        />
      </>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {canManage && (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Plus size={16} strokeWidth={1.5} />}
            onClick={openCreate}
          >
            Adicionar conteúdo
          </Button>
        </div>
      )}

      {CONTENT_SECTION_ORDER.map((section) => {
        const group = items.filter((it) => it.section === section)
        if (group.length === 0) return null
        return (
          <section key={section} className="flex flex-col gap-3">
            <Badge tone="steel" className="self-start">
              {CONTENT_SECTION_META[section as ContentSection].label}
            </Badge>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.map((item) => (
                <ContentCard
                  key={item.id}
                  item={item}
                  canManage={canManage}
                  onOpen={() => openItem(item)}
                  onEdit={() => openEdit(item)}
                  onDelete={() => {
                    removeItem(clientId, item.id)
                    toast.success('Conteúdo removido', item.title)
                  }}
                />
              ))}
            </div>
          </section>
        )
      })}

      <ContentForm
        open={open}
        editing={editing}
        draft={draft}
        setDraft={setDraft}
        onClose={() => setOpen(false)}
        onSave={save}
      />
    </div>
  )
}

/** Modal de criar/editar item de conteúdo. */
function ContentForm({
  open,
  editing,
  draft,
  setDraft,
  onClose,
  onSave,
}: {
  open: boolean
  editing: ContentItem | null
  draft: Draft
  setDraft: React.Dispatch<React.SetStateAction<Draft>>
  onClose: () => void
  onSave: () => void
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar conteúdo' : 'Novo conteúdo'}
      description="Materiais da biblioteca do cliente."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onSave}>{editing ? 'Salvar' : 'Adicionar'}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Título"
          value={draft.title}
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          placeholder="Ex.: Shotlist"
          autoFocus
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Seção"
            value={draft.section}
            onChange={(e) => setDraft((d) => ({ ...d, section: e.target.value as ContentSection }))}
          >
            {CONTENT_SECTION_ORDER.map((s) => (
              <option key={s} value={s}>
                {CONTENT_SECTION_META[s].label}
              </option>
            ))}
          </Select>
          <Select
            label="Ícone"
            value={draft.icon}
            onChange={(e) => setDraft((d) => ({ ...d, icon: e.target.value as ContentIcon }))}
          >
            {(Object.keys(ICON_LABEL) as ContentIcon[]).map((ic) => (
              <option key={ic} value={ic}>
                {ICON_LABEL[ic]}
              </option>
            ))}
          </Select>
        </div>
        <Input
          label="Link"
          optional
          value={draft.url ?? ''}
          onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))}
          placeholder="https://…"
          leadingIcon={<LinkIcon size={16} strokeWidth={1.5} />}
        />
      </div>
    </Modal>
  )
}
