import { COURTS } from '../../../components/remates/constants'
import { weekTitle } from '../dates'
import type { Court } from '../types'
import type { PublicationRow } from './api'
import { dayLabel, EMPTY_WEEK, groupByDay, hearingTime, publishedLabel } from './data'

const button = 'inline-flex rounded-md px-3 py-1.5 text-sm font-semibold whitespace-nowrap'

// Vista previa del bloque (opción A del plan). Imita el HTML de weeklyPublicationHtml con los
// componentes del dashboard: la CSP no deja mostrar el <style> del bloque dentro de un iframe.
// Los enlaces no se pueden seguir desde aquí: es solo para revisar.
export default function PublicationPreview({
  court,
  monday,
  now,
  hearings,
}: {
  court: Court
  monday: string
  now: Date
  hearings: PublicationRow[]
}) {
  const days = groupByDay(hearings)
  return (
    <div className="overflow-hidden rounded-xl bg-surface-container-low" aria-label="Vista previa de la publicación">
      <div className="bg-primary-container px-6 py-5">
        <p className="text-xs font-bold tracking-widest text-primary uppercase">Audiencias de remate</p>
        <p className="mt-1 font-display text-lg font-bold text-on-surface">{COURTS[court].name}</p>
        <p className="text-sm text-on-surface-variant">{weekTitle(monday)}</p>
        <p className="mt-2 text-xs text-on-surface-variant">{publishedLabel(now)}</p>
      </div>
      {days.length === 0 && <p className="px-6 py-5 text-sm text-on-surface-variant">{EMPTY_WEEK}</p>}
      {days.map(({ day, hearings: list }) => (
        <div key={day}>
          <p className="px-6 pt-4 pb-2 text-sm font-bold tracking-wide text-primary uppercase">{dayLabel(day)}</p>
          <ul className="space-y-1.5 px-3 pb-2">
            {list.map((hearing) => (
              <li
                key={hearing.id}
                className="grid gap-2 rounded-lg bg-surface-container-lowest p-3 sm:grid-cols-[7.5rem_1fr_auto] sm:items-center sm:gap-3"
              >
                <span className="text-base font-bold whitespace-nowrap">{hearingTime(hearing.scheduled_at)}</span>
                <span className="font-mono text-sm whitespace-nowrap text-on-surface-variant">
                  <span className="block font-sans text-xs">Radicado</span>
                  {hearing.case_number}
                </span>
                <span className="flex flex-wrap gap-2" aria-hidden="true">
                  <span className={`${button} bg-primary text-on-primary`}>Ingresar a Teams</span>
                  <span className={`${button} bg-primary-container text-primary`}>Ver aviso</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <p className="flex flex-wrap gap-x-5 gap-y-2 px-6 pt-3 pb-5 text-sm font-bold text-primary underline underline-offset-3">
        <span>Todos los avisos de remate</span>
        <span>Consultar audiencias</span>
      </p>
    </div>
  )
}
