import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LogIn, Eye, EyeOff, ShieldAlert } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { useSession } from '@/lib/session'
import { isSupabaseConfigured } from '@/lib/supabase'

/** Tela de login — e-mail + senha (Supabase Auth). Sem cadastro aberto. */
export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Para onde voltar após logar (se veio de uma rota protegida).
  const from = (location.state as { from?: string } | null)?.from ?? '/app'

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('Informe e-mail e senha.')
      return
    }
    setLoading(true)
    setError(null)
    const { error } = await signIn(email.trim(), password)
    setLoading(false)
    if (error) {
      setError(error === 'Invalid login credentials' ? 'E-mail ou senha inválidos.' : error)
      return
    }
    navigate(from, { replace: true })
  }

  return (
    <div className="grid min-h-screen place-items-center bg-ink px-4 text-fg">
      <div className="w-full max-w-sm">
        {/* Marca */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="grid size-11 place-items-center rounded-xl bg-steel-500 font-display text-h3 font-bold text-accent-fg">
            A
          </span>
          <div>
            <h1 className="font-display text-h1 font-semibold text-strong">Central Anju Mace</h1>
            <p className="mt-1 text-body-s text-muted">Entre para acessar o console.</p>
          </div>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-warn/40 bg-warn-tint p-3 text-body-s">
            <ShieldAlert size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-warn" aria-hidden />
            <span className="text-fg">
              Login indisponível — configure <code className="font-mono text-[12px]">VITE_SUPABASE_URL</code> e{' '}
              <code className="font-mono text-[12px]">VITE_SUPABASE_ANON_KEY</code>.
            </span>
          </div>
        )}

        <form onSubmit={submit} className="flex flex-col gap-4 rounded-2xl border border-line bg-slate-900 p-6">
          <Input
            label="E-mail"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@empresa.com"
            autoFocus
          />
          <Input
            label="Senha"
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            trailing={
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
                className="text-muted transition-colors hover:text-strong focus-visible:outline-none"
              >
                {show ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
              </button>
            }
          />

          {error && <p className="text-body-s text-err">{error}</p>}

          <Button
            type="submit"
            className="w-full"
            leftIcon={<LogIn size={18} strokeWidth={1.5} />}
            loading={loading}
            disabled={!isSupabaseConfigured}
          >
            Entrar
          </Button>

          <p className="text-center text-body-s text-faint">
            Acesso restrito ao time. Contas são criadas pelo administrador.
          </p>
        </form>
      </div>
    </div>
  )
}
