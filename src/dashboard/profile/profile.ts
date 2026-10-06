import { createContext, useContext } from 'react'
import type { Profile } from './api'

export type ProfileContextType = {
  profile: Profile | null
  // Nombre para mostrar: full_name o, si no hay, el correo.
  displayName: string
  email: string
  loading: boolean
  // La consulta del perfil falló (distinto de que la fila no exista).
  failed: boolean
  // Guarda el nombre y actualiza el menú y el saludo sin recargar. Lanza un Error con mensaje en
  // español si falla.
  saveFullName: (fullName: string) => Promise<void>
}

export const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  displayName: '',
  email: '',
  loading: true,
  failed: false,
  saveFullName: async () => {},
})

export function useProfile() {
  return useContext(ProfileContext)
}
