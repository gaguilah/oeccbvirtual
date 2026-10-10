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
import { useAccess } from '../access'
import { ActionMenu, icons } from '../ui'
import PublicationBadge from './PublicationBadge'
import type { AdminNotice } from './types'

export type NoticeHandlers = {
  onView: (notice: AdminNotice) => void
  onEdit: (notice: AdminNotice) => void
  onTogglePublished: (notice: AdminNotice) => void
  onDelete: (notice: AdminNotice) => void
}

type AdminRematesTableProps = NoticeHandlers & {
  rows: AdminNotice[]
  caption: string
  highlightId: string | null
  className?: string
}

// Menú de tres puntos con las acciones del aviso, cada una solo con su permiso en el juzgado del
// aviso. El mismo en la tabla y en las tarjetas.
function NoticeActions({
  notice,
  className,
  ...handlers
}: NoticeHandlers & { notice: AdminNotice; className?: string }) {
  const { can } = useAccess()
  const items = [
    { show: true, label: 'Ver', icon: icons.eye, onSelect: () => handlers.onView(notice) },
    {
      show: can('remates.editar', notice.court),
      label: 'Editar',
      icon: icons.pencil,
      onSelect: () => handlers.onEdit(notice),
    },
    {
      show: can('remates.publicar', notice.court),
      label: notice.is_published ? 'Ocultar' : 'Publicar',
      icon: notice.is_published ? icons.eyeSlash : icons.eye,
      onSelect: () => handlers.onTogglePublished(notice),
    },
    {
      show: can('remates.eliminar', notice.court),
      label: 'Eliminar',
      icon: icons.trash,
      onSelect: () => handlers.onDelete(notice),
      danger: true,
    },
  ].filter((item) => item.show)

  return (
    <ActionMenu label={`Opciones del aviso del radicado ${notice.case_number}`} items={items} className={className} />
  )
}

// La tabla del sitio público (mismas celdas y estilos), pero en la columna Estado solo importa si
// el aviso está publicado u oculto (Agendado / Realizado es para el público). Acciones en un menú
// de tres puntos. Desde xl: tabla; antes, tarjetas (con el menú lateral no caben las columnas).
export default function AdminRematesTable({
  rows,
  caption,
  highlightId,
  className,
  ...handlers
}: AdminRematesTableProps) {
  const highlight = (notice: AdminNotice) => notice.id === highlightId && 'bg-primary-container/50'

  return (
    <div className={className}>
      <table className="hidden w-full text-left xl:table">
        <caption className="sr-only">{caption}</caption>
        {/* La tarjeta no recorta (para que el menú de las últimas filas sobresalga): el encabezado
            lleva sus propias esquinas redondeadas. */}
        <thead className="bg-surface-container-low [&_th:first-child]:rounded-tl-lg [&_th:last-child]:rounded-tr-lg">
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
            <th scope="col" className={cn(headerCell, 'w-px')}>
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((notice) => (
            <tr key={notice.id} className={cn(bodyRow, highlight(notice))}>
              <ScheduleCell scheduledAt={notice.scheduled_at} />
              <CaseNumberCell caseNumber={notice.case_number} />
              <CourtCell court={notice.court} />
              <td className={bodyCell}>
                <PublicationBadge published={notice.is_published} />
              </td>
              <td className={cn(bodyCell, 'py-2')}>
                <NoticeActions notice={notice} className="flex justify-end" {...handlers} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul aria-label={caption} className="xl:hidden">
        {rows.map((notice) => (
          <li key={notice.id} className={cn(mobileItem, highlight(notice))}>
            <div className="flex items-start justify-between gap-3">
              <MobileSchedule scheduledAt={notice.scheduled_at} court={notice.court} />
              <NoticeActions notice={notice} className="-mt-1 -mr-2 shrink-0" {...handlers} />
            </div>
            <MobileCaseNumber caseNumber={notice.case_number} />
            <div className="flex flex-wrap gap-2">
              <PublicationBadge published={notice.is_published} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
