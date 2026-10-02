// Clases compartidas por las ilustraciones. Los retrasos de la entrada escalonada se escriben
// en cada composición como '[--illustration-delay:150ms]' (Tailwind necesita el literal completo).

// Entrada; con "reducir movimiento" no se anima.
export const enter = 'motion-safe:animate-illustration-in'

// Las tarjetas se elevan al pasar el mouse (propiedad translate, independiente de la animación).
export const lift = 'transition-[translate] duration-300 ease-out hover:-translate-x-1 hover:-translate-y-1'

// Líneas que conectan paneles.
export const connector = 'absolute bg-on-surface/15'
export const connectorCorner = 'absolute border-on-surface/15'
