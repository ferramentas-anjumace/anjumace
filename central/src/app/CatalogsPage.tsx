import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import {
  Card,
  Button,
  Input,
  Select,
  IconButton,
  Modal,
  Switch,
  EmptyState,
  SectionHeader,
  useToast,
} from '@/components/ui'
import { usePermissions } from '@/lib/permissions'
import {
  useCatalogs,
  CatalogBadge,
  CATALOG_KEYS,
  CATALOGS,
  CATALOG_TONES,
  TONE_LABEL,
  type CatalogKey,
  type CatalogItem,
  type CatalogTone,
} from './catalogs'

/* ----------------------------------------------------------------------------
   Catálogos — gestão das listas editáveis (categorias de tarefa, e futuramente
   tipos do editorial, mídias dos acessos...). Só quem tem `manage_resources`.
---------------------------------------------------------------------------- */

/** Modal de criar/editar um item de catálogo (nome + cor). */
function ItemEditor({
  open,
  catalog,
  item,
  onClose,
}: {
  open: boolean
  catalog: CatalogKey | null
  item: CatalogItem | null
  onClose: () => void
}) {
  const { addItem, updateItem } = useCatalogs()
  const toast = useToast()
  const [label, setLabel] = useState('')
  const [tone, setTone] = useState<CatalogTone>('neutral')
  const [busy, setBusy] = useState(false)

  // Sincroniza ao abrir.
  const [lastOpen, setLastOpen] = useState(false)
  if (open !== lastOpen) {
    setLastOpen(open)
    if (open) {
      setLabel(item?.label ?? '')
      setTone(item?.tone ?? 'neutral')
    }
  }

  if (!catalog) return null
  const def = CATALOGS[catalog]

  const save = async () => {
    setBusy(true)
    const res = item
      ? await updateItem(item, { label, tone })
      : await addItem(catalog, label, tone)
    setBusy(false)
    if (res.error) {
      toast.error('Não foi possível salvar', res.error)
      return
    }
    toast.success(item ? 'Item atualizado' : 'Item adicionado', label.trim())
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? `Editar ${def.singular}` : `Nova ${def.singular}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={busy || !label.trim()}>Salvar</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Nome"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={`Ex.: ${def.singular === 'categoria' ? 'Parcerias' : 'Novo item'}`}
          onKeyDown={(e) => { if (e.key === 'Enter' && label.trim()) save() }}
        />
        <Select label="Cor" value={tone} onChange={(e) => setTone(e.target.value as CatalogTone)}>
          {CATALOG_TONES.map((t) => (
            <option key={t} value={t}>{TONE_LABEL[t]}</option>
          ))}
        </Select>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-faint">Prévia</span>
          <CatalogBadge size="sm" tone={tone}>{label.trim() || def.singular}</CatalogBadge>
        </div>
      </div>
    </Modal>
  )
}

/** Bloco de um catálogo: lista de itens + ações. */
function CatalogCard({ catalog, onAdd, onEdit }: {
  catalog: CatalogKey
  onAdd: () => void
  onEdit: (item: CatalogItem) => void
}) {
  const { allItems, updateItem, removeItem, move } = useCatalogs()
  const toast = useToast()
  const def = CATALOGS[catalog]
  const list = allItems(catalog)

  const remove = async (item: CatalogItem) => {
    const res = await removeItem(item)
    if (res.error) {
      toast.error('Não foi possível remover', res.error)
      return
    }
    toast.success('Item removido', item.label)
  }

  return (
    <Card>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-display text-h3 font-semibold text-strong">{def.label}</h3>
          <p className="mt-1 text-body-s text-muted">{def.help}</p>
        </div>
        <Button size="sm" leftIcon={<Plus size={16} strokeWidth={1.5} />} onClick={onAdd}>
          Adicionar
        </Button>
      </div>

      {list.length === 0 ? (
        <EmptyState title="Nenhum item" description="Adicione o primeiro item deste catálogo." />
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {list.map((item, i) => (
            <li key={item.id} className="flex items-center gap-3 py-2.5">
              <div className="flex flex-col">
                <IconButton
                  size="sm"
                  aria-label="Mover para cima"
                  disabled={i === 0}
                  onClick={() => move(catalog, item.id, -1)}
                >
                  <ChevronUp size={14} strokeWidth={1.5} />
                </IconButton>
                <IconButton
                  size="sm"
                  aria-label="Mover para baixo"
                  disabled={i === list.length - 1}
                  onClick={() => move(catalog, item.id, 1)}
                >
                  <ChevronDown size={14} strokeWidth={1.5} />
                </IconButton>
              </div>

              <CatalogBadge size="sm" tone={item.tone}>{item.label}</CatalogBadge>
              {!item.active && (
                <span className="font-mono text-[10px] uppercase tracking-wider text-faint">inativo</span>
              )}

              <div className="ml-auto flex items-center gap-3">
                <Switch
                  checked={item.active}
                  onChange={(e) => updateItem(item, { active: e.target.checked })}
                  aria-label={item.active ? 'Desativar' : 'Ativar'}
                />
                <IconButton size="sm" aria-label="Editar" onClick={() => onEdit(item)}>
                  <Pencil size={15} strokeWidth={1.5} />
                </IconButton>
                <IconButton size="sm" aria-label="Remover" onClick={() => remove(item)}>
                  <Trash2 size={15} strokeWidth={1.5} />
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export function CatalogsPage() {
  const { can } = usePermissions()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorCatalog, setEditorCatalog] = useState<CatalogKey | null>(null)
  const [editorItem, setEditorItem] = useState<CatalogItem | null>(null)

  // Só gestores de recursos.
  if (!can('manage_resources')) return <Navigate to="/app" replace />

  const openAdd = (catalog: CatalogKey) => {
    setEditorCatalog(catalog)
    setEditorItem(null)
    setEditorOpen(true)
  }
  const openEdit = (catalog: CatalogKey, item: CatalogItem) => {
    setEditorCatalog(catalog)
    setEditorItem(item)
    setEditorOpen(true)
  }

  return (
    <div className="mx-auto max-w-screen-2xl px-6 py-8">
      <SectionHeader
        eyebrow="Configurações"
        title="Catálogos"
        description="Listas que alimentam o app. Adicione, renomeie, recoloque a cor e a ordem — sem precisar de código."
        className="mb-8"
      />

      <div className="flex flex-col gap-6">
        {CATALOG_KEYS.map((catalog) => (
          <CatalogCard
            key={catalog}
            catalog={catalog}
            onAdd={() => openAdd(catalog)}
            onEdit={(item) => openEdit(catalog, item)}
          />
        ))}
      </div>

      <ItemEditor
        open={editorOpen}
        catalog={editorCatalog}
        item={editorItem}
        onClose={() => setEditorOpen(false)}
      />
    </div>
  )
}
