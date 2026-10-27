import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../context/auth'
import { fetchEpsEntities, fetchPersonalInfo, type EpsEntity, type PersonalInfo } from './personalApi'

// Información personal del usuario en sesión y lista de EPS, solo para Mi perfil (por eso no va en
// ProfileProvider). `info` null = todavía no ha guardado nada.
export function usePersonalInfo() {
  const { session } = useAuth()
  const userId = session?.user.id ?? null
  const [info, setInfo] = useState<PersonalInfo | null>(null)
  const [eps, setEps] = useState<EpsEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!userId) return
    let active = true
    Promise.all([fetchPersonalInfo(userId), fetchEpsEntities()])
      .then(([row, list]) => {
        if (!active) return
        setInfo(row)
        setEps(list)
        setError(null)
      })
      .catch((err: Error) => {
        if (active) setError(err.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [userId, attempt])

  const reload = useCallback(() => {
    setLoading(true)
    setAttempt((value) => value + 1)
  }, [])

  return { userId, info, setInfo, eps, loading, error, reload }
}
