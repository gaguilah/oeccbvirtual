import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  availableYears,
  currentMonth,
  MAX_RANGE_MONTHS,
  parsePeriod,
  parseYearMonth,
  periodError,
  periodLabel,
  periodPhrase,
  periodRange,
  serializePeriod,
  switchMode,
} from './period'
import type { Period } from './types'

const oct2026 = { year: 2026, month: 10 }
const parse = (query: string) => parsePeriod(new URLSearchParams(query))

// "Hoy" fijo: 31 de octubre de 2026 a las 8:00 p. m. en Bogotá (en UTC ya es 1 de noviembre).
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-31T20:00:00-05:00'))
})
afterEach(() => {
  vi.useRealTimers()
})

describe('mes actual', () => {
  it('en hora de Colombia, no de UTC', () => {
    expect(currentMonth()).toEqual(oct2026)
  })
})

describe('parseYearMonth', () => {
  it('AAAA-MM entre 2000 y 2100', () => {
    expect(parseYearMonth('2026-02')).toEqual({ year: 2026, month: 2 })
    for (const value of [null, '', '2026-2', '2026-13', '2026-00', '1999-12', '2101-01', '2026-02-01']) {
      expect(parseYearMonth(value), String(value)).toBeNull()
    }
  })
})

describe('periodRange', () => {
  it('primer y último día, con febrero bisiesto', () => {
    expect(periodRange({ mode: 'mes', month: { year: 2028, month: 2 } })).toEqual({
      from: '2028-02-01',
      to: '2028-02-29',
    })
    expect(periodRange({ mode: 'mes', month: { year: 2026, month: 2 } }).to).toBe('2026-02-28')
    expect(periodRange({ mode: 'anio', year: 2026 })).toEqual({ from: '2026-01-01', to: '2026-12-31' })
    expect(periodRange({ mode: 'rango', from: { year: 2025, month: 11 }, to: { year: 2026, month: 4 } })).toEqual({
      from: '2025-11-01',
      to: '2026-04-30',
    })
  })
})

describe('periodError', () => {
  const range = (to: { year: number; month: number }): Period => ({ mode: 'rango', from: { year: 2025, month: 1 }, to })

  it(`rangos de 1 a ${MAX_RANGE_MONTHS} meses`, () => {
    expect(periodError(range({ year: 2025, month: 1 }))).toBeNull()
    expect(periodError(range({ year: 2026, month: 12 }))).toBeNull()
    expect(periodError(range({ year: 2027, month: 1 }))).toMatch(/hasta 24 meses/)
    expect(periodError(range({ year: 2024, month: 12 }))).toMatch(/anterior/)
  })

  it('mes y año siempre sirven', () => {
    expect(periodError({ mode: 'mes', month: oct2026 })).toBeNull()
    expect(periodError({ mode: 'anio', year: 2026 })).toBeNull()
  })
})

describe('textos del periodo', () => {
  it('periodLabel', () => {
    expect(periodLabel({ mode: 'mes', month: oct2026 })).toBe('Octubre de 2026')
    expect(periodLabel({ mode: 'anio', year: 2026 })).toBe('Año 2026')
    expect(periodLabel({ mode: 'rango', from: { year: 2026, month: 1 }, to: { year: 2026, month: 6 } })).toBe(
      'Enero a junio de 2026',
    )
    expect(periodLabel({ mode: 'rango', from: { year: 2025, month: 11 }, to: { year: 2026, month: 2 } })).toBe(
      'Noviembre de 2025 a febrero de 2026',
    )
    expect(periodLabel({ mode: 'rango', from: oct2026, to: oct2026 })).toBe('Octubre de 2026')
  })

  it('periodPhrase dentro de una frase', () => {
    expect(periodPhrase({ mode: 'mes', month: oct2026 })).toBe('en octubre de 2026')
    expect(periodPhrase({ mode: 'anio', year: 2026 })).toBe('en 2026')
    expect(periodPhrase({ mode: 'rango', from: oct2026, to: oct2026 })).toBe('en octubre de 2026')
    expect(periodPhrase({ mode: 'rango', from: { year: 2026, month: 1 }, to: { year: 2026, month: 6 } })).toBe(
      'de enero a junio de 2026',
    )
    expect(periodPhrase({ mode: 'rango', from: { year: 2025, month: 11 }, to: { year: 2026, month: 2 } })).toBe(
      'de noviembre de 2025 a febrero de 2026',
    )
  })
})

describe('availableYears', () => {
  it('desde el año de creación (en Bogotá) hasta el actual, del más reciente al más antiguo', () => {
    expect(availableYears('2024-06-01T10:00:00-05:00')).toEqual([2026, 2025, 2024])
    // 1 de enero de 2026 en UTC aún es 2025 en Bogotá.
    expect(availableYears('2026-01-01T03:00:00Z')).toEqual([2026, 2025])
    expect(availableYears('2027-01-01T12:00:00-05:00')).toEqual([2026])
  })
})

describe('filtros de la URL de resultados', () => {
  it('sin parámetros: el mes actual', () => {
    expect(parse('')).toEqual({ mode: 'mes', month: oct2026 })
  })

  it('lee mes, rango y año', () => {
    expect(parse('mes=2026-03')).toEqual({ mode: 'mes', month: { year: 2026, month: 3 } })
    expect(parse('periodo=rango&desde=2025-11&hasta=2026-02')).toEqual({
      mode: 'rango',
      from: { year: 2025, month: 11 },
      to: { year: 2026, month: 2 },
    })
    expect(parse('periodo=anio&anio=2025')).toEqual({ mode: 'anio', year: 2025 })
  })

  it('valores inválidos vuelven al predeterminado', () => {
    expect(parse('mes=2026-13')).toEqual({ mode: 'mes', month: oct2026 })
    expect(parse('periodo=rango')).toEqual({ mode: 'rango', from: { year: 2026, month: 1 }, to: oct2026 })
    expect(parse('periodo=anio&anio=1999')).toEqual({ mode: 'anio', year: 2026 })
    expect(parse('periodo=semana')).toEqual({ mode: 'mes', month: oct2026 })
  })

  it('el mes actual no va en la URL; lo que se escribe se lee igual', () => {
    expect(serializePeriod({ mode: 'mes', month: oct2026 }).toString()).toBe('')
    const periods: Period[] = [
      { mode: 'mes', month: { year: 2025, month: 7 } },
      { mode: 'rango', from: { year: 2025, month: 11 }, to: { year: 2026, month: 2 } },
      { mode: 'anio', year: 2024 },
    ]
    for (const period of periods) expect(parsePeriod(serializePeriod(period))).toEqual(period)
  })
})

describe('switchMode', () => {
  it('conserva el año; en el año actual llega hasta el mes actual', () => {
    expect(switchMode({ mode: 'anio', year: 2026 }, 'mes')).toEqual({ mode: 'mes', month: oct2026 })
    expect(switchMode({ mode: 'anio', year: 2025 }, 'rango')).toEqual({
      mode: 'rango',
      from: { year: 2025, month: 1 },
      to: { year: 2025, month: 12 },
    })
    expect(switchMode({ mode: 'rango', from: { year: 2025, month: 3 }, to: { year: 2026, month: 2 } }, 'anio')).toEqual(
      { mode: 'anio', year: 2026 },
    )
  })
})
