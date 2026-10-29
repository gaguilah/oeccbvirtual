import { describe, expect, it } from 'vitest'
import {
  addDays,
  addMonths,
  dayOf,
  isoWeekday,
  isWeekend,
  longWeekday,
  minutesOfDay,
  monthStart,
  monthTitle,
  monthWeeks,
  shortWeekday,
  startOfDay,
  toScheduledAt,
  weekDays,
  weekStart,
  weekTitle,
} from './dates'

describe('días de calendario', () => {
  it('suma días y meses cruzando meses y años', () => {
    expect(addDays('2026-10-29', 3)).toBe('2026-11-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
    expect(addMonths('2026-12-15', 1)).toBe('2027-01-01')
    expect(addMonths('2026-03-31', -1)).toBe('2026-02-01')
    expect(monthStart('2026-10-29')).toBe('2026-10-01')
  })

  it('día de la semana de lunes (1) a domingo (7)', () => {
    expect(isoWeekday('2026-10-26')).toBe(1)
    expect(isoWeekday('2026-11-01')).toBe(7)
    expect(isWeekend('2026-10-30')).toBe(false)
    expect(isWeekend('2026-10-31')).toBe(true)
  })

  it('la semana va de lunes a viernes, también desde un domingo', () => {
    expect(weekStart('2026-10-29')).toBe('2026-10-26')
    expect(weekStart('2026-11-01')).toBe('2026-10-26')
    expect(weekDays('2026-10-29')).toEqual(['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30'])
  })
})

describe('monthWeeks', () => {
  it('semanas de lunes a viernes que tocan el mes', () => {
    const weeks = monthWeeks('2026-10-15')
    expect(weeks.map((week) => week[0])).toEqual(['2026-09-28', '2026-10-05', '2026-10-12', '2026-10-19', '2026-10-26'])
    for (const week of weeks) expect(week).toHaveLength(5)
  })

  it('un mes que empieza en fin de semana no lleva una fila solo del mes anterior', () => {
    // Noviembre de 2026 empieza en domingo; agosto, en sábado.
    expect(monthWeeks('2026-11-20')[0][0]).toBe('2026-11-02')
    expect(monthWeeks('2026-08-20')[0][0]).toBe('2026-08-03')
    for (const day of ['2026-08-20', '2026-10-15', '2026-11-20']) {
      for (const week of monthWeeks(day)) {
        expect(
          week.some((d) => d.slice(0, 7) === day.slice(0, 7)),
          week[0],
        ).toBe(true)
      }
    }
  })

  it('termina en la semana del último día del mes', () => {
    expect(monthWeeks('2026-11-20').at(-1)?.[4]).toBe('2026-12-04')
    expect(monthWeeks('2026-10-15').at(-1)?.[4]).toBe('2026-10-30')
  })
})

describe('textos', () => {
  it('día, semana y mes en español', () => {
    expect(shortWeekday('2026-10-26')).toBe('lun 26')
    expect(longWeekday('2026-10-26')).toBe('Lunes, 26 de octubre')
    expect(monthTitle('2026-10-26')).toBe('Octubre de 2026')
  })

  it('weekTitle dentro de un mes, entre meses y entre años', () => {
    expect(weekTitle('2026-10-29')).toBe('Semana del 26 al 30 de octubre de 2026')
    expect(weekTitle('2026-10-01')).toBe('Semana del 28 de septiembre al 2 de octubre de 2026')
    expect(weekTitle('2026-12-31')).toBe('Semana del 28 de diciembre al 1 de enero de 2027')
  })
})

describe('hora de Colombia', () => {
  it('minutos y día de un instante en Bogotá, sin depender de la zona del equipo', () => {
    expect(minutesOfDay('2026-10-29T14:30:00Z')).toBe(9 * 60 + 30)
    expect(dayOf('2026-10-30T03:00:00Z')).toBe('2026-10-29')
  })

  it('startOfDay y toScheduledAt con el desfase de -05:00', () => {
    expect(startOfDay('2026-10-29')).toBe('2026-10-29T05:00:00.000Z')
    expect(toScheduledAt('2026-10-29', '17:00')).toBe('2026-10-29T22:00:00.000Z')
  })
})
