import { useRef, useState } from 'react'
import { Paperclip, Download, Trash2, FileText, Image as ImageIcon, Film, Music, FileArchive, File, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui'
import { cn } from '@/lib/cn'
import { useSession } from '@/lib/session'
import { usePermissions } from '@/lib/permissions'
import { useAttachments, type AttachmentEntity, type Attachment } from './attachments'

/* ----------------------------------------------------------------------------
   AttachmentList — anexos reutilizáveis de uma entidade (tarefa, post...).
   ----------------------------------------------------------------------------
   Recebe (entityType, entityId) e cuida de subir (botão ou arrastar), listar,
   baixar (signed URL) e remover. Quem enviou ou um gestor pode remover.
---------------------------------------------------------------------------- */

const KB = 1024
const MB = KB * 1024

function humanSize(bytes: number | null): string {
  if (bytes == null) return ''
  if (bytes < KB) return `${bytes} B`
  if (bytes < MB) return `${Math.round(bytes / KB)} KB`
  return `${(bytes / MB).toFixed(bytes < 10 * MB ? 1 : 0)} MB`
}

/** Ícone conforme o tipo do arquivo. */
function fileIcon(mime: string | null, name: string) {
  const m = mime ?? ''
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (m.startsWith('image/')) return ImageIcon
  if (m.startsWith('video/')) return Film
  if (m.startsWith('audio/')) return Music
  if (m === 'application/pdf' || ext === 'pdf') return FileText
  if (['zip', 'rar', '7z', 'gz', 'tar'].includes(ext)) return FileArchive
  if (['doc', 'docx', 'txt', 'rtf', 'md', 'csv', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return FileText
  return File
}

function AttachmentItem({
  att,
  canDelete,
  onDownload,
  onDelete,
}: {
  att: Attachment
  canDelete: boolean
  onDownload: () => void
  onDelete: () => void
}) {
  const Icon = fileIcon(att.mime, att.name)
  return (
    <li className="group flex items-center gap-3 rounded-md border border-line bg-slate-900 px-3 py-2">
      <span className="grid size-9 shrink-0 place-items-center rounded-md border border-line bg-ink-deep/40 text-steel-300">
        <Icon size={18} strokeWidth={1.5} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-body-s font-medium text-strong">{att.name}</div>
        <div className="truncate font-mono text-[11px] text-faint">
          {humanSize(att.size)}{att.size != null ? ' · ' : ''}{att.uploadedByName}
        </div>
      </div>
      <button
        onClick={onDownload}
        className="grid size-8 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-slate-800 hover:text-strong focus-visible:outline-none focus-visible:shadow-focus"
        aria-label={`Baixar ${att.name}`}
        title="Baixar"
      >
        <Download size={16} strokeWidth={1.5} />
      </button>
      {canDelete && (
        <button
          onClick={onDelete}
          className="grid size-8 shrink-0 place-items-center rounded-md text-muted opacity-0 transition-all hover:bg-slate-800 hover:text-err focus-visible:opacity-100 focus-visible:outline-none group-hover:opacity-100"
          aria-label={`Excluir ${att.name}`}
          title="Excluir"
        >
          <Trash2 size={16} strokeWidth={1.5} />
        </button>
      )}
    </li>
  )
}

export function AttachmentList({
  entityType,
  entityId,
}: {
  entityType: AttachmentEntity
  entityId: string
}) {
  const toast = useToast()
  const { user } = useSession()
  const { can } = usePermissions()
  const { getAttachments, addAttachment, removeAttachment, getDownloadUrl } = useAttachments()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)

  const attachments = getAttachments(entityType, entityId)
  const isModerator = can('manage_users')

  const upload = async (files: FileList | File[]) => {
    const list = Array.from(files)
    if (!list.length) return
    setBusy(true)
    try {
      for (const file of list) {
        const err = await addAttachment(entityType, entityId, file)
        if (err) toast.error('Falha ao anexar', `${file.name}: ${err}`)
      }
    } finally {
      setBusy(false)
    }
  }

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    e.target.value = '' // permite reenviar o mesmo arquivo
    if (files) await upload(files)
  }

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files?.length) await upload(e.dataTransfer.files)
  }

  const download = async (att: Attachment) => {
    const url = await getDownloadUrl(att)
    if (!url) {
      toast.error('Não foi possível baixar', att.name)
      return
    }
    window.open(url, '_blank', 'noopener')
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Paperclip size={15} strokeWidth={1.5} className="text-steel-300" aria-hidden />
        <span className="text-body-s font-medium text-strong">Anexos</span>
        {attachments.length > 0 && (
          <span className="font-mono text-[11px] text-faint tabular-nums">{attachments.length}</span>
        )}
      </div>

      {attachments.length > 0 && (
        <ul className="mb-3 flex flex-col gap-2">
          {attachments.map((att) => (
            <AttachmentItem
              key={att.id}
              att={att}
              canDelete={att.uploadedBy === user.userId || isModerator}
              onDownload={() => download(att)}
              onDelete={() => removeAttachment(att)}
            />
          ))}
        </ul>
      )}

      {/* Zona de upload (clique ou arraste) */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        disabled={busy}
        className={cn(
          'flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-4 py-5 text-center transition-colors focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-60',
          dragging ? 'border-steel-500 bg-steel-tint' : 'border-line hover:border-strong hover:bg-slate-800/40',
        )}
      >
        {busy ? (
          <Loader2 size={18} strokeWidth={1.5} className="animate-spin text-steel-300" />
        ) : (
          <Paperclip size={18} strokeWidth={1.5} className="text-steel-300" aria-hidden />
        )}
        <span className="text-body-s text-muted">
          {busy ? 'Enviando…' : <>Arraste arquivos ou <span className="text-steel-300">clique para anexar</span></>}
        </span>
        <span className="font-mono text-[11px] text-faint">até 25 MB por arquivo</span>
      </button>

      <input ref={inputRef} type="file" multiple className="hidden" onChange={onPick} />
    </div>
  )
}
