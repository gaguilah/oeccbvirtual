import { cn } from '../../lib/cn'
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
} from '../remates'
import { Badge, ExternalLinkIcon } from '../ui'
import { STATUS } from './constants'
import type { PublicHearing } from './types'

type Props = { rows: PublicHearing[]; caption: string }

const linkClass =
  'inline-flex items-center gap-1 text-sm font-medium whitespace-nowrap text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

function NewTab() {
  return <span className="sr-only"> (se abre en una pestaña nueva)</span>
}

// Enlaces de la audiencia: "Conectarse" mientras está programada (o "Presencial" en los tipos sin
// enlace) y "Ver grabación" cuando ya se realizó. Sin nada que mostrar: una raya.
function Links({ hearing }: { hearing: PublicHearing }) {
  const connect = hearing.status_id === 1 && hearing.connection_url
  const presencial = hearing.status_id === 1 && !hearing.requires_link
  if (!connect && !presencial && !hearing.recording_url)
    return <span className="text-sm text-on-surface-variant">—</span>
  return (
    <span className="flex flex-wrap gap-x-5 gap-y-1">
      {connect && (
        <a href={hearing.connection_url!} target="_blank" rel="noopener noreferrer" className={linkClass}>
          Conectarse
          <ExternalLinkIcon className="size-3.5" />
          <span className="sr-only"> a la audiencia del radicado {hearing.case_number}</span>
          <NewTab />
        </a>
      )}
      {presencial && <span className="text-sm text-on-surface-variant">Presencial</span>}
      {hearing.recording_url && (
        <a href={hearing.recording_url} target="_blank" rel="noopener noreferrer" className={linkClass}>
          Ver grabación
          <ExternalLinkIcon className="size-3.5" />
          <span className="sr-only"> de la audiencia del radicado {hearing.case_number}</span>
          <NewTab />
        </a>
      )}
    </span>
  )
}

function StatusBadge({ hearing, className }: { hearing: PublicHearing; className?: string }) {
  const status = STATUS[hearing.status_id]
  return (
    <Badge variant={status.variant} className={className}>
      {status.label}
    </Badge>
  )
}

// Desde xl: tabla con las mismas celdas que Avisos de Remate. Antes: tarjetas apiladas.
export default function AudienciasTable({ rows, caption }: Props) {
  return (
    <div>
      <table className="hidden w-full text-left xl:table">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-surface-container-low">
          <tr>
            <th scope="col" className={headerCell}>
              Fecha y hora
            </th>
            <th scope="col" className={headerCell}>
              Audiencia
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
            <th scope="col" className={headerCell}>
              Enlaces
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((hearing) => (
            <tr key={hearing.id} className={bodyRow}>
              <ScheduleCell scheduledAt={hearing.scheduled_at} />
              <td className={cn(bodyCell, 'text-sm text-on-surface')}>{hearing.type_name}</td>
              <CaseNumberCell caseNumber={hearing.case_number} />
              <CourtCell court={hearing.court_id} />
              <td className={bodyCell}>
                <StatusBadge hearing={hearing} />
              </td>
              <td className={bodyCell}>
                <Links hearing={hearing} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul aria-label={caption} className="xl:hidden">
        {rows.map((hearing) => (
          <li key={hearing.id} className={mobileItem}>
            <div className="flex items-start justify-between gap-3">
              <MobileSchedule scheduledAt={hearing.scheduled_at} court={hearing.court_id} />
              <StatusBadge hearing={hearing} className="shrink-0" />
            </div>
            <p className="text-sm font-semibold text-on-surface">{hearing.type_name}</p>
            <MobileCaseNumber caseNumber={hearing.case_number} />
            <Links hearing={hearing} />
          </li>
        ))}
      </ul>
    </div>
  )
}
