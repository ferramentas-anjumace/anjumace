import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Hash,
  Plus,
  Send,
  Trash2,
  MessagesSquare,
  PenSquare,
  Paperclip,
  SmilePlus,
  Reply,
  X,
  Download,
  FileText,
  File as FileIcon,
} from 'lucide-react'
import {
  Avatar,
  Button,
  IconButton,
  Input,
  Textarea,
  Modal,
  EmptyState,
  Skeleton,
  SearchField,
  useToast,
} from '@/components/ui'
import { cn } from '@/lib/cn'
import { Portal } from '@/lib/Portal'
import { useSession } from '@/lib/session'
import { useProfiles, type Member } from './profiles'
import { useAttachments, type Attachment } from './attachments'
import {
  useChat,
  type ChatChannel,
  type ChatMessage,
  type ChatReaction,
  type DmChannel,
  type ReplyMeta,
} from './chat'

/* ----------------------------------------------------------------------------
   ChatPage — chat da equipe (Fase 3: anexos + menções @ + reações).
   ----------------------------------------------------------------------------
   Layout em dois painéis: lista (canais + mensagens diretas) à esquerda,
   conversa + composer à direita. Anexos reusam o store/Storage de attachments;
   menções reusam notifications (deep-link pelo sino); reações têm tabela própria.
---------------------------------------------------------------------------- */

const EMOJIS = ['👍', '❤️', '😂', '🎉', '✅', '👀']
const MAX_SUGGESTIONS = 6

const fullDate = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

const rel = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.round(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return rel.format(-min, 'minute')
  const hr = Math.round(min / 60)
  if (hr < 24) return rel.format(-hr, 'hour')
  const day = Math.round(hr / 24)
  if (day < 7) return rel.format(-day, 'day')
  return fullDate.format(new Date(iso))
}

const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Quebra o texto em nós, destacando "@Nome" de membros conhecidos. */
function renderBody(body: string, names: string[]): React.ReactNode {
  if (!body || names.length === 0) return body
  const pattern = names.slice().sort((a, b) => b.length - a.length).map(escapeRe).join('|')
  const re = new RegExp(`@(${pattern})`, 'g')
  const out: React.ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(body)) !== null) {
    if (m.index > last) out.push(body.slice(last, m.index))
    out.push(
      <span key={`m-${i++}`} className="rounded bg-steel-500 px-1 font-medium text-accent-fg">
        {m[0]}
      </span>,
    )
    last = m.index + m[0].length
  }
  if (last < body.length) out.push(body.slice(last))
  return out
}

function isGrouped(prev: ChatMessage | undefined, cur: ChatMessage): boolean {
  if (!prev || prev.authorId !== cur.authorId) return false
  return new Date(cur.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60_000
}

const KB = 1024
const MB = KB * 1024
function humanSize(bytes: number | null): string {
  if (bytes == null) return ''
  if (bytes < KB) return `${bytes} B`
  if (bytes < MB) return `${Math.round(bytes / KB)} KB`
  return `${(bytes / MB).toFixed(bytes < 10 * MB ? 1 : 0)} MB`
}

const isImage = (a: Attachment) => (a.mime ?? '').startsWith('image/')

function UnreadPill({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-steel-500 px-1.5 text-[11px] font-medium tabular-nums text-accent-fg">
      {count > 99 ? '99+' : count}
    </span>
  )
}

function ChannelButton({
  channel,
  active,
  unread,
  onClick,
}: {
  channel: ChatChannel
  active: boolean
  unread: number
  onClick: () => void
}) {
  const hasUnread = unread > 0 && !active
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-body transition-colors',
        active ? 'bg-slate-800 text-strong' : 'text-muted hover:bg-slate-800/60 hover:text-strong',
      )}
    >
      <Hash size={16} strokeWidth={1.5} className="shrink-0 text-steel-400" aria-hidden />
      <span className={cn('min-w-0 flex-1 truncate', hasUnread && 'font-medium text-strong')}>{channel.name}</span>
      {hasUnread && <UnreadPill count={unread} />}
    </button>
  )
}

function DmButton({
  dm,
  active,
  unread,
  onClick,
}: {
  dm: DmChannel
  active: boolean
  unread: number
  onClick: () => void
}) {
  const { getMember } = useProfiles()
  const other = dm.otherUserId ? getMember(dm.otherUserId) : undefined
  const name = other?.name ?? 'Conversa'
  const hasUnread = unread > 0 && !active
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-body transition-colors',
        active ? 'bg-slate-800 text-strong' : 'text-muted hover:bg-slate-800/60 hover:text-strong',
      )}
    >
      <Avatar size="sm" name={name} src={other?.avatar ?? undefined} />
      <span className={cn('min-w-0 flex-1 truncate', hasUnread && 'font-medium text-strong')}>{name}</span>
      {hasUnread && <UnreadPill count={unread} />}
    </button>
  )
}

/** Miniatura de imagem (resolve a signed URL ao montar). */
function ImageThumb({ att }: { att: Attachment }) {
  const { getViewUrl } = useAttachments()
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let on = true
    getViewUrl(att).then((u) => {
      if (on) setUrl(u)
    })
    return () => {
      on = false
    }
  }, [att, getViewUrl])

  if (!url) return <Skeleton className="h-40 w-56 rounded-lg" />
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block w-fit">
      <img
        src={url}
        alt={att.name}
        loading="lazy"
        className="max-h-64 max-w-xs rounded-lg border border-line object-cover"
      />
    </a>
  )
}

/** Anexos de uma mensagem: imagens inline + chips de arquivo. */
function MessageAttachments({ messageId }: { messageId: string }) {
  const toast = useToast()
  const { getAttachments, getDownloadUrl } = useAttachments()
  const atts = getAttachments('chat_message', messageId)
  if (!atts.length) return null

  const download = async (att: Attachment) => {
    const url = await getDownloadUrl(att)
    if (!url) {
      toast.error('Não foi possível baixar', att.name)
      return
    }
    window.open(url, '_blank', 'noopener')
  }

  return (
    <div className="mt-1.5 flex flex-col gap-2">
      {atts.filter(isImage).map((att) => (
        <ImageThumb key={att.id} att={att} />
      ))}
      {atts.filter((a) => !isImage(a)).map((att) => (
        <button
          key={att.id}
          onClick={() => download(att)}
          className="flex w-fit max-w-xs items-center gap-2.5 rounded-md border border-line bg-slate-900 px-3 py-2 text-left transition-colors hover:border-strong hover:bg-slate-800"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-md border border-line bg-ink-deep/40 text-steel-300">
            <FileText size={16} strokeWidth={1.5} aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-body-s font-medium text-strong">{att.name}</span>
            <span className="block font-mono text-[11px] text-faint">{humanSize(att.size)}</span>
          </span>
          <Download size={15} strokeWidth={1.5} className="ml-1 shrink-0 text-muted" aria-hidden />
        </button>
      ))}
    </div>
  )
}

/** Barra de reações + botão de adicionar. */
function ReactionBar({
  reactions,
  myId,
  onToggle,
}: {
  reactions: ChatReaction[]
  myId: string
  onToggle: (emoji: string) => void
}) {
  // Agrega por emoji: contagem + se eu reagi.
  const groups = useMemo(() => {
    const map = new Map<string, { count: number; mine: boolean }>()
    for (const r of reactions) {
      const g = map.get(r.emoji) ?? { count: 0, mine: false }
      g.count += 1
      if (r.userId === myId) g.mine = true
      map.set(r.emoji, g)
    }
    return Array.from(map.entries())
  }, [reactions, myId])

  if (groups.length === 0) return null
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {groups.map(([emoji, g]) => (
        <button
          key={emoji}
          onClick={() => onToggle(emoji)}
          className={cn(
            'inline-flex h-6 items-center gap-1 rounded-full border px-2 text-[12px] tabular-nums transition-colors',
            g.mine
              ? 'border-steel-500/50 bg-steel-tint text-steel-200'
              : 'border-line bg-slate-900 text-muted hover:border-strong',
          )}
          title={g.mine ? 'Remover sua reação' : 'Reagir'}
        >
          <span>{emoji}</span>
          <span>{g.count}</span>
        </button>
      ))}
    </div>
  )
}

function EmojiPicker({ onPick, onClose }: { onPick: (emoji: string) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [onClose])
  return (
    <div
      ref={ref}
      className="absolute bottom-full right-0 z-dropdown mb-1 flex gap-0.5 rounded-lg border border-strong bg-slate-700 p-1 shadow-e2 animate-slide-up"
    >
      {EMOJIS.map((e) => (
        <button
          key={e}
          onClick={() => {
            onPick(e)
            onClose()
          }}
          className="grid size-8 place-items-center rounded-md text-[18px] transition-colors hover:bg-slate-800"
        >
          {e}
        </button>
      ))}
    </div>
  )
}

/** Menu de reações ancorado no cursor (clique direito na mensagem). */
function ReactionContextMenu({
  x,
  y,
  onPick,
  onClose,
}: {
  x: number
  y: number
  onPick: (emoji: string) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ left: x, top: y })

  // Mede e reposiciona para não estourar a viewport.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const { width, height } = el.getBoundingClientRect()
    const m = 8
    setPos({
      left: Math.max(m, Math.min(x, window.innerWidth - width - m)),
      top: Math.max(m, Math.min(y, window.innerHeight - height - m)),
    })
  }, [x, y])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onClose, true)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onClose, true)
    }
  }, [onClose])

  return (
    <Portal>
      <div
        ref={ref}
        style={{ position: 'fixed', left: pos.left, top: pos.top }}
        className="z-modal flex gap-0.5 rounded-lg border border-strong bg-slate-700 p-1 shadow-e3 animate-slide-up"
      >
        {EMOJIS.map((e) => (
          <button
            key={e}
            onClick={() => {
              onPick(e)
              onClose()
            }}
            className="grid size-9 place-items-center rounded-md text-[20px] transition-colors hover:bg-slate-800"
          >
            {e}
          </button>
        ))}
      </div>
    </Portal>
  )
}

/** Resumo de respostas (estilo Slack) abaixo da mensagem-pai. */
function ThreadSummary({ meta, onOpen }: { meta: ReplyMeta; onOpen: () => void }) {
  const { getMember } = useProfiles()
  return (
    <button
      onClick={onOpen}
      className="mt-1.5 inline-flex items-center gap-2 rounded-md border border-transparent py-0.5 pr-2 transition-colors hover:border-line hover:bg-slate-900/60"
    >
      <div className="flex -space-x-1.5">
        {meta.replierIds.slice(0, 3).map((id) => {
          const mb = getMember(id)
          return <Avatar key={id} size="xs" name={mb?.name ?? '?'} src={mb?.avatar ?? undefined} />
        })}
      </div>
      <span className="text-body-s font-semibold text-steel-300">
        {meta.count} {meta.count === 1 ? 'resposta' : 'respostas'}
      </span>
      <span className="text-[12px] text-faint">última resposta {timeAgo(meta.lastAt)}</span>
    </button>
  )
}

function MessageItem({
  message,
  grouped,
  names,
  reactions,
  myId,
  canDelete,
  onDelete,
  onToggleReaction,
  replyMeta,
  onOpenThread,
}: {
  message: ChatMessage
  grouped: boolean
  names: string[]
  reactions: ChatReaction[]
  myId: string
  canDelete: boolean
  onDelete: () => void
  onToggleReaction: (emoji: string) => void
  /** Resumo da thread desta mensagem (só no canal; ausente dentro da thread). */
  replyMeta?: ReplyMeta
  /** Abre a thread desta mensagem (só no canal; ausente dentro da thread). */
  onOpenThread?: () => void
}) {
  const { getMember } = useProfiles()
  const member = getMember(message.authorId)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)

  return (
    <li
      className={cn('group relative flex gap-2.5 px-1', grouped ? 'mt-0.5' : 'mt-4 first:mt-0')}
      onContextMenu={(e) => {
        e.preventDefault()
        setMenu({ x: e.clientX, y: e.clientY })
      }}
    >
      <div className="w-10 shrink-0">
        {grouped ? (
          <span className="block w-10" aria-hidden />
        ) : (
          <Avatar size="md" name={message.authorName} src={member?.avatar ?? undefined} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        {!grouped && (
          <div className="flex items-center gap-2">
            <span className="text-body-l font-semibold text-strong">{message.authorName}</span>
            <span className="font-mono text-[13px] text-faint">{timeAgo(message.createdAt)}</span>
          </div>
        )}
        {/* Bloco da mensagem + ações logo ao lado (não na extremidade). */}
        <div className="flex items-start gap-1.5">
          <div className="min-w-0">
            {message.body && (
              <p className="mt-1 whitespace-pre-wrap break-words text-body-l leading-relaxed text-fg">
                {renderBody(message.body, names)}
                {message.editedAt && (
                  <span className="ml-1 align-baseline font-mono text-[12px] text-faint">(editado)</span>
                )}
              </p>
            )}
            <MessageAttachments messageId={message.id} />
            <ReactionBar reactions={reactions} myId={myId} onToggle={onToggleReaction} />
            {onOpenThread && replyMeta && replyMeta.count > 0 && (
              <ThreadSummary meta={replyMeta} onOpen={onOpenThread} />
            )}
          </div>

          {/* Ações (hover): responder + reagir + excluir. Fixo com o picker aberto. */}
          <div
            className={cn(
              'relative mt-1 flex shrink-0 items-center gap-0.5 transition-opacity focus-within:opacity-100 group-hover:opacity-100',
              pickerOpen ? 'opacity-100' : 'opacity-0',
            )}
          >
            {onOpenThread && (
              <button
                onClick={onOpenThread}
                className="grid size-7 place-items-center rounded-md text-faint transition-colors hover:bg-slate-800 hover:text-steel-300 focus-visible:outline-none"
                aria-label="Responder na thread"
                title="Responder na thread"
              >
                <Reply size={15} strokeWidth={1.5} />
              </button>
            )}
            <button
              onClick={() => setPickerOpen((v) => !v)}
              className="grid size-7 place-items-center rounded-md text-faint transition-colors hover:bg-slate-800 hover:text-steel-300 focus-visible:outline-none"
              aria-label="Reagir"
              title="Reagir"
            >
              <SmilePlus size={16} strokeWidth={1.5} />
            </button>
            {canDelete && (
              <button
                onClick={onDelete}
                className="grid size-7 place-items-center rounded-md text-faint transition-colors hover:bg-slate-800 hover:text-err focus-visible:outline-none"
                aria-label="Excluir mensagem"
                title="Excluir mensagem"
              >
                <Trash2 size={15} strokeWidth={1.5} />
              </button>
            )}
            {pickerOpen && <EmojiPicker onPick={(e) => onToggleReaction(e)} onClose={() => setPickerOpen(false)} />}
          </div>
        </div>
      </div>

      {menu && (
        <ReactionContextMenu
          x={menu.x}
          y={menu.y}
          onPick={(e) => onToggleReaction(e)}
          onClose={() => setMenu(null)}
        />
      )}
    </li>
  )
}

function StagedFile({ file, onRemove }: { file: File; onRemove: () => void }) {
  const isImg = file.type.startsWith('image/')
  return (
    <div className="flex items-center gap-2 rounded-md border border-line bg-slate-900 py-1 pl-2 pr-1">
      <span className="grid size-6 shrink-0 place-items-center rounded text-steel-300">
        {isImg ? <FileIcon size={14} strokeWidth={1.5} /> : <FileText size={14} strokeWidth={1.5} />}
      </span>
      <span className="max-w-[10rem] truncate text-[12px] text-muted">{file.name}</span>
      <button
        onClick={onRemove}
        className="grid size-5 shrink-0 place-items-center rounded text-faint transition-colors hover:text-err"
        aria-label={`Remover ${file.name}`}
      >
        <X size={13} strokeWidth={2} />
      </button>
    </div>
  )
}

function Composer({
  placeholder,
  members,
  onSend,
}: {
  placeholder: string
  members: Member[]
  onSend: (text: string, files: File[], mentionIds: string[]) => Promise<void> | void
}) {
  const [draft, setDraft] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [mention, setMention] = useState<{ query: string; index: number } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const caretToSet = useRef<number | null>(null)

  const suggestions = useMemo(() => {
    if (!mention) return []
    const q = norm(mention.query)
    return members.filter((m) => m.name && (q === '' || norm(m.name).includes(q))).slice(0, MAX_SUGGESTIONS)
  }, [mention, members])

  useLayoutEffect(() => {
    if (caretToSet.current != null && textareaRef.current) {
      const pos = caretToSet.current
      caretToSet.current = null
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(pos, pos)
    }
  }, [draft])

  const syncMention = (value: string, caret: number) => {
    const before = value.slice(0, caret)
    const m = before.match(/(?:^|\s)@(\S*)$/)
    if (m) setMention((prev) => ({ query: m[1], index: prev ? Math.min(prev.index, MAX_SUGGESTIONS - 1) : 0 }))
    else setMention(null)
  }

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setDraft(value)
    syncMention(value, e.target.selectionStart ?? value.length)
  }

  const pickMention = (m: Member) => {
    const el = textareaRef.current
    const caret = el?.selectionStart ?? draft.length
    const before = draft.slice(0, caret)
    const after = draft.slice(caret)
    const newBefore = before.replace(/@(\S*)$/, `@${m.name} `)
    setDraft(newBefore + after)
    caretToSet.current = newBefore.length
    setMention(null)
  }

  const addFiles = (picked: FileList | null) => {
    if (!picked?.length) return
    setFiles((prev) => [...prev, ...Array.from(picked)])
  }

  const submit = async () => {
    const text = draft.trim()
    if ((!text && files.length === 0) || busy) return
    const mentionIds = text
      ? members.filter((m) => m.name && text.includes(`@${m.name}`)).map((m) => m.id)
      : []
    setBusy(true)
    try {
      await onSend(text, files, mentionIds)
      setDraft('')
      setFiles([])
      setMention(null)
    } finally {
      setBusy(false)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mention && suggestions.length) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setMention((p) => (p ? { ...p, index: (p.index + 1) % suggestions.length } : p))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setMention((p) => (p ? { ...p, index: (p.index - 1 + suggestions.length) % suggestions.length } : p))
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        pickMention(suggestions[Math.min(mention.index, suggestions.length - 1)])
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setMention(null)
        return
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="border-t border-line px-4 py-3">
      {files.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {files.map((f, i) => (
            <StagedFile key={`${f.name}-${i}`} file={f} onRemove={() => setFiles((prev) => prev.filter((_, j) => j !== i))} />
          ))}
        </div>
      )}
      <div className="relative flex items-end gap-2">
        {/* Seletor de @menção (ancorado acima do composer) */}
        {mention && suggestions.length > 0 && (
          <div className="absolute bottom-full left-0 z-dropdown mb-1 w-64 overflow-hidden rounded-lg border border-strong bg-slate-700 py-1 shadow-e2 animate-slide-up">
            {suggestions.map((m, i) => (
              <button
                key={m.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  pickMention(m)
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 px-2.5 py-1.5 text-left transition-colors',
                  i === mention.index ? 'bg-slate-800' : 'hover:bg-slate-800',
                )}
              >
                <Avatar size="sm" name={m.name} src={m.avatar ?? undefined} />
                <span className="min-w-0 flex-1 truncate text-body-s text-strong">{m.name}</span>
                {m.team && <span className="shrink-0 font-mono text-[11px] text-faint">{m.team}</span>}
              </button>
            ))}
          </div>
        )}

        <IconButton
          size="sm"
          variant="ghost"
          aria-label="Anexar arquivo"
          title="Anexar arquivo"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip size={18} strokeWidth={1.5} />
        </IconButton>
        <Textarea
          ref={textareaRef}
          rows={1}
          placeholder={placeholder}
          value={draft}
          onChange={onChange}
          onKeyDown={onKeyDown}
          className="flex-1"
        />
        <Button
          iconOnly
          aria-label="Enviar"
          leftIcon={<Send size={16} strokeWidth={1.5} />}
          onClick={submit}
          loading={busy}
          disabled={!draft.trim() && files.length === 0}
        />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>
      <span className="mt-1 block font-mono text-[12px] text-faint">
        Enter envia · Shift + Enter quebra linha · @ menciona
      </span>
    </div>
  )
}

function NewChannelModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { createChannel } = useChat()
  const toast = useToast()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setName('')
      setDescription('')
    }
  }, [open])

  const submit = async () => {
    if (!name.trim() || busy) return
    setBusy(true)
    const { error } = await createChannel(name, description)
    setBusy(false)
    if (error) toast.error('Não foi possível criar o canal', error)
    else {
      toast.success('Canal criado')
      onClose()
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Novo canal"
      description="Crie um espaço de conversa por tema ou equipe."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={busy} disabled={!name.trim()}>
            Criar canal
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Nome"
          placeholder="ex.: social-media"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <Textarea
          label="Descrição (opcional)"
          placeholder="Sobre o que é este canal?"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
    </Modal>
  )
}

function NewDmModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useSession()
  const { members } = useProfiles()
  const { openDm } = useChat()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    if (open) setQuery('')
  }, [open])

  const list = useMemo(() => {
    const q = norm(query)
    return members
      .filter((m) => m.id !== user.userId && m.name)
      .filter((m) => q === '' || norm(m.name).includes(q))
  }, [members, user.userId, query])

  const start = async (memberId: string) => {
    setBusyId(memberId)
    const { error } = await openDm(memberId)
    setBusyId(null)
    if (error) toast.error('Não foi possível abrir a conversa', error)
    else onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova mensagem direta" description="Escolha com quem conversar.">
      <div className="flex flex-col gap-3">
        <SearchField placeholder="Buscar pessoa…" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
        <ul className="flex max-h-80 flex-col gap-0.5 overflow-y-auto">
          {list.length === 0 ? (
            <li className="px-2 py-6 text-center text-body-s text-faint">Ninguém encontrado.</li>
          ) : (
            list.map((m) => (
              <li key={m.id}>
                <button
                  onClick={() => start(m.id)}
                  disabled={busyId != null}
                  className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-slate-800 disabled:opacity-50"
                >
                  <Avatar size="sm" name={m.name} src={m.avatar ?? undefined} />
                  <span className="min-w-0 flex-1 truncate text-body-s text-strong">{m.name}</span>
                  {m.team && <span className="shrink-0 font-mono text-[11px] text-faint">{m.team}</span>}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </Modal>
  )
}

/** Painel lateral da thread (estilo "Conversa" do Slack). */
function ThreadPanel() {
  const { user, isManager } = useSession()
  const { members } = useProfiles()
  const { addAttachment } = useAttachments()
  const toast = useToast()
  const {
    threadParent,
    threadMessages,
    closeThread,
    reactions,
    sendReply,
    deleteMessage,
    toggleReaction,
    activeChannel,
  } = useChat()

  const bottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [threadMessages, threadParent?.id])

  const names = useMemo(() => members.map((m) => m.name).filter(Boolean), [members])
  const replyItems = useMemo(
    () => threadMessages.map((m, i) => ({ message: m, grouped: isGrouped(threadMessages[i - 1], m) })),
    [threadMessages],
  )

  if (!threadParent) return null

  const count = threadMessages.length

  const handleReply = async (text: string, files: File[], mentionIds: string[]) => {
    const label = activeChannel?.kind === 'dm' ? 'uma conversa' : `#${activeChannel?.name ?? ''}`
    const msg = await sendReply(threadParent.id, text, mentionIds.length ? { ids: mentionIds, label } : undefined)
    if (msg && files.length) {
      for (const f of files) {
        const err = await addAttachment('chat_message', msg.id, f)
        if (err) toast.error('Falha ao anexar', `${f.name}: ${err}`)
      }
    }
  }

  return (
    <aside className="absolute inset-0 z-20 flex flex-col border-l border-line bg-ink-deep md:relative md:inset-auto md:z-auto md:w-[400px] md:shrink-0">
      <header className="flex items-center gap-2 border-b border-line px-4 py-3">
        <h2 className="text-body-l font-semibold text-strong">Conversa</h2>
        <span className="text-[12px] text-faint">na thread</span>
        <IconButton size="sm" aria-label="Fechar thread" className="ml-auto" onClick={closeThread}>
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col">
          <MessageItem
            message={threadParent}
            grouped={false}
            names={names}
            reactions={reactions[threadParent.id] ?? []}
            myId={user.userId}
            canDelete={threadParent.authorId === user.userId || isManager}
            onDelete={() => deleteMessage(threadParent.id)}
            onToggleReaction={(emoji) => toggleReaction(threadParent.id, emoji)}
          />
        </ul>

        {count > 0 && (
          <div className="my-3 flex items-center gap-3">
            <span className="shrink-0 text-[12px] font-medium text-muted">
              {count} {count === 1 ? 'resposta' : 'respostas'}
            </span>
            <div className="h-px flex-1 bg-line" />
          </div>
        )}

        <ul className="flex flex-col">
          {replyItems.map(({ message, grouped }) => (
            <MessageItem
              key={message.id}
              message={message}
              grouped={grouped}
              names={names}
              reactions={reactions[message.id] ?? []}
              myId={user.userId}
              canDelete={message.authorId === user.userId || isManager}
              onDelete={() => deleteMessage(message.id)}
              onToggleReaction={(emoji) => toggleReaction(message.id, emoji)}
            />
          ))}
          <div ref={bottomRef} />
        </ul>
      </div>

      <Composer key={threadParent.id} placeholder="Responder…" members={members} onSend={handleReply} />
    </aside>
  )
}

export function ChatPage() {
  const { user, isManager } = useSession()
  const { getMember, members } = useProfiles()
  const { addAttachment } = useAttachments()
  const {
    loading,
    channels,
    dms,
    unread,
    activeId,
    setActiveId,
    activeChannel,
    messages,
    messagesLoading,
    reactions,
    replyMeta,
    threadParent,
    openThread,
    sendMessage,
    deleteMessage,
    toggleReaction,
  } = useChat()
  const toast = useToast()
  const [newChannelOpen, setNewChannelOpen] = useState(false)
  const [newDmOpen, setNewDmOpen] = useState(false)

  // Deep-link: ?c=<channelId> (vindo do sino de notificações) abre a conversa.
  const [params] = useSearchParams()
  const linkChannel = params.get('c')
  useEffect(() => {
    if (linkChannel) setActiveId(linkChannel)
  }, [linkChannel, setActiveId])

  // Auto-scroll para o fim quando chegam mensagens ou troca de canal.
  const bottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, activeId])

  const names = useMemo(() => members.map((m) => m.name).filter(Boolean), [members])
  const items = useMemo(
    () => messages.map((m, i) => ({ message: m, grouped: isGrouped(messages[i - 1], m) })),
    [messages],
  )

  const activeDm = activeChannel?.kind === 'dm' ? dms.find((d) => d.id === activeId) : undefined
  const dmOther = activeDm?.otherUserId ? getMember(activeDm.otherUserId) : undefined
  const activeTitle = activeChannel ? (activeChannel.kind === 'dm' ? dmOther?.name ?? 'Conversa' : activeChannel.name) : ''
  const composerPlaceholder = activeChannel
    ? activeChannel.kind === 'dm'
      ? `Mensagem para ${(dmOther?.name ?? 'a pessoa').split(' ')[0]}…`
      : `Mensagem para #${activeChannel.name}…`
    : ''

  const handleSend = async (text: string, files: File[], mentionIds: string[]) => {
    const label = activeChannel?.kind === 'dm' ? 'uma conversa' : `#${activeChannel?.name ?? ''}`
    const msg = await sendMessage(text, mentionIds.length ? { ids: mentionIds, label } : undefined)
    if (msg && files.length) {
      for (const f of files) {
        const err = await addAttachment('chat_message', msg.id, f)
        if (err) toast.error('Falha ao anexar', `${f.name}: ${err}`)
      }
    }
  }

  return (
    <div className="relative flex h-full min-h-0">
      {/* Lista de conversas */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-slate-900/40 md:flex">
        <nav className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-2 py-3">
          {/* Canais */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="font-mono text-mono-label uppercase text-steel-400">Canais</span>
              <IconButton size="sm" aria-label="Novo canal" title="Novo canal" onClick={() => setNewChannelOpen(true)}>
                <Plus size={16} strokeWidth={1.5} />
              </IconButton>
            </div>
            {loading ? (
              <div className="flex flex-col gap-1.5 px-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              channels.map((c) => (
                <ChannelButton
                  key={c.id}
                  channel={c}
                  active={c.id === activeId}
                  unread={unread[c.id] ?? 0}
                  onClick={() => setActiveId(c.id)}
                />
              ))
            )}
          </div>

          {/* Mensagens diretas */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="font-mono text-mono-label uppercase text-steel-400">Mensagens diretas</span>
              <IconButton size="sm" aria-label="Nova conversa" title="Nova conversa" onClick={() => setNewDmOpen(true)}>
                <PenSquare size={15} strokeWidth={1.5} />
              </IconButton>
            </div>
            {dms.length === 0 ? (
              <p className="px-2 py-1 text-[12px] text-faint">Nenhuma conversa ainda.</p>
            ) : (
              dms.map((d) => (
                <DmButton
                  key={d.id}
                  dm={d}
                  active={d.id === activeId}
                  unread={unread[d.id] ?? 0}
                  onClick={() => setActiveId(d.id)}
                />
              ))
            )}
          </div>
        </nav>
      </aside>

      {/* Conversa */}
      <section className="flex min-w-0 flex-1 flex-col">
        {activeChannel ? (
          <>
            <header className="flex items-center gap-2 border-b border-line px-4 py-3">
              {activeChannel.kind === 'dm' ? (
                <Avatar size="sm" name={activeTitle} src={dmOther?.avatar ?? undefined} />
              ) : (
                <Hash size={18} strokeWidth={1.5} className="text-steel-400" aria-hidden />
              )}
              <div className="min-w-0">
                <h1 className="truncate text-body-l font-semibold text-strong">{activeTitle}</h1>
                {activeChannel.kind !== 'dm' && activeChannel.description && (
                  <p className="truncate text-body-s text-muted">{activeChannel.description}</p>
                )}
              </div>
              <div className="ml-auto flex items-center gap-1 md:hidden">
                <IconButton size="sm" aria-label="Nova conversa" onClick={() => setNewDmOpen(true)}>
                  <PenSquare size={15} strokeWidth={1.5} />
                </IconButton>
                <IconButton size="sm" aria-label="Novo canal" onClick={() => setNewChannelOpen(true)}>
                  <Plus size={16} strokeWidth={1.5} />
                </IconButton>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
              {messagesLoading ? (
                <div className="flex flex-col gap-4 px-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-2.5">
                      <Skeleton className="size-10 shrink-0 rounded-full" />
                      <div className="flex flex-1 flex-col gap-2">
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-3.5 w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="grid h-full place-items-center">
                  <p className="text-body-l text-faint">
                    {activeChannel.kind === 'dm'
                      ? `Diga olá para ${activeTitle.split(' ')[0]}.`
                      : `Nenhuma mensagem ainda em #${activeChannel.name}. Comece a conversa.`}
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col">
                  {items.map(({ message, grouped }) => (
                    <MessageItem
                      key={message.id}
                      message={message}
                      grouped={grouped}
                      names={names}
                      reactions={reactions[message.id] ?? []}
                      myId={user.userId}
                      canDelete={message.authorId === user.userId || isManager}
                      onDelete={() => deleteMessage(message.id)}
                      onToggleReaction={(emoji) => toggleReaction(message.id, emoji)}
                      replyMeta={replyMeta[message.id]}
                      onOpenThread={() => openThread(message.id)}
                    />
                  ))}
                  <div ref={bottomRef} />
                </ul>
              )}
            </div>

            <Composer key={activeChannel.id} placeholder={composerPlaceholder} members={members} onSend={handleSend} />
          </>
        ) : (
          <div className="grid h-full place-items-center p-6">
            <EmptyState
              icon={<MessagesSquare size={22} strokeWidth={1.5} />}
              title="Nenhum canal ainda"
              description="Crie o primeiro canal para a equipe começar a conversar."
              action={
                <Button leftIcon={<Plus size={16} strokeWidth={1.5} />} onClick={() => setNewChannelOpen(true)}>
                  Novo canal
                </Button>
              }
            />
          </div>
        )}
      </section>

      {threadParent && <ThreadPanel />}

      <NewChannelModal open={newChannelOpen} onClose={() => setNewChannelOpen(false)} />
      <NewDmModal open={newDmOpen} onClose={() => setNewDmOpen(false)} />
    </div>
  )
}
