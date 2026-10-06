import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '../../lib/cn'
import Icon from './Icon'
import { icons } from './icons'

export type ActionMenuItem = {
  label: string
  icon: string[]
  onSelect: () => void
  // Acción destructiva (p. ej. Eliminar): texto en rojo.
  danger?: boolean
}

type ActionMenuProps = {
  items: ActionMenuItem[]
  // Nombre accesible del botón, p. ej. "Opciones del aviso del radicado …".
  label: string
  className?: string
}

// Botón de tres puntos verticales que abre un menú debajo, con el mismo panel que el selector de
// tema (ThemeToggle compacto). Se abre con clic o toque; se cierra al elegir, al tocar fuera o con
// Escape (que devuelve el foco al botón).
export default function ActionMenu({ items, label, className }: ActionMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  if (items.length === 0) return null

  return (
    <div
      ref={rootRef}
      className={cn('relative', className)}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          setOpen(false)
          buttonRef.current?.focus()
        }
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen(!open)}
        className={cn(
          'inline-flex size-10 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
          open && 'bg-surface-container text-on-surface',
        )}
      >
        <Icon paths={icons.dotsVertical} />
      </button>

      {open && (
        <div className="absolute top-full right-0 z-20 pt-2">
          <div
            id={menuId}
            role="menu"
            aria-label={label}
            className="w-44 rounded-lg bg-surface-container-lowest p-1 shadow-ambient"
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  item.onSelect()
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary',
                  item.danger
                    ? 'text-red-700 hover:bg-red-600/10 dark:text-red-400'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
                )}
              >
                <Icon paths={item.icon} className="size-4" />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
