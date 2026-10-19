import { z } from 'zod'

// Reglas de contraseña compartidas por Mi perfil (dashboard) y Crear contraseña nueva (sitio).
// Mínimo 8 (más estricto que el de Supabase); máximo 72, el límite de bcrypt.
export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 72

export const newPasswordField = z
  .string()
  .min(PASSWORD_MIN, `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`)
  .max(PASSWORD_MAX, `La contraseña no puede pasar de ${PASSWORD_MAX} caracteres`)

// Contraseña nueva y su confirmación.
export const newPasswordSchema = z
  .object({ password: newPasswordField, confirm: z.string() })
  .refine((values) => values.password === values.confirm, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm'],
  })

// Mensajes en español para los errores de Supabase Auth con contraseñas.
const AUTH_ERRORS: Record<string, string> = {
  same_password: 'La nueva contraseña debe ser distinta de la actual.',
  weak_password: 'La contraseña es muy débil. Use una más larga, con letras, números y símbolos.',
  reauthentication_needed: 'Por seguridad, cierre sesión e inicie de nuevo antes de cambiar la contraseña.',
  session_not_found: 'Su sesión expiró. Inicie sesión de nuevo.',
  invalid_credentials: 'La contraseña actual no es correcta.',
  over_request_rate_limit: 'Demasiados intentos. Espere unos minutos e intente de nuevo.',
}

export function passwordErrorMessage(code: string | undefined): string {
  return (code && AUTH_ERRORS[code]) ?? 'No se pudo cambiar la contraseña. Intente de nuevo.'
}
