import { Badge } from '../ui'

type RemateStatusBadgeProps = {
  realizado: boolean
  className?: string
}

export default function RemateStatusBadge({ realizado, className }: RemateStatusBadgeProps) {
  return (
    <Badge variant={realizado ? 'neutral' : 'primary'} className={className}>
      {realizado ? 'Realizado' : 'Agendado'}
    </Badge>
  )
}
