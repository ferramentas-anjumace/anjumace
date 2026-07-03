import { useCallback, useEffect, useState } from 'react'
import {
  Image as ImageIcon,
  Video,
  Palette,
  BookText,
  ExternalLink,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Loader2,
} from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  Button,
  Modal,
  Input,
  Select,
  IconButton,
  DropdownMenu,
  MenuItem,
  MenuSeparator,
  EmptyState,
  useToast,
} from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/cn'

type MediaKind = 'imagens' | 'videos' | 'marca' | 'conteudos'
interface MediaLink { id: string; label: string; kind: MediaKind; url: string | null; hint: string | null }
interface Credential { id: string; platform: string; url: string | null; username: string | null; password: string | null; note: string | null }

const MEDIA_ICON: Record<MediaKind, React.ReactNode> = {
  imagens: <ImageIcon size={18} strokeWidth={1.5} />,
  videos: <Video size={18} strokeWidth={1.5} />,
  marca: <Palette size={18} strokeWidth={1.5} />,
  conteudos: <BookText size={18} strokeWidth={1.5} />,
}
const MEDIA_KINDS: { value: MediaKind; label: string }[] = [
  { value: 'imagens', label: 'Imagens' },
  { value: 'videos', label: 'Vídeos' },
  { value: 'marca', label: 'Marca' },
  { value: 'conteudos', label: 'Conteúdos' },
]

function prettyUrl(url: string) {
  return url.replace(/^https?:\/\//, '')
}

/** Campo copiável; com `secret`, oculta o valor e oferece mostrar/ocultar. */
function CopyField({ label, value, secret }: { label: string; value: string; secret?: boolean }) {
  const [show, setShow] = useState(false)
  const toast = useToast()
  // "Não definida": campo vazio ou só placeholder de bolinhas (seed inicial).
  const unset = !value.trim() || /^[•·]+$/.test(value.trim())
  const display = unset ? 'não definida' : secret && !show ? '•'.repeat(12) : value
  return (
    <div className="rounded-md border border-line bg-slate-800 px-2.5 py-1.5">
      <div className="font-mono text-[10px] uppercase tracking-wider text-faint">{label}</div>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'min-w-0 flex-1 truncate font-mono text-mono-data',
            unset ? 'italic text-faint' : 'text-strong',
          )}
        >
          {display}
        </span>
        {secret && !unset && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
            className="shrink-0 text-muted transition-colors hover:text-strong focus-visible:outline-none focus-visible:shadow-focus"
          >
            {show ? <EyeOff size={14} strokeWidth={1.5} /> : <Eye size={14} strokeWidth={1.5} />}
          </button>
        )}
        {!unset && (
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(value)
              toast.success('Copiado', label)
            }}
            aria-label={`Copiar ${label.toLowerCase()}`}
            className="shrink-0 text-muted transition-colors hover:text-strong focus-visible:outline-none focus-visible:shadow-focus"
          >
            <Copy size={14} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  )
}

function CredentialRow({
  cred,
  canManage,
  onEdit,
  onDelete,
}: {
  cred: Credential
  canManage: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="group flex flex-col gap-3 rounded-lg border border-line bg-slate-900 p-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3 sm:w-52 sm:shrink-0">
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-steel-tint font-mono text-mono-data font-semibold uppercase text-steel-300">
          {cred.platform.slice(0, 2)}
        </span>
        <div className="min-w-0">
          <div className="truncate font-medium text-strong">{cred.platform}</div>
          {cred.url ? (
            <a
              href={cred.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-mono text-[11px] text-faint transition-colors hover:text-steel-300 focus-visible:outline-none focus-visible:shadow-focus"
            >
              <span className="truncate">{prettyUrl(cred.url)}</span>
              <ExternalLink size={11} strokeWidth={1.5} aria-hidden />
            </a>
          ) : cred.note ? (
            <div className="truncate font-mono text-[11px] text-faint">{cred.note}</div>
          ) : null}
        </div>
      </div>
      <div className="grid flex-1 gap-2 sm:grid-cols-2">
        <CopyField label="Usuário" value={cred.username ?? ''} />
        <CopyField label="Senha" value={cred.password ?? ''} secret />
      </div>
      {canManage && (
        <DropdownMenu
          align="end"
          trigger={
            <IconButton size="sm" aria-label={`Ações de ${cred.platform}`} className="shrink-0">
              <MoreHorizontal size={16} strokeWidth={1.5} />
            </IconButton>
          }
        >
          <MenuItem icon={<Pencil size={16} strokeWidth={1.5} />} onClick={onEdit}>Editar</MenuItem>
          <MenuSeparator />
          <MenuItem icon={<Trash2 size={16} strokeWidth={1.5} />} destructive onClick={onDelete}>Excluir</MenuItem>
        </DropdownMenu>
      )}
    </div>
  )
}

type CredDraft = { platform: string; url: string; username: string; password: string; note: string }
const EMPTY_CRED: CredDraft = { platform: '', url: '', username: '', password: '', note: '' }

function CredentialModal({
  open,
  editing,
  onClose,
  onSave,
}: {
  open: boolean
  editing: Credential | null
  onClose: () => void
  onSave: (draft: CredDraft) => void
}) {
  const [draft, setDraft] = useState<CredDraft>(EMPTY_CRED)
  useEffect(() => {
    if (!open) return
    setDraft(
      editing
        ? {
            platform: editing.platform,
            url: editing.url ?? '',
            username: editing.username ?? '',
            password: editing.password ?? '',
            note: editing.note ?? '',
          }
        : EMPTY_CRED,
    )
  }, [open, editing])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar acesso' : 'Novo acesso'}
      description="Credenciais da plataforma."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSave(draft)}>{editing ? 'Salvar' : 'Adicionar'}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input label="Plataforma" value={draft.platform} onChange={(e) => setDraft((d) => ({ ...d, platform: e.target.value }))} placeholder="Ex.: Stripe" autoFocus />
        <Input label="Link" optional value={draft.url} onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))} placeholder="https://…" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Usuário" value={draft.username} onChange={(e) => setDraft((d) => ({ ...d, username: e.target.value }))} placeholder="e-mail ou login" />
          <Input label="Senha" value={draft.password} onChange={(e) => setDraft((d) => ({ ...d, password: e.target.value }))} placeholder="senha" />
        </div>
        <Input label="Nota" optional value={draft.note} onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))} placeholder="Ex.: MFA necessário" />
      </div>
    </Modal>
  )
}

type MediaDraft = { label: string; kind: MediaKind; url: string; hint: string }
const EMPTY_MEDIA: MediaDraft = { label: '', kind: 'imagens', url: '', hint: '' }

function MediaModal({ open, editing, onClose, onSave }: { open: boolean; editing: MediaLink | null; onClose: () => void; onSave: (d: MediaDraft) => void }) {
  const [draft, setDraft] = useState<MediaDraft>(EMPTY_MEDIA)
  useEffect(() => {
    if (!open) return
    setDraft(
      editing
        ? { label: editing.label, kind: editing.kind, url: editing.url ?? '', hint: editing.hint ?? '' }
        : EMPTY_MEDIA,
    )
  }, [open, editing])
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar banco / mídia' : 'Novo banco / mídia'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSave(draft)}>{editing ? 'Salvar' : 'Adicionar'}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input label="Nome" value={draft.label} onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))} placeholder="Ex.: Banco de imagens" autoFocus />
        <Select label="Tipo" value={draft.kind} onChange={(e) => setDraft((d) => ({ ...d, kind: e.target.value as MediaKind }))}>
          {MEDIA_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
        </Select>
        <Input label="Link" value={draft.url} onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))} placeholder="https://…" />
        <Input label="Descrição" optional value={draft.hint} onChange={(e) => setDraft((d) => ({ ...d, hint: e.target.value }))} placeholder="Ex.: Google Drive · fotos" />
      </div>
    </Modal>
  )
}

/** Conteúdo da aba "Acessos" do cliente — cofre de recursos (Supabase). */
export function ClientAccess({ clientId, canManage }: { clientId: string; canManage: boolean }) {
  const toast = useToast()
  const [media, setMedia] = useState<MediaLink[]>([])
  const [creds, setCreds] = useState<Credential[]>([])
  const [loading, setLoading] = useState(true)
  const [credModal, setCredModal] = useState(false)
  const [editingCred, setEditingCred] = useState<Credential | null>(null)
  const [mediaModal, setMediaModal] = useState(false)
  const [editingMedia, setEditingMedia] = useState<MediaLink | null>(null)

  const fetchAll = useCallback(async () => {
    const [m, c] = await Promise.all([
      supabase.from('client_media').select('id, label, kind, url, hint').eq('client_id', clientId).order('sort'),
      supabase.from('client_credentials').select('id, platform, url, username, password, note').eq('client_id', clientId).order('sort'),
    ])
    if (m.data) setMedia(m.data as MediaLink[])
    if (c.data) setCreds(c.data as Credential[])
    setLoading(false)
  }, [clientId])

  useEffect(() => {
    setLoading(true)
    fetchAll()
  }, [fetchAll])

  const nextSort = (arr: { length: number }) => arr.length + 1

  const saveCred = async (draft: CredDraft) => {
    if (!draft.platform.trim()) { toast.error('Informe a plataforma'); return }
    const payload = {
      platform: draft.platform.trim(),
      url: draft.url.trim() || null,
      username: draft.username.trim() || null,
      password: draft.password || null,
      note: draft.note.trim() || null,
    }
    const { error } = editingCred
      ? await supabase.from('client_credentials').update(payload).eq('id', editingCred.id)
      : await supabase.from('client_credentials').insert({ ...payload, client_id: clientId, sort: nextSort(creds) })
    if (error) toast.error('Falha ao salvar', error.message)
    else {
      toast.success(editingCred ? 'Acesso atualizado' : 'Acesso adicionado', payload.platform)
      await fetchAll()
    }
    setCredModal(false)
    setEditingCred(null)
  }

  const delCred = async (cred: Credential) => {
    const { error } = await supabase.from('client_credentials').delete().eq('id', cred.id)
    if (error) toast.error('Falha ao excluir', error.message)
    else { toast.success('Acesso removido', cred.platform); await fetchAll() }
  }

  const saveMedia = async (draft: MediaDraft) => {
    if (!draft.label.trim()) { toast.error('Informe o nome'); return }
    const payload = {
      label: draft.label.trim(),
      kind: draft.kind,
      url: draft.url.trim() || null,
      hint: draft.hint.trim() || null,
    }
    const { error } = editingMedia
      ? await supabase.from('client_media').update(payload).eq('id', editingMedia.id)
      : await supabase.from('client_media').insert({ ...payload, client_id: clientId, sort: nextSort(media) })
    if (error) toast.error('Falha ao salvar', error.message)
    else { toast.success(editingMedia ? 'Banco atualizado' : 'Banco adicionado', draft.label); await fetchAll() }
    setMediaModal(false)
    setEditingMedia(null)
  }

  const delMedia = async (m: MediaLink) => {
    const { error } = await supabase.from('client_media').delete().eq('id', m.id)
    if (error) toast.error('Falha ao excluir', error.message)
    else { toast.success('Removido', m.label); await fetchAll() }
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 size={26} strokeWidth={1.5} className="animate-spin text-steel-300" aria-label="Carregando" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Bancos & mídia */}
      <Card>
        <CardHeader>
          <CardTitle>Bancos & mídia</CardTitle>
          {canManage && (
            <Button size="sm" variant="secondary" leftIcon={<Plus size={16} strokeWidth={1.5} />} onClick={() => { setEditingMedia(null); setMediaModal(true) }}>
              Adicionar
            </Button>
          )}
        </CardHeader>
        {media.length === 0 ? (
          <p className="text-body-s text-faint">Nenhum banco cadastrado.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {media.map((m) => (
              <div key={m.id} className="group relative">
                <a
                  href={m.url ?? '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col gap-3 rounded-lg border border-line bg-slate-900 p-4 transition-colors hover:border-strong hover:bg-slate-800 focus-visible:outline-none focus-visible:shadow-focus"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid size-9 place-items-center rounded-md bg-steel-tint text-steel-300">{MEDIA_ICON[m.kind]}</span>
                    <ExternalLink size={15} strokeWidth={1.5} className="text-faint transition-colors group-hover:text-steel-300" aria-hidden />
                  </div>
                  <div>
                    <div className="font-medium text-strong">{m.label}</div>
                    <div className="text-body-s text-muted">{m.hint}</div>
                  </div>
                </a>
                {canManage && (
                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => { setEditingMedia(m); setMediaModal(true) }}
                      aria-label={`Editar ${m.label}`}
                      className="grid size-7 place-items-center rounded-md border border-line bg-slate-800/90 text-muted backdrop-blur transition-colors hover:text-strong focus-visible:outline-none focus-visible:shadow-focus"
                    >
                      <Pencil size={14} strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => delMedia(m)}
                      aria-label={`Excluir ${m.label}`}
                      className="grid size-7 place-items-center rounded-md border border-line bg-slate-800/90 text-muted backdrop-blur transition-colors hover:text-err focus-visible:outline-none focus-visible:shadow-focus"
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Senhas das plataformas — todo o time vê (acessa as plataformas);
          adicionar/editar/excluir segue restrito a quem gere recursos. */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <KeyRound size={18} strokeWidth={1.5} className="text-steel-300" aria-hidden />
            <CardTitle>Senhas das plataformas</CardTitle>
          </div>
          {canManage && (
            <Button size="sm" variant="secondary" leftIcon={<Plus size={16} strokeWidth={1.5} />} onClick={() => { setEditingCred(null); setCredModal(true) }}>
              Adicionar
            </Button>
          )}
        </CardHeader>
        {creds.length === 0 ? (
          <EmptyState className="border-0 bg-transparent" icon={<KeyRound size={22} strokeWidth={1.5} />} title="Nenhum acesso" description="Adicione as credenciais das plataformas do cliente." />
        ) : (
          <div className="flex flex-col gap-2">
            {creds.map((cred) => (
              <CredentialRow
                key={cred.id}
                cred={cred}
                canManage={canManage}
                onEdit={() => { setEditingCred(cred); setCredModal(true) }}
                onDelete={() => delCred(cred)}
              />
            ))}
          </div>
        )}
      </Card>

      <CredentialModal open={credModal} editing={editingCred} onClose={() => { setCredModal(false); setEditingCred(null) }} onSave={saveCred} />
      <MediaModal open={mediaModal} editing={editingMedia} onClose={() => { setMediaModal(false); setEditingMedia(null) }} onSave={saveMedia} />
    </div>
  )
}
