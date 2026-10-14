export const AUDIENCIAS_PATH = '/audiencias'

export const PAGE_SIZE = 10

type PublicStatus = { label: string; variant: 'primary' | 'success' | 'neutral' }

// Estados públicos (hearing_statuses).
export const STATUS: Record<1 | 2 | 3, PublicStatus> = {
  1: { label: 'Programada', variant: 'primary' },
  2: { label: 'Realizada', variant: 'success' },
  3: { label: 'Cancelada', variant: 'neutral' },
}

// Programada 60 minutos después de su hora y sin cerrar (pending_confirmation, calculado en
// list_public_hearings con la hora del servidor; docs/plan-audiencias-publica-tiempos.md).
const PENDING_CONFIRMATION: PublicStatus = { label: 'Por confirmar', variant: 'neutral' }

// Etiqueta pública de una audiencia (tabla, tarjetas y detalle).
export const publicStatus = (hearing: { status_id: 1 | 2 | 3; pending_confirmation: boolean }) =>
  hearing.pending_confirmation ? PENDING_CONFIRMATION : STATUS[hearing.status_id]
