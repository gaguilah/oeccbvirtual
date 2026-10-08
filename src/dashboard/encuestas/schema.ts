import { z } from 'zod'
import { SCALE_LIMITS } from './data'

// Mismas reglas que save_survey y survey_questions_scale_chk.
export const titleSchema = z
  .string()
  .trim()
  .min(3, 'El título debe tener al menos 3 caracteres')
  .max(120, 'El título puede tener hasta 120 caracteres')

const scaleValue = z.number().int().min(SCALE_LIMITS.min).max(SCALE_LIMITS.max)

export const questionSchema = z
  .object({
    text: z.string().trim().min(5, 'Escriba la pregunta (mínimo 5 caracteres)').max(200, 'Máximo 200 caracteres'),
    help_text: z.string().trim().max(300, 'Máximo 300 caracteres'),
    type: z.enum(['yes_no', 'scale']),
    scale_min: scaleValue,
    scale_max: scaleValue,
    min_label: z.string().trim().max(40, 'Máximo 40 caracteres'),
    max_label: z.string().trim().max(40, 'Máximo 40 caracteres'),
    is_required: z.boolean(),
  })
  .superRefine((question, ctx) => {
    if (question.type !== 'scale') return
    if (question.scale_min >= question.scale_max)
      ctx.addIssue({ code: 'custom', path: ['scale_max'], message: 'El máximo debe ser mayor que el mínimo' })
    if (!question.min_label) ctx.addIssue({ code: 'custom', path: ['min_label'], message: 'Escriba la etiqueta' })
    if (!question.max_label) ctx.addIssue({ code: 'custom', path: ['max_label'], message: 'Escriba la etiqueta' })
  })

export type QuestionField = keyof z.infer<typeof questionSchema>
