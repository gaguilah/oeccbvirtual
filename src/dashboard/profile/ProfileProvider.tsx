import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '../../context/auth'
import { fetchProfile, updateFullName, type Profile } from './api'
import { ProfileContext } from './profile'

// Carga el perfil una vez al entrar al dashboard y lo comparte con el menú y las páginas. Si la
// consulta falla se sigue con el correo: el perfil no bloquea el dashboard.
export default function ProfileProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const userId = session?.user.id ?? null
  const email = session?.user.email ?? ''
  const [profile, setProfile] = useState<Profile | null>(null)
  // Usuario para el que ya terminó la carga (así no hace falta un setState síncrono en el efecto).
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!userId) return
    let active = true
    fetchProfile(userId)
      .then((data) => {
        if (active) {
          setProfile(data)
          setFailed(false)
        }
      })
      .catch((error: unknown) => {
        console.error('Error cargando perfil:', error)
        if (active) {
          setProfile(null)
          setFailed(true)
        }
      })
      .finally(() => {
        if (active) setLoadedFor(userId)
      })
    return () => {
      active = false
    }
  }, [userId])

  const saveFullName = useCallback(
    async (fullName: string) => {
      if (!userId) throw new Error('Su sesión expiró. Inicie sesión de nuevo.')
      setProfile(await updateFullName(userId, fullName))
    },
    [userId],
  )

  const value = useMemo(
    () => ({
      profile,
      displayName: profile?.full_name?.trim() || email,
      email,
      loading: loadedFor !== userId,
      failed,
      saveFullName,
    }),
    [profile, email, loadedFor, userId, failed, saveFullName],
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}
