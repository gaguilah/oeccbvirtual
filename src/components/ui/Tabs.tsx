import { useEffect, useRef, type KeyboardEvent } from 'react'
import { cn } from '../../lib/cn'
import { tabIds } from './tabIds'
import TabsMenu from './TabsMenu'

export type TabItem<T extends string> = { id: T; label: string }

type TabsProps<T extends string> = {
  items: TabItem<T>[]
  value: T
  onChange: (id: T) => void
  // Nombre accesible de la fila, p. ej. "Secciones del perfil".
  label: string
  // Prefijo de los ids (el mismo que usa cada panel con tabPanelProps).
  idPrefix: string
  className?: string
}

// Pestañas subrayadas (Ayuda, Mi perfil). Desde `sm` (640 px) es la fila de pestañas, que pasa a
// otra línea si no caben; en celular, `TabsMenu`: un botón con la pestaña abierta que despliega la
// lista. Teclado: flechas izquierda/derecha, Inicio y Fin cambian de pestaña (activación
// automática); Tab entra al panel.
export default function Tabs<T extends string>({ items, value, onChange, label, idPrefix, className }: TabsProps<T>) {
  const refs = useRef(new Map<T, HTMLButtonElement>())

  useEffect(() => {
    refs.current.get(value)?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [value])

  function handleKeyDown(event: KeyboardEvent) {
    const index = items.findIndex((item) => item.id === value)
    const last = items.length - 1
    const next =
      event.key === 'ArrowRight'
        ? (index + 1) % items.length
        : event.key === 'ArrowLeft'
          ? (index - 1 + items.length) % items.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null
    if (next === null) return
    event.preventDefault()
    onChange(items[next].id)
    refs.current.get(items[next].id)?.focus()
  }

  return (
    <div className={className}>
      <TabsMenu items={items} value={value} onChange={onChange} label={label} className="sm:hidden" />
      <div
        className="hidden flex-wrap gap-x-6 gap-y-1 whitespace-nowrap sm:flex"
        role="tablist"
        aria-label={label}
        onKeyDown={handleKeyDown}
      >
        {items.map((item) => {
          const active = item.id === value
          const ids = tabIds(idPrefix, item.id)
          return (
            <button
              key={item.id}
              ref={(node) => {
                if (node) refs.current.set(item.id, node)
                else refs.current.delete(item.id)
              }}
              id={ids.tab}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={ids.panel}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(item.id)}
              className={cn(
                'inline-flex min-h-10 items-center border-b-2 px-1 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                active
                  ? 'border-primary font-semibold text-on-surface'
                  : 'border-transparent font-medium text-on-surface-variant hover:text-on-surface',
              )}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
