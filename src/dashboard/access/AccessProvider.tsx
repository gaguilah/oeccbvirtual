import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '../../context/auth'
import type { CourtNumber } from '../../lib/courts'
import { checkPermission, AccessContext } from './access'
import { fetchMyAccess, type Access } from './api'

// Carga el rol y los permisos del usuario en sesión una vez al entrar al dashboard
// (public.get_my_access) y los comparte con el menú, las rutas y las páginas.
export default function AccessProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const userId = session?.user.id ?? null
  const [access, setAccess] = useState<Access | null>(null)
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  const load = useCallback(async () => {
    try {
      setAccess(await fetchMyAccess())
      setFailed(false)
    } catch (error) {
      console.error('Error cargando permisos:', error)
      setAccess(null)
      setFailed(true)
    }
  }, [])

  useEffect(() => {
    if (!userId) return
    let active = true
    fetchMyAccess()
      .then((data) => {
        if (!active) return
        setAccess(data)
        setFailed(false)
      })
      .catch((error: unknown) => {
        console.error('Error cargando permisos:', error)
        if (!active) return
        setAccess(null)
        setFailed(true)
      })
      .finally(() => {
        if (active) setLoadedFor(userId)
      })
    return () => {
      active = false
    }
  }, [userId])

  const can = useCallback(
    (permission?: string, court?: CourtNumber) => checkPermission(access, permission, court),
    [access],
  )

  const value = useMemo(
    () => ({
      access,
      loading: loadedFor !== userId,
      failed,
      allowed: Boolean(access?.active && access.role),
      mustChangePassword: Boolean(access?.must_change_password),
      can,
      reload: load,
    }),
    [access, loadedFor, userId, failed, can, load],
  )

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>
}
