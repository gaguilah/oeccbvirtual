import { useCallback, useEffect, useState } from 'react'
import { countPendingClose, fetchCalendarHearings, fetchHearings, fetchHearingTypes, fetchNonBusinessDays } from './api'
import { addMonths, monthStart, monthWeeks, weekDays } from './dates'
import type { Hearing, HearingFilters, HearingType, NonBusinessDay } from './types'
import type { HearingsPage } from './api'

export function useHearingTypes() {
  const [types, setTypes] = useState<HearingType[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let active = true
    fetchHearingTypes()
      .then((rows) => {
        if (!active) return
        setTypes(rows)
        setError(null)
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'No se pudieron cargar los tipos de audiencia.')
      })
    return () => {
      active = false
    }
  }, [version])

  return { types, error, reload: useCallback(() => setVersion((v) => v + 1), []) }
}

type TableResult = { key: string; data?: HearingsPage; pending?: number; now?: Date; error?: string }

// Tabla: una página y el número de "Por cerrar". Cancela la petición anterior al cambiar de filtros
// y conserva los datos anteriores mientras carga.
export function useHearingsTable(filters: HearingFilters, enabled: boolean) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<TableResult | null>(null)
  const [last, setLast] = useState<Omit<TableResult, 'key' | 'error'>>({})
  const { tab, court, type, from, to, query, page } = filters
  const key = `${tab}|${court}|${type}|${from}|${to}|${query}|${page}|${attempt}`

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    const now = new Date()
    const current = { ...filters, tab, court, type, from, to, query, page }
    Promise.all([fetchHearings(current, now, controller.signal), countPendingClose(current, now, controller.signal)])
      .then(([data, pending]) => {
        setResult({ key, data, pending, now })
        setLast({ data, pending, now })
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setResult({ key, error: err instanceof Error ? err.message : 'No fue posible cargar las audiencias.' })
      })
    return () => controller.abort()
    // filters se desarma en sus campos: `key` ya los incluye.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled])

  const current = result?.key === key ? result : null
  return {
    data: current?.data ?? last.data,
    pending: current?.pending ?? last.pending,
    now: current?.now ?? last.now,
    loading: current === null,
    error: current?.error ?? null,
    reload: useCallback(() => setAttempt((n) => n + 1), []),
  }
}

// Días que muestra el calendario: la semana (lunes a viernes) o las semanas del mes.
export function calendarRange(filters: HearingFilters): { from: string; to: string; days: string[] } {
  if (filters.view === 'semana') {
    const days = weekDays(filters.date)
    return { from: days[0], to: days[4], days }
  }
  const days = monthWeeks(filters.date).flat()
  return { from: days[0], to: days[days.length - 1], days }
}

type CalendarResult = { key: string; hearings?: Hearing[]; nonBusiness?: NonBusinessDay[]; now?: Date; error?: string }

export function useHearingsCalendar(filters: HearingFilters, enabled: boolean) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<CalendarResult | null>(null)
  const [last, setLast] = useState<Omit<CalendarResult, 'key' | 'error'>>({})
  const range = calendarRange(filters)
  const { court, type, query } = filters
  const key = `${range.from}|${range.to}|${court}|${type}|${query}|${attempt}`

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    const now = new Date()
    Promise.all([
      fetchCalendarHearings({ ...filters, court, type, query }, range, controller.signal),
      fetchNonBusinessDays(range.from, range.to),
    ])
      .then(([hearings, nonBusiness]) => {
        if (controller.signal.aborted) return
        setResult({ key, hearings, nonBusiness, now })
        setLast({ hearings, nonBusiness, now })
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setResult({ key, error: err instanceof Error ? err.message : 'No fue posible cargar el calendario.' })
      })
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled])

  const current = result?.key === key ? result : null
  return {
    range,
    hearings: current?.hearings ?? last.hearings,
    nonBusiness: current?.nonBusiness ?? last.nonBusiness ?? [],
    now: current?.now ?? last.now,
    loading: current === null,
    error: current?.error ?? null,
    reload: useCallback(() => setAttempt((n) => n + 1), []),
  }
}

// Días no hábiles del mes de una fecha (y el siguiente), para validar el formulario.
export function useNonBusinessMonth(date: string | null) {
  const [cache, setCache] = useState<Record<string, NonBusinessDay[]>>({})
  const month = date ? monthStart(date) : null

  useEffect(() => {
    if (!month || cache[month]) return
    let active = true
    fetchNonBusinessDays(month, addMonths(month, 1))
      .then((days) => {
        if (active) setCache((current) => ({ ...current, [month]: days }))
      })
      .catch(() => {
        if (active) setCache((current) => ({ ...current, [month]: [] }))
      })
    return () => {
      active = false
    }
  }, [month, cache])

  return month ? (cache[month] ?? null) : null
}
