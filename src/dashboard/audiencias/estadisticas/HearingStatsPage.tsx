import { useId, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MODALITIES, modalityShort, type Modality } from '../../../components/audiencias/modality'
import { COURTS, type Court } from '../../../components/remates'
import { Alert, Button, EmptyState, Select, Spinner } from '../../../components/ui'
import { cn } from '../../../lib/cn'
import { useDocumentMeta } from '../../../lib/useDocumentMeta'
import { useAccess } from '../../access'
import { StackedBarChart } from '../../charts'
import {
  PeriodFilters,
  periodError,
  periodLabel,
  periodPhrase,
  periodRange,
  usePeriodFilters,
  yearRange,
} from '../../period'
import { HEARINGS_PATH } from '../data'
import type { HearingType } from '../types'
import { useHearingTypes } from '../useHearingsData'
import { changeStatsFilters, parseStatsFilters, typesForModality, withStatsFilters } from './filters'
import { formatCount, formatValue, seriesValues, share, STATS_SERIES, totals, typeBars } from './stats'
import type { HearingStatsRow, StatsFilters } from './types'
import { useHearingStats } from './useHearingStats'

function Kpi({
  label,
  value,
  detail,
  className,
}: {
  label: string
  value: string
  detail: string
  className?: string
}) {
  return (
    <div className={cn('rounded-lg bg-surface-container-low p-5', className)}>
      <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">{label}</p>
      <p className="mt-2 font-display text-3xl font-extrabold text-on-surface">{value}</p>
      <p className="mt-1 text-xs text-on-surface-variant">{detail}</p>
    </div>
  )
}

function StatsTable({ rows, caption }: { rows: HearingStatsRow[]; caption: string }) {
  const sum = totals(rows)
  const sumValues = [sum.realizadas, sum.canceladas, sum.programadas - sum.porCerrar, sum.porCerrar]
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-xl text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-on-surface-variant">
            <th scope="col" className="py-2 pr-4 pl-2 font-semibold">
              Tipo
            </th>
            {STATS_SERIES.map((serie) => (
              <th key={serie.label} scope="col" className="py-2 pr-4 text-right font-semibold">
                {serie.label}
              </th>
            ))}
            <th scope="col" className="py-2 pr-2 text-right font-semibold">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.type_id} className="odd:bg-surface-container-lowest/60">
              <th scope="row" className="py-2 pr-4 pl-2 text-left font-medium">
                {row.description}
                <span className="block text-xs font-normal text-on-surface-variant">{modalityShort(row)}</span>
              </th>
              {seriesValues(row).map((value, i) => (
                <td key={STATS_SERIES[i].label} className="py-2 pr-4 text-right tabular-nums">
                  {formatValue(value, row.total)}
                </td>
              ))}
              <td className="py-2 pr-2 text-right font-semibold tabular-nums">{formatCount(row.total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-semibold">
            <th scope="row" className="py-2 pr-4 pl-2 text-left">
              Total
            </th>
            {sumValues.map((value, i) => (
              <td key={STATS_SERIES[i].label} className="py-2 pr-4 text-right tabular-nums">
                {formatValue(value, sum.total)}
              </td>
            ))}
            <td className="py-2 pr-2 text-right tabular-nums">{formatCount(sum.total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function Filters({
  filters,
  types,
  showCourt,
  onChange,
}: {
  filters: StatsFilters
  types: HearingType[]
  showCourt: boolean
  onChange: (changes: Partial<StatsFilters>) => void
}) {
  const options = typesForModality(types, filters.modality)
  return (
    // Uno por fila en el teléfono; desde md (768 px), todos en una fila (3 con juzgado, 2 sin él).
    <div className={cn('grid gap-3', showCourt ? 'md:grid-cols-3' : 'md:grid-cols-2')}>
      {showCourt && (
        <Select
          label="Juzgado"
          value={filters.court ? String(filters.court) : ''}
          onChange={(e) => onChange({ court: e.target.value ? (Number(e.target.value) as Court) : null })}
          options={[
            { value: '', label: 'Todos' },
            { value: '1', label: COURTS[1].short },
            { value: '2', label: COURTS[2].short },
          ]}
        />
      )}
      <Select
        label="Modalidad"
        value={filters.modality ?? ''}
        onChange={(e) => onChange({ modality: (e.target.value || null) as Modality | null })}
        options={[{ value: '', label: 'Todas' }, ...MODALITIES]}
      />
      <Select
        label="Tipo"
        value={filters.type ? String(filters.type) : ''}
        onChange={(e) => onChange({ type: e.target.value ? Number(e.target.value) : null })}
        options={[
          { value: '', label: 'Todos' },
          ...options.map((t) => ({
            value: String(t.id),
            label: t.is_active ? t.description : `${t.description} (inactivo)`,
          })),
        ]}
      />
    </div>
  )
}

// Estadísticas de audiencias (/dashboard/audiencias/estadisticas, docs/plan-audiencias-estadisticas.md):
// conteos por estado y por tipo del periodo, con los filtros en la URL. Solo conteos de
// hearing_stats(), que respeta el alcance por juzgado (RLS).
export default function HearingStatsPage() {
  useDocumentMeta({ title: 'Estadísticas de audiencias · Dashboard', noindex: true })
  const { access } = useAccess()
  const forcedCourt = access?.scope === 'court' ? (access.court as Court) : null
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = parseStatsFilters(searchParams, forcedCourt)
  const { period, setPeriod } = usePeriodFilters()
  const invalid = periodError(period)
  const { types, error: typesError } = useHearingTypes()
  const { stats, error, loading, reload } = useHearingStats(invalid ? null : periodRange(period), filters)
  const [asTable, setAsTable] = useState(false)
  const chartTitleId = useId()

  const onChange = (changes: Partial<StatsFilters>) =>
    setSearchParams((current) =>
      withStatsFilters(
        current,
        changeStatsFilters(parseStatsFilters(current, forcedCourt), changes, types ?? []),
        forcedCourt,
      ),
    )

  const sum = stats ? totals(stats.rows) : null
  const court = filters.court ?? forcedCourt
  const scope = court ? `del ${COURTS[court].short}` : 'de los dos juzgados'

  function renderResults() {
    if (error)
      return (
        <Alert variant="error" title="No se pudieron cargar las estadísticas">
          <p>{error}</p>
          <Button variant="secondary" size="sm" onClick={reload} className="mt-3">
            Reintentar
          </Button>
        </Alert>
      )
    if (!stats || !sum)
      return (
        <div className="flex justify-center py-12 text-primary">
          <Spinner size="lg" label="Cargando estadísticas..." />
        </div>
      )
    return (
      <section
        aria-labelledby="stats-title"
        aria-busy={loading}
        className={cn('space-y-6 transition-opacity', loading && 'opacity-60')}
      >
        <h2 id="stats-title" className="text-lg font-bold">
          {periodLabel(period)}
        </h2>
        {sum.total === 0 ? (
          <EmptyState
            title={`No hay audiencias ${periodPhrase(period)}`}
            description="Pruebe con otro periodo o con otros filtros."
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Kpi
                label="Total"
                value={formatCount(sum.total)}
                detail={`${sum.total === 1 ? 'audiencia' : 'audiencias'} ${periodPhrase(period)}`}
              />
              <Kpi
                label="Realizadas"
                value={formatCount(sum.realizadas)}
                detail={`${share(sum.realizadas, sum.total)} del total`}
              />
              <Kpi
                label="Canceladas"
                value={formatCount(sum.canceladas)}
                detail={`${share(sum.canceladas, sum.total)} del total`}
              />
              <Kpi
                label="Programadas"
                value={formatCount(sum.programadas)}
                detail={`${share(sum.programadas, sum.total)} del total · de ellas, ${formatCount(sum.porCerrar)} por cerrar`}
              />
            </div>

            <article
              aria-labelledby={chartTitleId}
              className="space-y-5 rounded-lg bg-surface-container-low p-5 sm:p-6"
            >
              <header className="space-y-1">
                <h3 id={chartTitleId} className="text-base font-bold">
                  Por tipo de audiencia
                </h3>
                <p className="text-xs text-on-surface-variant">
                  De más a menos audiencias. Próximas y Por cerrar son las que siguen programadas.
                </p>
              </header>
              {asTable ? (
                <StatsTable rows={stats.rows} caption={`Audiencias por tipo y estado, ${periodLabel(period)}`} />
              ) : (
                <StackedBarChart
                  series={STATS_SERIES}
                  bars={typeBars(stats.rows)}
                  format={formatValue}
                  label={`Audiencias por tipo y estado, ${periodLabel(period)}`}
                />
              )}
              <button
                type="button"
                onClick={() => setAsTable((value) => !value)}
                aria-pressed={asTable}
                className="text-sm font-medium text-primary hover:underline"
              >
                {asTable ? 'Ver como gráfico' : 'Ver como tabla'}
              </button>
            </article>
          </>
        )}
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link to={HEARINGS_PATH} className="inline-flex text-sm font-medium text-primary hover:underline">
          ← Volver a Audiencias
        </Link>
        <h2 className="text-2xl font-extrabold">Estadísticas</h2>
        <p className="max-w-2xl text-sm text-on-surface-variant">
          Audiencias {scope} por estado, según su fecha programada. La modalidad sale del tipo de audiencia.
        </p>
      </div>

      {typesError && <Alert variant="error">{typesError}</Alert>}

      <div className="space-y-4">
        <Filters filters={filters} types={types ?? []} showCourt={!forcedCourt} onChange={onChange} />
        <PeriodFilters
          period={period}
          years={yearRange(stats?.first_year ?? null, stats?.last_year ?? null)}
          error={invalid}
          onChange={setPeriod}
        />
      </div>

      {!invalid && renderResults()}
    </div>
  )
}
