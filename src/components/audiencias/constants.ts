export const AUDIENCIAS_PATH = '/audiencias'

export const PAGE_SIZE = 10

// Estados públicos (hearing_statuses). Una Programada cuya hora ya pasó sigue "Programada" hasta
// que el juzgado la cierre.
export const STATUS: Record<1 | 2 | 3, { label: string; variant: 'primary' | 'success' | 'neutral' }> = {
  1: { label: 'Programada', variant: 'primary' },
  2: { label: 'Realizada', variant: 'success' },
  3: { label: 'Cancelada', variant: 'neutral' },
}
