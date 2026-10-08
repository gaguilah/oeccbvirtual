import { Badge } from '../../components/ui'
import { cn } from '../../lib/cn'
import { isPendingClose, STATUS } from './data'
import type { Hearing } from './types'

// Estado de la audiencia; una Programada cuya hora ya pasó se muestra "Por cerrar".
export function StatusBadge({ hearing, now, className }: { hearing: Hearing; now: Date; className?: string }) {
  if (isPendingClose(hearing, now))
    return (
      <Badge variant="warning" className={className}>
        Por cerrar
      </Badge>
    )
  const status = STATUS[hearing.status_id]
  return (
    <Badge variant={status.variant} className={className}>
      {status.label}
    </Badge>
  )
}

// El tipo requiere enlace y no lo tiene: no se comunicará hasta que se agregue.
export function MissingLinkNote({ className }: { className?: string }) {
  return (
    <p className={cn('text-xs font-medium text-amber-800 dark:text-amber-300', className)}>
      ⚠ Sin enlace de conexión: no se comunicará
    </p>
  )
}
