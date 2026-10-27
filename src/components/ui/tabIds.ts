// Ids que enlazan cada pestaña de `Tabs` con su panel (aria-controls / aria-labelledby). El panel
// los toma con `tabPanelProps(prefix, id)`; `prefix` es el mismo que recibe `Tabs` (p. ej. de useId).
export function tabIds(prefix: string, id: string) {
  return { tab: `${prefix}-tab-${id}`, panel: `${prefix}-panel-${id}` }
}

// El panel recibe el foco con Tab desde la pestaña: contorno visible solo con teclado.
export function tabPanelProps(prefix: string, id: string) {
  const ids = tabIds(prefix, id)
  return {
    id: ids.panel,
    role: 'tabpanel',
    'aria-labelledby': ids.tab,
    tabIndex: 0,
    className: 'rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary',
  } as const
}
