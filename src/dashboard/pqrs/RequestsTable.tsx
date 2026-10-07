import { useNavigate } from 'react-router-dom'
import { requestTypes } from '../../components/pqrs/data'
import { bodyCell, bodyRow, formatDate, formatTime, headerCell, mobileItem } from '../../components/remates'
import { cn } from '../../lib/cn'
import { useAccess } from '../access'
import { ActionMenu, icons, type ActionMenuItem } from '../ui'
import { isPending, PQRS_ADMIN_PATH } from './data'
import { DeadlineBadge, StatusBadge } from './RequestBadges'
import type { RequestRow } from './types'

export type RequestHandlers = {
  onSetInProgress: (row: RequestRow) => void
  onClose: (row: RequestRow) => void
  onReopen: (row: RequestRow) => void
}

type RequestsTableProps = RequestHandlers & {
  rows: RequestRow[]
  now: Date
  caption: string
  className?: string
}

// Menú ⋮ de cada PQRS: Ver (y responder desde el detalle), En trámite, Cerrar o Reabrir, según su
// estado y los permisos.
function RequestActions({ row, className, ...handlers }: RequestHandlers & { row: RequestRow; className?: string }) {
  const navigate = useNavigate()
  const { can } = useAccess()
  const detail = `${PQRS_ADMIN_PATH}/${row.id}`
  const items: ActionMenuItem[] = [{ label: 'Ver', icon: icons.eye, onSelect: () => navigate(detail) }]
  if (isPending(row.status) && can('pqrs.responder')) {
    items.push({ label: 'Responder', icon: icons.pencil, onSelect: () => navigate(`${detail}#responder`) })
  }
  if (can('pqrs.gestionar')) {
    if (row.status === 'recibida') {
      items.push({ label: 'Marcar en trámite', icon: icons.refresh, onSelect: () => handlers.onSetInProgress(row) })
    }
    if (isPending(row.status)) {
      items.push({ label: 'Cerrar sin respuesta', icon: icons.lock, onSelect: () => handlers.onClose(row) })
    }
    if (row.status === 'cerrada') {
      items.push({ label: 'Reabrir', icon: icons.unlock, onSelect: () => handlers.onReopen(row) })
    }
  }
  return <ActionMenu label={`Opciones de la PQRS ${row.request_number}`} items={items} className={className} />
}

function DateCell({ iso }: { iso: string }) {
  return (
    <>
      <span className="block text-sm font-semibold whitespace-nowrap text-on-surface">{formatDate(iso)}</span>
      <span className="block text-xs text-on-surface-variant">{formatTime(iso)}</span>
    </>
  )
}

// Misma base visual que Avisos de Remate (tableStyles): tabla desde xl, tarjetas por debajo.
export default function RequestsTable({ rows, now, caption, className, ...handlers }: RequestsTableProps) {
  return (
    <div className={className}>
      <table className="hidden w-full text-left xl:table">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-surface-container-low [&_th:first-child]:rounded-tl-lg [&_th:last-child]:rounded-tr-lg">
          <tr>
            <th scope="col" className={headerCell}>
              Radicado
            </th>
            <th scope="col" className={headerCell}>
              Fecha
            </th>
            <th scope="col" className={headerCell}>
              Tipo
            </th>
            <th scope="col" className={headerCell}>
              Ciudadano
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
          {rows.map((row) => (
            <tr key={row.id} className={bodyRow}>
              <td className={cn(bodyCell, 'font-mono text-sm font-semibold whitespace-nowrap text-on-surface')}>
                {row.request_number}
              </td>
              <td className={bodyCell}>
                <DateCell iso={row.created_at} />
              </td>
              <td className={cn(bodyCell, 'text-sm')}>{requestTypes[row.type]?.label ?? row.type}</td>
              <td className={bodyCell}>
                <span className="block text-sm font-medium text-on-surface">{row.name}</span>
                <span className="block max-w-64 truncate text-xs text-on-surface-variant" title={row.email}>
                  {row.email}
                </span>
              </td>
              <td className={bodyCell}>
                <div className="flex flex-col items-start gap-1.5">
                  <StatusBadge status={row.status} />
                  <DeadlineBadge status={row.status} createdAt={row.created_at} now={now} />
                </div>
              </td>
              <td className={cn(bodyCell, 'py-2')}>
                <RequestActions row={row} className="flex justify-end" {...handlers} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul aria-label={caption} className="xl:hidden">
        {rows.map((row) => (
          <li key={row.id} className={mobileItem}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-sm font-semibold text-on-surface">{row.request_number}</p>
                <p className="text-xs text-on-surface-variant">
                  {requestTypes[row.type]?.label ?? row.type} · {formatDate(row.created_at)},{' '}
                  {formatTime(row.created_at)}
                </p>
              </div>
              <RequestActions row={row} className="-mt-1 -mr-2 shrink-0" {...handlers} />
            </div>
            <p className="text-sm">
              <span className="font-medium text-on-surface">{row.name}</span>
              <span className="block text-xs break-all text-on-surface-variant">{row.email}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={row.status} />
              <DeadlineBadge status={row.status} createdAt={row.created_at} now={now} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
