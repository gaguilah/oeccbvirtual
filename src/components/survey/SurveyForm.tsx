import type { TurnstileInstance } from '@marsidev/react-turnstile'
import { useRef, useState, type FormEvent } from 'react'
import { Alert, Button, Card, CardBody } from '../ui'
import { submitSurvey } from './api'
import QuestionField from './questions/QuestionField'
import SurveyProgress from './SurveyProgress'
import SurveyReview from './SurveyReview'
import SurveySent from './SurveySent'
import type { AnswerValue, Answers, Survey } from './types'
import { firstInvalidQuestion, validateAnswer } from './validation'

const TITLE_ID = 'survey-step-title'

// Encuesta por pasos: una pregunta por paso (validada al avanzar) y un paso final de
// revisión con Turnstile. El envío revalida todas las respuestas.
export default function SurveyForm({ survey }: { survey: Survey }) {
  const questions = survey.survey_questions
  const reviewStep = questions.length
  const totalSteps = questions.length + 1

  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const formRef = useRef<HTMLFormElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const captchaRef = useRef<TurnstileInstance>(null)

  const isReview = step === reviewStep
  const question = isReview ? null : questions[step]

  function answer(questionId: string, value: AnswerValue) {
    setAnswers((current) => ({ ...current, [questionId]: value }))
    setErrors((current) => {
      const next = { ...current }
      delete next[questionId]
      return next
    })
  }

  function goTo(next: number) {
    // El widget se desmonta al salir de la revisión: su token deja de ser útil.
    if (isReview) setCaptchaToken(null)
    setSubmitError(null)
    setStep(next)
    requestAnimationFrame(() => headingRef.current?.focus())
  }

  function showError(index: number, message: string) {
    const target = questions[index]
    setErrors((current) => ({ ...current, [target.id]: message }))
    if (index !== step) goTo(index)
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitError(null)

    if (question) {
      const error = validateAnswer(question, answers[question.id])
      if (error) {
        showError(step, error)
        return
      }
      goTo(step + 1)
      return
    }

    // Revisión: se revalida todo por si alguna respuesta quedó inválida.
    const invalidIndex = firstInvalidQuestion(questions, answers)
    if (invalidIndex !== -1) {
      const target = questions[invalidIndex]
      showError(invalidIndex, validateAnswer(target, answers[target.id]) ?? '')
      return
    }
    if (!captchaToken) {
      setSubmitError('Complete la verificación de seguridad antes de enviar.')
      return
    }

    setSubmitting(true)
    const error = await submitSurvey(
      {
        surveyId: survey.id,
        answers: questions
          .filter((q) => answers[q.id] !== undefined)
          .map((q) => ({ questionId: q.id, value: answers[q.id] as AnswerValue })),
      },
      captchaToken,
    )
    setSubmitting(false)

    if (error) {
      // Cada token de Turnstile se puede verificar una sola vez: pedimos uno nuevo.
      captchaRef.current?.reset()
      setCaptchaToken(null)
      setSubmitError(error)
      return
    }
    setSent(true)
  }

  if (questions.length === 0) {
    return <Alert variant="info">Esta encuesta todavía no tiene preguntas.</Alert>
  }

  if (sent) {
    return (
      <Card>
        <CardBody className="sm:p-8">
          <SurveySent />
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <SurveyProgress current={step} total={totalSteps} label={isReview ? 'Revisión y envío' : `Pregunta ${step + 1}`} />

      <Card>
        <CardBody className="sm:p-8">
          <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-6">
            <h3 id={TITLE_ID} ref={headingRef} tabIndex={-1} className="text-xl font-bold sm:text-2xl focus:outline-none">
              {question ? question.text : 'Revise sus respuestas'}
              {question && !question.is_required && (
                <span className="ml-2 align-middle text-sm font-normal text-on-surface-variant">(opcional)</span>
              )}
            </h3>

            {question ? (
              <QuestionField
                key={question.id}
                question={question}
                value={answers[question.id]}
                onChange={(value) => answer(question.id, value)}
                error={errors[question.id]}
                labelledBy={TITLE_ID}
              />
            ) : (
              <SurveyReview
                questions={questions}
                answers={answers}
                onEdit={goTo}
                captchaRef={captchaRef}
                onCaptchaToken={setCaptchaToken}
                onCaptchaError={() => setSubmitError('No se pudo cargar la verificación de seguridad. Recargue la página.')}
              />
            )}

            {submitError && <Alert variant="error">{submitError}</Alert>}

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
              {step > 0 ? (
                <Button variant="secondary" onClick={() => goTo(step - 1)} disabled={submitting}>
                  Anterior
                </Button>
              ) : (
                <span aria-hidden="true" />
              )}
              <Button type="submit" loading={submitting}>
                {isReview ? (submitting ? 'Enviando...' : 'Enviar encuesta') : step === reviewStep - 1 ? 'Revisar' : 'Siguiente'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
