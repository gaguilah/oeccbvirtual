import { formatLongDate } from '../../../components/remates/dates'
import { bogotaParts } from '../dates'
import type { Hearing } from '../types'

// Datos del formato "Referencia cruzada" (docs/plan-audiencias-formato.md), ya formateados para el
// PDF. Se arma aquí, sin la librería de PDF, para que el dashboard no la descargue hasta pedirlo.
export type HearingFormatData = {
  title: string
  preparedOn: string
  preparedBy: string
  position: string
  caseNumber: string
  description: string
  documentDate: string
  recordingUrl: string
}

const EMPTY = '—'

// Solo las realizadas (que siempre tienen grabación) tienen formato.
export const hasFormat = (hearing: Hearing) => hearing.status_id === 2 && Boolean(hearing.recording_url)

// 68001310300520170012301 → 68001-31-03-005-2017-00123-01 (igual que en los correos).
export function formatCaseNumber(value: string): string {
  const m = /^(\d{5})(\d{2})(\d{2})(\d{3})(\d{4})(\d{5})(\d{2})$/.exec(value)
  return m ? m.slice(1).join('-') : value
}

export function hearingFormatData(hearing: Hearing, typeName: string): HearingFormatData {
  const caseNumber = formatCaseNumber(hearing.case_number)
  return {
    title: `Referencia cruzada ${caseNumber}`,
    preparedOn: hearing.recording_set_at ? formatLongDate(hearing.recording_set_at) : EMPTY,
    preparedBy: hearing.recording_set_by_name ?? EMPTY,
    position: hearing.recording_set_by_position ?? EMPTY,
    caseNumber,
    description: `Link ${typeName}`,
    documentDate: bogotaParts(hearing.scheduled_at).date.replace(/-/g, '/'),
    recordingUrl: hearing.recording_url ?? '',
  }
}

// Referencia-cruzada-<radicado>-<AAAAMMDDHHmm de la audiencia, hora de Colombia>.pdf
export function hearingFormatFileName(hearing: Hearing): string {
  const { date, time } = bogotaParts(hearing.scheduled_at)
  return `Referencia-cruzada-${hearing.case_number}-${date.replace(/-/g, '')}${time.replace(':', '')}.pdf`
}
