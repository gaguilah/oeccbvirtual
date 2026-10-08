import { formatDate, formatTime } from '../../components/remates'
import { icons, type ActionMenuItem } from '../ui'
import { canCancelNow, canRealizeNow, deleteBlocker, isClosed, realizeFrom } from './data'
import type { Hearing } from './types'

export type HearingAction = 'view' | 'edit' | 'realize' | 'cancel' | 'recording' | 'delete'

const checkIcon = ['m4.5 12.75 6 6 9-13.5']
const banIcon = ['M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636']
const videoIcon = [
  'm15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z',
]

const at = (iso: string) => `${formatTime(iso)} del ${formatDate(iso)}`

// Acciones de una audiencia, cada una con su permiso en el juzgado de la audiencia. Las que existen
// pero aún no se pueden usar se muestran en gris con el motivo.
export function hearingActionItems(
  hearing: Hearing,
  now: Date,
  can: (permission: string, court: 1 | 2) => boolean,
  onAction: (action: HearingAction, hearing: Hearing) => void,
  options: { includeView?: boolean } = {},
): ActionMenuItem[] {
  const canEdit = can('audiencias.editar', hearing.court_id)
  const items: ActionMenuItem[] = []
  if (options.includeView !== false)
    items.push({ label: 'Ver detalle', icon: icons.eye, onSelect: () => onAction('view', hearing) })
  if (canEdit && !isClosed(hearing)) {
    items.push(
      { label: 'Editar', icon: icons.pencil, onSelect: () => onAction('edit', hearing) },
      {
        label: 'Marcar realizada',
        icon: checkIcon,
        disabledReason: canRealizeNow(hearing, now)
          ? undefined
          : `Disponible desde las ${at(realizeFrom(hearing).toISOString())}`,
        onSelect: () => onAction('realize', hearing),
      },
      {
        label: 'Marcar cancelada',
        icon: banIcon,
        disabledReason: canCancelNow(hearing, now)
          ? undefined
          : `Disponible desde las ${at(hearing.scheduled_at)}. Para cambiar la fecha, edítela`,
        onSelect: () => onAction('cancel', hearing),
      },
    )
  }
  if (canEdit && hearing.status_id === 2)
    items.push({ label: 'Corregir grabación', icon: videoIcon, onSelect: () => onAction('recording', hearing) })
  if (can('audiencias.eliminar', hearing.court_id) && !isClosed(hearing)) {
    const blocker = deleteBlocker(hearing, now)
    items.push({
      label: 'Eliminar',
      icon: icons.trash,
      danger: true,
      disabledReason: blocker ?? undefined,
      onSelect: () => onAction('delete', hearing),
    })
  }
  return items
}
