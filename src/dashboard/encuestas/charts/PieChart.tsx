import { cn } from '../../../lib/cn'

export type PieSlice = { label: string; value: number; className: string }

type PieChartProps = {
  slices: PieSlice[]
  // Resumen para lectores de pantalla, p. ej. "Sí: 43 (91 %). No: 4 (9 %)."
  label: string
  className?: string
}

const R = 48
const C = 50

function point(fraction: number) {
  const angle = fraction * 2 * Math.PI - Math.PI / 2
  return `${C + R * Math.cos(angle)} ${C + R * Math.sin(angle)}`
}

// Gráfico de torta en SVG. Empieza arriba y avanza en el sentido del reloj; cada porción lleva una
// clase de relleno (p. ej. fill-primary) para seguir los tokens en claro y oscuro.
export default function PieChart({ slices, label, className }: PieChartProps) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)
  let start = 0

  return (
    <svg viewBox="0 0 100 100" role="img" aria-label={label} className={cn('size-36 shrink-0', className)}>
      {total === 0 ? (
        <circle cx={C} cy={C} r={R} className="fill-surface-container" />
      ) : (
        slices
          .filter((slice) => slice.value > 0)
          .map((slice) => {
            const fraction = slice.value / total
            const from = start
            start += fraction
            if (fraction >= 1) return <circle key={slice.label} cx={C} cy={C} r={R} className={slice.className} />
            return (
              <path
                key={slice.label}
                d={`M${C} ${C} L${point(from)} A${R} ${R} 0 ${fraction > 0.5 ? 1 : 0} 1 ${point(start)} Z`}
                className={cn(slice.className, 'stroke-surface-container-lowest')}
                strokeWidth={1}
                strokeLinejoin="round"
              />
            )
          })
      )}
    </svg>
  )
}
