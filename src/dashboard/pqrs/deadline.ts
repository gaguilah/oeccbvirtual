import type { RequestRow } from './types'

// El plazo (15 días hábiles: lunes a viernes, sin los días de non_business_days, desde el día
// siguiente a la radicación) lo calcula solo la base de datos: columnas due_date y
// business_days_left (migración 20261007150000_non_business_days.sql). Aquí solo se decide cómo
// mostrarlo.
export const RESPONSE_BUSINESS_DAYS = 15

export type Deadline = { kind: 'none' } | { kind: 'ok' | 'soon' | 'today' | 'overdue'; days: number; due: string }

// Solo las pendientes tienen plazo. "soon": 3 días hábiles o menos.
export function deadlineFor(row: Pick<RequestRow, 'status' | 'due_date' | 'business_days_left'>): Deadline {
  if (row.status !== 'recibida' && row.status !== 'en_tramite') return { kind: 'none' }
  const days = row.business_days_left
  const due = row.due_date
  if (days < 0) return { kind: 'overdue', days: -days, due }
  if (days === 0) return { kind: 'today', days: 0, due }
  return { kind: days <= 3 ? 'soon' : 'ok', days, due }
}
