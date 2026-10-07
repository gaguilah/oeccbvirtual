export type DayKind = 'festivo' | 'cierre' | 'otro'

// Fila de public.non_business_days (RLS: calendario.ver).
export type NonBusinessDay = {
  day: string
  kind: DayKind
  reason: string
  created_at: string
}

export type NewDay = { day: string; kind: DayKind; reason: string }
