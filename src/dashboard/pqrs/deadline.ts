import { bogotaParts } from '../remates/datetime'
import type { RequestStatus } from './types'

// Plazo de respuesta: 15 días hábiles (lunes a viernes) contados desde el día siguiente a la
// radicación, en hora de Colombia. Festivos: más adelante. La misma regla está en la función SQL
// public.pqrs_due_date (migración 20261007140000_pqrs_admin.sql): si cambia, cambiar las dos.
export const RESPONSE_BUSINESS_DAYS = 15

// Las fechas se manejan como 'YYYY-MM-DD' sobre UTC para que el huso del navegador no corra el día.
function toDate(date: string) {
  return new Date(`${date}T00:00:00Z`)
}

function toKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function isBusinessDay(date: Date) {
  const day = date.getUTCDay()
  return day !== 0 && day !== 6
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 86_400_000)
}

export function dueDate(createdAt: string): string {
  let date = toDate(bogotaParts(createdAt).date)
  let counted = 0
  while (counted < RESPONSE_BUSINESS_DAYS) {
    date = addDays(date, 1)
    if (isBusinessDay(date)) counted++
  }
  return toKey(date)
}

// Días hábiles entre hoy (exclusivo) y la fecha de vencimiento (inclusiva). Negativo si ya venció.
function businessDaysUntil(today: string, due: string): number {
  if (today === due) return 0
  const forward = today < due
  let date = toDate(today)
  const end = toDate(due)
  let count = 0
  while (forward ? date < end : date > end) {
    date = addDays(date, forward ? 1 : -1)
    if (isBusinessDay(date)) count++
  }
  return forward ? count : -count
}

export type Deadline = { kind: 'none' } | { kind: 'ok' | 'soon' | 'today' | 'overdue'; days: number; due: string }

// Solo las pendientes tienen plazo. "soon": 3 días hábiles o menos.
export function deadlineFor(status: RequestStatus, createdAt: string, now: Date): Deadline {
  if (status !== 'recibida' && status !== 'en_tramite') return { kind: 'none' }
  const due = dueDate(createdAt)
  const days = businessDaysUntil(bogotaParts(now).date, due)
  if (days < 0) return { kind: 'overdue', days: -days, due }
  if (days === 0) return { kind: 'today', days: 0, due }
  return { kind: days <= 3 ? 'soon' : 'ok', days, due }
}
