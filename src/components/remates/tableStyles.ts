// Estilos de la tabla de avisos, compartidos por el sitio público (RematesTable) y el dashboard
// (AdminRematesTable). Sin líneas divisorias: las filas se separan con un fondo alterno.
export const headerCell = 'px-4 py-3 text-xs font-semibold uppercase tracking-widest text-on-surface-variant lg:px-6'

export const bodyCell = 'px-4 py-4 lg:px-6'

export const bodyRow = 'transition-colors even:bg-surface-container-low/50 hover:bg-primary-container/30'

export const mobileItem = 'space-y-3 px-4 py-4 even:bg-surface-container-low/50'

// Primera fila de filtros fija bajo el encabezado del sitio (h-16) desde tableta (md, 768 px),
// mientras se ve la tabla; con fondo translúcido como el encabezado para que la tabla pase por
// debajo. Avisos de Remate y Audiencias (sitio público): el padre debe envolver filtros y
// resultados, para que la fila se suelte al terminar la tabla.
export const stickyFilters = 'md:sticky md:top-16 md:z-30 md:bg-surface/90 md:py-3 md:backdrop-blur-xl'
