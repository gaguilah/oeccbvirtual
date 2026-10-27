import { describe, expect, it } from 'vitest'
import { nearestIndex, wrapIndex } from './carousel'

describe('wrapIndex', () => {
  it('avanza y retrocede dentro de la lista', () => {
    expect(wrapIndex(1, 5)).toBe(1)
    expect(wrapIndex(3, 5)).toBe(3)
  })

  it('después de la última vuelve a la primera', () => {
    expect(wrapIndex(5, 5)).toBe(0)
  })

  it('antes de la primera va a la última', () => {
    expect(wrapIndex(-1, 5)).toBe(4)
  })
})

describe('nearestIndex', () => {
  const offsets = [0, 480, 960, 1440, 1920]

  it('encuentra la tarjeta alineada al inicio', () => {
    expect(nearestIndex(offsets, 0)).toBe(0)
    expect(nearestIndex(offsets, 960)).toBe(2)
    expect(nearestIndex(offsets, 1920)).toBe(4)
  })

  it('a mitad de un desplazamiento elige la más cercana', () => {
    expect(nearestIndex(offsets, 200)).toBe(0)
    expect(nearestIndex(offsets, 300)).toBe(1)
    expect(nearestIndex(offsets, 1600)).toBe(3)
    expect(nearestIndex(offsets, 1700)).toBe(4)
  })
})
