import type { TurnstileInstance } from '@marsidev/react-turnstile'
import type { Ref } from 'react'
import { CaptchaField, Textarea } from '../ui'
import { SUMMARY_MAX_CHARS, requestTypes, type RequestTypeId } from './data'

type SummaryStepProps = {
  type: RequestTypeId | null
  summary: string
  onChange: (value: string) => void
  error?: string
  captchaRef: Ref<TurnstileInstance>
  onCaptchaToken: (token: string | null) => void
  onCaptchaError: () => void
}

// Paso 3: descripción del caso y verificación de seguridad.
export default function SummaryStep({
  type,
  summary,
  onChange,
  error,
  captchaRef,
  onCaptchaToken,
  onCaptchaError,
}: SummaryStepProps) {
  return (
    <div className="space-y-6">
      <Textarea
        label={type ? `Describa su ${requestTypes[type].label.toLowerCase()}` : 'Describa su solicitud'}
        name="summary"
        value={summary}
        onChange={(e) => onChange(e.target.value)}
        error={error}
        hint="Resuma el asunto de forma breve, clara y respetuosa."
        maxLength={SUMMARY_MAX_CHARS}
        showCount
        rows={8}
        required
      />
      <div className="space-y-2">
        <p className="text-sm font-medium text-on-surface-variant">Verificación de seguridad</p>
        <CaptchaField ref={captchaRef} onToken={onCaptchaToken} onError={onCaptchaError} />
      </div>
    </div>
  )
}
