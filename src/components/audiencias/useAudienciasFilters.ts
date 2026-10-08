import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { sanitizeQuery } from '../remates'
import type { AudienciasFilters, Court } from './types'

// /audiencias?periodo=anteriores&juzgado=1&tipo=4&desde=2026-10-01&hasta=2026-10-31&q=6800&pagina=2
const PARAM = {
  period: 'periodo',
  court: 'juzgado',
  type: 'tipo',
  from: 'desde',
  to: 'hasta',
  query: 'q',
  page: 'pagina',
} as const

const DAY = /^\d{4}-\d{2}-\d{2}$/
const day = (value: string | null) => (value && DAY.test(value) ? value : null)

function parse(params: URLSearchParams): AudienciasFilters {
  const court = params.get(PARAM.court)
  const type = Number.parseInt(params.get(PARAM.type) ?? '', 10)
  const page = Number.parseInt(params.get(PARAM.page) ?? '', 10)
  return {
    period: params.get(PARAM.period) === 'anteriores' ? 'anteriores' : 'proximas',
    court: court === '1' || court === '2' ? (Number(court) as Court) : null,
    type: Number.isInteger(type) && type > 0 ? type : null,
    from: day(params.get(PARAM.from)),
    to: day(params.get(PARAM.to)),
    query: sanitizeQuery(params.get(PARAM.query) ?? ''),
    page: Number.isInteger(page) && page > 1 ? page : 1,
  }
}

function serialize(filters: AudienciasFilters) {
  const params = new URLSearchParams()
  if (filters.period === 'anteriores') params.set(PARAM.period, 'anteriores')
  if (filters.court) params.set(PARAM.court, String(filters.court))
  if (filters.type) params.set(PARAM.type, String(filters.type))
  if (filters.from) params.set(PARAM.from, filters.from)
  if (filters.to) params.set(PARAM.to, filters.to)
  if (filters.query) params.set(PARAM.query, filters.query)
  if (filters.page > 1) params.set(PARAM.page, String(filters.page))
  return params
}

// Los filtros viven en la URL: se pueden compartir y el botón Atrás los restaura.
export function useAudienciasFilters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => parse(searchParams), [searchParams])
  const updateFilters = useCallback(
    (changes: Partial<AudienciasFilters>, options?: { replace?: boolean }) => {
      setSearchParams((current) => serialize({ ...parse(current), page: 1, ...changes }), {
        replace: options?.replace,
      })
    },
    [setSearchParams],
  )
  return { filters, updateFilters }
}
