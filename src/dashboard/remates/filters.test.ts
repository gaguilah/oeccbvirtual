import { describe, expect, it } from 'vitest'
import { parseAdminFilters, serializeAdminFilters } from './filters'
import type { AdminFilters } from './types'

const DEFAULTS: AdminFilters = { court: null, period: 'proximos', publication: 'todos', query: '', page: 1 }
const parse = (query: string, forced: 1 | 2 | null = null) => parseAdminFilters(new URLSearchParams(query), forced)

describe('filtros de la URL de Avisos de Remate (dashboard)', () => {
  it('sin parámetros: próximos, todos, sin juzgado, página 1', () => {
    expect(parse('')).toEqual(DEFAULTS)
  })

  it('lee juzgado, periodo, publicación, búsqueda y página', () => {
    expect(parse('juzgado=2&periodo=todos&publicacion=ocultos&q=6800-1&pagina=3')).toEqual({
      court: 2,
      period: 'todos',
      publication: 'ocultos',
      query: '68001',
      page: 3,
    })
  })

  it('valores inválidos vuelven al predeterminado', () => {
    expect(parse('juzgado=3&periodo=ayer&publicacion=borrados&q=abc&pagina=0')).toEqual(DEFAULTS)
  })

  it('el juzgado forzado manda sobre la URL y no se escribe en ella', () => {
    expect(parse('juzgado=2', 1).court).toBe(1)
    expect(serializeAdminFilters({ ...DEFAULTS, court: 1 }, 1).toString()).toBe('')
  })

  it('los predeterminados no van en la URL; lo que se escribe se lee igual', () => {
    expect(serializeAdminFilters(DEFAULTS, null).toString()).toBe('')
    const filters: AdminFilters = { court: 1, period: 'pasados', publication: 'publicados', query: '6800', page: 2 }
    expect(parseAdminFilters(serializeAdminFilters(filters, null), null)).toEqual(filters)
  })
})
