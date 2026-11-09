// Serie de un gráfico de barras apiladas: su nombre y la clase de fondo de su color (token o color
// de estado, así sigue el tema claro y oscuro).
export type StackedSeries = { label: string; className: string }

// Una barra: su etiqueta y un valor por serie, en el mismo orden que las series.
export type StackedBar = { label: string; values: number[] }
