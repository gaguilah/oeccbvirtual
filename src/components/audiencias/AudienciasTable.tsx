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
import { Badge, Button } from '../ui'
import { STATUS } from './constants'
import type { PublicHearing } from './types'

type Props = {
  rows: PublicHearing[]
  caption: string
  // Abre el detalle de la audiencia.
  onSelect: (hearing: PublicHearing) => void
}

function StatusBadge({ hearing, className }: { hearing: PublicHearing; className?: string }) {
  const status = STATUS[hearing.status_id]
  return (
    <Badge variant={status.variant} className={className}>
      {status.label}
    </Badge>
  )
}

function DetailButton({ hearing, onSelect }: { hearing: PublicHearing; onSelect: (hearing: PublicHearing) => void }) {
  return (
    <Button variant="secondary" size="sm" onClick={() => onSelect(hearing)} aria-haspopup="dialog">
      <svg
        className="size-4 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
        />
      </svg>
      Ver audiencia
      <span className="sr-only"> del radicado {hearing.case_number}</span>
    </Button>
  )
}

// Como la tabla de Avisos de Remate: fecha y hora, radicado, juzgado, estado y "Ver audiencia",
// que abre el detalle. Escritorio: tabla. Celular: tarjetas con los mismos datos.
export default function AudienciasTable({ rows, caption, onSelect }: Props) {
  return (
    <div>
      <table className="hidden w-full text-left md:table">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-surface-container-low">
          <tr>
            <th scope="col" className={headerCell}>
              Fecha y hora
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
            <th scope="col" className={cn(headerCell, 'text-right')}>
              <span className="sr-only">Audiencia</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((hearing) => (
            <tr key={hearing.id} className={bodyRow}>
              <ScheduleCell scheduledAt={hearing.scheduled_at} />
              <CaseNumberCell caseNumber={hearing.case_number} />
              <CourtCell court={hearing.court_id} />
              <td className={bodyCell}>
                <StatusBadge hearing={hearing} />
              </td>
              <td className={cn(bodyCell, 'text-right')}>
                <DetailButton hearing={hearing} onSelect={onSelect} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul aria-label={caption} className="md:hidden">
        {rows.map((hearing) => (
          <li key={hearing.id} className={mobileItem}>
            <div className="flex items-start justify-between gap-3">
              <MobileSchedule scheduledAt={hearing.scheduled_at} court={hearing.court_id} />
              <StatusBadge hearing={hearing} className="shrink-0" />
            </div>
            <MobileCaseNumber caseNumber={hearing.case_number} />
            <DetailButton hearing={hearing} onSelect={onSelect} />
          </li>
        ))}
      </ul>
    </div>
  )
}
