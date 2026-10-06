import { useCallback, useEffect, useState } from 'react'
import { fetchRoles, fetchUsers } from './api'
import type { RoleOption, UserRow } from './types'

// Cada cuánto se vuelve a pedir la lista mientras la página está visible.
const REFRESH_MS = 60_000

// Usuarios y roles de la sección. reload() vuelve a pedir la lista (tras crear, editar, etc.)
// conservando la anterior mientras llega. Lo que hacen otros usuarios en su sesión (cambiar la
// contraseña temporal, iniciar sesión) no avisa: por eso también se actualiza al volver a la
// pestaña y cada minuto mientras está visible.
export function useUsers() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  // Versión ya cargada: si es menor que `version`, hay una recarga en curso.
  const [loadedVersion, setLoadedVersion] = useState(-1)

  useEffect(() => {
    let active = true
    Promise.all([fetchUsers(), fetchRoles()])
      .then(([userRows, roleRows]) => {
        if (!active) return
        setUsers(userRows)
        setRoles(roleRows)
        setError(null)
      })
      .catch((err: unknown) => {
        console.error('Error cargando usuarios:', err)
        if (active) setError('No se pudo cargar la lista de usuarios.')
      })
      .finally(() => {
        if (active) setLoadedVersion(version)
      })
    return () => {
      active = false
    }
  }, [version])

  const reload = useCallback(() => setVersion((current) => current + 1), [])

  useEffect(() => {
    const visible = () => document.visibilityState === 'visible'
    const onVisible = () => {
      if (visible()) reload()
    }
    const timer = setInterval(onVisible, REFRESH_MS)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [reload])

  return {
    users,
    roles,
    // Primera carga (sin lista todavía) y recargas (con la lista anterior en pantalla).
    loading: loadedVersion < 0,
    refreshing: loadedVersion >= 0 && loadedVersion < version,
    error,
    reload,
  }
}
