import type { TurnstileInstance } from '@marsidev/react-turnstile'
import type { Ref } from 'react'
import { Button, CaptchaField } from '../ui'
import type { Answers, SurveyQuestion } from './types'
import { formatAnswer } from './validation'

type SurveyReviewProps = {
  questions: SurveyQuestion[]
  answers: Answers
  onEdit: (index: number) => void
  captchaRef: Ref<TurnstileInstance>
  onCaptchaToken: (token: string | null) => void
  onCaptchaError: () => void
}

// Último paso: resumen de respuestas (editables) y verificación de seguridad.
export default function SurveyReview({
  questions,
  answers,
  onEdit,
  captchaRef,
  onCaptchaToken,
  onCaptchaError,
}: SurveyReviewProps) {
  return (
    <div className="space-y-8">
      <ol className="space-y-3">
        {questions.map((question, index) => (
          <li
            key={question.id}
            className="flex flex-col gap-3 rounded-lg bg-surface-container-low p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 space-y-1">
              <p className="text-sm text-on-surface-variant">
                {index + 1}. {question.text}
              </p>
              <p className="font-semibold text-on-surface">{formatAnswer(question, answers[question.id])}</p>
            </div>
            <Button variant="tertiary" size="sm" onClick={() => onEdit(index)} className="self-start sm:self-center">
              Cambiar<span className="sr-only"> respuesta {index + 1}</span>
            </Button>
          </li>
        ))}
      </ol>
      <div className="space-y-2">
        <p className="text-sm font-medium text-on-surface-variant">Verificación de seguridad</p>
        <CaptchaField ref={captchaRef} onToken={onCaptchaToken} onError={onCaptchaError} />
      </div>
    </div>
  )
}
