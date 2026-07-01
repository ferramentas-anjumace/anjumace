import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck } from 'lucide-react'
import { DropdownMenu, IconButton } from '@/components/ui'
import { useNotifications, type AppNotification } from '@/lib/notifications'

/* ----------------------------------------------------------------------------
   NotificationsBell — sino do topo com contador de não lidas e lista.
   ----------------------------------------------------------------------------
   Clicar numa notificação marca como lida e leva para Tarefas. "Marcar todas"
   zera o contador.
---------------------------------------------------------------------------- */

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  const diff = Math.max(0, Date.now() - then)
  const min = Math.floor(diff / 60_000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h} h`
  const d = Math.floor(h / 24)
  return `há ${d} d`
}

export function NotificationsBell() {
  const navigate = useNavigate()
  const { items, unread, markRead, markAllRead } = useNotifications()

  const open = (n: AppNotification) => {
    if (!n.read) markRead(n.id)
    // Menção de chat leva direto ao canal; o resto vai para Tarefas.
    if (n.chatChannelId) navigate(`/app/chat?c=${n.chatChannelId}`)
    else navigate('/app/tarefas')
  }

  return (
    <DropdownMenu
      align="end"
      className="w-80 p-0"
      trigger={
        <IconButton aria-label={`Notificações${unread ? ` (${unread} não lidas)` : ''}`} className="relative">
          <Bell size={18} strokeWidth={1.5} />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-steel-500 px-1 font-mono text-[10px] font-semibold leading-4 text-accent-fg">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </IconButton>
      }
    >
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <span className="text-body-s font-medium text-strong">Notificações</span>
        {unread > 0 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); markAllRead() }}
            className="inline-flex items-center gap-1 font-mono text-[11px] uppercase text-steel-300 transition-colors hover:text-steel-400 focus-visible:outline-none"
          >
            <CheckCheck size={13} strokeWidth={1.5} /> marcar todas
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="px-3 py-6 text-center text-body-s text-faint">Nenhuma notificação.</p>
      ) : (
        <ul className="max-h-80 overflow-y-auto py-1">
          {items.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => open(n)}
                className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-slate-600 focus-visible:outline-none focus-visible:bg-slate-600"
              >
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-steel-400'}`}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className={`block text-body-s ${n.read ? 'text-muted' : 'font-medium text-strong'}`}>
                    {n.title}
                  </span>
                  {n.body && <span className="mt-0.5 block text-[12px] leading-snug text-faint">{n.body}</span>}
                  <span className="mt-0.5 block font-mono text-[10px] uppercase text-faint">{timeAgo(n.createdAt)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </DropdownMenu>
  )
}
