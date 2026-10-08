import { Select } from '../../components/ui'
import { cn } from '../../lib/cn'
import { MONTHS } from './period'
import type { Period, PeriodMode, YearMonth } from './types'
import { switchMode } from './usePeriodFilters'

const MODES: { value: PeriodMode; label: string }[] = [
  { value: 'mes', label: 'Mes' },
  { value: 'rango', label: 'Rango de meses' },
  { value: 'anio', label: 'Año' },
]

const monthOptions = MONTHS.map((name, i) => ({
  value: String(i + 1),
  label: name.charAt(0).toLocaleUpperCase('es') + name.slice(1),
}))

type Props = {
  period: Period
  years: number[]
  error: string | null
  onChange: (period: Period) => void
}

function MonthPicker({
  label,
  value,
  years,
  onChange,
}: {
  label: string
  value: YearMonth
  years: number[]
  onChange: (value: YearMonth) => void
}) {
  // El año del filtro siempre está entre las opciones (aunque llegue de una URL fuera del rango).
  const yearOptions = [...new Set([...years, value.year])].sort((a, b) => b - a)
  return (
    <fieldset className="flex items-end gap-2">
      <legend className="sr-only">{label}</legend>
      <Select
        label={label}
        value={String(value.month)}
        onChange={(e) => onChange({ ...value, month: Number(e.target.value) })}
        options={monthOptions}
        className="w-36"
      />
      <Select
        label="Año"
        aria-label={`${label}: año`}
        value={String(value.year)}
        onChange={(e) => onChange({ ...value, year: Number(e.target.value) })}
        options={yearOptions.map((year) => ({ value: String(year), label: String(year) }))}
        className="w-28"
      />
    </fieldset>
  )
}

// Periodo de los resultados: un mes, un rango de meses o un año.
export default function PeriodFilters({ period, years, error, onChange }: Props) {
  return (
    <div className="space-y-4 rounded-lg bg-surface-container-low p-4 sm:p-5">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-on-surface">Periodo</legend>
        <div className="inline-flex flex-wrap gap-1 rounded-lg bg-surface-container p-1">
          {MODES.map((mode) => (
            <label
              key={mode.value}
              className={cn(
                'cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors has-focus-visible:outline-2 has-focus-visible:outline-primary',
                period.mode === mode.value
                  ? 'bg-surface-container-lowest text-primary shadow-ambient'
                  : 'text-on-surface-variant hover:text-on-surface',
              )}
            >
              <input
                type="radio"
                name="period-mode"
                value={mode.value}
                checked={period.mode === mode.value}
                onChange={() => onChange(switchMode(period, mode.value))}
                className="sr-only"
              />
              {mode.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-end gap-x-6 gap-y-3 [&_label]:text-xs">
        {period.mode === 'mes' && (
          <MonthPicker
            label="Mes"
            value={period.month}
            years={years}
            onChange={(month) => onChange({ ...period, month })}
          />
        )}
        {period.mode === 'rango' && (
          <>
            <MonthPicker
              label="Desde"
              value={period.from}
              years={years}
              onChange={(from) => onChange({ ...period, from })}
            />
            <MonthPicker label="Hasta" value={period.to} years={years} onChange={(to) => onChange({ ...period, to })} />
          </>
        )}
        {period.mode === 'anio' && (
          <Select
            label="Año"
            value={String(period.year)}
            onChange={(e) => onChange({ ...period, year: Number(e.target.value) })}
            options={[...new Set([...years, period.year])]
              .sort((a, b) => b - a)
              .map((year) => ({ value: String(year), label: String(year) }))}
            className="w-28"
          />
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
