import { describe, expect, it } from 'vitest'
// El plazo lo calcula pqrs_due_date (20261007150000_non_business_days.sql); aquí solo se muestra.
import nonBusinessDaysSql from '../../../supabase/migrations/20261007150000_non_business_days.sql?raw'
import respondRequestSource from '../../../supabase/functions/respond-request/index.ts?raw'
import submitRequestSource from '../../../supabase/functions/submit-request/index.ts?raw'
import { EMAIL_KINDS, isPending, RESPONSE_MAX_CHARS, RESPONSE_MIN_CHARS, STATUS, TABS } from './data'
import { deadlineFor, RESPONSE_BUSINESS_DAYS } from './deadline'
import type { RequestStatus } from './types'

const due = '2026-11-20'
const row = (status: RequestStatus, business_days_left: number) => ({ status, due_date: due, business_days_left })

describe('deadlineFor', () => {
  it('solo las pendientes tienen plazo', () => {
    expect(deadlineFor(row('respondida', -5))).toEqual({ kind: 'none' })
    expect(deadlineFor(row('cerrada', 2))).toEqual({ kind: 'none' })
    expect(deadlineFor(row('recibida', 10)).kind).toBe('ok')
    expect(deadlineFor(row('en_tramite', 10)).kind).toBe('ok')
  })

  it('a tiempo, por vencer (3 días hábiles o menos), vence hoy y vencida', () => {
    expect(deadlineFor(row('recibida', 4))).toEqual({ kind: 'ok', days: 4, due })
    expect(deadlineFor(row('recibida', 3))).toEqual({ kind: 'soon', days: 3, due })
    expect(deadlineFor(row('recibida', 1))).toEqual({ kind: 'soon', days: 1, due })
    expect(deadlineFor(row('recibida', 0))).toEqual({ kind: 'today', days: 0, due })
  })

  it('vencida cuenta los días de atraso en positivo', () => {
    expect(deadlineFor(row('en_tramite', -2))).toEqual({ kind: 'overdue', days: 2, due })
  })

  it('la base cuenta el mismo número de días hábiles', () => {
    // offset 14 limit 1: el día hábil número 15 desde el día siguiente a la radicación.
    expect(nonBusinessDaysSql).toContain(`offset ${RESPONSE_BUSINESS_DAYS - 1} limit 1`)
  })
})

describe('datos de PQRS', () => {
  it('pendientes: recibida y en trámite', () => {
    const pending = (Object.keys(STATUS) as RequestStatus[]).filter(isPending)
    expect(pending).toEqual(['recibida', 'en_tramite'])
  })

  it('pestañas únicas, con pendientes primero (la predeterminada)', () => {
    const values = TABS.map((tab) => tab.value)
    expect(new Set(values).size).toBe(values.length)
    expect(values[0]).toBe('pendientes')
  })

  it('cada correo que envían las Edge Functions tiene nombre en el historial', () => {
    for (const kind of Object.keys(EMAIL_KINDS)) {
      expect(`${submitRequestSource}\n${respondRequestSource}`, kind).toContain(`'${kind}'`)
    }
  })

  it('respond-request usa los mismos límites de la respuesta', () => {
    expect(respondRequestSource).toContain(`const RESPONSE_MIN = ${RESPONSE_MIN_CHARS}`)
    expect(respondRequestSource).toContain(`const RESPONSE_MAX = ${RESPONSE_MAX_CHARS}`)
  })
})
