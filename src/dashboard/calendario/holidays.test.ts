import { describe, expect, it } from 'vitest'
import { colombianHolidays, easterSunday, judicialDays, weekdaysBetween } from './holidays'

const days = (list: { day: string }[]) => list.map((item) => item.day)
const weekday = (day: string) => new Date(`${day}T00:00:00Z`).getUTCDay()

describe('easterSunday', () => {
  it('domingos de Pascua conocidos', () => {
    const known: Record<number, string> = {
      2019: '2019-04-21',
      2024: '2024-03-31',
      2025: '2025-04-20',
      2026: '2026-04-05',
      2027: '2027-03-28',
      2038: '2038-04-25',
    }
    for (const [year, day] of Object.entries(known)) {
      expect(easterSunday(Number(year)).toISOString().slice(0, 10)).toBe(day)
    }
  })
})

describe('colombianHolidays', () => {
  it('2026: los 18 festivos del calendario oficial', () => {
    expect(days(colombianHolidays(2026))).toEqual([
      '2026-01-01',
      '2026-01-12',
      '2026-03-23',
      '2026-04-02',
      '2026-04-03',
      '2026-05-01',
      '2026-05-18',
      '2026-06-08',
      '2026-06-15',
      '2026-06-29',
      '2026-07-20',
      '2026-08-07',
      '2026-08-17',
      '2026-10-12',
      '2026-11-02',
      '2026-11-16',
      '2026-12-08',
      '2026-12-25',
    ])
  })

  it('2025: sin los que caen en domingo y con San Pedro y Sagrado Corazón en un solo día', () => {
    const list = colombianHolidays(2025)
    // 20 de julio de 2025 fue domingo.
    expect(days(list)).not.toContain('2025-07-20')
    expect(list.filter((item) => item.day === '2025-06-30')).toEqual([
      { day: '2025-06-30', reason: 'San Pedro y San Pablo y Sagrado Corazón de Jesús' },
    ])
    expect(days(list)).toEqual(expect.arrayContaining(['2025-01-06', '2025-03-24', '2025-06-02', '2025-06-23']))
  })

  it('cualquier año: días únicos, ordenados, de lunes a viernes; los trasladados caen en lunes', () => {
    for (let year = 2024; year <= 2060; year++) {
      const list = colombianHolidays(year)
      const all = days(list)
      expect(new Set(all).size, String(year)).toBe(all.length)
      expect([...all].sort(), String(year)).toEqual(all)
      for (const item of list) {
        expect(item.day.startsWith(String(year))).toBe(true)
        expect(weekday(item.day), item.day).not.toBe(0)
        expect(weekday(item.day), item.day).not.toBe(6)
        if (
          /Reyes|San José|San Pedro|Asunción|Diversidad|Todos los Santos|Cartagena|Ascensión|Corpus|Sagrado/.test(
            item.reason,
          )
        ) {
          expect(weekday(item.day), `${item.day} ${item.reason}`).toBe(1)
        }
      }
    }
  })
})

describe('judicialDays', () => {
  it('2026: vacancia, lunes a miércoles santos y 17 de diciembre, sin fines de semana ni festivos', () => {
    expect(days(judicialDays(2026))).toEqual([
      // 2 al 10 de enero: sin el 3 y 4 (fin de semana) ni el 12 (Reyes, ya fuera del rango).
      '2026-01-02',
      '2026-01-05',
      '2026-01-06',
      '2026-01-07',
      '2026-01-08',
      '2026-01-09',
      '2026-03-30',
      '2026-03-31',
      '2026-04-01',
      '2026-12-17',
      // 20 al 31 de diciembre: sin fines de semana ni el 25 (Navidad).
      '2026-12-21',
      '2026-12-22',
      '2026-12-23',
      '2026-12-24',
      '2026-12-28',
      '2026-12-29',
      '2026-12-30',
      '2026-12-31',
    ])
  })

  it('no repite un festivo: Reyes el 6 de enero de 2025 queda solo como festivo', () => {
    expect(days(colombianHolidays(2025))).toContain('2025-01-06')
    expect(days(judicialDays(2025))).not.toContain('2025-01-06')
  })

  it('cualquier año: días únicos y sin cruzarse con los festivos', () => {
    for (let year = 2024; year <= 2060; year++) {
      const holidays = new Set(days(colombianHolidays(year)))
      const all = days(judicialDays(year))
      expect(new Set(all).size, String(year)).toBe(all.length)
      for (const day of all) expect(holidays.has(day), day).toBe(false)
    }
  })
})

describe('weekdaysBetween', () => {
  it('de lunes a viernes, ambos extremos incluidos', () => {
    expect(weekdaysBetween('2026-10-29', '2026-11-03')).toEqual([
      '2026-10-29',
      '2026-10-30',
      '2026-11-02',
      '2026-11-03',
    ])
    expect(weekdaysBetween('2026-10-31', '2026-11-01')).toEqual([])
    expect(weekdaysBetween('2026-11-02', '2026-11-02')).toEqual(['2026-11-02'])
  })
})
