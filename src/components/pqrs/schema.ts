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
})

export type RequestInput = z.infer<typeof requestSchema>

// Estado del formulario mientras se diligencia (el tipo aún puede no estar elegido).
export type RequestDraft = Omit<RequestInput, 'type'> & { type: RequestInput['type'] | null }

export type FieldErrors = Partial<Record<keyof RequestInput, string>>

// Campos que se validan en cada paso del flujo.
export const stepFields: (keyof RequestInput)[][] = [['type'], ['name', 'email'], ['summary']]

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
