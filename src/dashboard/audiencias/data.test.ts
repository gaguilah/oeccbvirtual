import { describe, expect, it } from 'vitest'
// Mismas condiciones que hearings_rules (última versión en 20261014120000_hearings_filed.sql): cambiar juntos.
import hearingsRulesSql from '../../../supabase/migrations/20261014120000_hearings_filed.sql?raw'
import {
  CLOSE_AFTER_MINUTES,
  canCancelNow,
  canRealizeNow,
  deleteBlocker,
  isClosed,
  isPendingClose,
  missingLink,
  realizeFrom,
  timeLabel,
  typeName,
} from './data'
import { testHearing } from './testHearing'
import type { HearingType } from './types'

const scheduled = new Date('2026-10-29T09:00:00-05:00')
const minutesAfter = (minutes: number) => new Date(scheduled.getTime() + minutes * 60_000)
const type = (overrides: Partial<HearingType> = {}): HearingType => ({
  id: 1,
  description: 'Remate',
  requires_link: true,
  is_active: true,
  created_at: '2026-10-01T08:00:00-05:00',
  ...overrides,
})

describe('cierre de audiencias', () => {
  it('Realizada desde CLOSE_AFTER_MINUTES después de la hora, no antes', () => {
    const hearing = testHearing()
    expect(realizeFrom(hearing)).toEqual(minutesAfter(CLOSE_AFTER_MINUTES))
    expect(canRealizeNow(hearing, minutesAfter(CLOSE_AFTER_MINUTES - 1))).toBe(false)
    expect(canRealizeNow(hearing, minutesAfter(CLOSE_AFTER_MINUTES))).toBe(true)
  })

  it('Cancelada desde la hora programada', () => {
    const hearing = testHearing()
    expect(canCancelNow(hearing, minutesAfter(-1))).toBe(false)
    expect(canCancelNow(hearing, scheduled)).toBe(true)
  })

  it('una cerrada no se vuelve a cerrar', () => {
    for (const status_id of [2, 3] as const) {
      const hearing = testHearing({ status_id })
      expect(isClosed(hearing)).toBe(true)
      expect(canRealizeNow(hearing, minutesAfter(120))).toBe(false)
      expect(canCancelNow(hearing, minutesAfter(120))).toBe(false)
      expect(isPendingClose(hearing, minutesAfter(120))).toBe(false)
    }
  })

  it('por cerrar: Programada cuya hora llegó', () => {
    expect(isPendingClose(testHearing(), minutesAfter(-1))).toBe(false)
    expect(isPendingClose(testHearing(), scheduled)).toBe(true)
  })

  it('la migración usa el mismo margen para Realizada y la hora para Cancelada', () => {
    expect(CLOSE_AFTER_MINUTES).toBe(60)
    expect(hearingsRulesSql).toContain("now() < old.scheduled_at + interval '1 hour'")
    expect(hearingsRulesSql).toContain('now() < old.scheduled_at then')
  })
})

describe('deleteBlocker', () => {
  const before = minutesAfter(-60)

  it('se elimina una Programada futura sin enlace ni grabación', () => {
    expect(deleteBlocker(testHearing(), before)).toBeNull()
  })

  it('cada condición tiene su motivo', () => {
    expect(deleteBlocker(testHearing({ status_id: 3 }), before)).toBe('La audiencia ya está cerrada')
    expect(deleteBlocker(testHearing(), scheduled)).toBe('La fecha ya pasó: cancélela')
    expect(deleteBlocker(testHearing({ connection_url: 'https://x.test' }), before)).toBe('Tiene enlace de conexión')
    expect(deleteBlocker(testHearing({ recording_url: 'https://x.test' }), before)).toBe('Tiene grabación')
  })

  it('la migración pide las mismas condiciones', () => {
    expect(hearingsRulesSql).toContain(
      'old.status_id = 1 and old.scheduled_at > now() and old.connection_url is null and old.recording_url is null',
    )
  })
})

describe('missingLink', () => {
  it('solo una Programada cuyo tipo requiere enlace y no lo tiene', () => {
    expect(missingLink(testHearing(), type())).toBe(true)
    expect(missingLink(testHearing({ connection_url: 'https://x.test' }), type())).toBe(false)
    expect(missingLink(testHearing(), type({ requires_link: false }))).toBe(false)
    expect(missingLink(testHearing(), undefined)).toBe(false)
    expect(missingLink(testHearing({ status_id: 3 }), type())).toBe(false)
  })
})

describe('textos', () => {
  it('timeLabel en 12 horas', () => {
    expect(timeLabel('07:00')).toBe('7:00 a. m.')
    expect(timeLabel('12:00')).toBe('12:00 p. m.')
    expect(timeLabel('17:45')).toBe('5:45 p. m.')
    expect(timeLabel('00:30')).toBe('12:30 a. m.')
  })

  it('typeName con tipo desconocido', () => {
    expect(typeName([type()], 1)).toBe('Remate')
    expect(typeName([type()], 9)).toBe('Tipo desconocido')
  })
})
