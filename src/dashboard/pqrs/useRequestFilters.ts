import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { REQUEST_TYPE_IDS, type RequestTypeId } from '../../components/pqrs/data'
import { sanitizeQuery } from './api'
import { TABS } from './data'
import type { RequestFilters, RequestTab } from './types'

// /dashboard/pqrs?estado=respondidas&tipo=queja&q=ana&pagina=2 (por defecto: pendientes).
const PARAM = { tab: 'estado', type: 'tipo', query: 'q', page: 'pagina' } as const

function parse(params: URLSearchParams): RequestFilters {
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

function serialize(filters: RequestFilters) {
  const params = new URLSearchParams()
  if (filters.tab !== 'pendientes') params.set(PARAM.tab, filters.tab)
  if (filters.type) params.set(PARAM.type, filters.type)
  if (filters.query) params.set(PARAM.query, filters.query)
  if (filters.page > 1) params.set(PARAM.page, String(filters.page))
  return params
}

// Filtros de la lista en la URL (se pueden compartir; Atrás los restaura).
export function useRequestFilters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => parse(searchParams), [searchParams])
  const updateFilters = useCallback(
    (changes: Partial<RequestFilters>, options?: { replace?: boolean }) => {
      setSearchParams((current) => serialize({ ...parse(current), page: 1, ...changes }), {
        replace: options?.replace,
      })
    },
    [setSearchParams],
  )
  return { filters, updateFilters }
}
