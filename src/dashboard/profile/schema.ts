import { z } from 'zod'

// Letras del español y de nombres latinos (tildes, ñ, ü, ç…), sin × ni ÷.
const LETTERS = 'A-Za-zÀ-ÖØ-öø-ÿ'
// Palabras de letras separadas por un espacio, un guion, un apóstrofo o ". " (abreviatura, p. ej.
// "Ma. José"); puede terminar en punto. La misma regla está en la base de datos
// (migración 20261005140000_profiles_full_name_check.sql): si cambia, cambiar las dos.
const NAME_PATTERN = new RegExp(`^[${LETTERS}]+((\\. |[ '-])[${LETTERS}]+)*\\.?$`)

// Antes de validar: sin espacios sobrantes y con el apóstrofo tipográfico (’) como recto (').
export const nameSchema = z
  .string()
  .transform((value) => value.trim().replace(/\s+/g, ' ').replace(/’/g, "'"))
  .pipe(
    z
      .string()
      .min(3, 'Escriba su nombre completo')
      .max(120, 'El nombre no puede pasar de 120 caracteres')
      .refine((value) => !/\d/.test(value), 'El nombre no puede tener números')
      .refine(
        (value) => /\d/.test(value) || NAME_PATTERN.test(value),
        "Use solo letras, espacios, guiones (-) y apóstrofos ('), sin signos seguidos",
      ),
  )

// Mínimo 8 (más estricto que el de Supabase); máximo 72, el límite de bcrypt.
export const passwordSchema = z
  .object({
    current: z.string().min(1, 'Escriba su contraseña actual'),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .max(72, 'La contraseña no puede pasar de 72 caracteres'),
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
