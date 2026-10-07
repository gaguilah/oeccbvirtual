import type { TurnstileInstance } from '@marsidev/react-turnstile'
import { useRef, useState, type FormEvent } from 'react'
import { Alert, Button, Card, CardBody } from '../ui'
import { submitRequest } from './api'
import ContactStep from './ContactStep'
import { REQUEST_STEPS as STEPS } from './data'
import RequestSent from './RequestSent'
import StepIndicator from './StepIndicator'
import SummaryStep from './SummaryStep'
import TypeStep from './TypeStep'
import { requestSchema, stepFields, validateFields, type FieldErrors, type RequestDraft } from './schema'

const STEP_TITLES = ['¿Qué tipo de solicitud desea presentar?', '¿Cómo podemos contactarle?', 'Cuéntenos su caso']

const EMPTY_DRAFT: RequestDraft = { type: null, name: '', email: '', summary: '', acceptedTerms: false }

// Formulario de PQRS en 3 pasos. Cada paso valida solo sus campos; el envío final
// revalida todo con el esquema completo y exige el token de Turnstile.
export default function PqrsForm() {
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<RequestDraft>(EMPTY_DRAFT)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState<{ email: string; requestNumber: string; emailSent: boolean } | null>(null)

  const formRef = useRef<HTMLFormElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const captchaRef = useRef<TurnstileInstance>(null)

  const isLastStep = step === STEPS.length - 1

  function update<K extends keyof RequestDraft>(field: K, value: RequestDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function goTo(next: number) {
    // El widget se desmonta al salir del último paso: su token deja de ser útil.
    if (isLastStep) setCaptchaToken(null)
    setSubmitError(null)
    setStep(next)
    // Lleva el foco al título del nuevo paso (teclado y lectores de pantalla).
    requestAnimationFrame(() => headingRef.current?.focus())
  }

  function focusFirstError() {
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitError(null)

    const stepErrors = validateFields(draft, stepFields[step])
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      focusFirstError()
      return
    }

    if (!isLastStep) {
      goTo(step + 1)
      return
    }

    const result = requestSchema.safeParse(draft)
    if (!result.success) {
      setSubmitError('Revise los datos de los pasos anteriores.')
      return
    }
    if (!captchaToken) {
      setSubmitError('Complete la verificación de seguridad antes de enviar.')
      return
    }

    setSubmitting(true)
    const outcome = await submitRequest(result.data, captchaToken)
    setSubmitting(false)

    if (!outcome.ok) {
      // Cada token de Turnstile se puede verificar una sola vez: pedimos uno nuevo.
      captchaRef.current?.reset()
      setCaptchaToken(null)
      setSubmitError(outcome.error)
      return
    }

    setSent({ email: result.data.email, requestNumber: outcome.requestNumber, emailSent: outcome.emailSent })
  }

  function reset() {
    setDraft(EMPTY_DRAFT)
    setErrors({})
    setCaptchaToken(null)
    setSubmitError(null)
    setSent(null)
    setStep(0)
  }

  if (sent) {
    return (
      <Card>
        <CardBody className="sm:p-8">
          <RequestSent {...sent} onReset={reset} />
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <StepIndicator steps={STEPS} current={step} />

      <Card>
        <CardBody className="sm:p-8">
          <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-6">
            <h3 ref={headingRef} tabIndex={-1} className="text-2xl font-bold focus:outline-none">
              {STEP_TITLES[step]}
            </h3>

            {step === 0 && (
              <TypeStep value={draft.type} onChange={(value) => update('type', value)} error={errors.type} />
            )}

            {step === 1 && <ContactStep name={draft.name} email={draft.email} onChange={update} errors={errors} />}

            {step === 2 && (
              <SummaryStep
                type={draft.type}
                summary={draft.summary}
                onChange={(value) => update('summary', value)}
                error={errors.summary}
                acceptedTerms={draft.acceptedTerms}
                onAcceptedTermsChange={(value) => update('acceptedTerms', value)}
                termsError={errors.acceptedTerms}
                captchaRef={captchaRef}
                onCaptchaToken={setCaptchaToken}
                onCaptchaError={() =>
                  setSubmitError('No se pudo cargar la verificación de seguridad. Recargue la página.')
                }
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
                {isLastStep ? (submitting ? 'Enviando...' : 'Enviar solicitud') : 'Siguiente'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
