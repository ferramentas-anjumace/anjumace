import { useState } from 'react'
import { MessageSquare, Send, Trash2 } from 'lucide-react'
import { Avatar, Button, Textarea } from '@/components/ui'
import { useSession } from '@/lib/session'
import { usePermissions } from '@/lib/permissions'
import { useProfiles } from './profiles'
import { useComments, type CommentEntity, type Comment } from './comments'

/* ----------------------------------------------------------------------------
   CommentThread — discussão reutilizável de uma entidade (tarefa, post...).
   ----------------------------------------------------------------------------
   Plugável em qualquer lugar: recebe (entityType, entityId) e cuida de listar,
   comentar e remover. `notifyUserIds`/`notifyLabel` ligam a opção de avisar
   gente ao comentar (ex.: os responsáveis da tarefa).
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

function CommentItem({ comment, canDelete, onDelete }: { comment: Comment; canDelete: boolean; onDelete: () => void }) {
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
        <p className="mt-0.5 whitespace-pre-wrap break-words text-body-s text-fg">{comment.body}</p>
      </div>
    </li>
  )
}

export function CommentThread({
  entityType,
  entityId,
  notifyUserIds,
  notifyLabel,
  taskId,
}: {
  entityType: CommentEntity
  entityId: string
  /** Quem avisar ao comentar (ex.: responsáveis). O autor é sempre excluído. */
  notifyUserIds?: string[]
  /** Título da entidade, usado no corpo da notificação. */
  notifyLabel?: string
  /** Liga a notificação a uma tarefa (deep-link no sino). */
  taskId?: string
}) {
  const { user } = useSession()
  const { can } = usePermissions()
  const { getComments, addComment, removeComment } = useComments()
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)

  const comments = getComments(entityType, entityId)
  const isModerator = can('manage_users')

  const submit = async () => {
    const text = draft.trim()
    if (!text || busy) return
    setBusy(true)
    try {
      const notify =
        notifyUserIds && notifyUserIds.length
          ? {
              userIds: notifyUserIds,
              title: 'Novo comentário',
              body: `${user.name} comentou${notifyLabel ? ` em "${notifyLabel}"` : ''}: ${text.slice(0, 80)}`,
              taskId,
            }
          : undefined
      await addComment(entityType, entityId, text, notify)
      setDraft('')
    } finally {
      setBusy(false)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl+Enter envia.
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
              canDelete={c.authorId === user.userId || isModerator}
              onDelete={() => removeComment(c.id)}
            />
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2">
        <Textarea
          rows={2}
          placeholder="Escreva um comentário…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
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
