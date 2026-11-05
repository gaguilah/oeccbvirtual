import { describe, expect, it } from 'vitest'
import { formatValue, share, STATS_SERIES, totals, typeBars } from './stats'
import type { HearingStatsRow } from './types'

// ICU puede o no poner un espacio de no separación antes de %.
const normalize = (text: string) => text.replace(/\s+%/g, '%')

const row = (description: string, counts: Partial<HearingStatsRow>): HearingStatsRow => {
  const base = { realizadas: 0, canceladas: 0, programadas: 0, por_cerrar: 0, ...counts }
  return {
    type_id: description.length,
    description,
    requires_link: true,
    total: base.realizadas + base.canceladas + base.programadas,
    ...base,
  }
}

// El ejemplo del plan: 20 audiencias, 12 realizadas, 3 canceladas y 5 programadas (2 por cerrar).
const rows = [
  row('Audiencia de Remate', { realizadas: 10, canceladas: 2, programadas: 3, por_cerrar: 2 }),
  row('Audiencia de Pruebas', { realizadas: 2, canceladas: 1, programadas: 2 }),
]

describe('totales de las tarjetas', () => {
  it('suma los tipos; programadas incluye las por cerrar', () => {
    expect(totals(rows)).toEqual({ total: 20, realizadas: 12, canceladas: 3, programadas: 5, porCerrar: 2 })
  })
  it('sin filas, todo en 0', () => {
    expect(totals([])).toEqual({ total: 0, realizadas: 0, canceladas: 0, programadas: 0, porCerrar: 0 })
  })
})

describe('porcentajes del total del filtro', () => {
  it('redondea sin decimales', () => {
    expect(normalize(share(12, 20))).toBe('60%')
    expect(normalize(share(1, 3))).toBe('33%')
    expect(normalize(formatValue(3, 20))).toBe('3 (15%)')
  })
  it('sin audiencias no hay porcentaje', () => {
    expect(share(0, 0)).toBe('—')
  })
})

describe('barras por tipo', () => {
  it('una por tipo en el orden recibido, partida en realizadas, canceladas, próximas y por cerrar', () => {
    expect(STATS_SERIES.map((serie) => serie.label)).toEqual(['Realizadas', 'Canceladas', 'Próximas', 'Por cerrar'])
    expect(typeBars(rows)).toEqual([
      { label: 'Audiencia de Remate', values: [10, 2, 1, 2] },
      { label: 'Audiencia de Pruebas', values: [2, 1, 2, 0] },
    ])
  })
})
