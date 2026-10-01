import { createContext, useContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export type AuthContextType = {
  session: Session | null
  loading: boolean
}

export const AuthContext = createContext<AuthContextType>({ session: null, loading: true })

export function useAuth() {
  return useContext(AuthContext)
}
