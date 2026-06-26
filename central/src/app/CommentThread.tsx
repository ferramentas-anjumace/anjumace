import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { MessageSquare, Send, Trash2 } from 'lucide-react'
import { Avatar, Button, Textarea } from '@/components/ui'
import { cn } from '@/lib/cn'
import { useSession } from '@/lib/session'
import { usePermissions } from '@/lib/permissions'
import { useProfiles } from './profiles'
import { useComments, type CommentEntity, type Comment } from './comments'
import type { Member } from './profiles'

/* ----------------------------------------------------------------------------
   CommentThread — discussão reutilizável de uma entidade (tarefa, post...).
   ----------------------------------------------------------------------------
   Plugável em qualquer lugar: recebe (entityType, entityId) e cuida de listar,
   comentar e remover. Suporta @menções: digitar "@" abre o seletor de membros;
   os mencionados (e, opcionalmente, os responsáveis em `notifyUserIds`) são
   avisados por notificação ao publicar.
---------------------------------------------------------------------------- */

const rel = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })
const fullDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

/** Tempo relativo curto ("agora", "há 3 min", "há 2 h"), com fallback de data. */
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
  if (names.length === 0) return body
  // Nomes mais longos primeiro, para casar "@Maria Silva" antes de "@Maria".
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

function CommentItem({
  comment,
  names,
  canDelete,
  onDelete,
}: {
  comment: Comment
  names: string[]
  canDelete: boolean
  onDelete: () => void
}) {
  const { getMember } = useProfiles()
  const member = getMember(comment.authorId)
  return (
    <li className="group flex gap-2.5">
      <Avatar size="sm" name={comment.authorName} src={member?.avatar ?? undefined} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-body-s font-medium text-strong">{comment.authorName}</span>
          <span className="font-mono text-[11px] text-faint">{timeAgo(comment.createdAt)}</span>
          {canDelete && (
            <button
              onClick={onDelete}
              className="ml-auto grid size-6 shrink-0 place-items-center rounded text-faint opacity-0 transition-opacity hover:text-err focus-visible:opacity-100 focus-visible:outline-none group-hover:opacity-100"
              aria-label="Excluir comentário"
              title="Excluir comentário"
            >
              <Trash2 size={14} strokeWidth={1.5} />
            </button>
          )}
        </div>
        <p className="mt-0.5 whitespace-pre-wrap break-words text-body-s text-fg">
          {renderBody(comment.body, names)}
        </p>
      </div>
    </li>
  )
}

const MAX_SUGGESTIONS = 6

export function CommentThread({
  entityType,
  entityId,
  notifyUserIds,
  notifyLabel,
  taskId,
}: {
  entityType: CommentEntity
  entityId: string
  /** Responsáveis a avisar ao comentar. O autor e os mencionados são excluídos. */
  notifyUserIds?: string[]
  /** Título da entidade, usado no corpo da notificação. */
  notifyLabel?: string
  /** Liga a notificação a uma tarefa (deep-link no sino). */
  taskId?: string
}) {
  const { user } = useSession()
  const { can } = usePermissions()
  const { members } = useProfiles()
  const { getComments, addComment, removeComment } = useComments()
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)

  // Estado do seletor de @menção.
  const [mention, setMention] = useState<{ query: string; index: number } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const caretToSet = useRef<number | null>(null)

  const comments = getComments(entityType, entityId)
  const isModerator = can('manage_users')
  const names = useMemo(() => members.map((m) => m.name).filter(Boolean), [members])

  // Sugestões filtradas pela query atual.
  const suggestions = useMemo(() => {
    if (!mention) return []
    const q = norm(mention.query)
    return members
      .filter((m) => m.name && (q === '' || norm(m.name).includes(q)))
      .slice(0, MAX_SUGGESTIONS)
  }, [mention, members])

  // Reposiciona o cursor após inserir uma menção no texto.
  useLayoutEffect(() => {
    if (caretToSet.current != null && textareaRef.current) {
      const pos = caretToSet.current
      caretToSet.current = null
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(pos, pos)
    }
  }, [draft])

  /** Detecta se o cursor está logo após um "@palavra" e abre/fecha o seletor. */
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

  /** Substitui o "@query" antes do cursor pelo nome completo do membro. */
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

  const submit = async () => {
    const text = draft.trim()
    if (!text || busy) return
    setBusy(true)
    try {
      // Mencionados: membros cujo "@Nome" aparece literalmente no texto.
      const mentionIds = members
        .filter((m) => m.name && text.includes(`@${m.name}`))
        .map((m) => m.id)

      const notify = []
      if (mentionIds.length) {
        notify.push({
          userIds: mentionIds,
          title: 'Você foi mencionado',
          body: `${user.name} mencionou você${notifyLabel ? ` em "${notifyLabel}"` : ''}: ${text.slice(0, 80)}`,
          taskId,
        })
      }
      if (notifyUserIds?.length) {
        notify.push({
          userIds: notifyUserIds,
          title: 'Novo comentário',
          body: `${user.name} comentou${notifyLabel ? ` em "${notifyLabel}"` : ''}: ${text.slice(0, 80)}`,
          taskId,
        })
      }

      await addComment(entityType, entityId, text, notify)
      setDraft('')
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
    // Cmd/Ctrl+Enter envia (quando o seletor não está aberto).
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <MessageSquare size={15} strokeWidth={1.5} className="text-steel-300" aria-hidden />
        <span className="text-body-s font-medium text-strong">Discussão</span>
        {comments.length > 0 && (
          <span className="font-mono text-[11px] text-faint tabular-nums">{comments.length}</span>
        )}
      </div>

      {comments.length === 0 ? (
        <p className="mb-3 text-body-s text-faint">Nenhum comentário ainda. Comece a conversa.</p>
      ) : (
        <ul className="mb-4 flex flex-col gap-4">
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              names={names}
              canDelete={c.authorId === user.userId || isModerator}
              onDelete={() => removeComment(c.id)}
            />
          ))}
        </ul>
      )}

      <div className="relative flex flex-col gap-2">
        {/* Seletor de @menção (ancorado acima do composer) */}
        {mention && suggestions.length > 0 && (
          <div className="absolute bottom-full left-0 z-dropdown mb-1 w-64 overflow-hidden rounded-lg border border-strong bg-slate-700 py-1 shadow-e2 animate-slide-up">
            {suggestions.map((m, i) => (
              <button
                key={m.id}
                type="button"
                // onMouseDown (não onClick) para não roubar o foco do textarea antes da inserção.
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

        <Textarea
          ref={textareaRef}
          rows={2}
          placeholder="Escreva um comentário…  (@ para mencionar)"
          value={draft}
          onChange={onChange}
          onKeyDown={onKeyDown}
        />
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] text-faint">⌘/Ctrl + Enter para enviar</span>
          <Button
            size="sm"
            leftIcon={<Send size={15} strokeWidth={1.5} />}
            onClick={submit}
            loading={busy}
            disabled={!draft.trim()}
          >
            Comentar
          </Button>
        </div>
      </div>
    </div>
  )
}
