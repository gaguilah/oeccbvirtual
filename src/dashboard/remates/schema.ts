import { z } from 'zod'
import { CASE_NUMBER_LENGTH } from '../../components/remates'

// Radicado: se aceptan espacios, puntos o guiones al pegar y se quitan; deben quedar 23 dígitos
// (la misma regla que auction_notices_case_number_chk).
export const caseNumberSchema = z
  .string()
  .transform((value) => value.replace(/\D/g, ''))
  .pipe(z.string().length(CASE_NUMBER_LENGTH, `El radicado debe tener ${CASE_NUMBER_LENGTH} dígitos`))

export const noticeSchema = z.object({
  caseNumber: caseNumberSchema,
  court: z.enum(['1', '2'], { message: 'Elija el juzgado' }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Elija la fecha'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Elija la hora'),
})

export const pdfUrlSchema = z
  .string()
  .trim()
  .url('Escriba una URL completa')
  .startsWith('https://', 'La URL debe empezar por https://')

export type NoticeFields = keyof z.infer<typeof noticeSchema> | 'pdfUrl'
