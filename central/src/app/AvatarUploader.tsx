import { useRef, useState } from 'react'
import { Camera, Trash2, Loader2 } from 'lucide-react'
import { Avatar } from '@/components/ui'
import { cn } from '@/lib/cn'

/* ----------------------------------------------------------------------------
   AvatarUploader — escolhe/troca/remove a foto de um usuário.
   ----------------------------------------------------------------------------
   A imagem é redimensionada no navegador (quadrada, corte central, ~256px) e
   devolvida como data URL — leve o bastante para guardar na coluna text
   `profiles.avatar`, no mesmo padrão usado para a foto dos clientes.
---------------------------------------------------------------------------- */

const MAX_SIZE = 256 // px do lado do quadrado final
const MAX_INPUT_BYTES = 8 * 1024 * 1024 // 8 MB de arquivo original

/** Lê um File de imagem e devolve um data URL quadrado, redimensionado. */
function fileToAvatarDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Escolha um arquivo de imagem (JPG, PNG ou WebP).'))
      return
    }
    if (file.size > MAX_INPUT_BYTES) {
      reject(new Error('Imagem muito grande (máx. 8 MB).'))
      return
    }
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const side = Math.min(img.width, img.height)
      const sx = (img.width - side) / 2
      const sy = (img.height - side) / 2
      const canvas = document.createElement('canvas')
      canvas.width = MAX_SIZE
      canvas.height = MAX_SIZE
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Não foi possível processar a imagem.'))
        return
      }
      ctx.drawImage(img, sx, sy, side, side, 0, 0, MAX_SIZE, MAX_SIZE)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Não foi possível ler a imagem.'))
    }
    img.src = url
  })
}

export function AvatarUploader({
  name,
  src,
  onChange,
  onError,
  size = 'xl',
  disabled,
  className,
}: {
  /** Nome para iniciais e alt. */
  name: string
  /** Foto atual (data URL) ou null. */
  src: string | null
  /** Recebe o novo data URL, ou null quando o usuário remove a foto. */
  onChange: (dataUrl: string | null) => void | Promise<void>
  /** Reporta erros de leitura/validação da imagem. */
  onError?: (message: string) => void
  size?: 'lg' | 'xl'
  disabled?: boolean
  className?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const pick = () => inputRef.current?.click()

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // permite reescolher o mesmo arquivo
    if (!file) return
    setBusy(true)
    try {
      const dataUrl = await fileToAvatarDataUrl(file)
      await onChange(dataUrl)
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Falha ao processar a imagem.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await onChange(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <button
        type="button"
        onClick={pick}
        disabled={disabled || busy}
        className="group relative rounded-full focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed"
        aria-label={src ? 'Trocar foto' : 'Adicionar foto'}
      >
        <Avatar size={size} name={name} src={src ?? undefined} />
        <span className="absolute inset-0 grid place-items-center rounded-full bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100">
          {busy ? (
            <Loader2 size={18} strokeWidth={1.5} className="animate-spin" />
          ) : (
            <Camera size={18} strokeWidth={1.5} />
          )}
        </span>
      </button>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={pick}
            disabled={disabled || busy}
            className="rounded-md border border-line px-3 py-1.5 text-body-s text-strong transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-50"
          >
            {src ? 'Trocar foto' : 'Enviar foto'}
          </button>
          {src && (
            <button
              type="button"
              onClick={remove}
              disabled={disabled || busy}
              className="grid size-8 place-items-center rounded-md text-muted transition-colors hover:bg-slate-800 hover:text-err focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-50"
              aria-label="Remover foto"
              title="Remover foto"
            >
              <Trash2 size={16} strokeWidth={1.5} />
            </button>
          )}
        </div>
        <p className="text-[11px] text-faint">JPG, PNG ou WebP · recorte quadrado automático.</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}
