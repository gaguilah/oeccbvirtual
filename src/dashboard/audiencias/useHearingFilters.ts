import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { sanitizeQuery, type Court } from '../../components/remates'
import { TABS, VIEWS } from './data'
import { todayInBogota } from './dates'
import type { HearingFilters, HearingTab, HearingView } from './types'

// /dashboard/audiencias?vista=mes&fecha=2026-10-13&juzgado=1&tipo=4&q=6800
//                     ?estado=por-cerrar&desde=2026-10-01&hasta=2026-10-31&pagina=2
const PARAM = {
  view: 'vista',
  tab: 'estado',
  court: 'juzgado',
  type: 'tipo',
  from: 'desde',
  to: 'hasta',
  query: 'q',
  page: 'pagina',
  date: 'fecha',
} as const

const DAY = /^\d{4}-\d{2}-\d{2}$/
const day = (value: string | null) => (value && DAY.test(value) ? value : null)

function parse(params: URLSearchParams, forcedCourt: Court | null): HearingFilters {
  const view = params.get(PARAM.view) as HearingView
  const tab = params.get(PARAM.tab) as HearingTab
  const court = params.get(PARAM.court)
  const type = Number.parseInt(params.get(PARAM.type) ?? '', 10)
  const page = Number.parseInt(params.get(PARAM.page) ?? '', 10)
  return {
    view: VIEWS.some((v) => v.value === view) ? view : 'tabla',
    tab: TABS.some((t) => t.value === tab) ? tab : 'proximas',
    court: forcedCourt ?? (court === '1' || court === '2' ? (Number(court) as Court) : null),
    type: Number.isInteger(type) && type > 0 ? type : null,
    from: day(params.get(PARAM.from)),
    to: day(params.get(PARAM.to)),
    query: sanitizeQuery(params.get(PARAM.query) ?? ''),
    page: Number.isInteger(page) && page > 1 ? page : 1,
    date: day(params.get(PARAM.date)) ?? todayInBogota(),
  }
}

function serialize(filters: HearingFilters, forcedCourt: Court | null) {
  const params = new URLSearchParams()
  if (filters.view !== 'tabla') params.set(PARAM.view, filters.view)
  if (filters.tab !== 'proximas') params.set(PARAM.tab, filters.tab)
  if (filters.court && !forcedCourt) params.set(PARAM.court, String(filters.court))
  if (filters.type) params.set(PARAM.type, String(filters.type))
  if (filters.from) params.set(PARAM.from, filters.from)
  if (filters.to) params.set(PARAM.to, filters.to)
  if (filters.query) params.set(PARAM.query, filters.query)
  if (filters.page > 1) params.set(PARAM.page, String(filters.page))
  if (filters.view !== 'tabla' && filters.date !== todayInBogota()) params.set(PARAM.date, filters.date)
  return params
}

// Filtros y vista en la URL (se pueden compartir; Atrás los restaura). `forcedCourt`: un usuario de
// alcance juzgado solo ve el suyo (RLS lo garantiza; esto evita mostrar un filtro que no aplica).
export function useHearingFilters(forcedCourt: Court | null) {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => parse(searchParams, forcedCourt), [searchParams, forcedCourt])

  const updateFilters = useCallback(
    (changes: Partial<HearingFilters>, options?: { replace?: boolean }) => {
      setSearchParams((current) => serialize({ ...parse(current, forcedCourt), page: 1, ...changes }, forcedCourt), {
        replace: options?.replace,
      })
    },
    [setSearchParams, forcedCourt],
  )

  return { filters, updateFilters }
}
