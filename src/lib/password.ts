import { z } from 'zod'

// Reglas de contraseña compartidas por Mi perfil (dashboard) y Crear contraseña nueva (sitio).
// Mínimo 8 y máximo 72 (el límite de bcrypt), con al menos una letra y un número. La misma regla está
// en Supabase Auth (Authentication → Policies: longitud mínima 8, "Letters and digits";
// docs/plan-seguridad-supabase.md, Fase 3): si cambia, cambiar las dos.
export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 72

// Auth cuenta como letras solo a-z y A-Z: una contraseña con solo "ñ" o letras con tilde pasaría aquí
// con \p{L} y Auth la rechazaría. Por eso se exige una letra sin tilde.
const HAS_LETTER = /[A-Za-z]/
const HAS_DIGIT = /[0-9]/

// Texto de ayuda bajo el campo de la contraseña nueva (Mi perfil y Crear contraseña nueva).
export const PASSWORD_HINT = `Entre ${PASSWORD_MIN} y ${PASSWORD_MAX} caracteres, con al menos una letra y un número.`

export const newPasswordField = z
  .string()
  .min(PASSWORD_MIN, `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`)
  .max(PASSWORD_MAX, `La contraseña no puede pasar de ${PASSWORD_MAX} caracteres`)
  .refine((value) => HAS_LETTER.test(value), 'La contraseña debe incluir al menos una letra (a-z, sin tilde)')
  .refine((value) => HAS_DIGIT.test(value), 'La contraseña debe incluir al menos un número')

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
  // Captcha de Auth (Mi perfil comprueba la contraseña actual con signInWithPassword).
  captcha_failed: 'La verificación de seguridad falló. Complétela de nuevo e intente otra vez.',
}

export function passwordErrorMessage(code: string | undefined): string {
  // Object.hasOwn: un código como "toString" no debe devolver lo heredado de Object.
  return code && Object.hasOwn(AUTH_ERRORS, code)
    ? AUTH_ERRORS[code]
    : 'No se pudo cambiar la contraseña. Intente de nuevo.'
}
