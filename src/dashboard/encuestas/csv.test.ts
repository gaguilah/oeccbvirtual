import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildCsv, csvFileName } from './csv'
import { questionResult } from './results'
import { scaleQuestion, testSurvey, yesNoQuestion } from './testSurvey'
import type { Period, SurveyStats } from './types'

const october: Period = { mode: 'mes', month: { year: 2026, month: 10 } }
const stats: SurveyStats = {
  total: 4,
  answers: [
    { question_id: 'q1', value: 1, count: 3 },
    { question_id: 'q1', value: 0, count: 1 },
    { question_id: 'q2', value: 5, count: 2 },
  ],
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-29T08:00:00-05:00'))
})
afterEach(() => {
  vi.useRealTimers()
})

// Celdas de una fila, respetando las comillas (como las lee Excel).
const cells = (line: string) =>
  [...line.matchAll(/(?:^|;)("(?:[^"]|"")*"|[^;]*)/g)].map(([, cell]) =>
    cell.startsWith('"') ? cell.slice(1, -1).replace(/""/g, '"') : cell,
  )

function build() {
  const results = testSurvey.questions.map((question) => questionResult(question, stats))
  return buildCsv(testSurvey, october, stats.total, results)
}

describe('csvFileName', () => {
  it('código de la encuesta y el periodo', () => {
    expect(csvFileName(testSurvey, october)).toBe('encuesta-satisfaccion-oeccb-2026-10.csv')
    expect(
      csvFileName(testSurvey, { mode: 'rango', from: { year: 2026, month: 1 }, to: { year: 2026, month: 6 } }),
    ).toBe('encuesta-satisfaccion-oeccb-2026-01-a-2026-06.csv')
    expect(csvFileName(testSurvey, { mode: 'anio', year: 2026 })).toBe('encuesta-satisfaccion-oeccb-2026.csv')
  })
})

describe('buildCsv', () => {
  it('para Excel en español: BOM UTF-8, separador ";" y saltos CRLF', () => {
    const csv = build()
    expect(csv.charCodeAt(0)).toBe(0xfeff)
    expect(csv.endsWith('\r\n')).toBe(true)
    expect(csv.slice(1).split('\r\n')[0]).toBe('Encuesta;Satisfacción OECCB')
    expect(csv.replace(/\r\n/g, '')).not.toContain('\n')
  })

  it('encabezado con periodo, respuestas y fecha de generación', () => {
    const lines = build().slice(1).split('\r\n')
    expect(lines[1]).toBe('Periodo;Octubre de 2026')
    expect(lines[2]).toBe('Respuestas;4')
    expect(lines[3]).toMatch(/^Generado;.*2026/)
    expect(lines[4]).toBe('')
    expect(lines[5]).toBe('N.º;Pregunta;Tipo;Respuesta;Cantidad;Porcentaje;Promedio')
  })

  it('una fila por opción de cada pregunta, con las etiquetas de los extremos de la escala', () => {
    const lines = build().slice(1).split('\r\n').slice(6, -1)
    // 2 de sí / no + 5 de la escala de 1 a 5.
    expect(lines).toHaveLength(2 + 5)
    // Sin espacios: según la versión de ICU, el porcentaje lleva o no un espacio antes de %.
    expect(lines[0].replace(/\s/g, '')).toBe(`1;${yesNoQuestion.text};Sí/no;Sí;3;75%;`.replace(/\s/g, ''))
    expect(cells(lines[2]).slice(3, 5)).toEqual(['5 (Excelente)', '2'])
    expect(cells(lines[6]).slice(3, 5)).toEqual(['1 (Malo)', '0'])
    expect(cells(lines[2])[1]).toBe(scaleQuestion.text)
  })

  it('pone entre comillas los textos con ";" o comillas, duplicando las comillas', () => {
    const line = build()
      .split('\r\n')
      .find((row) => row.startsWith('2;'))
    expect(line?.startsWith(`2;"${scaleQuestion.text.replace(/"/g, '""')}";Escala 1–5;`)).toBe(true)
    expect(line?.endsWith(';5,0')).toBe(true)
  })
})
