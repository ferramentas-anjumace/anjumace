import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/lib/session'
import { Badge } from '@/components/ui'
import { cn } from '@/lib/cn'

/* ----------------------------------------------------------------------------
   Catálogos editáveis (tabela public.catalog_items)
   ----------------------------------------------------------------------------
   Listas antes "chumbadas" no código (categorias de tarefa, tipos do editorial,
   tipos de mídia...) agora vivem no banco e são geridas pela UI por quem tem
   `manage_resources`. A UI lê rótulos/cores daqui; o gestor adiciona/edita/
   remove sem precisar de código. Mesmo padrão da matriz de permissões.
---------------------------------------------------------------------------- */

/** Tons nativos do design system (renderizados pelo <Badge>). */
const DS_TONES = ['steel', 'sand', 'success', 'warning', 'danger', 'neutral'] as const
type DsTone = (typeof DS_TONES)[number]

/** Cores EXTRAS (fora do design system) — cor explícita, renderizadas inline. */
export const EXTRA_TONE_HEX: Record<string, { bg: string; fg: string }> = {
  blue: { bg: '#3f6fa6', fg: '#ffffff' },
  teal: { bg: '#2f9c9c', fg: '#ffffff' },
  purple: { bg: '#7a5bb0', fg: '#ffffff' },
  pink: { bg: '#c45c93', fg: '#ffffff' },
  orange: { bg: '#cc7836', fg: '#ffffff' },
  graphite: { bg: '#5b6470', fg: '#ffffff' },
}

export type CatalogTone = DsTone | keyof typeof EXTRA_TONE_HEX

export const CATALOG_TONES: CatalogTone[] = [
  ...DS_TONES,
  ...(Object.keys(EXTRA_TONE_HEX) as (keyof typeof EXTRA_TONE_HEX)[]),
]

// Nomes pelas cores reais do tema Anju (não pelo nome técnico do token).
export const TONE_LABEL: Record<CatalogTone, string> = {
  steel: 'Sálvia',
  sand: 'Areia',
  success: 'Verde',
  warning: 'Mostarda',
  danger: 'Vermelho',
  neutral: 'Neutro',
  blue: 'Azul',
  teal: 'Turquesa',
  purple: 'Roxo',
  pink: 'Rosa',
  orange: 'Laranja',
  graphite: 'Grafite',
}

export function isExtraTone(tone: CatalogTone): boolean {
  return tone in EXTRA_TONE_HEX
}

const TONE_SIZE_CLS = {
  sm: 'h-5 gap-1 px-1.5 text-[10px] tracking-[0.08em]',
  md: 'h-6 gap-1.5 px-2 text-mono-label',
}

/** Badge que entende tanto tons do DS quanto as cores extras (cor explícita). */
export function CatalogBadge({
  tone,
  children,
  size = 'sm',
  className,
}: {
  tone: CatalogTone
  children: React.ReactNode
  size?: 'sm' | 'md'
  className?: string
}) {
  const extra = EXTRA_TONE_HEX[tone]
  if (!extra) {
    return (
      <Badge tone={tone as React.ComponentProps<typeof Badge>['tone']} size={size} className={className}>
        {children}
      </Badge>
    )
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border border-transparent font-mono uppercase leading-none',
        TONE_SIZE_CLS[size],
        className,
      )}
      style={{ backgroundColor: extra.bg, color: extra.fg }}
    >
      {children}
    </span>
  )
}

/**
 * Catálogos registrados. `usage` (opcional) indica onde o `value` é gravado, para
 * propagar renomeações aos registros existentes (ex.: renomear uma categoria
 * atualiza tasks.tag). Para adicionar um novo catálogo: registre aqui + crie o
 * provider/consumidores correspondentes.
 */
export const CATALOGS = {
  task_category: {
    label: 'Categorias de tarefa',
    singular: 'categoria',
    help: 'Classificam as tarefas no quadro (campo Categoria).',
    usage: { table: 'tasks', column: 'tag' },
  },
} as const

export type CatalogKey = keyof typeof CATALOGS
export const CATALOG_KEYS = Object.keys(CATALOGS) as CatalogKey[]

export interface CatalogItem {
  id: string
  catalog: string
  value: string
  label: string
  tone: CatalogTone
  sort: number
  active: boolean
}

function usageOf(catalog: CatalogKey): { table: string; column: string } | null {
  const def = CATALOGS[catalog] as { usage?: { table: string; column: string } }
  return def.usage ?? null
}

interface CatalogsCtx {
  loading: boolean
  /** Itens ATIVOS de um catálogo, ordenados (para selects/chips). */
  items: (catalog: CatalogKey) => CatalogItem[]
  /** Todos os itens, inclusive inativos (para a tela de gestão). */
  allItems: (catalog: CatalogKey) => CatalogItem[]
  /** Rótulo de um valor (fallback: o próprio valor). */
  label: (catalog: CatalogKey, value?: string | null) => string
  /** Cor (tone) de um valor (fallback: 'neutral'). */
  tone: (catalog: CatalogKey, value?: string | null) => CatalogTone
  addItem: (catalog: CatalogKey, label: string, tone: CatalogTone) => Promise<{ error: string | null }>
  updateItem: (
    item: CatalogItem,
    patch: { label?: string; tone?: CatalogTone; active?: boolean },
  ) => Promise<{ error: string | null }>
  removeItem: (item: CatalogItem) => Promise<{ error: string | null }>
  /** Move um item uma posição para cima (-1) ou para baixo (+1). */
  move: (catalog: CatalogKey, id: string, dir: -1 | 1) => Promise<void>
}

const Context = createContext<CatalogsCtx | null>(null)

export function CatalogsProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const [rows, setRows] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    const { data, error } = await supabase
      .from('catalog_items')
      .select('*')
      .order('catalog', { ascending: true })
      .order('sort', { ascending: true })
    if (!error && data) setRows(data as CatalogItem[])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (status === 'authed') {
      setLoading(true)
      fetchAll()
      const channel = supabase
        .channel('catalog_items:sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'catalog_items' }, () => fetchAll())
        .subscribe()
      return () => {
        supabase.removeChannel(channel)
      }
    } else if (status === 'anon') {
      setRows([])
      setLoading(false)
    }
  }, [status, fetchAll])

  const byCatalog = useMemo(() => {
    const map: Record<string, CatalogItem[]> = {}
    for (const r of rows) (map[r.catalog] ??= []).push(r)
    for (const k of Object.keys(map)) map[k].sort((a, b) => a.sort - b.sort)
    return map
  }, [rows])

  const allItems = useCallback((catalog: CatalogKey) => byCatalog[catalog] ?? [], [byCatalog])
  const items = useCallback(
    (catalog: CatalogKey) => (byCatalog[catalog] ?? []).filter((i) => i.active),
    [byCatalog],
  )

  const find = useCallback(
    (catalog: CatalogKey, value?: string | null) =>
      value ? (byCatalog[catalog] ?? []).find((i) => i.value === value) : undefined,
    [byCatalog],
  )

  const label = useCallback(
    (catalog: CatalogKey, value?: string | null) => find(catalog, value)?.label ?? value ?? '',
    [find],
  )
  const tone = useCallback(
    (catalog: CatalogKey, value?: string | null): CatalogTone => find(catalog, value)?.tone ?? 'neutral',
    [find],
  )

  const addItem = useCallback(
    async (catalog: CatalogKey, rawLabel: string, tone: CatalogTone) => {
      const value = rawLabel.trim()
      if (!value) return { error: 'Informe um nome.' }
      const existing = byCatalog[catalog] ?? []
      if (existing.some((i) => i.value.toLowerCase() === value.toLowerCase())) {
        return { error: 'Já existe um item com esse nome.' }
      }
      const sort = existing.reduce((max, i) => Math.max(max, i.sort), -1) + 1
      const { error } = await supabase
        .from('catalog_items')
        .insert({ catalog, value, label: value, tone, sort })
      if (error) return { error: error.message }
      await fetchAll()
      return { error: null }
    },
    [byCatalog, fetchAll],
  )

  const updateItem = useCallback(
    async (item: CatalogItem, patch: { label?: string; tone?: CatalogTone; active?: boolean }) => {
      const next: Record<string, unknown> = {}
      let renamed: string | null = null
      if (patch.label !== undefined) {
        const newLabel = patch.label.trim()
        if (!newLabel) return { error: 'Informe um nome.' }
        if (newLabel !== item.value) {
          const siblings = (byCatalog[item.catalog] ?? []).filter((i) => i.id !== item.id)
          if (siblings.some((i) => i.value.toLowerCase() === newLabel.toLowerCase())) {
            return { error: 'Já existe um item com esse nome.' }
          }
          // value acompanha o label (é o token gravado nos registros).
          next.value = newLabel
          next.label = newLabel
          renamed = newLabel
        } else {
          next.label = newLabel
        }
      }
      if (patch.tone !== undefined) next.tone = patch.tone
      if (patch.active !== undefined) next.active = patch.active

      // Propaga a renomeação aos registros que usam o value (ex.: tasks.tag).
      const usage = usageOf(item.catalog as CatalogKey)
      if (renamed && usage) {
        const { error: cascadeErr } = await supabase
          .from(usage.table)
          .update({ [usage.column]: renamed })
          .eq(usage.column, item.value)
        if (cascadeErr) return { error: cascadeErr.message }
      }

      const { error } = await supabase.from('catalog_items').update(next).eq('id', item.id)
      if (error) return { error: error.message }
      await fetchAll()
      return { error: null }
    },
    [byCatalog, fetchAll],
  )

  const removeItem = useCallback(
    async (item: CatalogItem) => {
      const { error } = await supabase.from('catalog_items').delete().eq('id', item.id)
      if (error) return { error: error.message }
      await fetchAll()
      return { error: null }
    },
    [fetchAll],
  )

  const move = useCallback(
    async (catalog: CatalogKey, id: string, dir: -1 | 1) => {
      const list = byCatalog[catalog] ?? []
      const idx = list.findIndex((i) => i.id === id)
      const swapWith = idx + dir
      if (idx < 0 || swapWith < 0 || swapWith >= list.length) return
      const a = list[idx]
      const b = list[swapWith]
      // Troca os sorts dos dois.
      await supabase.from('catalog_items').update({ sort: b.sort }).eq('id', a.id)
      await supabase.from('catalog_items').update({ sort: a.sort }).eq('id', b.id)
      await fetchAll()
    },
    [byCatalog, fetchAll],
  )

  const value = useMemo<CatalogsCtx>(
    () => ({ loading, items, allItems, label, tone, addItem, updateItem, removeItem, move }),
    [loading, items, allItems, label, tone, addItem, updateItem, removeItem, move],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useCatalogs() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useCatalogs deve ser usado dentro de <CatalogsProvider>')
  return ctx
}
