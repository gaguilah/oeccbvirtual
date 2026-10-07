import { z } from 'zod'
import { REQUEST_TYPE_IDS, SUMMARY_MAX_CHARS } from './data'

export const requestSchema = z.object({
  type: z.enum(REQUEST_TYPE_IDS, { error: 'Seleccione el tipo de solicitud.' }),
  name: z.string().trim().min(2, 'El nombre es muy corto.'),
  email: z.string().trim().email('Ingrese un correo electrónico válido.'),
  summary: z
    .string()
    .trim()
    .min(10, 'El mensaje es muy corto (mínimo 10 caracteres).')
    .max(SUMMARY_MAX_CHARS, `El mensaje es muy largo (máximo ${SUMMARY_MAX_CHARS} caracteres).`),
  // Autorización de tratamiento de datos (terms.ts). submit-request la vuelve a exigir y guarda la fecha.
  acceptedTerms: z.literal(true, { error: 'Debe aceptar los términos y condiciones para enviar su solicitud.' }),
})

export type RequestInput = z.infer<typeof requestSchema>

// Estado del formulario mientras se diligencia (el tipo aún puede no estar elegido y los términos
// aún pueden no estar aceptados).
export type RequestDraft = Omit<RequestInput, 'type' | 'acceptedTerms'> & {
  type: RequestInput['type'] | null
  acceptedTerms: boolean
}

export type FieldErrors = Partial<Record<keyof RequestInput, string>>

// Campos que se validan en cada paso del flujo.
export const stepFields: (keyof RequestInput)[][] = [['type'], ['name', 'email'], ['summary', 'acceptedTerms']]

// Valida solo los campos indicados y devuelve el primer error de cada uno.
export function validateFields(draft: RequestDraft, fields: (keyof RequestInput)[]): FieldErrors {
  const mask = Object.fromEntries(fields.map((field) => [field, true])) as Partial<Record<keyof RequestInput, true>>
  const result = requestSchema.pick(mask).safeParse(draft)
  if (result.success) return {}

  const errors: FieldErrors = {}
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof RequestInput
    errors[field] ??= issue.message
  }
  return errors
}
