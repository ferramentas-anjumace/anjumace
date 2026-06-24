import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { FieldShell, fieldIds, controlClasses } from './Field'

export interface ComboboxOption {
  value: string
  label: string
  disabled?: boolean
}

export interface ComboboxProps {
  options: ComboboxOption[]
  value: string | null
  onChange: (value: string | null) => void
  label?: React.ReactNode
  helperText?: React.ReactNode
  error?: React.ReactNode
  optional?: boolean
  placeholder?: string
  /** Texto quando o filtro não encontra nada. */
  emptyText?: string
  /** Permite limpar a seleção pelo botão ✕. */
  clearable?: boolean
  disabled?: boolean
  id?: string
  className?: string
}

/**
 * Combobox / Autocomplete — campo de busca com lista filtrável e seleção única.
 * Teclado: setas navegam, Enter seleciona, Escape fecha. role=combobox/listbox
 * com aria-activedescendant. Fecha ao clicar fora.
 */
export function Combobox({
  options,
  value,
  onChange,
  label,
  helperText,
  error,
  optional,
  placeholder = 'Selecione…',
  emptyText = 'Nenhum resultado',
  clearable = true,
  disabled,
  id,
  className,
}: ComboboxProps) {
  const reactId = useId()
  const fieldId = id ?? reactId
  const listId = `${fieldId}-list`
  const { helperId, errorId } = fieldIds(fieldId)

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const selected = useMemo(() => options.find((o) => o.value === value) ?? null, [options, value])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, query])

  // Fecha ao clicar fora.
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  // Mantém a opção ativa visível.
  useEffect(() => {
    if (!open) return
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  function openList() {
    if (disabled) return
    setOpen(true)
    const idx = Math.max(0, filtered.findIndex((o) => o.value === value))
    setActive(idx === -1 ? 0 : idx)
  }

  function close() {
    setOpen(false)
    setQuery('')
  }

  function select(opt: ComboboxOption) {
    if (opt.disabled) return
    onChange(opt.value)
    close()
    inputRef.current?.focus()
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      e.preventDefault()
      openList()
      return
    }
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const opt = filtered[active]
      if (opt) select(opt)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
    } else if (e.key === 'Home') {
      setActive(0)
    } else if (e.key === 'End') {
      setActive(filtered.length - 1)
    }
  }

  const showClear = clearable && !!selected && !disabled

  return (
    <FieldShell
      id={fieldId}
      label={label}
      helperText={helperText}
      error={error}
      optional={optional}
      className={className}
    >
      <div ref={rootRef} className="relative">
        <input
          ref={inputRef}
          id={fieldId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && filtered[active] ? `${fieldId}-opt-${active}` : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          autoComplete="off"
          disabled={disabled}
          placeholder={placeholder}
          value={open ? query : (selected?.label ?? '')}
          onChange={(e) => {
            setQuery(e.target.value)
            if (!open) setOpen(true)
            setActive(0)
          }}
          onFocus={openList}
          onClick={openList}
          onKeyDown={onKeyDown}
          className={cn(controlClasses(!!error, 'h-10 pl-3 pr-16'))}
        />

        {/* Ações à direita: limpar + chevron */}
        <div className="absolute inset-y-0 right-2 flex items-center gap-0.5">
          {showClear && (
            <button
              type="button"
              tabIndex={-1}
              aria-label="Limpar seleção"
              onClick={() => {
                onChange(null)
                setQuery('')
                inputRef.current?.focus()
              }}
              className="grid size-6 place-items-center rounded-xs text-faint transition-colors hover:bg-slate-700 hover:text-strong"
            >
              <X size={15} strokeWidth={1.5} aria-hidden />
            </button>
          )}
          <ChevronsUpDown
            size={16}
            strokeWidth={1.5}
            aria-hidden
            className="pointer-events-none text-muted"
          />
        </div>

        {open && (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            className="absolute z-dropdown mt-1.5 max-h-60 w-full overflow-auto rounded-md border border-strong bg-slate-700 p-1 shadow-e2 animate-slide-up"
          >
            {filtered.length === 0 ? (
              <li className="px-2.5 py-3 text-center text-body-s text-faint">{emptyText}</li>
            ) : (
              filtered.map((opt, i) => {
                const isSelected = opt.value === value
                const isActive = i === active
                return (
                  <li
                    key={opt.value}
                    id={`${fieldId}-opt-${i}`}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={opt.disabled || undefined}
                    data-index={i}
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => select(opt)}
                    className={cn(
                      'flex cursor-pointer items-center justify-between gap-2 rounded-sm px-2.5 py-2 text-body-s',
                      opt.disabled
                        ? 'cursor-not-allowed text-faint'
                        : isActive
                          ? 'bg-slate-600 text-strong'
                          : 'text-fg',
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && (
                      <Check size={15} strokeWidth={2} className="shrink-0 text-steel-300" aria-hidden />
                    )}
                  </li>
                )
              })
            )}
          </ul>
        )}
      </div>
    </FieldShell>
  )
}
