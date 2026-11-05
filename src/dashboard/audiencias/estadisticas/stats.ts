import type { StackedBar, StackedSeries } from '../../charts/types'
import type { HearingStatsRow } from './types'

export type Totals = { total: number; realizadas: number; canceladas: number; programadas: number; porCerrar: number }

// Tarjetas: suma de los tipos. Programadas incluye las por cerrar.
export function totals(rows: HearingStatsRow[]): Totals {
  return rows.reduce<Totals>(
    (acc, row) => ({
      total: acc.total + row.total,
      realizadas: acc.realizadas + row.realizadas,
      canceladas: acc.canceladas + row.canceladas,
      programadas: acc.programadas + row.programadas,
      porCerrar: acc.porCerrar + row.por_cerrar,
    }),
    { total: 0, realizadas: 0, canceladas: 0, programadas: 0, porCerrar: 0 },
  )
}

const percentFormatter = new Intl.NumberFormat('es-CO', { style: 'percent', maximumFractionDigits: 0 })

export const formatCount = (value: number) => value.toLocaleString('es-CO')

// Porcentaje del total del filtro; sin audiencias no hay porcentaje ("—", no 0 %).
export const share = (part: number, total: number) => (total > 0 ? percentFormatter.format(part / total) : '—')

export const formatValue = (value: number, total: number) => `${formatCount(value)} (${share(value, total)})`

// Partes de cada barra, en este orden: las cerradas y luego las que siguen Programadas, separadas en
// próximas (su hora no ha llegado) y por cerrar (ya llegó). Colores de los estados del dashboard.
export const STATS_SERIES: StackedSeries[] = [
  { label: 'Realizadas', className: 'bg-green-600 dark:bg-green-500' },
  { label: 'Canceladas', className: 'bg-red-500 dark:bg-red-400' },
  { label: 'Próximas', className: 'bg-primary' },
  { label: 'Por cerrar', className: 'bg-amber-500 dark:bg-amber-400' },
]

export const seriesValues = (row: HearingStatsRow) => [
  row.realizadas,
  row.canceladas,
  row.programadas - row.por_cerrar,
  row.por_cerrar,
]

// Una barra por tipo, en el orden de hearing_stats (de más a menos audiencias).
export const typeBars = (rows: HearingStatsRow[]): StackedBar[] =>
  rows.map((row) => ({ label: row.description, values: seriesValues(row) }))
