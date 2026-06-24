import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useSession } from './session'

/** Guarda de rota — exige sessão autenticada; senão manda para /login. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div className="grid min-h-screen place-items-center bg-ink text-muted">
        <Loader2 size={28} strokeWidth={1.5} className="animate-spin text-steel-300" aria-label="Carregando" />
      </div>
    )
  }

  if (status === 'anon') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
