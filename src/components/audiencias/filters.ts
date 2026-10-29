import { sanitizeQuery } from '../remates/filters'
import type { AudienciasFilters, Court } from './types'

// /audiencias?periodo=anteriores&juzgado=1&desde=2026-10-01&hasta=2026-10-31&q=6800&pagina=2
const PARAM = {
  period: 'periodo',
  court: 'juzgado',
  from: 'desde',
  to: 'hasta',
  query: 'q',
  page: 'pagina',
} as const

const DAY = /^\d{4}-\d{2}-\d{2}$/
const day = (value: string | null) => (value && DAY.test(value) ? value : null)

// Valores inválidos o ausentes vuelven al predeterminado.
export function parseFilters(params: URLSearchParams): AudienciasFilters {
  const court = params.get(PARAM.court)
  const page = Number.parseInt(params.get(PARAM.page) ?? '', 10)
  return {
    period: params.get(PARAM.period) === 'anteriores' ? 'anteriores' : 'proximas',
    court: court === '1' || court === '2' ? (Number(court) as Court) : null,
    from: day(params.get(PARAM.from)),
    to: day(params.get(PARAM.to)),
    query: sanitizeQuery(params.get(PARAM.query) ?? ''),
    page: Number.isInteger(page) && page > 1 ? page : 1,
  }
}

// Solo se escriben los valores distintos del predeterminado, para URLs cortas.
export function serializeFilters(filters: AudienciasFilters) {
  const params = new URLSearchParams()
  if (filters.period === 'anteriores') params.set(PARAM.period, 'anteriores')
  if (filters.court) params.set(PARAM.court, String(filters.court))
  if (filters.from) params.set(PARAM.from, filters.from)
  if (filters.to) params.set(PARAM.to, filters.to)
  if (filters.query) params.set(PARAM.query, filters.query)
  if (filters.page > 1) params.set(PARAM.page, String(filters.page))
  return params
}
