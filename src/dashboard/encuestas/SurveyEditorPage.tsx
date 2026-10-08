import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Alert, Button, ButtonLink, EmptyState, Input, Modal, Spinner } from '../../components/ui'
import { useDocumentMeta } from '../../lib/useDocumentMeta'
import { ActionMenu, Icon, icons } from '../ui'
import { saveSurvey } from './api'
import {
  draftToQuestion,
  EMPTY_QUESTION,
  MAX_QUESTIONS,
  newKey,
  questionTypeLabel,
  SURVEYS_PATH,
  surveyCode,
  surveyPath,
  uniqueCode,
  withQuestionCodes,
} from './data'
import QuestionModal from './QuestionModal'
import QuestionPreview from './QuestionPreview'
import { titleSchema } from './schema'
import SurveyNotFound, { BackLink } from './SurveyNotFound'
import type { QuestionDraft, SurveyDetail, SurveyRow, SurveysFlash } from './types'
import { useSurveyDetail, useSurveys } from './useSurveyData'

const arrowUp = ['M4.5 15.75 12 8.25l7.5 7.5']
const arrowDown = ['m19.5 8.25-7.5 7.5-7.5-7.5']

function toDraft(survey: SurveyDetail): QuestionDraft[] {
  return survey.questions.map((q) => ({
    key: q.id,
    id: q.id,
    code: q.code,
    text: q.text,
    help_text: q.help_text ?? '',
    type: q.type === 'scale' ? 'scale' : 'yes_no',
    scale_min: q.scale_min ?? 1,
    scale_max: q.scale_max ?? 5,
    min_label: q.min_label ?? '',
    max_label: q.max_label ?? '',
    is_required: q.is_required,
  }))
}

// Crear (/dashboard/encuestas/nueva) o editar (/dashboard/encuestas/:id/editar) una encuesta con
// sus preguntas. Ruta protegida con encuestas.gestionar.
export default function SurveyEditorPage() {
  const { id } = useParams()
  const { survey, error: surveyError } = useSurveyDetail(id)
  const { surveys, loading, error: listError } = useSurveys()
  const error = surveyError ?? listError

  if (error)
    return (
      <div className="space-y-4">
        <BackLink />
        <Alert variant="error">{error}</Alert>
      </div>
    )
  if (loading || (id && survey === undefined))
    return (
      <div className="flex justify-center py-16 text-primary">
        <Spinner size="lg" label="Cargando encuesta..." />
      </div>
    )
  if (id && !survey) return <SurveyNotFound />
  const row = id ? surveys.find((s) => s.id === id) : undefined
  return <SurveyForm key={id ?? 'nueva'} survey={survey ?? null} row={row ?? null} surveys={surveys} />
}

type FormProps = { survey: SurveyDetail | null; row: SurveyRow | null; surveys: SurveyRow[] }

function SurveyForm({ survey, row, surveys }: FormProps) {
  useDocumentMeta({ title: `${survey ? survey.title : 'Nueva encuesta'} · Encuestas · Dashboard`, noindex: true })
  const navigate = useNavigate()
  const locked = (row?.response_count ?? 0) > 0
  const [title, setTitle] = useState(survey?.title ?? '')
  const [questions, setQuestions] = useState<QuestionDraft[]>(() => (survey ? toDraft(survey) : []))
  const [editing, setEditing] = useState<{ question: QuestionDraft; isNew: boolean } | null>(null)
  const [preview, setPreview] = useState(false)
  const [titleError, setTitleError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const code =
    survey?.code ??
    uniqueCode(
      surveyCode(title),
      surveys.map((s) => s.code),
    )
  const cancelTo = survey ? surveyPath(survey.id) : SURVEYS_PATH

  function move(index: number, delta: number) {
    setQuestions((current) => {
      const next = [...current]
      const [item] = next.splice(index, 1)
      next.splice(index + delta, 0, item)
      return next
    })
  }

  function saveQuestion(question: QuestionDraft) {
    setQuestions((current) =>
      current.some((q) => q.key === question.key)
        ? current.map((q) => (q.key === question.key ? question : q))
        : [...current, question],
    )
    setEditing(null)
    setServerError(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setServerError(null)
    const parsedTitle = titleSchema.safeParse(title.replace(/\s+/g, ' '))
    if (!parsedTitle.success) return setTitleError(parsedTitle.error.issues[0].message)
    if (!code) return setTitleError('El título debe tener letras o números.')
    if (questions.length === 0) return setServerError('Agregue al menos una pregunta.')
    setSaving(true)
    try {
      const savedId = await saveSurvey(survey?.id ?? null, code, parsedTitle.data, withQuestionCodes(questions))
      const flash: SurveysFlash = {
        message: `Encuesta "${parsedTitle.data}" ${survey ? 'actualizada' : 'creada (inactiva: actívela desde el menú cuando esté lista)'}.`,
        highlightId: savedId,
      }
      navigate(SURVEYS_PATH, { state: { flash } })
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'No se pudo guardar la encuesta.')
      setSaving(false)
    }
  }

  // Los modales van fuera del <form>: el de la pregunta tiene su propio formulario.
  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="max-w-4xl space-y-8">
        <div className="space-y-3">
          <BackLink />
          <h2 className="text-2xl font-extrabold">{survey ? `Editar encuesta: ${survey.title}` : 'Crear encuesta'}</h2>
          {locked && (
            <Alert variant="info" live={false}>
              Esta encuesta ya tiene {row?.response_count === 1 ? '1 respuesta' : `${row?.response_count} respuestas`}:
              puede corregir textos (título, preguntas, ayudas y etiquetas), pero no agregar, quitar ni reordenar
              preguntas, ni cambiar su tipo o escala. Para eso, duplíquela desde la lista y edite la copia.
            </Alert>
          )}
          {survey?.is_active && !locked && (
            <Alert variant="warning" live={false}>
              Esta encuesta está activa: los cambios se verán de inmediato en el sitio público.
            </Alert>
          )}
        </div>

        <Input
          label="Título"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            setTitleError(null)
          }}
          maxLength={120}
          error={titleError ?? undefined}
          hint={
            code
              ? `Código: ${code}${survey ? '' : ' (no se puede cambiar después)'}`
              : 'Lo ven los ciudadanos sobre la encuesta.'
          }
        />

        <section className="space-y-3" aria-labelledby="questions-title">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="questions-title" className="text-lg font-bold">
              Preguntas
            </h2>
            <p className="text-sm text-on-surface-variant">
              {questions.length} de {MAX_QUESTIONS} como máximo
            </p>
          </div>

          {questions.length === 0 ? (
            <EmptyState
              title="Todavía no hay preguntas"
              description="Agregue preguntas de sí / no o de escala."
              className="py-8"
            />
          ) : (
            <ol className="space-y-2">
              {questions.map((question, i) => (
                <li
                  key={question.key}
                  className="flex items-center gap-3 rounded-lg bg-surface-container-low py-3 pr-2 pl-4"
                >
                  <span className="w-5 shrink-0 font-display font-bold text-primary">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-on-surface sm:whitespace-normal">
                      {question.text}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {questionTypeLabel(question)}
                      {!question.is_required && ' · opcional'}
                    </p>
                  </div>
                  {!locked && (
                    <div className="flex shrink-0">
                      <button
                        type="button"
                        onClick={() => move(i, -1)}
                        disabled={i === 0}
                        aria-label={`Subir la pregunta ${i + 1}`}
                        className="rounded-md p-2 text-on-surface-variant hover:bg-surface-container hover:text-on-surface disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <Icon paths={arrowUp} className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(i, 1)}
                        disabled={i === questions.length - 1}
                        aria-label={`Bajar la pregunta ${i + 1}`}
                        className="rounded-md p-2 text-on-surface-variant hover:bg-surface-container hover:text-on-surface disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <Icon paths={arrowDown} className="size-4" />
                      </button>
                    </div>
                  )}
                  <ActionMenu
                    label={`Opciones de la pregunta ${i + 1}`}
                    items={[
                      {
                        label: locked ? 'Corregir textos' : 'Editar',
                        icon: icons.pencil,
                        onSelect: () => setEditing({ question, isNew: false }),
                      },
                      {
                        label: 'Quitar',
                        icon: icons.trash,
                        danger: true,
                        disabledReason: locked ? 'La encuesta ya tiene respuestas' : undefined,
                        onSelect: () => setQuestions((current) => current.filter((q) => q.key !== question.key)),
                      },
                    ]}
                  />
                </li>
              ))}
            </ol>
          )}

          <div className="flex flex-wrap gap-2">
            {!locked && (
              <Button
                variant="secondary"
                onClick={() => setEditing({ question: { key: newKey(), ...EMPTY_QUESTION }, isNew: true })}
                disabled={questions.length >= MAX_QUESTIONS}
              >
                <Icon paths={icons.plus} className="size-4" />
                Agregar pregunta
              </Button>
            )}
            <Button variant="secondary" onClick={() => setPreview(true)} disabled={questions.length === 0}>
              <Icon paths={icons.eye} className="size-4" />
              Vista previa
            </Button>
          </div>
        </section>

        {serverError && <Alert variant="error">{serverError}</Alert>}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <ButtonLink to={cancelTo} variant="secondary">
            Cancelar
          </ButtonLink>
          <Button type="submit" loading={saving}>
            {survey ? 'Guardar cambios' : 'Crear encuesta'}
          </Button>
        </div>
      </form>

      {editing && (
        <QuestionModal
          initial={editing.question}
          isNew={editing.isNew}
          textsOnly={locked}
          onSave={saveQuestion}
          onClose={() => setEditing(null)}
        />
      )}

      <Modal
        open={preview}
        onClose={() => setPreview(false)}
        title={title.trim() || 'Vista previa'}
        className="max-w-2xl"
      >
        <p className="mb-4 text-sm text-on-surface-variant">
          Así verá el ciudadano las preguntas (en el sitio, una por paso). Nada de lo que marque aquí se envía.
        </p>
        <div className="space-y-3">
          {preview &&
            questions.map((question, i) => (
              <QuestionPreview key={question.key} question={draftToQuestion(question, i + 1)} number={i + 1} />
            ))}
        </div>
      </Modal>
    </>
  )
}
