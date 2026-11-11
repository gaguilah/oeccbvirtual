// Animación al ampliar una imagen (TutorialImage): el Modal crece desde la miniatura.

export type Rect = { left: number; top: number; width: number; height: number }

// Parte de la caja que ocupa la imagen con object-contain (centrada, sin deformarse). Sin tamaño
// natural (aún no cargó), devuelve la caja.
export function containedRect(box: Rect, naturalWidth: number, naturalHeight: number): Rect {
  if (!naturalWidth || !naturalHeight || !box.width || !box.height) return box
  const scale = Math.min(box.width / naturalWidth, box.height / naturalHeight)
  const width = naturalWidth * scale
  const height = naturalHeight * scale
  return { left: box.left + (box.width - width) / 2, top: box.top + (box.height - height) / 2, width, height }
}

// Transformación inicial del diálogo (con origen en su esquina superior izquierda) para que la imagen
// ampliada quede exactamente sobre la miniatura. null si no se puede medir.
export function zoomStartTransform(dialog: Rect, zoomed: Rect, thumb: Rect): string | null {
  if (!zoomed.width || !thumb.width) return null
  const scale = thumb.width / zoomed.width
  const x = thumb.left - dialog.left - scale * (zoomed.left - dialog.left)
  const y = thumb.top - dialog.top - scale * (zoomed.top - dialog.top)
  return `translate(${round(x)}px, ${round(y)}px) scale(${round(scale, 4)})`
}

// Al cerrar, la imagen vuelve a la miniatura solo si esta se ve en pantalla (si el usuario
// desplazó el diálogo y la miniatura quedó fuera, solo se desvanece).
export function isOnScreen(rect: Rect, viewportHeight: number): boolean {
  return rect.height > 0 && rect.top + rect.height > 0 && rect.top < viewportHeight
}

const round = (value: number, digits = 2) => Number(value.toFixed(digits))

export const ZOOM_DURATION_MS = 320
export const ZOOM_EASING = 'cubic-bezier(0.2, 0, 0, 1)'
