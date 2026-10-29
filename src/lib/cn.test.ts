import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('une clases condicionales', () => {
    const hidden = false
    expect(cn('px-2', hidden && 'hidden', null, undefined, ['text-sm'])).toBe('px-2 text-sm')
  })

  it('la última clase de Tailwind en conflicto gana (así className sobrescribe)', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
    expect(cn('text-on-surface', 'text-primary')).toBe('text-primary')
  })
})
