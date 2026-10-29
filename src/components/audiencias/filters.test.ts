import { describe, expect, it } from 'vitest'
import { publicStatus } from './constants'
import { parseFilters, serializeFilters } from './filters'

const parse = (query: string) => parseFilters(new URLSearchParams(query))
const DEFAULTS = { period: 'proximas', court: null, from: null, to: null, query: '', page: 1 }

describe('filtros de Audiencias en la URL', () => {
  it('sin parámetros: próximas, todos los juzgados, sin fechas, página 1', () => {
    expect(parse('')).toEqual(DEFAULTS)
  })

  it('lee los parámetros válidos', () => {
    expect(parse('periodo=anteriores&juzgado=1&desde=2026-10-01&hasta=2026-10-31&q=6800&pagina=2')).toEqual({
      period: 'anteriores',
      court: 1,
      from: '2026-10-01',
      to: '2026-10-31',
      query: '6800',
      page: 2,
    })
  })

  it('las fechas deben venir como AAAA-MM-DD', () => {
    expect(parse('desde=01/10/2026&hasta=2026-10').from).toBeNull()
    expect(parse('desde=01/10/2026&hasta=2026-10').to).toBeNull()
  })

  it('los valores inválidos vuelven al predeterminado', () => {
    expect(parse('periodo=proximos&juzgado=0&q=x&pagina=1.5')).toEqual(DEFAULTS)
  })

  it('escribe solo lo distinto del predeterminado y se puede leer de vuelta', () => {
    expect(serializeFilters(DEFAULTS).toString()).toBe('')
    const filters = { period: 'anteriores', court: 2, from: '2026-01-02', to: null, query: '99', page: 3 } as const
    expect(parseFilters(serializeFilters(filters))).toEqual(filters)
  })
})

describe('publicStatus', () => {
  it('muestra el estado de la audiencia', () => {
    expect(publicStatus({ status_id: 1, pending_confirmation: false }).label).toBe('Programada')
    expect(publicStatus({ status_id: 2, pending_confirmation: false }).label).toBe('Realizada')
    expect(publicStatus({ status_id: 3, pending_confirmation: false }).label).toBe('Cancelada')
  })

  it('una Programada pasada sin cerrar se muestra Por confirmar', () => {
    // pending_confirmation lo calcula list_public_hearings (migración 20261014150000).
    expect(publicStatus({ status_id: 1, pending_confirmation: true }).label).toBe('Por confirmar')
  })
})
