import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

// Cierra la sesión y lleva a /login (con replace: "atrás" no vuelve al dashboard). Devuelve false si
// no se pudo, para que quien la llama lo muestre.
export function useSignOut() {
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  async function signOut(): Promise<boolean> {
    setSigningOut(true)
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error cerrando sesión:', error)
      setSigningOut(false)
      return false
    }
    navigate('/login', { replace: true })
    return true
  }

  return { signOut, signingOut }
}
