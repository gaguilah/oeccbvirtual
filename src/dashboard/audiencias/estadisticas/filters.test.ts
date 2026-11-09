import { describe, expect, it } from 'vitest'
import type { HearingType } from '../types'
import { changeStatsFilters, parseStatsFilters, typesForModality, virtualParam, withStatsFilters } from './filters'

const type = (id: number, requires_link: boolean, is_active = true): HearingType => ({
  id,
  description: `Tipo ${id}`,
  requires_link,
  is_active,
  created_at: '2026-10-08T08:00:00-05:00',
})
const virtual = type(1, true)
const presencial = type(2, false)
const inactiva = type(3, false, false)
const types = [virtual, presencial, inactiva]

const parse = (query: string, forced: 1 | 2 | null = null) => parseStatsFilters(new URLSearchParams(query), forced)

describe('filtros de estadísticas en la URL', () => {
  it('sin parámetros: todos los juzgados, tipos y modalidades', () => {
    expect(parse('')).toEqual({ court: null, type: null, modality: null })
  })
  it('lee juzgado, tipo y modalidad', () => {
    expect(parse('juzgado=2&tipo=4&modalidad=presencial')).toEqual({ court: 2, type: 4, modality: 'presencial' })
  })
  it('ignora valores inválidos', () => {
    expect(parse('juzgado=3&tipo=-1&modalidad=hibrida')).toEqual({ court: null, type: null, modality: null })
    expect(parse('tipo=abc').type).toBeNull()
  })
  it('un usuario de juzgado queda en el suyo aunque la URL diga otro', () => {
    expect(parse('juzgado=2', 1).court).toBe(1)
  })
  it('conserva el periodo y no escribe el juzgado forzado', () => {
    const current = new URLSearchParams('periodo=anio&anio=2026&juzgado=2')
    expect(withStatsFilters(current, { court: 1, type: 4, modality: 'virtual' }, 1).toString()).toBe(
      'periodo=anio&anio=2026&tipo=4&modalidad=virtual',
    )
    expect(withStatsFilters(current, { court: 2, type: null, modality: null }, null).toString()).toBe(
      'periodo=anio&anio=2026&juzgado=2',
    )
  })
})

describe('modalidad', () => {
  it('sale del tipo: virtual = requiere enlace; incluye los inactivos', () => {
    expect(typesForModality(types, 'virtual')).toEqual([virtual])
    expect(typesForModality(types, 'presencial')).toEqual([presencial, inactiva])
    expect(typesForModality(types, null)).toEqual(types)
  })
  it('al cambiar a una modalidad que no incluye el tipo elegido, el tipo vuelve a Todos', () => {
    const filters = { court: null, type: 1, modality: null }
    expect(changeStatsFilters(filters, { modality: 'presencial' }, types)).toEqual({
      court: null,
      type: null,
      modality: 'presencial',
    })
    expect(changeStatsFilters(filters, { modality: 'virtual' }, types).type).toBe(1)
  })
  it('p_virtual de hearing_stats', () => {
    expect(virtualParam('virtual')).toBe(true)
    expect(virtualParam('presencial')).toBe(false)
    expect(virtualParam(null)).toBeNull()
  })
})
