// Posición de la página pública de Preguntas frecuentes al abrir una pregunta
// (docs/modulos/preguntas-frecuentes.md): la pregunta abierta queda centrada en el espacio visible
// bajo el encabezado del sitio; si es más alta que ese espacio (p. ej. con imagen), queda arriba,
// bajo el encabezado, para leerla desde su primera línea.

export type QuestionBox = {
  // Borde superior de la pregunta, medido desde el inicio de la página (px).
  top: number
  height: number
  // Alto de la ventana.
  viewport: number
  // Espacio que tapa el encabezado fijo (el scroll-margin-top de la pregunta).
  offset: number
}

export function questionScrollTop({ top, height, viewport, offset }: QuestionBox): number {
  const visible = viewport - offset
  const target = height <= visible ? top - offset - (visible - height) / 2 : top - offset
  return Math.max(0, Math.round(target))
}
