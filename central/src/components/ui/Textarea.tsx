import { forwardRef, useId, useLayoutEffect, useRef } from 'react'
import { cn } from '@/lib/cn'
import { FieldShell, fieldIds, controlClasses } from './Field'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode
  helperText?: React.ReactNode
  error?: React.ReactNode
  optional?: boolean
  /** Cresce sozinho conforme o texto (até `maxHeight`), sem alça de
      redimensionar manual. Passa a rolar internamente acima do limite. */
  autoGrow?: boolean
  /** Altura máxima (px) quando `autoGrow` está ligado. */
  maxHeight?: number
}

function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (!ref) continue
      if (typeof ref === 'function') ref(node)
      else (ref as React.MutableRefObject<T | null>).current = node
    }
  }
}

/**
 * Textarea — área de texto multilinha com rótulo, ajuda e estado de erro.
 * Com `autoGrow`, a altura acompanha o conteúdo (sem alça manual) até
 * `maxHeight`, e só então vira barra de rolagem interna.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, helperText, error, optional, id, rows = 4, autoGrow = false, maxHeight = 200, value, ...props }, ref) => {
    const reactId = useId()
    const fieldId = id ?? reactId
    const { helperId, errorId } = fieldIds(fieldId)
    const innerRef = useRef<HTMLTextAreaElement>(null)

    useLayoutEffect(() => {
      if (!autoGrow) return
      const el = innerRef.current
      if (!el) return
      el.style.height = 'auto'
      el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`
    }, [autoGrow, maxHeight, value])

    return (
      <FieldShell
        id={fieldId}
        label={label}
        helperText={helperText}
        error={error}
        optional={optional}
        className={className}
      >
        <textarea
          ref={mergeRefs(ref, innerRef)}
          id={fieldId}
          rows={rows}
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={cn(
            controlClasses(!!error, 'px-3 py-2.5 leading-relaxed'),
            autoGrow ? 'resize-none overflow-y-auto' : 'resize-y',
          )}
          style={autoGrow ? { maxHeight } : undefined}
          {...props}
        />
      </FieldShell>
    )
  },
)
Textarea.displayName = 'Textarea'
