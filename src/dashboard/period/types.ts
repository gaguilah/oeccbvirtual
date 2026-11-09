export type YearMonth = { year: number; month: number }

export type Period =
  { mode: 'mes'; month: YearMonth } | { mode: 'rango'; from: YearMonth; to: YearMonth } | { mode: 'anio'; year: number }

export type PeriodMode = Period['mode']
