import { supabase } from '../../lib/supabase'

export type Profile = { full_name: string | null }

// Perfil del usuario en sesión. Que no exista la fila es normal (null), no un error.
export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('full_name').eq('id', userId).maybeSingle()
  if (error) throw error
  return data
}

// Cambia el nombre propio. RLS solo deja actualizar la fila propia y solo la columna full_name
// (migración 20261005130000). Sin fila no se actualiza nada: el perfil lo crea un administrador.
export async function updateFullName(userId: string, fullName: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', userId)
    .select('full_name')
    .maybeSingle()
  // 23514: lo rechazó la restricción profiles_full_name_format (alguien se saltó el formulario).
  if (error?.code === '23514') throw new Error('El nombre tiene caracteres no permitidos.')
  if (error) throw new Error('No se pudo guardar el nombre. Intente de nuevo.')
  if (!data) throw new Error('Su perfil aún no está creado. Pida a un administrador que lo cree.')
  return data
}

// Mensajes en español para los errores de Supabase Auth al cambiar la contraseña.
const PASSWORD_ERRORS: Record<string, string> = {
  same_password: 'La nueva contraseña debe ser distinta de la actual.',
  weak_password: 'La contraseña es muy débil. Use una más larga, con letras, números y símbolos.',
  reauthentication_needed: 'Por seguridad, cierre sesión e inicie de nuevo antes de cambiar la contraseña.',
  session_not_found: 'Su sesión expiró. Inicie sesión de nuevo.',
  invalid_credentials: 'La contraseña actual no es correcta.',
  over_request_rate_limit: 'Demasiados intentos. Espere unos minutos e intente de nuevo.',
}

function passwordError(code: string | undefined): Error {
  return new Error((code && PASSWORD_ERRORS[code]) ?? 'No se pudo cambiar la contraseña. Intente de nuevo.')
}

// Cambia la contraseña del usuario en sesión (Supabase Auth). Primero comprueba la actual
// iniciando sesión con ella (renueva la sesión del mismo usuario): así una sesión abierta y
// olvidada no basta para cambiarla desde esta página.
export async function changePassword(email: string, currentPassword: string, newPassword: string): Promise<void> {
  const check = await supabase.auth.signInWithPassword({ email, password: currentPassword })
  if (check.error) throw passwordError(check.error.code)

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw passwordError(error.code)
}
