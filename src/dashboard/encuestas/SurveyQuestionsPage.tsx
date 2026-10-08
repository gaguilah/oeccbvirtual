import { useParams } from 'react-router-dom'
import { Alert, Badge, ButtonLink, Spinner } from '../../components/ui'
import { useDocumentMeta } from '../../lib/useDocumentMeta'
import { useAccess } from '../access'
import { Icon, icons } from '../ui'
import { questionTypeLabel, surveyPath } from './data'
import SurveyNotFound, { BackLink } from './SurveyNotFound'
import type { SurveyDetail } from './types'
import { useSurveyDetail } from './useSurveyData'

// Preguntas de una encuesta, solo lectura (/dashboard/encuestas/:id/preguntas, encuestas.ver).
export default function SurveyQuestionsPage() {
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
  return <Questions survey={survey} />
}

function Questions({ survey }: { survey: SurveyDetail }) {
  useDocumentMeta({ title: `Preguntas · ${survey.title} · Dashboard`, noindex: true })
  const canManage = useAccess().can('encuestas.gestionar')

  return (
    <div className="max-w-4xl space-y-6">
      <div className="space-y-3">
        <BackLink />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold">{survey.title}</h2>
            <p className="text-sm text-on-surface-variant">
              {survey.questions.length} {survey.questions.length === 1 ? 'pregunta' : 'preguntas'} ·{' '}
              <code className="font-mono text-xs">{survey.code}</code>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink to={surveyPath(survey.id)} variant="secondary">
              Ver resultados
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

      <ol className="space-y-3">
        {survey.questions.map((question, i) => (
          <li key={question.id} className="flex gap-4 rounded-lg bg-surface-container-low p-5">
            <span className="font-display text-lg font-bold text-primary">{i + 1}</span>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="font-semibold text-on-surface">{question.text}</p>
              {question.help_text && <p className="text-sm text-on-surface-variant">{question.help_text}</p>}
              <div className="flex flex-wrap gap-2">
                <Badge variant="primary">{questionTypeLabel(question)}</Badge>
                {question.type === 'scale' && (
                  <Badge>
                    {question.scale_min} = {question.min_label} · {question.scale_max} = {question.max_label}
                  </Badge>
                )}
                <Badge>{question.is_required ? 'Obligatoria' : 'Opcional'}</Badge>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
