import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

// Cierra la sesión y lleva a /login (con replace: "atrás" no vuelve al dashboard).
export function useSignOut() {
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  async function signOut() {
    setSigningOut(true)
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error cerrando sesión:', error)
      setSigningOut(false)
      return
    }
    navigate('/login', { replace: true })
  }

  return { signOut, signingOut }
}
