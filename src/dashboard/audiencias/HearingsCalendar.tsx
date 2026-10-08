import { COURTS, formatTime } from '../../components/remates'
import { Button, EmptyState } from '../../components/ui'
import { cn } from '../../lib/cn'
import { Icon } from '../ui'
import { FIRST_HOUR, HEARING_MINUTES, isPendingClose, LAST_HOUR, STATUS, typeName } from './data'
import {
  addDays,
  addMonths,
  dayOf,
  isWeekend,
  longWeekday,
  minutesOfDay,
  monthTitle,
  monthWeeks,
  shortWeekday,
  todayInBogota,
  weekDays,
  weekTitle,
} from './dates'
import type { Hearing, HearingType, HearingView, NonBusinessDay } from './types'

type Props = {
  view: Exclude<HearingView, 'tabla'>
  date: string
  hearings: Hearing[]
  nonBusiness: NonBusinessDay[]
  types: HearingType[]
  now: Date
  loading: boolean
  onNavigate: (date: string, view?: HearingView) => void
  onOpen: (hearing: Hearing) => void
}

const ROW_REM = 3.5
const HOURS = Array.from({ length: LAST_HOUR - FIRST_HOUR + 1 }, (_, i) => FIRST_HOUR + i)
const chevronLeft = ['M15.75 19.5 8.25 12l7.5-7.5']

// Color del bloque según el estado (Por cerrar: ámbar; Realizada: verde; Cancelada: tachada).
function tone(hearing: Hearing, now: Date) {
  if (isPendingClose(hearing, now)) return 'bg-amber-500/15 text-amber-900 dark:text-amber-200'
  if (hearing.status_id === 2) return 'bg-green-600/10 text-green-900 dark:text-green-200'
  if (hearing.status_id === 3) return 'bg-surface-container text-on-surface-variant line-through'
  return 'bg-primary-container text-primary'
}

function statusText(hearing: Hearing, now: Date) {
  return isPendingClose(hearing, now) ? 'Por cerrar' : STATUS[hearing.status_id].label
}

// Columnas para las audiencias que se cruzan (duración fija de 1 hora). Cada grupo de audiencias
// encadenadas por cruces reparte el ancho entre sus columnas; las demás ocupan todo el ancho.
function lanes(hearings: Hearing[]) {
  type Placed = { hearing: Hearing; start: number; lane: number; count: number }
  const result: Placed[] = []
  let group: Placed[] = []
  let ends: number[] = []
  let groupEnd = -1
  const close = () => {
    for (const item of group) item.count = ends.length
    result.push(...group)
    group = []
    ends = []
  }
  for (const hearing of hearings) {
    const start = minutesOfDay(hearing.scheduled_at)
    if (start >= groupEnd) close()
    let lane = ends.findIndex((end) => end <= start)
    if (lane === -1) lane = ends.length
    ends[lane] = start + HEARING_MINUTES
    groupEnd = Math.max(groupEnd, start + HEARING_MINUTES)
    group.push({ hearing, start, lane, count: 1 })
  }
  close()
  return result
}

export default function HearingsCalendar(props: Props) {
  const { view, date, onNavigate, loading } = props
  const step = (direction: 1 | -1) => (view === 'semana' ? addDays(date, 7 * direction) : addMonths(date, direction))

  return (
    <section aria-busy={loading} className={cn('space-y-4 transition-opacity', loading && 'opacity-60')}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{view === 'semana' ? weekTitle(date) : monthTitle(date)}</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => onNavigate(step(-1))}
            aria-label={view === 'semana' ? 'Semana anterior' : 'Mes anterior'}
          >
            <Icon paths={chevronLeft} className="size-4" />
          </Button>
          <Button variant="secondary" size="sm" className="min-h-10" onClick={() => onNavigate(todayInBogota())}>
            Hoy
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={() => onNavigate(step(1))}
            aria-label={view === 'semana' ? 'Semana siguiente' : 'Mes siguiente'}
          >
            <Icon paths={chevronLeft} className="size-4 rotate-180" />
          </Button>
        </div>
      </div>
      <div className="hidden md:block">{view === 'semana' ? <WeekGrid {...props} /> : <MonthGrid {...props} />}</div>
      <DayList {...props} className="md:hidden" />
    </section>
  )
}

function useDayData({ hearings, nonBusiness }: Props) {
  const byDay = new Map<string, Hearing[]>()
  for (const hearing of hearings) {
    const day = dayOf(hearing.scheduled_at)
    byDay.set(day, [...(byDay.get(day) ?? []), hearing])
  }
  const reasons = new Map(nonBusiness.map((day) => [day.day, day.reason]))
  return { byDay, reasons }
}

function WeekGrid(props: Props) {
  const { date, types, now, onOpen } = props
  const { byDay, reasons } = useDayData(props)
  const today = todayInBogota()
  const days = weekDays(date)

  return (
    <div className="overflow-hidden rounded-lg bg-surface-container-low">
      <div className="grid grid-cols-[5.5rem_repeat(5,1fr)]">
        <div />
        {days.map((day) => (
          <div key={day} className={cn('px-2 py-3 text-center', day === today && 'text-primary')}>
            <p className={cn('text-sm font-semibold capitalize', day === today ? 'text-primary' : 'text-on-surface')}>
              {shortWeekday(day)}
            </p>
            {reasons.has(day) && <p className="truncate text-xs text-on-surface-variant">{reasons.get(day)}</p>}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[5.5rem_repeat(5,1fr)]">
        <div>
          {HOURS.map((hour) => (
            <div key={hour} className="h-14 pr-2 text-right text-xs whitespace-nowrap text-on-surface-variant">
              {hour % 12 === 0 ? 12 : hour % 12}:00 {hour < 12 ? 'a. m.' : 'p. m.'}
            </div>
          ))}
        </div>
        {days.map((day) => (
          <div
            key={day}
            className={cn(
              'relative border-l border-outline-variant/15',
              reasons.has(day) &&
                'bg-[repeating-linear-gradient(135deg,transparent_0_8px,var(--color-surface-container)_8px_10px)]',
            )}
          >
            {HOURS.map((hour) => (
              <div key={hour} className="h-14 border-t border-outline-variant/15" />
            ))}
            {lanes(byDay.get(day) ?? []).map(({ hearing, start, lane, count }) => (
              <button
                key={hearing.id}
                type="button"
                onClick={() => onOpen(hearing)}
                title={`${formatTime(hearing.scheduled_at)} · ${typeName(types, hearing.hearing_type_id)} · ${COURTS[hearing.court_id].short} · ${hearing.case_number} · ${statusText(hearing, now)}`}
                className={cn(
                  'absolute overflow-hidden rounded-md px-2 py-1 text-left text-xs leading-tight shadow-sm transition-[filter] hover:brightness-95 focus-visible:outline-2 focus-visible:outline-primary',
                  tone(hearing, now),
                )}
                style={{
                  top: `${((start - FIRST_HOUR * 60) / 60) * ROW_REM}rem`,
                  height: `${(HEARING_MINUTES / 60) * ROW_REM - 0.25}rem`,
                  left: `calc(${(lane / count) * 100}% + 2px)`,
                  width: `calc(${100 / count}% - 4px)`,
                }}
              >
                <span className="block font-semibold">
                  {formatTime(hearing.scheduled_at)} · {COURTS[hearing.court_id].short}
                </span>
                <span className="block truncate">{typeName(types, hearing.hearing_type_id)}</span>
                <span className="sr-only">
                  , radicado {hearing.case_number}, {statusText(hearing, now)}
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

const MONTH_LIMIT = 3

function MonthGrid(props: Props) {
  const { date, types, now, onOpen, onNavigate } = props
  const { byDay, reasons } = useDayData(props)
  const today = todayInBogota()
  const month = date.slice(0, 7)

  return (
    <div className="overflow-hidden rounded-lg bg-surface-container-low">
      <div className="grid grid-cols-5">
        {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map((name) => (
          <p key={name} className="px-3 py-2 text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
            {name}
          </p>
        ))}
      </div>
      {monthWeeks(date).map((week) => (
        <div key={week[0]} className="grid grid-cols-5">
          {week.map((day) => {
            const items = byDay.get(day) ?? []
            const outside = day.slice(0, 7) !== month
            return (
              <div
                key={day}
                className={cn(
                  'min-h-32 space-y-1 border-t border-l border-outline-variant/15 p-2 first:border-l-0',
                  outside && 'opacity-50',
                  reasons.has(day) &&
                    'bg-[repeating-linear-gradient(135deg,transparent_0_8px,var(--color-surface-container)_8px_10px)]',
                )}
              >
                <p
                  className={cn(
                    'flex size-7 items-center justify-center rounded-full text-sm font-semibold',
                    day === today ? 'bg-primary text-on-primary' : 'text-on-surface',
                  )}
                >
                  {Number(day.slice(8))}
                </p>
                {reasons.has(day) && <p className="truncate text-xs text-on-surface-variant">{reasons.get(day)}</p>}
                {items.slice(0, MONTH_LIMIT).map((hearing) => (
                  <button
                    key={hearing.id}
                    type="button"
                    onClick={() => onOpen(hearing)}
                    className={cn(
                      'block w-full truncate rounded px-1.5 py-0.5 text-left text-xs focus-visible:outline-2 focus-visible:outline-primary',
                      tone(hearing, now),
                    )}
                  >
                    <span className="font-semibold">{formatTime(hearing.scheduled_at)}</span>{' '}
                    {typeName(types, hearing.hearing_type_id)}
                    <span className="sr-only">
                      , {COURTS[hearing.court_id].short}, radicado {hearing.case_number}, {statusText(hearing, now)}
                    </span>
                  </button>
                ))}
                {items.length > MONTH_LIMIT && (
                  <button
                    type="button"
                    onClick={() => onNavigate(day, 'semana')}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    +{items.length - MONTH_LIMIT} más
                  </button>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// Celular: lista por día (solo días con audiencias o no hábiles).
function DayList(props: Props & { className?: string }) {
  const { view, date, types, now, onOpen, className } = props
  const { byDay, reasons } = useDayData(props)
  const month = date.slice(0, 7)
  const days = (
    view === 'semana'
      ? weekDays(date)
      : monthWeeks(date)
          .flat()
          .filter((d) => d.slice(0, 7) === month)
  )
    .filter((day) => !isWeekend(day))
    .filter((day) => byDay.has(day) || reasons.has(day))

  if (days.length === 0)
    return (
      <EmptyState
        className={className}
        title={view === 'semana' ? 'No hay audiencias esta semana' : 'No hay audiencias este mes'}
      />
    )

  return (
    <ol className={cn('space-y-4', className)}>
      {days.map((day) => (
        <li key={day} className="space-y-2">
          <h3 className="text-sm font-semibold text-on-surface">
            {longWeekday(day)}
            {reasons.has(day) && <span className="ml-2 font-normal text-on-surface-variant">· {reasons.get(day)}</span>}
          </h3>
          <ul className="space-y-2">
            {(byDay.get(day) ?? []).map((hearing) => (
              <li key={hearing.id}>
                <button
                  type="button"
                  onClick={() => onOpen(hearing)}
                  className={cn('w-full rounded-lg px-4 py-3 text-left text-sm', tone(hearing, now))}
                >
                  <span className="block font-semibold">
                    {formatTime(hearing.scheduled_at)} · {typeName(types, hearing.hearing_type_id)}
                  </span>
                  <span className="block text-xs">
                    {COURTS[hearing.court_id].short} · {hearing.case_number} · {statusText(hearing, now)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  )
}
