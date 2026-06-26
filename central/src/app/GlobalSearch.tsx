import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutGrid,
  CalendarRange,
  ListChecks,
  CalendarDays,
  FolderOpen,
  KeyRound,
  Users,
  Settings2,
  User,
  Search,
} from 'lucide-react'
import { SearchField } from '@/components/ui'
import { useProfiles } from './profiles'
import { useTasks } from './tasks'
import { useAgenda } from './agenda'

/* ----------------------------------------------------------------------------
   GlobalSearch — busca do topo. Procura em páginas, usuários, tarefas e agenda
   sobre os dados já carregados; clicar leva à seção correspondente.
---------------------------------------------------------------------------- */

interface Result {
  key: string
  group: string
  label: string
  sub?: string
  to: string
  icon: React.ReactNode
}

const ICON = { size: 16, strokeWidth: 1.5 } as const

const PAGES: { label: string; to: string; icon: React.ReactNode; keywords: string[] }[] = [
  { label: 'Visão geral', to: '/app', icon: <LayoutGrid {...ICON} />, keywords: ['dashboard', 'inicio', 'home'] },
  { label: 'Editorial', to: '/app/editorial', icon: <CalendarRange {...ICON} />, keywords: ['calendario', 'criativos', 'posts'] },
  { label: 'Tarefas', to: '/app/tarefas', icon: <ListChecks {...ICON} />, keywords: ['quadro', 'kanban', 'demandas'] },
  { label: 'Agenda', to: '/app/agenda', icon: <CalendarDays {...ICON} />, keywords: ['eventos', 'compromissos', 'reuniao'] },
  { label: 'Conteúdo', to: '/app/conteudo', icon: <FolderOpen {...ICON} />, keywords: ['biblioteca', 'midia', 'materiais'] },
  { label: 'Acessos', to: '/app/acessos', icon: <KeyRound {...ICON} />, keywords: ['credenciais', 'senhas', 'logins'] },
  { label: 'Equipe', to: '/app/usuarios', icon: <Users {...ICON} />, keywords: ['usuarios', 'pessoas', 'time'] },
  { label: 'Permissões', to: '/app/config', icon: <Settings2 {...ICON} />, keywords: ['funcoes', 'papeis', 'configuracoes'] },
]

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export function GlobalSearch() {
  const navigate = useNavigate()
  const { members } = useProfiles()
  const { tasks } = useTasks()
  const { events } = useAgenda()

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const results = useMemo<Result[]>(() => {
    const q = norm(query.trim())
    if (!q) return []
    const out: Result[] = []

    for (const p of PAGES) {
      if (norm(p.label).includes(q) || p.keywords.some((k) => norm(k).includes(q))) {
        out.push({ key: `page:${p.to}`, group: 'Páginas', label: p.label, to: p.to, icon: p.icon })
      }
    }
    for (const m of members) {
      if (norm(m.name).includes(q) || norm(m.email ?? '').includes(q)) {
        out.push({
          key: `user:${m.id}`,
          group: 'Usuários',
          label: m.name || m.email || '—',
          sub: m.email ?? undefined,
          to: '/app/usuarios',
          icon: <User {...ICON} />,
        })
      }
    }
    for (const t of tasks) {
      if (norm(t.title).includes(q)) {
        out.push({
          key: `task:${t.id}`,
          group: 'Tarefas',
          label: t.title,
          to: '/app/tarefas',
          icon: <ListChecks {...ICON} />,
        })
      }
    }
    for (const e of events) {
      if (norm(e.title).includes(q)) {
        out.push({
          key: `event:${e.id}`,
          group: 'Agenda',
          label: e.title,
          sub: e.date ?? undefined,
          to: '/app/agenda',
          icon: <CalendarDays {...ICON} />,
        })
      }
    }

    // Limita por grupo para não estourar a lista.
    const cap: Record<string, number> = {}
    return out.filter((r) => {
      cap[r.group] = (cap[r.group] ?? 0) + 1
      return cap[r.group] <= 6
    })
  }, [query, members, tasks, events])

  const grouped = useMemo(() => {
    const map = new Map<string, Result[]>()
    for (const r of results) {
      const arr = map.get(r.group) ?? []
      arr.push(r)
      map.set(r.group, arr)
    }
    return Array.from(map.entries())
  }, [results])

  const go = (to: string) => {
    navigate(to)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={rootRef} className="relative mx-auto w-full max-w-md">
      <SearchField
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onClear={() => {
          setQuery('')
          setOpen(false)
        }}
        onFocus={() => setOpen(true)}
        placeholder="Buscar usuários, registros, ações…"
        aria-label="Buscar"
      />

      {open && query.trim() && (
        <div className="absolute left-0 right-0 top-full z-dropdown mt-1.5 max-h-[70vh] overflow-y-auto rounded-md border border-strong bg-slate-700 p-1 shadow-e2 animate-slide-up">
          {results.length === 0 ? (
            <p className="flex items-center justify-center gap-2 px-3 py-6 text-body-s text-faint">
              <Search size={15} strokeWidth={1.5} /> Nada encontrado para “{query.trim()}”.
            </p>
          ) : (
            grouped.map(([group, rows]) => (
              <div key={group} className="py-1">
                <div className="px-2.5 pb-1 font-mono text-mono-label uppercase text-faint">{group}</div>
                {rows.map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => go(r.to)}
                    className="flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-left text-body-s text-fg transition-colors hover:bg-slate-600 hover:text-strong focus-visible:bg-slate-600 focus-visible:text-strong focus-visible:outline-none"
                  >
                    <span className="shrink-0 text-faint">{r.icon}</span>
                    <span className="min-w-0 flex-1 truncate">{r.label}</span>
                    {r.sub && <span className="shrink-0 truncate font-mono text-[11px] text-faint">{r.sub}</span>}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
