// Enlaces de la navegación pública. Añade aquí nuevas páginas públicas.
export type NavItem = { to: string; label: string }

export const mainLinks: NavItem[] = [
  { to: '/', label: 'Inicio' },
  { to: '/avisos-remates', label: 'Avisos Remate' },
  { to: '/audiencias', label: 'Audiencias' },
  { to: '/pqrs', label: 'PQRS' },
  { to: '/encuesta', label: 'Encuesta' },
  { to: '/tutoriales', label: 'Tutoriales' },
  { to: '/contacto', label: 'Contacto' },
]

type LinkState = { isActive: boolean }

// Escritorio: "Flat Tabs". El activo cambia a on-surface con subrayado primary de 2px.
export function desktopLinkClass({ isActive }: LinkState) {
  return [
    'inline-flex min-h-10 items-center border-b-2 px-3 text-sm font-medium transition-colors',
    isActive ? 'border-primary text-on-surface' : 'border-transparent text-on-surface-variant hover:text-on-surface',
  ].join(' ')
}

// Móvil: lista apilada; el activo se distingue con un fondo tonal.
export function mobileLinkClass({ isActive }: LinkState) {
  return [
    'flex min-h-10 items-center rounded-md px-3 text-sm font-medium transition-colors',
    isActive
      ? 'bg-surface-container text-on-surface'
      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
  ].join(' ')
}
