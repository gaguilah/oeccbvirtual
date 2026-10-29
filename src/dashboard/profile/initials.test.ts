import { describe, expect, it } from 'vitest'
import { initials } from './initials'

describe('initials', () => {
  it('primera y última palabra, o la primera letra del correo', () => {
    expect(initials('Ana María Pérez')).toBe('AP')
    expect(initials('  ana  ')).toBe('A')
    expect(initials('ñandú@correo.co')).toBe('Ñ')
    expect(initials('')).toBe('?')
  })
})
