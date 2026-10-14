import { supabase } from '../../lib/supabase'

export type Profile = { full_name: string | null; position_id: number | null }

// Cargo del catálogo job_positions (migración 20261013120000).
export type JobPosition = { id: number; name: string; is_active: boolean }

export type ProfileFields = { fullName: string; positionId: number }

const PROFILE_COLUMNS = 'full_name, position_id'

// Perfil del usuario en sesión. Que no exista la fila es normal (null), no un error.
export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', userId).maybeSingle()
  if (error) throw error
  return data
}

export async function fetchJobPositions(): Promise<JobPosition[]> {
  const { data, error } = await supabase.from('job_positions').select('id, name, is_active').order('name')
  if (error) throw new Error('No se pudo cargar la lista de cargos.')
  return data ?? []
}

// Cambia el nombre y el cargo propios. RLS solo deja actualizar la fila propia y solo esas dos
// columnas (migraciones 20261005130000 y 20261013120000). Sin fila no se actualiza nada: el perfil lo
// crea un administrador.
export async function updateProfile(userId: string, fields: ProfileFields): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ full_name: fields.fullName, position_id: fields.positionId })
    .eq('id', userId)
    .select(PROFILE_COLUMNS)
    .maybeSingle()
  // 23514: lo rechazó la restricción profiles_full_name_format (alguien se saltó el formulario).
  if (error?.code === '23514') throw new Error('El nombre tiene caracteres no permitidos.')
  if (error?.code === '23503') throw new Error('Ese cargo ya no existe: elija otro.')
  if (error) throw new Error('No se pudieron guardar sus datos. Intente de nuevo.')
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
