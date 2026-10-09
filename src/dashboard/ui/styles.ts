// Bloque de filtros fijo bajo la Topbar (min-h-16) desde xl (1280 px), donde las listas se ven en
// tabla; fondo translúcido como la Topbar para que la tabla pase por debajo. La usan Avisos de
// Remate, Audiencias (vista Tabla), PQRS y Usuarios. El bloque debe ser hijo directo del contenedor
// de la página, para quedar fijo mientras se ve la lista.
export const stickyFilters = 'xl:sticky xl:top-16 xl:z-[5] xl:bg-surface/90 xl:py-3 xl:backdrop-blur-xl'
