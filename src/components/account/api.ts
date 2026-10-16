import { FunctionsHttpError } from '@supabase/supabase-js'
import { passwordErrorMessage } from '../../lib/password'
import { supabase } from '../../lib/supabase'

// Recuperar contraseña (docs/plan-recuperar-contrasena.md). Edge Function password-reset.

export type RequestResult = { ok: true } | { ok: false; error: string }

// Pide el enlace. La respuesta es la misma exista o no la cuenta.
export async function requestPasswordReset(email: string, captchaToken: string): Promise<RequestResult> {
  try {
    const { error } = await supabase.functions.invoke('password-reset', {
      body: { action: 'request', email, captchaToken },
    })
    if (!error) return { ok: true }
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null)
      if (body && typeof body.error === 'string') return { ok: false, error: body.error }
    }
    return { ok: false, error: 'No se pudo enviar la solicitud. Intente de nuevo.' }
  } catch {
    return { ok: false, error: 'No se pudo enviar la solicitud. Revise su conexión e intente de nuevo.' }
  }
}

// Valida el enlace del correo: si sirve, deja la sesión iniciada.
export async function verifyRecoveryLink(tokenHash: string): Promise<boolean> {
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' })
  if (error) console.error('Enlace de recuperación no válido:', error.code ?? error.message)
  return !error
}

// Guarda la contraseña nueva y, después, lo que no debe impedir terminar: cierra las sesiones de
// otros equipos, quita la marca de contraseña temporal (si falta el cargo, Mi perfil lo pedirá) y
// envía el aviso "Su contraseña se cambió".
export async function saveNewPassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    console.error('Error guardando la contraseña nueva:', error.code ?? error.message)
    throw new Error(passwordErrorMessage(error.code))
  }

  await Promise.allSettled([
    supabase.auth.signOut({ scope: 'others' }),
    supabase.rpc('complete_password_change'),
    supabase.functions.invoke('password-reset', { body: { action: 'notify-changed' } }),
  ])
}
