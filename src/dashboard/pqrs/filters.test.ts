import { describe, expect, it } from 'vitest'
import { parseFilters, sanitizeQuery, serializeFilters } from './filters'
import type { RequestFilters } from './types'

const DEFAULTS: RequestFilters = { tab: 'pendientes', type: null, query: '', page: 1 }
const parse = (query: string) => parseFilters(new URLSearchParams(query))

describe('sanitizeQuery', () => {
  it('deja letras con tildes, números, espacios y @ . _ -', () => {
    expect(sanitizeQuery('José Núñez')).toBe('José Núñez')
    expect(sanitizeQuery('ana.perez_1-x@correo.co')).toBe('ana.perez_1-x@correo.co')
    expect(sanitizeQuery('PQRS-2026-000123')).toBe('PQRS-2026-000123')
  })

  it('quita lo que rompe el filtro "or" de PostgREST', () => {
    expect(sanitizeQuery('a,b"c(d)e*f')).toBe('abcdef')
  })

  it('máximo 80 caracteres', () => {
    expect(sanitizeQuery('a'.repeat(100))).toHaveLength(80)
  })
})

describe('filtros de la URL de PQRS', () => {
  it('sin parámetros: pendientes, todos los tipos, página 1', () => {
    expect(parse('')).toEqual(DEFAULTS)
  })

  it('lee estado, tipo, búsqueda y página', () => {
    expect(parse('estado=respondidas&tipo=queja&q=ana&pagina=2')).toEqual({
      tab: 'respondidas',
      type: 'queja',
      query: 'ana',
      page: 2,
    })
  })

  it('valores inválidos vuelven al predeterminado', () => {
    expect(parse('estado=borradas&tipo=denuncia&q=%22%2C&pagina=-3')).toEqual(DEFAULTS)
    expect(parse('pagina=1.5').page).toBe(1)
    expect(parse('pagina=abc').page).toBe(1)
  })

  it('los predeterminados no van en la URL', () => {
    expect(serializeFilters(DEFAULTS).toString()).toBe('')
  })

  it('lo que se escribe se lee igual', () => {
    const filters: RequestFilters = { tab: 'cerradas', type: 'felicitacion', query: 'José', page: 4 }
    expect(parseFilters(serializeFilters(filters))).toEqual(filters)
  })
})
