import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { sanitizeQuery, type Court } from '../../components/remates'
import type { AdminFilters, AdminPeriod, Publication } from './types'

// Mismos nombres que el sitio público, más `publicacion`:
//   /dashboard/avisos-remates?juzgado=1&periodo=todos&publicacion=ocultos&q=6800&pagina=2
const PARAM = { court: 'juzgado', period: 'periodo', publication: 'publicacion', query: 'q', page: 'pagina' } as const

const PERIODS: AdminPeriod[] = ['proximos', 'pasados', 'todos']
const PUBLICATIONS: Publication[] = ['todos', 'publicados', 'ocultos']

function parse(params: URLSearchParams, forcedCourt: Court | null): AdminFilters {
  const court = params.get(PARAM.court)
  const period = params.get(PARAM.period) as AdminPeriod
  const publication = params.get(PARAM.publication) as Publication
  const page = Number.parseInt(params.get(PARAM.page) ?? '', 10)
  return {
    court: forcedCourt ?? (court === '1' || court === '2' ? (Number(court) as Court) : null),
    period: PERIODS.includes(period) ? period : 'proximos',
    publication: PUBLICATIONS.includes(publication) ? publication : 'todos',
    query: sanitizeQuery(params.get(PARAM.query) ?? ''),
    page: Number.isInteger(page) && page > 1 ? page : 1,
  }
}

function serialize(filters: AdminFilters, forcedCourt: Court | null) {
  const params = new URLSearchParams()
  if (filters.court && !forcedCourt) params.set(PARAM.court, String(filters.court))
  if (filters.period !== 'proximos') params.set(PARAM.period, filters.period)
  if (filters.publication !== 'todos') params.set(PARAM.publication, filters.publication)
  if (filters.query) params.set(PARAM.query, filters.query)
  if (filters.page > 1) params.set(PARAM.page, String(filters.page))
  return params
}

// Filtros del listado del dashboard en la URL. `forcedCourt`: un usuario de alcance juzgado solo
// ve el suyo (RLS lo garantiza; esto solo evita mostrar un filtro que no aplica).
export function useAdminFilters(forcedCourt: Court | null) {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => parse(searchParams, forcedCourt), [searchParams, forcedCourt])

  const updateFilters = useCallback(
    (changes: Partial<AdminFilters>, options?: { replace?: boolean }) => {
      setSearchParams((current) => serialize({ ...parse(current, forcedCourt), page: 1, ...changes }, forcedCourt), {
        replace: options?.replace,
      })
    },
    [setSearchParams, forcedCourt],
  )

  return { filters, updateFilters }
}
