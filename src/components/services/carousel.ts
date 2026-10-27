// Lógica del carrusel de Servicios (docs/plan-inicio-servicios.md), aparte para probarla sin
// navegador.

// Índice dentro de 0…count-1 dando la vuelta: después de la última, la primera, y antes de la
// primera, la última.
export function wrapIndex(index: number, count: number): number {
  return ((index % count) + count) % count
}

// Tarjeta alineada al inicio: la de posición (offsetLeft) más cercana al desplazamiento actual.
export function nearestIndex(offsets: number[], scrollLeft: number): number {
  let best = 0
  for (let i = 1; i < offsets.length; i++) {
    if (Math.abs(offsets[i] - scrollLeft) < Math.abs(offsets[best] - scrollLeft)) best = i
  }
  return best
}
