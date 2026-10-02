import type { ReactNode } from 'react'
import { useTheme, type Theme } from '../../context/theme'
import { cn } from '../../lib/cn'

function Icon({ d }: { d: string }) {
  return (
    <svg
      className="size-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  )
}

const options: { value: Theme; label: string; icon: ReactNode }[] = [
  {
    value: 'light',
    label: 'Claro',
    icon: (
      <Icon d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
    ),
  },
  {
    value: 'dark',
    label: 'Oscuro',
    icon: (
      <Icon d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
    ),
  },
  {
    value: 'system',
    label: 'Sistema',
    icon: (
      <Icon d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
    ),
  },
]

type ThemeToggleProps = {
  // 'segmented' (por defecto): las 3 opciones siempre visibles. 'compact': solo el ícono del tema
  // actual; las 3 opciones aparecen en un desplegable al pasar el mouse o al enfocarlo (escritorio).
  variant?: 'segmented' | 'compact'
  // Muestra el texto junto al icono en la variante segmentada (menú móvil).
  showLabels?: boolean
  // Se llama después de elegir un tema (p. ej. para cerrar el menú móvil).
  onSelect?: (theme: Theme) => void
  className?: string
}

function CheckMark() {
  return (
    <svg
      className="ml-auto size-4 shrink-0 text-primary"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  )
}

// Botón con el tema actual y desplegable debajo con las 3 opciones. Se abre con hover o con el
// foco (group-focus-within), así funciona con mouse, teclado (Tab / Escape) y toque. Las opciones
// están `invisible` mientras está cerrado, por eso Tab no entra en ellas hasta que el grupo tiene foco.
function CompactThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const current = options.find((option) => option.value === theme) ?? options[2]

  return (
    <div
      className={cn('group/theme relative', className)}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && document.activeElement instanceof HTMLElement) document.activeElement.blur()
      }}
    >
      <button
        type="button"
        aria-label={`Tema: ${current.label}`}
        className={cn(
          'inline-flex size-10 items-center justify-center rounded-md bg-surface-container-low text-on-surface transition-colors hover:bg-surface-container',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        )}
      >
        {current.icon}
      </button>

      {/* pt-2 hace de puente: el panel no se cierra al bajar el mouse desde el botón. */}
      <div
        className={cn(
          'absolute top-full right-0 z-20 pt-2',
          'invisible opacity-0 group-focus-within/theme:visible group-focus-within/theme:opacity-100 group-hover/theme:visible group-hover/theme:opacity-100',
          'motion-safe:-translate-y-1 motion-safe:transition-[opacity,visibility,translate] motion-safe:duration-150 motion-safe:group-focus-within/theme:translate-y-0 motion-safe:group-hover/theme:translate-y-0',
        )}
      >
        <div
          role="group"
          aria-label="Tema de color"
          className="w-40 rounded-lg bg-surface-container-lowest p-1 shadow-ambient"
        >
          {options.map((option) => {
            const active = theme === option.value
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={(event) => {
                  setTheme(option.value)
                  // Con mouse (detail > 0) se suelta el foco para que el panel se cierre;
                  // con teclado se conserva para seguir navegando.
                  if (event.detail > 0) event.currentTarget.blur()
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary',
                  active
                    ? 'bg-primary-container text-on-surface'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
                )}
              >
                {option.icon}
                {option.label}
                {active && <CheckMark />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Control segmentado: fondo tonal, sin bordes; la opción activa se "eleva" con surface-container-lowest.
export default function ThemeToggle({
  variant = 'segmented',
  showLabels = false,
  onSelect,
  className,
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()

  if (variant === 'compact') return <CompactThemeToggle className={className} />

  return (
    <div
      role="group"
      aria-label="Tema de color"
      className={cn('inline-flex rounded-md bg-surface-container-low p-1', showLabels && 'flex w-full', className)}
    >
      {options.map((option) => {
        const active = theme === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              setTheme(option.value)
              onSelect?.(option.value)
            }}
            aria-pressed={active}
            aria-label={showLabels ? undefined : option.label}
            title={option.label}
            className={cn(
              'inline-flex min-h-8 items-center justify-center gap-2 rounded px-2 text-sm font-medium transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary',
              showLabels && 'min-h-9 flex-1',
              active
                ? 'bg-surface-container-lowest text-on-surface shadow-ambient'
                : 'text-on-surface-variant hover:text-on-surface',
            )}
          >
            {option.icon}
            {showLabels && option.label}
          </button>
        )
      })}
    </div>
  )
}
