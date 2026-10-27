import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '../../lib/cn'
import CheckIcon from './CheckIcon'
import type { TabItem } from './Tabs'

type TabsMenuProps<T extends string> = {
  items: TabItem<T>[]
  value: T
  onChange: (id: T) => void
  label: string
  className?: string
}

// Versión de celular de `Tabs`: un botón con la pestaña abierta que despliega la lista de todas.
// Se cierra al elegir, al tocar fuera o con Escape (el foco vuelve al botón). Flechas arriba/abajo,
// Inicio y Fin recorren la lista. Las pestañas de verdad (role="tab") siguen en la página, ocultas,
// porque los paneles toman de ellas su nombre (aria-labelledby).
export default function TabsMenu<T extends string>({ items, value, onChange, label, className }: TabsMenuProps<T>) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const listId = useId()
  const current = items.find((item) => item.id === value) ?? items[0]

  useEffect(() => {
    if (!open) return
    listRef.current?.querySelector<HTMLButtonElement>('[aria-current="true"]')?.focus()
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  function close() {
    setOpen(false)
    buttonRef.current?.focus()
  }

  function moveFocus(key: string) {
    const options = [...(listRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])]
    const index = options.indexOf(document.activeElement as HTMLButtonElement)
    const last = options.length - 1
    const next =
      key === 'ArrowDown'
        ? (index + 1) % options.length
        : key === 'ArrowUp'
          ? (index - 1 + options.length) % options.length
          : key === 'Home'
            ? 0
            : last
    options[next]?.focus()
  }

  return (
    <div
      ref={rootRef}
      className={cn('relative', className)}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.preventDefault()
          close()
        } else if (open && ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
          event.preventDefault()
          moveFocus(event.key)
        }
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen(!open)}
        className={cn(
          'flex min-h-11 w-full items-center gap-3 rounded-lg bg-surface-container-low px-3 text-left text-sm transition-colors hover:bg-surface-container',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
          open && 'bg-surface-container',
        )}
      >
        <svg
          className="size-5 shrink-0 text-on-surface-variant"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
        <span className="min-w-0 flex-1">
          <span className="sr-only">{label}: </span>
          <span className="block truncate font-semibold text-on-surface">{current.label}</span>
        </span>
        <span className="shrink-0 text-xs text-on-surface-variant">
          {items.indexOf(current) + 1} de {items.length}
        </span>
        <svg
          className={cn('size-4 shrink-0 text-on-surface-variant transition-transform', open && 'rotate-180')}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-20 pt-2">
          <ul
            ref={listRef}
            id={listId}
            aria-label={label}
            className="max-h-[70vh] overflow-y-auto rounded-lg bg-surface-container-lowest p-1 shadow-ambient"
          >
            {items.map((item) => {
              const active = item.id === value
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-current={active ? 'true' : undefined}
                    onClick={() => {
                      close()
                      if (!active) onChange(item.id)
                    }}
                    className={cn(
                      'flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-left text-sm transition-colors',
                      'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary',
                      active
                        ? 'bg-surface-container-low font-semibold text-on-surface'
                        : 'font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
                    )}
                  >
                    <span className="flex-1">{item.label}</span>
                    {active && <CheckIcon className="shrink-0 text-primary" />}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
