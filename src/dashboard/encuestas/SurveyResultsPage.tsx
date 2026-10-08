import { useParams } from 'react-router-dom'
import { Alert, Badge, Button, ButtonLink, EmptyState, Spinner } from '../../components/ui'
import { useDocumentMeta } from '../../lib/useDocumentMeta'
import { useAccess } from '../access'
import { Icon, icons } from '../ui'
import { buildCsv, csvFileName, downloadCsv } from './csv'
import { surveyPath } from './data'
import { availableYears, periodError, periodLabel, periodPhrase, periodRange } from './period'
import PeriodFilters from './PeriodFilters'
import QuestionResultCard from './QuestionResultCard'
import { formatAverage, formatCount, formatPercent, kpis, questionResult } from './results'
import SurveyNotFound, { BackLink } from './SurveyNotFound'
import type { SurveyDetail } from './types'
import { usePeriodFilters } from './usePeriodFilters'
import { useSurveyDetail, useSurveyStats } from './useSurveyData'

const downloadIcon = [
  'M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3',
]

// Resultados de una encuesta (/dashboard/encuestas/:id): solo conteos del periodo elegido.
export default function SurveyResultsPage() {
  const { id } = useParams()
  const { survey, error } = useSurveyDetail(id)

  if (error)
    return (
      <div className="space-y-4">
        <BackLink />
        <Alert variant="error">{error}</Alert>
      </div>
    )
  if (survey === undefined)
    return (
      <div className="flex justify-center py-16 text-primary">
        <Spinner size="lg" label="Cargando encuesta..." />
      </div>
    )
  if (!survey) return <SurveyNotFound />
  return <Results survey={survey} />
}

function Kpi({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg bg-surface-container-low p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">{label}</p>
      <p className="mt-2 font-display text-3xl font-extrabold text-on-surface">{value}</p>
      <p className="mt-1 text-xs text-on-surface-variant">{detail}</p>
    </div>
  )
}

function Results({ survey }: { survey: SurveyDetail }) {
  useDocumentMeta({ title: `${survey.title} · Encuestas · Dashboard`, noindex: true })
  const canManage = useAccess().can('encuestas.gestionar')
  const { period, setPeriod } = usePeriodFilters()
  const invalid = periodError(period)
  const { stats, error, loading } = useSurveyStats(survey.id, invalid ? null : periodRange(period))
  const results = stats ? survey.questions.map((question) => questionResult(question, stats)) : []
  const summary = kpis(results)

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <BackLink />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold">{survey.title}</h2>
            <Badge variant={survey.is_active ? 'success' : 'neutral'}>{survey.is_active ? 'Activa' : 'Inactiva'}</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink to={`${surveyPath(survey.id)}/preguntas`} variant="secondary">
              <Icon paths={icons.eye} className="size-4" />
              Ver preguntas
            </ButtonLink>
            {canManage && (
              <ButtonLink to={`${surveyPath(survey.id)}/editar`} variant="secondary">
                <Icon paths={icons.pencil} className="size-4" />
                Editar
              </ButtonLink>
            )}
          </div>
        </div>
      </div>

      <PeriodFilters period={period} years={availableYears(survey.created_at)} error={invalid} onChange={setPeriod} />

      {error && <Alert variant="error">{error}</Alert>}

      {!invalid &&
        (!stats ? (
          <div className="flex justify-center py-12 text-primary">
            <Spinner />
          </div>
        ) : (
          <section
            aria-labelledby="results-title"
            aria-busy={loading}
            className={loading ? 'space-y-6 opacity-60 transition-opacity' : 'space-y-6 transition-opacity'}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="results-title" className="text-lg font-bold">
                {periodLabel(period)}
              </h2>
              {stats.total > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={loading}
                  onClick={() =>
                    downloadCsv(csvFileName(survey, period), buildCsv(survey, period, stats.total, results))
                  }
                >
                  <Icon paths={downloadIcon} className="size-4" />
                  Descargar CSV
                </Button>
              )}
            </div>
            {stats.total === 0 ? (
              <EmptyState
                icon={<Icon paths={icons.question} />}
                title={`No hay respuestas ${periodPhrase(period)}`}
                description="Elija otro periodo para ver resultados."
              />
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Kpi
                    label="Respuestas"
                    value={formatCount(stats.total)}
                    detail={`${stats.total === 1 ? 'encuesta diligenciada' : 'encuestas diligenciadas'} ${periodPhrase(period)}`}
                  />
                  {summary.average && (
                    <Kpi
                      label="Promedio de satisfacción"
                      value={`${formatAverage(summary.average.value)} / ${summary.average.max}`}
                      detail="Preguntas de escala"
                    />
                  )}
                  {summary.yes && (
                    <Kpi
                      label='Respondieron "Sí"'
                      value={formatPercent(summary.yes.count, summary.yes.total)}
                      detail="Preguntas de sí / no"
                    />
                  )}
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {results.map((result, i) => (
                    <QuestionResultCard key={result.question.id} result={result} number={i + 1} />
                  ))}
                </div>
              </>
            )}
          </section>
        ))}
    </div>
  )
}
