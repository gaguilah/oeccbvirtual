import { CASE_NUMBER_LENGTH } from './constants'
import type { Court, RematesFilters } from './types'

// Nombres de los parámetros en la URL: /avisos-remates?juzgado=1&periodo=pasados&q=6800&pagina=2
const PARAM = { court: 'juzgado', period: 'periodo', query: 'q', page: 'pagina' } as const

// Deja solo dígitos, con el largo máximo de un radicado.
export function sanitizeQuery(value: string) {
  return value.replace(/\D/g, '').slice(0, CASE_NUMBER_LENGTH)
}

// Valores inválidos o ausentes vuelven al predeterminado.
export function parseFilters(params: URLSearchParams): RematesFilters {
  const court = params.get(PARAM.court)
  const page = Number.parseInt(params.get(PARAM.page) ?? '', 10)
  return {
    court: court === '1' || court === '2' ? (Number(court) as Court) : null,
    period: params.get(PARAM.period) === 'pasados' ? 'pasados' : 'proximos',
    query: sanitizeQuery(params.get(PARAM.query) ?? ''),
    page: Number.isInteger(page) && page > 1 ? page : 1,
  }
}

// Solo se escriben los valores distintos del predeterminado, para URLs cortas.
export function serializeFilters(filters: RematesFilters) {
  const params = new URLSearchParams()
  if (filters.court) params.set(PARAM.court, String(filters.court))
  if (filters.period === 'pasados') params.set(PARAM.period, 'pasados')
  if (filters.query) params.set(PARAM.query, filters.query)
  if (filters.page > 1) params.set(PARAM.page, String(filters.page))
  return params
}
