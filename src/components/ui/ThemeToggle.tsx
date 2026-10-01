import type { ReactNode } from 'react'
import { useTheme, type Theme } from '../../context/theme'
import { cn } from '../../lib/cn'

function Icon({ d }: { d: string }) {
  return (
    <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
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
  // Muestra el texto junto al icono (recomendado en móvil, donde hay espacio vertical).
  showLabels?: boolean
  className?: string
}

// Control segmentado: fondo tonal, sin bordes; la opción activa se "eleva" con surface-container-lowest.
export default function ThemeToggle({ showLabels = false, className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()

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
            onClick={() => setTheme(option.value)}
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
