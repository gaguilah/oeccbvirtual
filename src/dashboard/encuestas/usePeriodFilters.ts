import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { currentMonth, formatYearMonth, parseYearMonth } from './period'
import type { Period, PeriodMode } from './types'

// /dashboard/encuestas/:id?periodo=mes&mes=2026-10
//                       ?periodo=rango&desde=2026-01&hasta=2026-06
//                       ?periodo=anio&anio=2026
// Por defecto: el mes actual (hora de Colombia).
function parse(params: URLSearchParams): Period {
  const now = currentMonth()
  const mode = params.get('periodo')
  if (mode === 'rango') {
    const from = parseYearMonth(params.get('desde')) ?? { year: now.year, month: 1 }
    const to = parseYearMonth(params.get('hasta')) ?? now
    return { mode: 'rango', from, to }
  }
  if (mode === 'anio') {
    const year = Number.parseInt(params.get('anio') ?? '', 10)
    return { mode: 'anio', year: year >= 2000 && year <= 2100 ? year : now.year }
  }
  return { mode: 'mes', month: parseYearMonth(params.get('mes')) ?? now }
}

function serialize(period: Period) {
  const params = new URLSearchParams()
  if (period.mode === 'mes') {
    const now = currentMonth()
    if (period.month.year !== now.year || period.month.month !== now.month)
      params.set('mes', formatYearMonth(period.month))
  } else if (period.mode === 'rango') {
    params.set('periodo', 'rango')
    params.set('desde', formatYearMonth(period.from))
    params.set('hasta', formatYearMonth(period.to))
  } else {
    params.set('periodo', 'anio')
    params.set('anio', String(period.year))
  }
  return params
}

// Al cambiar de tipo de periodo se conserva el año que se estaba viendo.
export function switchMode(period: Period, mode: PeriodMode): Period {
  const now = currentMonth()
  const year = period.mode === 'mes' ? period.month.year : period.mode === 'rango' ? period.to.year : period.year
  const lastMonth = year === now.year ? now.month : 12
  if (mode === 'mes') return { mode, month: { year, month: lastMonth } }
  if (mode === 'rango') return { mode, from: { year, month: 1 }, to: { year, month: lastMonth } }
  return { mode, year }
}

// Periodo de los resultados en la URL (se puede compartir; Atrás lo restaura).
export function usePeriodFilters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const period = useMemo(() => parse(searchParams), [searchParams])
  const setPeriod = useCallback((next: Period) => setSearchParams(serialize(next)), [setSearchParams])
  return { period, setPeriod }
}
