import { Badge } from '../../components/ui'
import { STATUS } from './data'
import { deadlineFor } from './deadline'
import type { RequestStatus } from './types'

export function StatusBadge({ status, className }: { status: RequestStatus; className?: string }) {
  const { label, variant } = STATUS[status]
  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  )
}

function plural(days: number) {
  return `${days} ${days === 1 ? 'día hábil' : 'días hábiles'}`
}

// Plazo de las pendientes: días hábiles que quedan, "Vence hoy" o "Vencida". Nada si ya se respondió
// o se cerró.
export function DeadlineBadge({
  status,
  createdAt,
  now,
  className,
}: {
  status: RequestStatus
  createdAt: string
  now: Date
  className?: string
}) {
  const deadline = deadlineFor(status, createdAt, now)
  if (deadline.kind === 'none') return null
  if (deadline.kind === 'overdue') {
    return (
      <Badge variant="danger" className={className}>
        Vencida hace {plural(deadline.days)}
      </Badge>
    )
  }
  if (deadline.kind === 'today') {
    return (
      <Badge variant="warning" className={className}>
        Vence hoy
      </Badge>
    )
  }
  return (
    <Badge variant={deadline.kind === 'soon' ? 'warning' : 'neutral'} className={className}>
      {plural(deadline.days)}
    </Badge>
  )
}
