import { z } from 'zod'
import {
  ANSWER_MAX,
  ANSWER_MIN,
  IMAGE_ALT_MAX,
  IMAGE_ALT_MIN,
  QUESTION_MAX,
  QUESTION_MIN,
  SECTION_TITLE_MAX,
  SECTION_TITLE_MIN,
} from '../../components/faq/data'

// Mismas reglas que las restricciones de faq_sections y faq_questions (cambiar ambas juntas): el
// texto llega sin espacios al inicio ni al final, como exige la base.

// Una línea: espacios repetidos se vuelven uno.
const singleLine = (value: string) => value.replace(/\s+/g, ' ').trim()

// Respuesta: saltos de línea normalizados, sin espacios al final de cada línea y como máximo una
// línea en blanco seguida (separa párrafos).
export function normalizeAnswer(value: string): string {
  return value
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export const sectionSchema = z.object({
  title: z
    .string()
    .transform(singleLine)
    .pipe(
      z
        .string()
        .min(SECTION_TITLE_MIN, `El nombre debe tener al menos ${SECTION_TITLE_MIN} caracteres`)
        .max(SECTION_TITLE_MAX, `El nombre puede tener hasta ${SECTION_TITLE_MAX} caracteres`),
    ),
})

export const questionSchema = z.object({
  sectionId: z.coerce.number({ message: 'Elija la sección' }).int().positive('Elija la sección'),
  question: z
    .string()
    .transform(singleLine)
    .pipe(
      z
        .string()
        .min(QUESTION_MIN, `La pregunta debe tener al menos ${QUESTION_MIN} caracteres`)
        .max(QUESTION_MAX, `La pregunta puede tener hasta ${QUESTION_MAX} caracteres`),
    ),
  answer: z
    .string()
    .transform(normalizeAnswer)
    .pipe(
      z
        .string()
        .min(ANSWER_MIN, `La respuesta debe tener al menos ${ANSWER_MIN} caracteres`)
        .max(ANSWER_MAX, `La respuesta puede tener hasta ${ANSWER_MAX.toLocaleString('es-CO')} caracteres`),
    ),
})

// Texto alternativo de la imagen de apoyo: obligatorio cuando hay imagen.
export const imageAltSchema = z
  .string()
  .transform(singleLine)
  .pipe(
    z
      .string()
      .min(IMAGE_ALT_MIN, 'Describa lo que muestra la imagen (al menos 5 caracteres)')
      .max(IMAGE_ALT_MAX, `La descripción puede tener hasta ${IMAGE_ALT_MAX} caracteres`),
  )

export type QuestionInput = z.output<typeof questionSchema>
export type QuestionField = keyof QuestionInput | 'imageAlt' | 'image'
