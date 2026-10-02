import { cn } from '../../lib/cn'

// Mapa esquemático (no es un mapa real): cuadras en cuadrícula, la Carrera 12 y la Calle 31
// rotuladas, la cuadra de la oficina resaltada y un pin con pulso en el cruce.
// El SVG escala con el ancho de la tarjeta; el pin es HTML para poder animarlo con animate-ping.
const WIDTH = 288
const HEIGHT = 84
// Calles verticales (carreras) y horizontales (calles): posición y grosor en unidades del SVG.
const avenues = [36, 100, 164, 228]
const streets = [20, 52]
const STREET = 10
const CARRERA_12 = avenues[2]
const CALLE_31 = streets[1]

export default function MapSketch({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-md', className)}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="block h-auto w-full">
        {/* Fondo = cuadras; encima, las calles. */}
        <rect width={WIDTH} height={HEIGHT} className="fill-surface-container" />
        {/* Cuadra de la oficina. */}
        <rect
          x={CARRERA_12 + STREET}
          y={CALLE_31 + STREET}
          width={avenues[3] - CARRERA_12 - STREET}
          height={HEIGHT - CALLE_31 - STREET}
          className="fill-primary-container"
        />
        {avenues.map((x) => (
          <rect key={`a${x}`} x={x} y={0} width={STREET} height={HEIGHT} className="fill-surface-container-lowest" />
        ))}
        {streets.map((y) => (
          <rect key={`c${y}`} x={0} y={y} width={WIDTH} height={STREET} className="fill-surface-container-lowest" />
        ))}
        {/* Carrera 12 y Calle 31 un poco más marcadas. */}
        <rect x={CARRERA_12} y={0} width={STREET} height={HEIGHT} className="fill-primary/10" />
        <rect x={0} y={CALLE_31} width={WIDTH} height={STREET} className="fill-primary/10" />
        <text x={8} y={CALLE_31 + 7.5} className="fill-on-surface-variant text-[9px] font-semibold">
          Calle 31
        </text>
        <text
          x={CARRERA_12 + 7.5}
          y={HEIGHT - 6}
          transform={`rotate(-90 ${CARRERA_12 + 7.5} ${HEIGHT - 6})`}
          className="fill-on-surface-variant text-[9px] font-semibold"
        >
          Cra. 12
        </text>
      </svg>

      {/* Pin en la esquina de la cuadra de la oficina: x = (164 + 10 + 6) / 288 = 62.5 %,
          y = (52 + 10 + 4) / 84 ≈ 78.6 %. Si cambian las calles, recalcular. */}
      <span className="absolute top-[78.6%] left-[62.5%] -translate-x-1/2 -translate-y-full">
        <span className="absolute bottom-0 left-1/2 size-3 -translate-x-1/2 translate-y-1/2 rounded-full bg-primary/40 motion-safe:animate-ping" />
        <svg className="relative size-5 text-primary drop-shadow" viewBox="0 0 24 24" fill="currentColor">
          <path
            fillRule="evenodd"
            d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    </div>
  )
}
