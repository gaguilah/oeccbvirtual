import { cn } from '../../lib/cn'
import type { StackedBar, StackedSeries } from './types'

type StackedBarChartProps = {
  series: StackedSeries[]
  bars: StackedBar[]
  // Nombre de la lista para lectores de pantalla.
  label: string
  // Texto de cada valor dentro de su barra, p. ej. "2 (40 %)".
  format: (value: number, total: number) => string
  className?: string
}

// Barras horizontales apiladas: una fila por barra con su etiqueta y su total, la barra (largo
// proporcional a la mayor, partida por serie) y debajo cada serie con su valor escrito, así se lee
// sin depender del color. La leyenda va arriba.
export default function StackedBarChart({ series, bars, label, format, className }: StackedBarChartProps) {
  const totals = bars.map((bar) => bar.values.reduce((sum, value) => sum + value, 0))
  const max = Math.max(1, ...totals)

  return (
    <div className={cn('space-y-4', className)}>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-on-surface-variant" aria-hidden="true">
        {series.map((serie) => (
          <li key={serie.label} className="flex items-center gap-1.5">
            <span className={cn('size-3 shrink-0 rounded-sm', serie.className)} />
            {serie.label}
          </li>
        ))}
      </ul>
      <ul aria-label={label} className="space-y-4">
        {bars.map((bar, i) => (
          <li key={bar.label} className="space-y-1.5 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-medium text-on-surface">{bar.label}</span>
              <span className="shrink-0 font-semibold tabular-nums text-on-surface">
                <span className="sr-only">Total: </span>
                {totals[i].toLocaleString('es-CO')}
              </span>
            </div>
            <span className="flex h-4 overflow-hidden rounded bg-surface-container" aria-hidden="true">
              <span
                className="flex h-full transition-[width] duration-500"
                style={{ width: `${(totals[i] / max) * 100}%` }}
              >
                {bar.values.map((value, j) =>
                  value > 0 ? (
                    <span
                      key={series[j].label}
                      className={cn('h-full', series[j].className)}
                      style={{ width: `${(value / totals[i]) * 100}%` }}
                    />
                  ) : null,
                )}
              </span>
            </span>
            <p className="flex flex-wrap gap-x-3 text-xs text-on-surface-variant">
              {bar.values.map((value, j) =>
                value > 0 ? (
                  <span key={series[j].label} className="tabular-nums">
                    {series[j].label}: {format(value, totals[i])}
                  </span>
                ) : null,
              )}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
