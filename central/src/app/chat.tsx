import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/lib/session'

/* ----------------------------------------------------------------------------
   Store do Chat — Supabase (chat_channels / chat_members / chat_messages)
   ----------------------------------------------------------------------------
   Fase 1: canais públicos + mensagens. Fase 2: DMs + não-lidas.
   Fase 3: anexos + menções @ + reações. Fase 4: respostas em thread.

   O canal ativo mantém UMA lista `allMessages` (topo + respostas). A partir
   dela derivamos: `messages` (só topo), `replyMeta` (resumo de respostas por
   pai) e `threadMessages` (respostas da thread aberta). Assim a thread fica
   viva em tempo real sem subscription extra.
---------------------------------------------------------------------------- */

export type ChannelKind = 'channel' | 'dm'

export interface ChatChannel {
  id: string
  kind: ChannelKind
  name: string
  description: string | null
  isPrivate: boolean
  createdBy: string | null
  createdAt: string
}

export interface DmChannel extends ChatChannel {
  otherUserId: string | null
}

export interface ChatMessage {
  id: string
  channelId: string
  authorId: string
  authorName: string
  body: string
  parentId: string | null
  editedAt: string | null
  createdAt: string
}

export interface ChatReaction {
  messageId: string
  userId: string
  emoji: string
}

/** Resumo de uma thread (respostas de uma mensagem-pai). */
export interface ReplyMeta {
  count: number
  lastAt: string
  replierIds: string[]
}

/** Quem notificar ao mencionar (ids) + rótulo do canal para o corpo do aviso. */
export interface MentionNotify {
  ids: string[]
  label: string
}

interface ChannelRow {
  id: string
  kind: ChannelKind
  name: string
  description: string | null
  is_private: boolean
  created_by: string | null
  created_at: string
}

interface MessageRow {
  id: string
  channel_id: string
  author_id: string
  author_name: string
  body: string
  parent_id: string | null
  edited_at: string | null
  created_at: string
}

function rowToChannel(r: ChannelRow): ChatChannel {
  return {
    id: r.id,
    kind: r.kind,
    name: r.name,
    description: r.description,
    isPrivate: r.is_private,
    createdBy: r.created_by,
    createdAt: r.created_at,
  }
}

function rowToMessage(r: MessageRow): ChatMessage {
  return {
    id: r.id,
    channelId: r.channel_id,
    authorId: r.author_id,
    authorName: r.author_name,
    body: r.body,
    parentId: r.parent_id ?? null,
    editedAt: r.edited_at,
    createdAt: r.created_at,
  }
}

interface ChatCtx {
  loading: boolean
  channels: ChatChannel[]
  dms: DmChannel[]
  unread: Record<string, number>
  totalUnread: number
  activeId: string | null
  setActiveId: (id: string | null) => void
  /** A ChatPage está montada? Controla auto-leitura e supressão de avisos. */
  chatOpen: boolean
  setChatOpen: (open: boolean) => void
  /** Registra um ouvinte de mensagens novas (de outros usuários, fora do canal
   *  que o usuário está vendo). Retorna a função de cancelamento. */
  onIncoming: (cb: (m: ChatMessage) => void) => () => void
  activeChannel: ChatChannel | null
  /** Mensagens de topo do canal ativo (sem as respostas). */
  messages: ChatMessage[]
  messagesLoading: boolean
  reactions: Record<string, ChatReaction[]>
  /** Resumo de respostas por mensagem-pai (count, último, quem respondeu). */
  replyMeta: Record<string, ReplyMeta>
  /** Mensagem cuja thread está aberta (painel lateral) — ou null. */
  threadParent: ChatMessage | null
  /** Respostas da thread aberta (ordenadas). */
  threadMessages: ChatMessage[]
  openThread: (messageId: string) => void
  closeThread: () => void
  sendMessage: (body: string, mentions?: MentionNotify) => Promise<ChatMessage | null>
  sendReply: (parentId: string, body: string, mentions?: MentionNotify) => Promise<ChatMessage | null>
  editMessage: (id: string, body: string) => Promise<void>
  deleteMessage: (id: string) => Promise<void>
  toggleReaction: (messageId: string, emoji: string) => Promise<void>
  createChannel: (name: string, description?: string) => Promise<{ error: string | null; id?: string }>
  /** Exclui o canal e todas as mensagens (RLS: criador ou gestor). */
  deleteChannel: (id: string) => Promise<{ error: string | null }>
  openDm: (otherUserId: string) => Promise<{ error: string | null; id?: string }>
}

const Context = createContext<ChatCtx | null>(null)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { status, user } = useSession()
  const [channels, setChannels] = useState<ChatChannel[]>([])
  const [dms, setDms] = useState<DmChannel[]>([])
  const [unread, setUnread] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [reactions, setReactions] = useState<Record<string, ChatReaction[]>>({})
  const [threadId, setThreadId] = useState<string | null>(null)

  const activeIdRef = useRef<string | null>(null)
  useEffect(() => {
    activeIdRef.current = activeId
  }, [activeId])

  // A ChatPage avisa quando monta/desmonta: só consideramos uma mensagem "vista"
  // (auto-lida, sem aviso) se o chat está aberto E a aba está visível.
  const [chatOpen, setChatOpen] = useState(false)
  const chatOpenRef = useRef(false)
  useEffect(() => {
    chatOpenRef.current = chatOpen
  }, [chatOpen])

  // Ouvintes de mensagens novas (toasts / notificação do navegador).
  const incomingRef = useRef(new Set<(m: ChatMessage) => void>())
  const onIncoming = useCallback((cb: (m: ChatMessage) => void) => {
    incomingRef.current.add(cb)
    return () => {
      incomingRef.current.delete(cb)
    }
  }, [])

  // ---- Carregamentos --------------------------------------------------------
  const fetchChannels = useCallback(async () => {
    const { data, error } = await supabase
      .from('chat_channels')
      .select('*')
      .eq('kind', 'channel')
      .order('created_at', { ascending: true })
    if (!error && data) setChannels((data as ChannelRow[]).map(rowToChannel))
    setLoading(false)
  }, [])

  const fetchDms = useCallback(async () => {
    const { data: rows, error } = await supabase.from('chat_channels').select('*').eq('kind', 'dm')
    if (error || !rows) return
    const list = rows as ChannelRow[]
    const ids = list.map((r) => r.id)
    const membersByChannel: Record<string, string[]> = {}
    if (ids.length) {
      const { data: mem } = await supabase.from('chat_members').select('channel_id, user_id').in('channel_id', ids)
      for (const row of (mem ?? []) as { channel_id: string; user_id: string }[]) {
        ;(membersByChannel[row.channel_id] ??= []).push(row.user_id)
      }
    }
    setDms(
      list.map((r) => ({
        ...rowToChannel(r),
        otherUserId: (membersByChannel[r.id] ?? []).find((u) => u !== user.userId) ?? null,
      })),
    )
  }, [user.userId])

  const fetchUnread = useCallback(async () => {
    const { data, error } = await supabase.rpc('chat_unread_counts')
    if (error || !data) return
    const map: Record<string, number> = {}
    for (const row of data as { channel_id: string; unread: number }[]) {
      map[row.channel_id] = Number(row.unread)
    }
    setUnread(map)
  }, [])

  const ensureMemberships = useCallback(async () => {
    await supabase.rpc('chat_ensure_memberships')
  }, [])

  const markRead = useCallback(async (cid: string) => {
    setUnread((prev) => (prev[cid] ? { ...prev, [cid]: 0 } : prev))
    await supabase.rpc('chat_mark_read', { cid })
  }, [])

  // ---- Inicialização / limpeza ao mudar a sessão ---------------------------
  useEffect(() => {
    if (status === 'authed') {
      setLoading(true)
      ;(async () => {
        await ensureMemberships()
        await Promise.all([fetchChannels(), fetchDms(), fetchUnread()])
      })()
    } else if (status === 'anon') {
      setChannels([])
      setDms([])
      setUnread({})
      setActiveId(null)
      setLoading(false)
    }
  }, [status, ensureMemberships, fetchChannels, fetchDms, fetchUnread])

  useEffect(() => {
    if (!channels.length) return
    setActiveId((cur) => (cur ? cur : channels[0].id))
  }, [channels])

  // ---- Firehose: não-lidas em segundo plano + mudanças de canais -----------
  useEffect(() => {
    if (status !== 'authed') return
    const ch = supabase
      .channel('chat:firehose')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        const m = payload.new as MessageRow
        if (m.author_id === user.userId) return
        // "Vendo" = canal ativo + ChatPage montada + aba visível. Fora disso a
        // mensagem conta como não-lida e dispara os avisos registrados.
        const seeing = m.channel_id === activeIdRef.current && chatOpenRef.current && !document.hidden
        if (seeing) return
        setUnread((prev) => ({ ...prev, [m.channel_id]: (prev[m.channel_id] ?? 0) + 1 }))
        const msg = rowToMessage(m)
        for (const cb of incomingRef.current) cb(msg)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_channels' }, () => {
        fetchChannels()
        fetchDms()
        ensureMemberships()
      })
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [status, user.userId, fetchChannels, fetchDms, ensureMemberships])

  // ---- Mensagens do canal ativo (topo + respostas numa lista só) -----------
  useEffect(() => {
    if (status !== 'authed' || !activeId) {
      setAllMessages([])
      return
    }
    let active = true
    setMessagesLoading(true)
    setThreadId(null) // fecha qualquer thread ao trocar de canal
    supabase
      .from('chat_messages')
      .select('*')
      .eq('channel_id', activeId)
      .order('created_at', { ascending: true })
      .limit(400)
      .then(({ data, error }) => {
        if (!active) return
        if (!error && data) setAllMessages((data as MessageRow[]).map(rowToMessage))
        setMessagesLoading(false)
      })

    const channel = supabase
      .channel(`chat:messages:${activeId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `channel_id=eq.${activeId}` },
        (payload) => {
          const m = rowToMessage(payload.new as MessageRow)
          setAllMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]))
          // Só auto-lê se o usuário está de fato vendo o canal (chat aberto + aba visível).
          if (m.authorId !== user.userId && chatOpenRef.current && !document.hidden) markRead(activeId)
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_messages', filter: `channel_id=eq.${activeId}` },
        (payload) => {
          const m = rowToMessage(payload.new as MessageRow)
          setAllMessages((prev) => prev.map((x) => (x.id === m.id ? m : x)))
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'chat_messages', filter: `channel_id=eq.${activeId}` },
        (payload) => {
          const id = (payload.old as { id: string }).id
          setAllMessages((prev) => prev.filter((x) => x.id !== id))
          setThreadId((cur) => (cur === id ? null : cur))
        },
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [status, activeId, user.userId, markRead])

  // ---- Leitura do canal ativo ----------------------------------------------
  // Marca como lido quando o usuário passa a VER o canal: ao abrir o chat, ao
  // trocar de canal e ao voltar para a aba (antes, o canal ativo era auto-lido
  // até com o usuário em outra página ou com a aba em segundo plano).
  useEffect(() => {
    if (status !== 'authed' || !chatOpen || !activeId) return
    const mark = () => {
      if (!document.hidden) markRead(activeId)
    }
    mark()
    document.addEventListener('visibilitychange', mark)
    window.addEventListener('focus', mark)
    return () => {
      document.removeEventListener('visibilitychange', mark)
      window.removeEventListener('focus', mark)
    }
  }, [status, chatOpen, activeId, markRead])

  // ---- Reações do canal ativo ----------------------------------------------
  useEffect(() => {
    if (status !== 'authed' || !activeId) {
      setReactions({})
      return
    }
    let active = true
    supabase
      .from('chat_reactions')
      .select('message_id, user_id, emoji')
      .eq('channel_id', activeId)
      .then(({ data, error }) => {
        if (!active || error || !data) return
        const map: Record<string, ChatReaction[]> = {}
        for (const r of data as { message_id: string; user_id: string; emoji: string }[]) {
          ;(map[r.message_id] ??= []).push({ messageId: r.message_id, userId: r.user_id, emoji: r.emoji })
        }
        setReactions(map)
      })

    const channel = supabase
      .channel(`chat:reactions:${activeId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_reactions', filter: `channel_id=eq.${activeId}` },
        (payload) => {
          const r = payload.new as { message_id: string; user_id: string; emoji: string }
          setReactions((prev) => {
            const cur = prev[r.message_id] ?? []
            if (cur.some((x) => x.userId === r.user_id && x.emoji === r.emoji)) return prev
            return { ...prev, [r.message_id]: [...cur, { messageId: r.message_id, userId: r.user_id, emoji: r.emoji }] }
          })
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'chat_reactions', filter: `channel_id=eq.${activeId}` },
        (payload) => {
          const r = payload.old as { message_id: string; user_id: string; emoji: string }
          setReactions((prev) => {
            const cur = prev[r.message_id]
            if (!cur) return prev
            return { ...prev, [r.message_id]: cur.filter((x) => !(x.userId === r.user_id && x.emoji === r.emoji)) }
          })
        },
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [status, activeId])

  // ---- Notifica menções (helper compartilhado por sendMessage/sendReply) ----
  const notifyMentions = useCallback(
    async (text: string, mentions: MentionNotify | undefined, cid: string) => {
      const ids = (mentions?.ids ?? []).filter((id) => id !== user.userId)
      if (!ids.length) return
      const rows = ids.map((uid) => ({
        user_id: uid,
        title: 'Você foi mencionado',
        body: `${user.name} mencionou você em ${mentions!.label}: ${text.slice(0, 80)}`,
        chat_channel_id: cid,
      }))
      await supabase.from('notifications').insert(rows)
    },
    [user.userId, user.name],
  )

  const insertMessage = useCallback(
    async (body: string, parentId: string | null, mentions?: MentionNotify) => {
      const text = body.trim()
      if (!activeId) return null
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          channel_id: activeId,
          author_id: user.userId,
          author_name: user.name,
          body: text,
          parent_id: parentId,
        })
        .select('*')
        .single()
      if (error || !data) return null
      const m = rowToMessage(data as MessageRow)
      setAllMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]))
      await notifyMentions(text, mentions, activeId)
      return m
    },
    [activeId, user.userId, user.name, notifyMentions],
  )

  const sendMessage = useCallback(
    (body: string, mentions?: MentionNotify) => insertMessage(body, null, mentions),
    [insertMessage],
  )

  const sendReply = useCallback(
    (parentId: string, body: string, mentions?: MentionNotify) => insertMessage(body, parentId, mentions),
    [insertMessage],
  )

  const editMessage = useCallback(async (id: string, body: string) => {
    const text = body.trim()
    if (!text) return
    const editedAt = new Date().toISOString()
    setAllMessages((prev) => prev.map((x) => (x.id === id ? { ...x, body: text, editedAt } : x)))
    await supabase.from('chat_messages').update({ body: text, edited_at: editedAt }).eq('id', id)
  }, [])

  const deleteMessage = useCallback(async (id: string) => {
    setAllMessages((prev) => prev.filter((x) => x.id !== id))
    setThreadId((cur) => (cur === id ? null : cur))
    setReactions((prev) => {
      if (!prev[id]) return prev
      const rest = { ...prev }
      delete rest[id]
      return rest
    })
    await supabase.from('chat_messages').delete().eq('id', id)
  }, [])

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!activeId) return
      const me = user.userId
      const has = (reactions[messageId] ?? []).some((r) => r.userId === me && r.emoji === emoji)
      setReactions((prev) => {
        const cur = prev[messageId] ?? []
        const next = has
          ? cur.filter((r) => !(r.userId === me && r.emoji === emoji))
          : [...cur, { messageId, userId: me, emoji }]
        return { ...prev, [messageId]: next }
      })
      if (has) {
        await supabase.from('chat_reactions').delete().match({ message_id: messageId, user_id: me, emoji })
      } else {
        await supabase
          .from('chat_reactions')
          .insert({ message_id: messageId, channel_id: activeId, user_id: me, emoji })
      }
    },
    [activeId, user.userId, reactions],
  )

  const createChannel = useCallback(
    async (name: string, description?: string) => {
      const clean = name.trim().replace(/^#+/, '').trim()
      if (!clean) return { error: 'Informe um nome para o canal.' }
      const { data, error } = await supabase
        .from('chat_channels')
        .insert({
          kind: 'channel',
          name: clean,
          description: description?.trim() || null,
          is_private: false,
          created_by: user.userId,
        })
        .select('*')
        .single()
      if (error || !data) return { error: error?.message ?? 'Falha ao criar o canal.' }
      const ch = rowToChannel(data as ChannelRow)
      setChannels((prev) => (prev.some((c) => c.id === ch.id) ? prev : [...prev, ch]))
      setActiveId(ch.id)
      return { error: null, id: ch.id }
    },
    [user.userId],
  )

  const deleteChannel = useCallback(async (id: string) => {
    const { error } = await supabase.from('chat_channels').delete().eq('id', id)
    if (error) return { error: error.message }
    setChannels((prev) => prev.filter((c) => c.id !== id))
    setDms((prev) => prev.filter((c) => c.id !== id))
    setUnread((prev) => {
      if (!(id in prev)) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
    // Sai do canal excluído — o efeito de canais escolhe o primeiro disponível.
    setActiveId((cur) => (cur === id ? null : cur))
    return { error: null }
  }, [])

  const openDm = useCallback(
    async (otherUserId: string) => {
      const { data, error } = await supabase.rpc('get_or_create_dm', { other: otherUserId })
      if (error || !data) return { error: error?.message ?? 'Falha ao abrir a conversa.' }
      const cid = data as string
      await fetchDms()
      setActiveId(cid)
      return { error: null, id: cid }
    },
    [fetchDms],
  )

  const openThread = useCallback((messageId: string) => setThreadId(messageId), [])
  const closeThread = useCallback(() => setThreadId(null), [])

  // ---- Derivados ------------------------------------------------------------
  const messages = useMemo(() => allMessages.filter((m) => !m.parentId), [allMessages])

  const replyMeta = useMemo(() => {
    const map: Record<string, ReplyMeta> = {}
    for (const m of allMessages) {
      if (!m.parentId) continue
      const e = (map[m.parentId] ??= { count: 0, lastAt: m.createdAt, replierIds: [] })
      e.count += 1
      if (m.createdAt > e.lastAt) e.lastAt = m.createdAt
      if (!e.replierIds.includes(m.authorId)) e.replierIds.push(m.authorId)
    }
    return map
  }, [allMessages])

  const threadMessages = useMemo(() => {
    if (!threadId) return []
    return allMessages
      .filter((m) => m.parentId === threadId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }, [allMessages, threadId])

  const threadParent = useMemo(
    () => (threadId ? allMessages.find((m) => m.id === threadId) ?? null : null),
    [allMessages, threadId],
  )

  const activeChannel = useMemo(
    () => channels.find((c) => c.id === activeId) ?? dms.find((c) => c.id === activeId) ?? null,
    [channels, dms, activeId],
  )

  const totalUnread = useMemo(() => Object.values(unread).reduce((a, b) => a + b, 0), [unread])

  const value = useMemo<ChatCtx>(
    () => ({
      loading,
      channels,
      dms,
      unread,
      totalUnread,
      activeId,
      setActiveId,
      chatOpen,
      setChatOpen,
      onIncoming,
      activeChannel,
      messages,
      messagesLoading,
      reactions,
      replyMeta,
      threadParent,
      threadMessages,
      openThread,
      closeThread,
      sendMessage,
      sendReply,
      editMessage,
      deleteMessage,
      toggleReaction,
      createChannel,
      deleteChannel,
      openDm,
    }),
    [
      loading,
      channels,
      dms,
      unread,
      totalUnread,
      activeId,
      chatOpen,
      onIncoming,
      activeChannel,
      messages,
      messagesLoading,
      reactions,
      replyMeta,
      threadParent,
      threadMessages,
      openThread,
      closeThread,
      sendMessage,
      sendReply,
      editMessage,
      deleteMessage,
      toggleReaction,
      createChannel,
      deleteChannel,
      openDm,
    ],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useChat() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useChat deve ser usado dentro de <ChatProvider>')
  return ctx
}
