import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/lib/session'

/* ----------------------------------------------------------------------------
   Store de anexos — Supabase Storage (bucket "attachments") + metadados
   ----------------------------------------------------------------------------
   Polimórfico: cada anexo aponta para uma entidade via (entityType, entityId).
   O arquivo vive no Storage (bucket privado); a tabela public.attachments
   guarda nome/tipo/tamanho/autor. Download é por signed URL temporária.
---------------------------------------------------------------------------- */

export type AttachmentEntity = 'task' | 'editorial' | 'chat_message'

const BUCKET = 'attachments'
export const MAX_BYTES = 25 * 1024 * 1024 // 25 MB (igual ao limite do bucket)

export interface Attachment {
  id: string
  entityType: AttachmentEntity
  entityId: string
  bucket: string
  path: string
  name: string
  mime: string | null
  size: number | null
  uploadedBy: string | null
  uploadedByName: string
  createdAt: string
}

interface AttachmentRow {
  id: string
  entity_type: AttachmentEntity
  entity_id: string
  bucket: string
  path: string
  name: string
  mime: string | null
  size: number | null
  uploaded_by: string | null
  uploaded_by_name: string
  created_at: string
}

function rowToAttachment(r: AttachmentRow): Attachment {
  return {
    id: r.id,
    entityType: r.entity_type,
    entityId: r.entity_id,
    bucket: r.bucket,
    path: r.path,
    name: r.name,
    mime: r.mime,
    size: r.size,
    uploadedBy: r.uploaded_by,
    uploadedByName: r.uploaded_by_name,
    createdAt: r.created_at,
  }
}

const key = (type: AttachmentEntity, id: string) => `${type}:${id}`

/** Caminhos dos arquivos de uma entidade (bucket + path), para limpeza. */
export async function listEntityFiles(entityType: AttachmentEntity, entityId: string) {
  const { data } = await supabase
    .from('attachments')
    .select('bucket, path')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
  return (data ?? []) as { bucket: string; path: string }[]
}

/** Remove objetos do Storage via Storage API (DELETE direto em storage.objects
 *  é bloqueado pelo Supabase). Agrupa por bucket. Tolerante a falhas. */
export async function removeStorageFiles(files: { bucket: string; path: string }[]) {
  if (!files.length) return
  const byBucket: Record<string, string[]> = {}
  for (const f of files) (byBucket[f.bucket] ??= []).push(f.path)
  for (const [bucket, paths] of Object.entries(byBucket)) {
    await supabase.storage.from(bucket).remove(paths)
  }
}

/** Sanitiza o nome para compor um caminho de objeto seguro. */
function safeName(name: string) {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'arquivo'
}

interface AttachmentsCtx {
  loading: boolean
  getAttachments: (entityType: AttachmentEntity, entityId: string) => Attachment[]
  count: (entityType: AttachmentEntity, entityId: string) => number
  /** Faz upload e registra o anexo. Devolve erro (string) ou null em sucesso. */
  addAttachment: (entityType: AttachmentEntity, entityId: string, file: File) => Promise<string | null>
  removeAttachment: (att: Attachment) => Promise<void>
  /** Gera uma URL temporária para baixar o arquivo (force download). */
  getDownloadUrl: (att: Attachment) => Promise<string | null>
  /** Gera uma URL temporária para exibir o arquivo (ex.: <img> inline). */
  getViewUrl: (att: Attachment) => Promise<string | null>
}

const Context = createContext<AttachmentsCtx | null>(null)

export function AttachmentsProvider({ children }: { children: React.ReactNode }) {
  const { status, user } = useSession()
  const [items, setItems] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAttachments = useCallback(async () => {
    const { data, error } = await supabase
      .from('attachments')
      .select('*')
      .order('created_at', { ascending: true })
    if (!error && data) setItems((data as AttachmentRow[]).map(rowToAttachment))
    setLoading(false)
  }, [])

  useEffect(() => {
    if (status === 'authed') {
      setLoading(true)
      fetchAttachments()
      const channel = supabase
        .channel('attachments:sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'attachments' }, () => fetchAttachments())
        .subscribe()
      return () => {
        supabase.removeChannel(channel)
      }
    } else if (status === 'anon') {
      setItems([])
      setLoading(false)
    }
  }, [status, fetchAttachments])

  const byEntity = useMemo(() => {
    const map: Record<string, Attachment[]> = {}
    for (const a of items) (map[key(a.entityType, a.entityId)] ??= []).push(a)
    return map
  }, [items])

  const getAttachments = useCallback(
    (entityType: AttachmentEntity, entityId: string) => byEntity[key(entityType, entityId)] ?? [],
    [byEntity],
  )

  const count = useCallback(
    (entityType: AttachmentEntity, entityId: string) => getAttachments(entityType, entityId).length,
    [getAttachments],
  )

  const addAttachment = useCallback(
    async (entityType: AttachmentEntity, entityId: string, file: File) => {
      if (file.size > MAX_BYTES) return 'Arquivo muito grande (máx. 25 MB).'
      const path = `${entityType}/${entityId}/${crypto.randomUUID()}-${safeName(file.name)}`

      const up = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type || undefined,
        upsert: false,
      })
      if (up.error) return up.error.message

      const { data, error } = await supabase
        .from('attachments')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          bucket: BUCKET,
          path,
          name: file.name,
          mime: file.type || null,
          size: file.size,
          uploaded_by: user.userId,
          uploaded_by_name: user.name,
        })
        .select('*')
        .single()
      if (error || !data) {
        // Reverte o objeto órfão se o registro falhar.
        await supabase.storage.from(BUCKET).remove([path])
        return error?.message ?? 'Falha ao registrar o anexo.'
      }

      setItems((prev) =>
        prev.some((a) => a.id === (data as AttachmentRow).id)
          ? prev
          : [...prev, rowToAttachment(data as AttachmentRow)],
      )
      return null
    },
    [user.userId, user.name],
  )

  const removeAttachment = useCallback(async (att: Attachment) => {
    setItems((prev) => prev.filter((a) => a.id !== att.id))
    await supabase.storage.from(att.bucket).remove([att.path])
    await supabase.from('attachments').delete().eq('id', att.id)
  }, [])

  const getDownloadUrl = useCallback(async (att: Attachment) => {
    const { data, error } = await supabase.storage
      .from(att.bucket)
      .createSignedUrl(att.path, 60, { download: att.name })
    if (error || !data) return null
    return data.signedUrl
  }, [])

  const getViewUrl = useCallback(async (att: Attachment) => {
    // URL para exibição inline (sem forçar download) — vida útil maior, pois
    // miniaturas podem permanecer na tela por mais tempo.
    const { data, error } = await supabase.storage.from(att.bucket).createSignedUrl(att.path, 3600)
    if (error || !data) return null
    return data.signedUrl
  }, [])

  const value = useMemo<AttachmentsCtx>(
    () => ({ loading, getAttachments, count, addAttachment, removeAttachment, getDownloadUrl, getViewUrl }),
    [loading, getAttachments, count, addAttachment, removeAttachment, getDownloadUrl, getViewUrl],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useAttachments() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useAttachments deve ser usado dentro de <AttachmentsProvider>')
  return ctx
}
