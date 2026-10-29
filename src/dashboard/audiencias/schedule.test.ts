import { describe, expect, it } from 'vitest'
// Mismas reglas que hearing_schedule_error (20261008150000_hearings.sql): cambiar juntos.
import hearingsSql from '../../../supabase/migrations/20261008150000_hearings.sql?raw'
import { FIRST_HOUR, LAST_HOUR, TIME_OPTIONS } from './data'
import { scheduleProblem } from './schedule'

const now = new Date('2026-10-29T08:00:00-05:00').getTime()
const holidays = [{ day: '2026-11-02', reason: 'Todos los Santos' }]
const pad = (hour: number) => `${String(hour).padStart(2, '0')}:00`

describe('scheduleProblem', () => {
  it('sin fecha no hay problema; sin hora solo se revisa el día', () => {
    expect(scheduleProblem('', '09:00', holidays, now)).toBeNull()
    expect(scheduleProblem('2026-10-30', '', holidays, now)).toBeNull()
    expect(scheduleProblem('2026-10-31', '', holidays, now)).toMatch(/sábados y domingos/)
  })

  it('un día hábil futuro, en punto o en cuartos de hora, sirve', () => {
    for (const time of ['09:00', '09:15', '09:30', '09:45']) {
      expect(scheduleProblem('2026-10-30', time, holidays, now)).toBeNull()
    }
  })

  it('sábados, domingos y días no hábiles no sirven', () => {
    expect(scheduleProblem('2026-10-31', '09:00', holidays, now)).toMatch(/sábados y domingos/)
    expect(scheduleProblem('2026-11-01', '09:00', holidays, now)).toMatch(/sábados y domingos/)
    expect(scheduleProblem('2026-11-02', '09:00', holidays, now)).toBe('No es día hábil: Todos los Santos.')
  })

  it('días no hábiles aún sin cargar no se marcan', () => {
    expect(scheduleProblem('2026-11-02', '09:00', null, now)).toBeNull()
  })

  it('de la primera a la última hora, ambas incluidas', () => {
    expect(scheduleProblem('2026-10-30', pad(FIRST_HOUR), holidays, now)).toBeNull()
    expect(scheduleProblem('2026-10-30', pad(LAST_HOUR), holidays, now)).toBeNull()
    expect(scheduleProblem('2026-10-30', '06:45', holidays, now)).toMatch(/entre las 7:00 a\. m\. y las 5:00 p\. m\./)
    expect(scheduleProblem('2026-10-30', '17:15', holidays, now)).toMatch(/entre las/)
  })

  it('minutos fuera de los cuartos de hora no sirven', () => {
    expect(scheduleProblem('2026-10-30', '09:10', holidays, now)).toMatch(/en punto/)
  })

  it('debe ser futura: la hora exacta de ahora ya no sirve', () => {
    expect(scheduleProblem('2026-10-29', '08:00', holidays, now)).toBe('La fecha y hora deben ser futuras.')
    expect(scheduleProblem('2026-10-29', '08:15', holidays, now)).toBeNull()
    expect(scheduleProblem('2026-10-28', '09:00', holidays, now)).toBe('La fecha y hora deben ser futuras.')
  })

  it('TIME_OPTIONS ofrece justo las horas que acepta', () => {
    expect(TIME_OPTIONS[0]).toEqual({ value: pad(FIRST_HOUR), label: '7:00 a. m.' })
    expect(TIME_OPTIONS.at(-1)).toEqual({ value: pad(LAST_HOUR), label: '5:00 p. m.' })
    expect(TIME_OPTIONS).toHaveLength((LAST_HOUR - FIRST_HOUR) * 4 + 1)
    for (const { value } of TIME_OPTIONS) expect(scheduleProblem('2026-10-30', value, holidays, now), value).toBeNull()
  })

  it('la migración usa las mismas horas y los mismos saltos', () => {
    expect(hearingsSql).toContain(
      `v_local::time < time '${pad(FIRST_HOUR)}' or v_local::time > time '${pad(LAST_HOUR)}'`,
    )
    expect(hearingsSql).toContain('extract(minute from v_local)::integer % 15 <> 0')
  })
})
