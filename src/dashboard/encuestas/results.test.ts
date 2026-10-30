import { describe, expect, it } from 'vitest'
import { formatAverage, formatPercent, kpis, questionResult } from './results'
import { scaleQuestion, yesNoQuestion } from './testSurvey'
import type { SurveyStats } from './types'

// Según la versión de ICU, Intl pone o no un espacio de no separación antes de % ("75 %").
const normalize = (text: string) => text.replace(/\s/g, '')

const stats: SurveyStats = {
  total: 6,
  answers: [
    { question_id: 'q1', value: 1, count: 3 },
    { question_id: 'q1', value: 0, count: 1 },
    { question_id: 'q2', value: 5, count: 2 },
    { question_id: 'q2', value: 2, count: 1 },
    { question_id: 'otra', value: 1, count: 9 },
  ],
}

describe('questionResult', () => {
  it('sí / no: Sí primero, luego No', () => {
    const result = questionResult(yesNoQuestion, stats)
    expect(result.answered).toBe(4)
    expect(result.values).toEqual([
      { value: 1, label: 'Sí', count: 3 },
      { value: 0, label: 'No', count: 1 },
    ])
    expect(result.average).toBeNull()
  })

  it('escala: del mayor al menor, con ceros, y el promedio de quienes contestaron', () => {
    const result = questionResult(scaleQuestion, stats)
    expect(result.answered).toBe(3)
    expect(result.values.map((v) => [v.value, v.count])).toEqual([
      [5, 2],
      [4, 0],
      [3, 0],
      [2, 1],
      [1, 0],
    ])
    expect(result.average).toBe(4)
  })

  it('sin respuestas: todo en cero y sin promedio', () => {
    const result = questionResult(scaleQuestion, { total: 0, answers: [] })
    expect(result.answered).toBe(0)
    expect(result.average).toBeNull()
  })
})

describe('kpis', () => {
  const results = [questionResult(yesNoQuestion, stats), questionResult(scaleQuestion, stats)]

  it('promedio de las escalas y porcentaje de Sí', () => {
    expect(kpis(results)).toEqual({ average: { value: 4, max: 5 }, yes: { count: 3, total: 4 } })
  })

  it('sin promedio si las escalas tienen rangos distintos', () => {
    const other = questionResult({ ...scaleQuestion, id: 'q3', scale_min: 0, scale_max: 10 }, stats)
    expect(kpis([...results, other]).average).toBeNull()
  })

  it('sin respuestas no hay indicadores', () => {
    const empty = { total: 0, answers: [] }
    expect(kpis([questionResult(yesNoQuestion, empty), questionResult(scaleQuestion, empty)])).toEqual({
      average: null,
      yes: null,
    })
  })
})

describe('formatos', () => {
  it('porcentaje sin decimales y promedio con uno, en español', () => {
    expect(normalize(formatPercent(3, 4))).toBe('75%')
    expect(normalize(formatPercent(0, 0))).toBe('0%')
    expect(formatAverage(4)).toBe('4,0')
    expect(formatAverage(3.25)).toBe('3,3')
  })
})
