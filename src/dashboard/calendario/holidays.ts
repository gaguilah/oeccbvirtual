// Festivos de Colombia y días de la Rama Judicial de un año, para la vista previa de "Cargar
// calendario" (docs/plan-dias-no-habiles.md). Fechas como 'YYYY-MM-DD' sobre UTC, para que el huso
// del navegador no corra el día.

export type CandidateDay = { day: string; reason: string }

function date(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day))
}

function key(value: Date) {
  return value.toISOString().slice(0, 10)
}

function addDays(value: Date, days: number) {
  return new Date(value.getTime() + days * 86_400_000)
}

function isWeekday(value: Date) {
  const day = value.getUTCDay()
  return day !== 0 && day !== 6
}

// Domingo de Pascua (algoritmo de Meeus/Jones/Butcher, calendario gregoriano).
export function easterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return date(year, month, day)
}

// Ley 51 de 1983 (Ley Emiliani): si el festivo no cae en lunes, se traslada al lunes siguiente.
function nextMonday(value: Date) {
  const day = value.getUTCDay()
  return day === 1 ? value : addDays(value, (8 - day) % 7)
}

// Festivos nacionales de Colombia de un año (solo los que caen de lunes a viernes: los demás no
// cambian el conteo de días hábiles).
export function colombianHolidays(year: number): CandidateDay[] {
  const easter = easterSunday(year)
  const list: [Date, string][] = [
    // Fijos.
    [date(year, 1, 1), 'Año Nuevo'],
    [date(year, 5, 1), 'Día del Trabajo'],
    [date(year, 7, 20), 'Día de la Independencia'],
    [date(year, 8, 7), 'Batalla de Boyacá'],
    [date(year, 12, 8), 'Inmaculada Concepción'],
    [date(year, 12, 25), 'Navidad'],
    // Trasladables al lunes.
    [nextMonday(date(year, 1, 6)), 'Día de los Reyes Magos'],
    [nextMonday(date(year, 3, 19)), 'Día de San José'],
    [nextMonday(date(year, 6, 29)), 'San Pedro y San Pablo'],
    [nextMonday(date(year, 8, 15)), 'Asunción de la Virgen'],
    [nextMonday(date(year, 10, 12)), 'Día de la Diversidad Étnica y Cultural'],
    [nextMonday(date(year, 11, 1)), 'Todos los Santos'],
    [nextMonday(date(year, 11, 11)), 'Independencia de Cartagena'],
    // Según la Pascua.
    [addDays(easter, -3), 'Jueves Santo'],
    [addDays(easter, -2), 'Viernes Santo'],
    [nextMonday(addDays(easter, 39)), 'Ascensión del Señor'],
    [nextMonday(addDays(easter, 60)), 'Corpus Christi'],
    [nextMonday(addDays(easter, 68)), 'Sagrado Corazón de Jesús'],
  ]
  return list
    .filter(([value]) => isWeekday(value))
    .map(([value, reason]) => ({ day: key(value), reason }))
    .sort((x, y) => x.day.localeCompare(y.day))
}

// Días de la Rama Judicial de un año (tipo "cierre"): lunes a miércoles santos, 17 de diciembre
// (Día de la Rama Judicial) y la vacancia judicial colectiva (2 al 10 de enero, que viene del
// diciembre anterior, y 20 al 31 de diciembre). Sin fines de semana ni los que ya son festivos.
export function judicialDays(year: number): CandidateDay[] {
  const easter = easterSunday(year)
  const holidays = new Set(colombianHolidays(year).map((holiday) => holiday.day))
  const days: CandidateDay[] = []
  const push = (value: Date, reason: string) => {
    if (isWeekday(value) && !holidays.has(key(value))) days.push({ day: key(value), reason })
  }

  for (let day = 2; day <= 10; day++) push(date(year, 1, day), 'Vacancia judicial')
  push(addDays(easter, -6), 'Lunes Santo (Semana Santa)')
  push(addDays(easter, -5), 'Martes Santo (Semana Santa)')
  push(addDays(easter, -4), 'Miércoles Santo (Semana Santa)')
  push(date(year, 12, 17), 'Día de la Rama Judicial')
  for (let day = 20; day <= 31; day++) push(date(year, 12, day), 'Vacancia judicial')

  return days.sort((x, y) => x.day.localeCompare(y.day))
}

// Días de lunes a viernes entre dos fechas (inclusive), para agregar un rango.
export function weekdaysBetween(from: string, to: string): string[] {
  const days: string[] = []
  const end = new Date(`${to}T00:00:00Z`)
  for (let value = new Date(`${from}T00:00:00Z`); value <= end; value = addDays(value, 1)) {
    if (isWeekday(value)) days.push(key(value))
  }
  return days
}
