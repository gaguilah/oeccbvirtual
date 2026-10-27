import { describe, expect, it } from 'vitest'
import { formatPhone, normalizePhone, PHONE_CHARS, PHONE_PATTERN, relationshipLabel } from './personalData'

describe('normalizePhone', () => {
  it('deja solo los dígitos', () => {
    expect(normalizePhone('300 123 4567')).toBe('3001234567')
    expect(normalizePhone('(300) 123-45.67')).toBe('3001234567')
  })

  it('quita el indicativo +57', () => {
    expect(normalizePhone('+57 300 123 4567')).toBe('3001234567')
    expect(normalizePhone('573001234567')).toBe('3001234567')
  })

  it('no quita un 57 que no es indicativo', () => {
    expect(normalizePhone('5712345')).toBe('5712345')
  })
})

describe('PHONE_CHARS y PHONE_PATTERN', () => {
  it('acepta los separadores habituales y rechaza letras', () => {
    expect(PHONE_CHARS.test('+57 (300) 123-45.67')).toBe(true)
    expect(PHONE_CHARS.test('300abc4567')).toBe(false)
    expect(PHONE_CHARS.test('300 123 4567 ext')).toBe(false)
  })

  it('exige 10 dígitos que empiecen por 3', () => {
    expect(PHONE_PATTERN.test('3001234567')).toBe(true)
    expect(PHONE_PATTERN.test('6071234567')).toBe(false)
    expect(PHONE_PATTERN.test('300123456')).toBe(false)
    expect(PHONE_PATTERN.test('30012345678')).toBe(false)
  })
})

describe('formatPhone', () => {
  it('separa un celular válido en 3 · 3 · 4', () => {
    expect(formatPhone('3001234567')).toBe('300 123 4567')
  })

  it('deja igual lo que no es un celular válido', () => {
    expect(formatPhone('12345')).toBe('12345')
  })
})

describe('relationshipLabel', () => {
  it('traduce el código guardado', () => {
    expect(relationshipLabel('conyuge')).toBe('Cónyuge o compañero(a) permanente')
    expect(relationshipLabel('otro_familiar')).toBe('Otro familiar')
  })

  it('devuelve null sin parentesco y el código si no lo conoce', () => {
    expect(relationshipLabel(null)).toBeNull()
    expect(relationshipLabel('primo')).toBe('primo')
  })
})
