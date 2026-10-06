import { cn } from '../../lib/cn'
import { COURTS } from './constants'
import { formatDate, formatTime } from './dates'
import { bodyCell } from './tableStyles'
import type { Court } from './types'

// Celdas comunes de la tabla de avisos (sitio público y dashboard).

export function ScheduleCell({ scheduledAt }: { scheduledAt: string }) {
  return (
    <td className={bodyCell}>
      <span className="block text-sm font-semibold text-on-surface">{formatDate(scheduledAt)}</span>
      <span className="block text-xs text-on-surface-variant">{formatTime(scheduledAt)}</span>
    </td>
  )
}

export function CaseNumberCell({ caseNumber }: { caseNumber: string }) {
  return <td className={cn(bodyCell, 'text-sm font-medium tabular-nums text-on-surface')}>{caseNumber}</td>
}

export function CourtCell({ court }: { court: Court }) {
  return (
    <td className={cn(bodyCell, 'text-sm text-on-surface-variant')}>
      <abbr title={COURTS[court].name} className="no-underline">
        {COURTS[court].short}
      </abbr>
    </td>
  )
}

// Celular: fecha y hora con el nombre del juzgado debajo.
export function MobileSchedule({ scheduledAt, court }: { scheduledAt: string; court: Court }) {
  return (
    <div>
      <p className="text-sm font-semibold text-on-surface">
        {formatDate(scheduledAt)} · {formatTime(scheduledAt)}
      </p>
      <p className="text-xs text-on-surface-variant">{COURTS[court].name}</p>
    </div>
  )
}

export function MobileCaseNumber({ caseNumber }: { caseNumber: string }) {
  return (
    <p className="text-sm">
      <span className="text-on-surface-variant">Radicado </span>
      <span className="font-medium tabular-nums text-on-surface break-all">{caseNumber}</span>
    </p>
  )
}
