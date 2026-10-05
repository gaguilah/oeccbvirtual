import { z } from 'zod'
import { nameSchema } from '../profile/schema'

// Mismo nombre que Mi perfil (y que la restricción profiles_full_name_format).
export const userSchema = z.object({
  fullName: nameSchema,
  email: z.string().trim().toLowerCase().email('Escriba un correo válido'),
  roleId: z.string().min(1, 'Elija un rol'),
  court: z.string(),
})

export type UserFields = keyof z.infer<typeof userSchema>
