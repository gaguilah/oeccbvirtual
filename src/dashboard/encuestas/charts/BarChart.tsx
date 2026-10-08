import { cn } from '../../../lib/cn'

export type Bar = { label: string; count: number; detail: string }

type BarChartProps = {
  bars: Bar[]
  // Nombre de la lista para lectores de pantalla.
  label: string
  className?: string
}

// Barras horizontales: una fila por valor con su etiqueta, la barra (proporcional a la mayor) y el
// conteo con su porcentaje escritos, así se lee sin depender del color.
export default function BarChart({ bars, label, className }: BarChartProps) {
  const max = Math.max(1, ...bars.map((bar) => bar.count))

  return (
    <ul aria-label={label} className={cn('space-y-2', className)}>
      {bars.map((bar) => (
        <li key={bar.label} className="grid grid-cols-[1.5rem_1fr_auto] items-center gap-3 text-sm">
          <span className="text-right font-semibold tabular-nums text-on-surface">{bar.label}</span>
          <span className="h-5 overflow-hidden rounded bg-surface-container" aria-hidden="true">
            <span
              className="block h-full rounded bg-primary transition-[width] duration-500"
              style={{ width: `${(bar.count / max) * 100}%` }}
            />
          </span>
          <span className="min-w-20 tabular-nums text-on-surface-variant">{bar.detail}</span>
        </li>
      ))}
    </ul>
  )
}
