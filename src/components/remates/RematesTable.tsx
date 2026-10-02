import { cn } from '../../lib/cn'
import { Button } from '../ui'
import { COURTS } from './constants'
import { formatDate, formatTime, isRealizado } from './dates'
import RemateStatusBadge from './RemateStatusBadge'
import type { AuctionNotice } from './types'

type RematesTableProps = {
  rows: AuctionNotice[]
  // Instante con el que se consultaron las filas; decide Agendado / Realizado.
  now: Date
  caption: string
  // Abre el detalle del aviso.
  onSelect: (id: string) => void
  className?: string
}

// Abre el modal de detalle del aviso (ver, descargar).
function DetailButton({ notice, onSelect }: { notice: AuctionNotice; onSelect: (id: string) => void }) {
  return (
    <Button variant="secondary" size="sm" onClick={() => onSelect(notice.id)} aria-haspopup="dialog">
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
          d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
        />
      </svg>
      Ver aviso
      <span className="sr-only"> del radicado {notice.case_number}</span>
    </Button>
  )
}

const headerCell = 'px-4 py-3 text-xs font-semibold uppercase tracking-widest text-on-surface-variant lg:px-6'
const bodyCell = 'px-4 py-4 lg:px-6'

// Escritorio: tabla. Celular: tarjetas apiladas con los mismos datos.
// Sin líneas divisorias: las filas se separan con un fondo alterno.
export default function RematesTable({ rows, now, caption, onSelect, className }: RematesTableProps) {
  return (
    <div className={className}>
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
              <span className="sr-only">Aviso</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((notice) => (
            <tr
              key={notice.id}
              className="transition-colors even:bg-surface-container-low/50 hover:bg-primary-container/30"
            >
              <td className={bodyCell}>
                <span className="block text-sm font-semibold text-on-surface">{formatDate(notice.scheduled_at)}</span>
                <span className="block text-xs text-on-surface-variant">{formatTime(notice.scheduled_at)}</span>
              </td>
              <td className={cn(bodyCell, 'text-sm font-medium tabular-nums text-on-surface')}>{notice.case_number}</td>
              <td className={cn(bodyCell, 'text-sm text-on-surface-variant')}>
                <abbr title={COURTS[notice.court].name} className="no-underline">
                  {COURTS[notice.court].short}
                </abbr>
              </td>
              <td className={bodyCell}>
                <RemateStatusBadge realizado={isRealizado(notice.scheduled_at, now)} />
              </td>
              <td className={cn(bodyCell, 'text-right')}>
                <DetailButton notice={notice} onSelect={onSelect} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul aria-label={caption} className="md:hidden">
        {rows.map((notice) => (
          <li key={notice.id} className="space-y-3 px-4 py-4 even:bg-surface-container-low/50">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-on-surface">
                  {formatDate(notice.scheduled_at)} · {formatTime(notice.scheduled_at)}
                </p>
                <p className="text-xs text-on-surface-variant">{COURTS[notice.court].name}</p>
              </div>
              <RemateStatusBadge realizado={isRealizado(notice.scheduled_at, now)} className="shrink-0" />
            </div>
            <p className="text-sm">
              <span className="text-on-surface-variant">Radicado </span>
              <span className="font-medium tabular-nums text-on-surface break-all">{notice.case_number}</span>
            </p>
            <DetailButton notice={notice} onSelect={onSelect} />
          </li>
        ))}
      </ul>
    </div>
  )
}
