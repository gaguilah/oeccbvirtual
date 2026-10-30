import { describe, expect, it } from 'vitest'
import { REALIZADO_DESPUES_DE_MIN } from './constants'
import { dateParts, formatDate, formatLongDate, formatTime, isRealizado, realizadoCutoff } from './dates'

// Intl usa espacios especiales (sin salto) en "p. m."; se comparan como espacios normales.
const plain = (text: string) => text.replace(/\s/g, ' ')

describe('fechas en hora de Bogotá', () => {
  it('formatea fecha, hora y fecha larga', () => {
    const iso = '2026-02-17T14:30:00-05:00'
    expect(plain(formatDate(iso))).toBe('17 de feb de 2026')
    expect(plain(formatTime(iso))).toBe('2:30 p. m.')
    expect(formatLongDate(iso)).toBe('17 de febrero de 2026')
  })

  it('usa la zona de Bogotá aunque la fecha venga en UTC', () => {
    // 04:59 UTC del 1 de enero = 11:59 p. m. del 31 de diciembre en Bogotá.
    const iso = '2026-01-01T04:59:00Z'
    expect(plain(formatDate(iso))).toBe('31 de dic de 2025')
    expect(plain(formatTime(iso))).toBe('11:59 p. m.')
  })

  it('formatea la mañana y el mediodía', () => {
    expect(plain(formatTime('2026-03-02T08:05:00-05:00'))).toBe('8:05 a. m.')
    expect(plain(formatTime('2026-03-02T12:00:00-05:00'))).toBe('12:00 p. m.')
  })

  it('arma las partes del bloque de calendario', () => {
    expect(dateParts('2026-11-12T09:00:00-05:00')).toEqual({ day: '12', month: 'NOV', year: '2026' })
    expect(dateParts('2026-09-03T09:00:00-05:00')).toEqual({ day: '03', month: 'SEPT', year: '2026' })
  })
})

describe('Agendado / Realizado', () => {
  const now = new Date('2026-10-29T10:00:00-05:00')
  const minutesBefore = (minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString()

  it(`el corte es ${REALIZADO_DESPUES_DE_MIN} minutos antes de ahora`, () => {
    expect(realizadoCutoff(now).toISOString()).toBe(minutesBefore(REALIZADO_DESPUES_DE_MIN))
  })

  it('pasa a Realizado justo en el corte, no antes', () => {
    expect(isRealizado(minutesBefore(REALIZADO_DESPUES_DE_MIN - 1), now)).toBe(false)
    expect(isRealizado(minutesBefore(REALIZADO_DESPUES_DE_MIN), now)).toBe(true)
    expect(isRealizado(minutesBefore(REALIZADO_DESPUES_DE_MIN + 1), now)).toBe(true)
  })

  it('un remate futuro sigue Agendado', () => {
    expect(isRealizado('2026-10-30T10:00:00-05:00', now)).toBe(false)
  })
})
