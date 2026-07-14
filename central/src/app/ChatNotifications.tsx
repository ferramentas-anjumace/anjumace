import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, useToast } from '@/components/ui'
import { useChat, type ChatMessage } from './chat'
import { useProfiles } from './profiles'

/* ----------------------------------------------------------------------------
   Avisos de mensagem nova no chat (DMs e canais)
   ----------------------------------------------------------------------------
   Montado dentro do AppShell (precisa de router + toasts). Ouve o firehose do
   ChatProvider e converte cada mensagem "não vista" em:
   - toast clicável (usuário navegando em outra aba do app);
   - notificação do navegador (aba em segundo plano, se permitido);
   - contador de não-lidas no título da aba: "(3) Anju Mace · …".
   Dentro do chat aberto e visível nada dispara — os badges da sidebar bastam.
---------------------------------------------------------------------------- */

const snippet = (body: string) => {
  const text = body.replace(/\s+/g, ' ').trim()
  if (!text) return 'Nova mensagem'
  return text.length > 90 ? `${text.slice(0, 90)}…` : text
}

export function ChatNotifications() {
  const { channels, dms, chatOpen, setActiveId, totalUnread, onIncoming } = useChat()
  const { getMember } = useProfiles()
  const toast = useToast()
  const navigate = useNavigate()

  // Título base da aba (capturado uma vez) + contador de não-lidas.
  const baseTitle = useRef(document.title)
  useEffect(() => {
    document.title = totalUnread > 0 ? `(${totalUnread > 99 ? '99+' : totalUnread}) ${baseTitle.current}` : baseTitle.current
    return () => {
      document.title = baseTitle.current
    }
  }, [totalUnread])

  // Refs para o handler não precisar reassinar a cada render.
  const stateRef = useRef({ channels, dms, chatOpen, getMember })
  useEffect(() => {
    stateRef.current = { channels, dms, chatOpen, getMember }
  }, [channels, dms, chatOpen, getMember])

  useEffect(() => {
    const handle = (m: ChatMessage) => {
      const { channels, dms, chatOpen, getMember } = stateRef.current
      const channel = channels.find((c) => c.id === m.channelId) ?? dms.find((d) => d.id === m.channelId)
      const isDm = channel?.kind === 'dm'
      // DM: só o nome de quem mandou. Canal: "Fulana — #canal".
      const title = isDm || !channel ? m.authorName : `${m.authorName} — #${channel.name}`
      const body = snippet(m.body)
      const avatar = getMember(m.authorId)?.avatar ?? undefined
      const open = () => {
        setActiveId(m.channelId)
        navigate('/app/chat')
      }

      // Aba em segundo plano → notificação do navegador (uma por conversa),
      // com a foto de quem mandou (data URL) quando houver.
      if (document.hidden) {
        if ('Notification' in window && Notification.permission === 'granted') {
          const n = new Notification(title, { body, tag: `chat-${m.channelId}`, icon: avatar ?? '/favicon.svg' })
          n.onclick = () => {
            window.focus()
            open()
            n.close()
          }
        }
        return
      }

      // App visível mas fora do chat → toast clicável com a foto de quem
      // mandou. Dentro do chat, os badges da lista de conversas já sinalizam.
      if (!chatOpen)
        toast.toast({
          tone: 'info',
          variant: 'accent',
          icon: <Avatar size="sm" name={m.authorName} src={avatar} />,
          title,
          description: body,
          onClick: open,
        })
    }
    return onIncoming(handle)
  }, [onIncoming, setActiveId, navigate, toast])

  return null
}
