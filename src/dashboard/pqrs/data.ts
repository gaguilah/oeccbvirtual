import type { BadgeVariant } from './badgeVariant'
import type { RequestStatus, RequestTab } from './types'

export const PQRS_ADMIN_PATH = '/dashboard/pqrs'

export const RESPONSE_MAX_CHARS = 5000
export const RESPONSE_MIN_CHARS = 10

export const STATUS: Record<RequestStatus, { label: string; variant: BadgeVariant }> = {
  recibida: { label: 'Recibida', variant: 'primary' },
  en_tramite: { label: 'En trámite', variant: 'warning' },
  respondida: { label: 'Respondida', variant: 'success' },
  cerrada: { label: 'Cerrada', variant: 'neutral' },
}

export const TABS: { value: RequestTab; label: string }[] = [
  { value: 'pendientes', label: 'Pendientes' },
  { value: 'respondidas', label: 'Respondidas' },
  { value: 'cerradas', label: 'Cerradas' },
  { value: 'todas', label: 'Todas' },
]

// Nombre de cada correo del historial (email_log.kind).
export const EMAIL_KINDS: Record<string, string> = {
  pqrs_acuse: 'Acuse de recibo',
  pqrs_aviso_oficina: 'Aviso a la oficina',
  pqrs_respuesta: 'Respuesta',
  pqrs_respuesta_reenvio: 'Reenvío de la respuesta',
}

export function isPending(status: RequestStatus) {
  return status === 'recibida' || status === 'en_tramite'
}
