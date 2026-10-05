import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/auth'
import { PageLoader } from '../../components/ui'

// Sin sesión, redirige a /login guardando la ruta pedida (state.from) para volver a ella.
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) return <PageLoader />
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />
  return <>{children}</>
}
