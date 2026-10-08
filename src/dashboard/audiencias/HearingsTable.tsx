import {
  bodyCell,
  bodyRow,
  CaseNumberCell,
  CourtCell,
  headerCell,
  MobileCaseNumber,
  MobileSchedule,
  mobileItem,
  ScheduleCell,
} from '../../components/remates'
import { cn } from '../../lib/cn'
import type { HearingAction } from './actions'
import { missingLink, typeName } from './data'
import HearingActions from './HearingActions'
import { MissingLinkNote, StatusBadge } from './HearingBadges'
import type { Hearing, HearingType } from './types'

type Props = {
  rows: Hearing[]
  types: HearingType[]
  now: Date
  caption: string
  highlightId: string | null
  onAction: (action: HearingAction, hearing: Hearing) => void
}

// Tabla de audiencias con las mismas celdas que Avisos de Remate. Desde xl: tabla; antes, tarjetas
// (con el menú lateral no caben las columnas). Acciones en el menú de tres puntos.
export default function HearingsTable({ rows, types, now, caption, highlightId, onAction }: Props) {
  const highlight = (hearing: Hearing) => hearing.id === highlightId && 'bg-primary-container/50'
  const type = (hearing: Hearing) => types.find((t) => t.id === hearing.hearing_type_id)

  return (
    <div>
      <table className="hidden w-full text-left xl:table">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-surface-container-low [&_th:first-child]:rounded-tl-lg [&_th:last-child]:rounded-tr-lg">
          <tr>
            <th scope="col" className={headerCell}>
              Fecha y hora
            </th>
            <th scope="col" className={headerCell}>
              Tipo
            </th>
            <th scope="col" className={headerCell}>
              Radicado
            </th>
            <th scope="col" className={headerCell}>
              Juzgado
            </th>
            <th scope="col" className={headerCell}>
              Estado
            </th>
            <th scope="col" className={cn(headerCell, 'w-px')}>
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((hearing) => (
            <tr key={hearing.id} className={cn(bodyRow, highlight(hearing))}>
              <ScheduleCell scheduledAt={hearing.scheduled_at} />
              <td className={cn(bodyCell, 'text-sm text-on-surface')}>
                {typeName(types, hearing.hearing_type_id)}
                {missingLink(hearing, type(hearing)) && <MissingLinkNote className="mt-1" />}
              </td>
              <CaseNumberCell caseNumber={hearing.case_number} />
              <CourtCell court={hearing.court_id} />
              <td className={bodyCell}>
                <StatusBadge hearing={hearing} now={now} />
              </td>
              <td className={cn(bodyCell, 'py-2')}>
                <HearingActions hearing={hearing} now={now} onAction={onAction} className="flex justify-end" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul aria-label={caption} className="xl:hidden">
        {rows.map((hearing) => (
          <li key={hearing.id} className={cn(mobileItem, highlight(hearing))}>
            <div className="flex items-start justify-between gap-3">
              <MobileSchedule scheduledAt={hearing.scheduled_at} court={hearing.court_id} />
              <HearingActions hearing={hearing} now={now} onAction={onAction} className="-mt-1 -mr-2 shrink-0" />
            </div>
            <p className="text-sm font-semibold text-on-surface">{typeName(types, hearing.hearing_type_id)}</p>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <MobileCaseNumber caseNumber={hearing.case_number} />
              <StatusBadge hearing={hearing} now={now} />
            </div>
            {missingLink(hearing, type(hearing)) && <MissingLinkNote />}
          </li>
        ))}
      </ul>
    </div>
  )
}
