import { z } from 'zod'
import { newPasswordField } from '../../lib/password'

// Letras del español y de nombres latinos (tildes, ñ, ü, ç…), sin × ni ÷.
const LETTERS = 'A-Za-zÀ-ÖØ-öø-ÿ'
// Palabras de letras separadas por un espacio, un guion, un apóstrofo o ". " (abreviatura, p. ej.
// "Ma. José"); puede terminar en punto. La misma regla está en la base de datos
// (migración 20261005140000_profiles_full_name_check.sql, y para el contacto de emergencia
// 20261027120000_profile_personal_info.sql): si cambia, cambiar todas.
const NAME_PATTERN = new RegExp(`^[${LETTERS}]+((\\. |[ '-])[${LETTERS}]+)*\\.?$`)

// Antes de validar: sin espacios sobrantes y con el apóstrofo tipográfico (’) como recto (').
export const normalizeName = (value: string) => value.trim().replace(/\s+/g, ' ').replace(/’/g, "'")

// También la usa el nombre del contacto de emergencia (personalSchema.ts), con su propio mensaje.
export function buildNameSchema(tooShortMessage: string) {
  return z
    .string()
    .transform(normalizeName)
    .pipe(
      z
        .string()
        .min(3, tooShortMessage)
        .max(120, 'El nombre no puede pasar de 120 caracteres')
        .refine((value) => !/\d/.test(value), 'El nombre no puede tener números')
        .refine(
          (value) => /\d/.test(value) || NAME_PATTERN.test(value),
          "Use solo letras, espacios, guiones (-) y apóstrofos ('), sin signos seguidos",
        ),
    )
}

export const nameSchema = buildNameSchema('Escriba su nombre completo')

// Reglas de la contraseña nueva en src/lib/password.ts (las comparte Crear contraseña nueva).
export const passwordSchema = z
  .object({
    current: z.string().min(1, 'Escriba su contraseña actual'),
    password: newPasswordField,
    confirm: z.string(),
  })
  .refine((values) => values.password === values.confirm, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm'],
  })
  .refine((values) => !values.current || values.password !== values.current, {
    message: 'La nueva contraseña debe ser distinta de la actual',
    path: ['password'],
  })

export type PasswordFields = z.infer<typeof passwordSchema>
