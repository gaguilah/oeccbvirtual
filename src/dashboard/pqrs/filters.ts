import { REQUEST_TYPE_IDS, type RequestTypeId } from '../../components/pqrs/data'
import { TABS } from './data'
import type { RequestFilters, RequestTab } from './types'

// /dashboard/pqrs?estado=respondidas&tipo=queja&q=ana&pagina=2 (por defecto: pendientes).
const PARAM = { tab: 'estado', type: 'tipo', query: 'q', page: 'pagina' } as const

// Solo letras, números, espacios y @ . _ - (sin comillas, comas ni paréntesis, que rompen el filtro
// "or" de PostgREST).
export function sanitizeQuery(value: string) {
  return value.replace(/[^\p{L}\p{N}\s@._-]/gu, '').slice(0, 80)
}

// Valores inválidos o ausentes vuelven al predeterminado.
export function parseFilters(params: URLSearchParams): RequestFilters {
  const tab = params.get(PARAM.tab) as RequestTab
  const type = params.get(PARAM.type) as RequestTypeId
  const page = Number.parseInt(params.get(PARAM.page) ?? '', 10)
  return {
    tab: TABS.some((option) => option.value === tab) ? tab : 'pendientes',
    type: REQUEST_TYPE_IDS.includes(type) ? type : null,
    query: sanitizeQuery(params.get(PARAM.query) ?? ''),
    page: Number.isInteger(page) && page > 1 ? page : 1,
  }
}

// Solo lo que no es predeterminado, para que la URL quede corta.
export function serializeFilters(filters: RequestFilters) {
  const params = new URLSearchParams()
  if (filters.tab !== 'pendientes') params.set(PARAM.tab, filters.tab)
  if (filters.type) params.set(PARAM.type, filters.type)
  if (filters.query) params.set(PARAM.query, filters.query)
  if (filters.page > 1) params.set(PARAM.page, String(filters.page))
  return params
}
