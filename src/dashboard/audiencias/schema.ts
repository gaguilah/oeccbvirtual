import { z } from 'zod'
import { caseNumberSchema } from '../remates/schema'
import { TIME_OPTIONS } from './data'

const optionalUrl = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || /^https:\/\/\S+$/.test(value),
    'Escriba un enlace completo que empiece por https://',
  )

export const hearingSchema = z.object({
  court: z.enum(['1', '2'], { message: 'Elija el juzgado' }),
  typeId: z.string().regex(/^\d+$/, 'Elija el tipo de audiencia'),
  caseNumber: caseNumberSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Elija la fecha'),
  time: z.string().refine((value) => TIME_OPTIONS.some((option) => option.value === value), 'Elija la hora'),
  connectionUrl: optionalUrl,
  notes: z.string().trim().max(1000, 'Máximo 1000 caracteres'),
})

export type HearingField = keyof z.infer<typeof hearingSchema>

export const recordingSchema = z
  .string()
  .trim()
  .min(1, 'Escriba el enlace de la grabación')
  .regex(/^https:\/\/\S+$/, 'Escriba un enlace completo que empiece por https://')
