import { describe, expect, it } from 'vitest'
import { CASE_NUMBER_LENGTH } from './constants'
import { parseFilters, sanitizeQuery, serializeFilters } from './filters'

const parse = (query: string) => parseFilters(new URLSearchParams(query))
const DEFAULTS = { court: null, period: 'proximos', query: '', page: 1 }

describe('sanitizeQuery', () => {
  it(`deja solo dígitos, hasta ${CASE_NUMBER_LENGTH}`, () => {
    expect(sanitizeQuery('68001-31-03')).toBe('680013103')
    expect(sanitizeQuery('abc')).toBe('')
    expect(sanitizeQuery('1'.repeat(CASE_NUMBER_LENGTH + 5))).toHaveLength(CASE_NUMBER_LENGTH)
  })
})

describe('filtros de Avisos de Remate en la URL', () => {
  it('sin parámetros: próximos, todos los juzgados, página 1', () => {
    expect(parse('')).toEqual(DEFAULTS)
  })

  it('lee los parámetros válidos', () => {
    expect(parse('juzgado=2&periodo=pasados&q=6800&pagina=3')).toEqual({
      court: 2,
      period: 'pasados',
      query: '6800',
      page: 3,
    })
  })

  it('los valores inválidos vuelven al predeterminado', () => {
    expect(parse('juzgado=3&periodo=otro&q=abc&pagina=-2')).toEqual(DEFAULTS)
    expect(parse('pagina=uno').page).toBe(1)
    expect(parse('pagina=0').page).toBe(1)
  })

  it('solo escribe lo distinto del predeterminado', () => {
    expect(serializeFilters({ court: null, period: 'proximos', query: '', page: 1 }).toString()).toBe('')
    expect(serializeFilters({ court: 1, period: 'pasados', query: '6800', page: 2 }).toString()).toBe(
      'juzgado=1&periodo=pasados&q=6800&pagina=2',
    )
  })

  it('leer lo escrito devuelve los mismos filtros', () => {
    const filters = { court: 2, period: 'pasados', query: '12345', page: 4 } as const
    expect(parseFilters(serializeFilters(filters))).toEqual(filters)
  })
})
