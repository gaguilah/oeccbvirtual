import { describe, expect, it } from 'vitest'
import { parsePublicationFilters, serializePublicationFilters } from './filters'

const NOW = new Date('2026-11-20T16:00:00-05:00')
const parse = (query: string, forced: 1 | 2 | null = null) =>
  parsePublicationFilters(new URLSearchParams(query), forced, NOW)

describe('filtros de la publicación', () => {
  it('por defecto: Juzgado 1 y la semana siguiente', () => {
    expect(parse('')).toEqual({ court: 1, monday: '2026-11-23' })
  })

  it('la fecha de la URL se lleva a su lunes; las inválidas se ignoran', () => {
    expect(parse('juzgado=2&semana=2026-11-12')).toEqual({ court: 2, monday: '2026-11-09' })
    expect(parse('semana=2026-02-31').monday).toBe('2026-11-23')
    expect(parse('semana=hoy&juzgado=7')).toEqual({ court: 1, monday: '2026-11-23' })
  })

  it('el juzgado del usuario manda y no va en la URL', () => {
    expect(parse('juzgado=1', 2).court).toBe(2)
    expect(serializePublicationFilters({ court: 2, monday: '2026-11-23' }, 2, NOW).toString()).toBe('')
  })

  it('solo guarda en la URL lo que no es el valor por defecto', () => {
    expect(serializePublicationFilters({ court: 1, monday: '2026-11-23' }, null, NOW).toString()).toBe('')
    expect(serializePublicationFilters({ court: 2, monday: '2026-11-30' }, null, NOW).toString()).toBe(
      'juzgado=2&semana=2026-11-30',
    )
  })
})
