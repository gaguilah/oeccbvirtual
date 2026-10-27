import { z } from 'zod'
import { normalizePhone, PHONE_CHARS, PHONE_PATTERN, RELATIONSHIPS } from './personalData'
import { buildNameSchema, normalizeName } from './schema'

// Todos los campos son opcionales: vacío se guarda como null y las reglas se aplican solo al que
// tenga valor. Las mismas reglas están en la base de datos (restricciones de
// profile_personal_info, migración 20261027120000): si cambian, cambiar las dos.

const orNull = (value: string) => (value === '' ? null : value)

// Primero los caracteres: normalizePhone quita todo lo que no es dígito, así que sin esta revisión
// "abc" quedaría vacío (y se guardaría como "sin celular") sin ningún mensaje.
const phoneField = z.string().transform((value, ctx) => {
  if (!PHONE_CHARS.test(value)) {
    ctx.addIssue({ code: 'custom', message: 'Escriba solo números (puede separarlos con espacios)' })
    return z.NEVER
  }
  const phone = orNull(normalizePhone(value))
  if (phone !== null && !PHONE_PATTERN.test(phone)) {
    ctx.addIssue({ code: 'custom', message: 'Escriba un celular de 10 dígitos que empiece por 3' })
    return z.NEVER
  }
  return phone
})

// Una sola línea, sin espacios sobrantes.
const addressField = z
  .string()
  .transform((value) => orNull(value.trim().replace(/\s+/g, ' ')))
  .refine((value) => value === null || value.length >= 5, 'Escriba la dirección completa')
  .refine((value) => value === null || value.length <= 200, 'La dirección no puede pasar de 200 caracteres')

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

const emailField = z
  .string()
  .transform((value) => orNull(value.trim().toLowerCase()))
  .refine((value) => value === null || value.length <= 254, 'El correo no puede pasar de 254 caracteres')
  .refine(
    (value) => value === null || EMAIL_PATTERN.test(value),
    'Escriba un correo válido, por ejemplo nombre@correo.com',
  )

// El valor del Select ('' = sin registrar).
const epsField = z.string().transform((value) => (value === '' ? null : Number(value)))

const contactName = buildNameSchema('Escriba el nombre completo de su contacto')

const contactNameField = z
  .string()
  .transform((value) => orNull(normalizeName(value)))
  .superRefine((value, ctx) => {
    if (value === null) return
    const result = contactName.safeParse(value)
    if (!result.success) ctx.addIssue({ code: 'custom', message: result.error.issues[0].message })
  })

const relationshipField = z
  .string()
  .transform(orNull)
  .refine(
    (value) => value === null || RELATIONSHIPS.some((item) => item.value === value),
    'Elija un parentesco de la lista',
  )

export const personalInfoSchema = z.object({
  residenceAddress: addressField,
  mobilePhone: phoneField,
  personalEmail: emailField,
  epsId: epsField,
})

export const emergencyContactSchema = z.object({
  emergencyName: contactNameField,
  emergencyRelationship: relationshipField,
  emergencyPhone: phoneField,
})

export type PersonalInfoInput = z.input<typeof personalInfoSchema>
export type PersonalInfoValues = z.output<typeof personalInfoSchema>
export type EmergencyContactInput = z.input<typeof emergencyContactSchema>
export type EmergencyContactValues = z.output<typeof emergencyContactSchema>
