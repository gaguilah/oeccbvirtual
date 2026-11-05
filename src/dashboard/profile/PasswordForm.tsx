import type { TurnstileInstance } from '@marsidev/react-turnstile'
import { useRef, useState, type FormEvent } from 'react'
import { Alert, Button, CaptchaField, Card, CardBody, CardFooter, CardHeader, Input } from '../../components/ui'
import { PASSWORD_HINT } from '../../lib/password'
import { changePassword } from './api'
import { useProfile } from './profile'
import { passwordSchema, type PasswordFields } from './schema'

const EMPTY: PasswordFields = { current: '', password: '', confirm: '' }

// Cambio de contraseña del usuario en sesión: pide la actual, la nueva y su confirmación.
// onChanged se llama tras un cambio exitoso (p. ej. para quitar el aviso de contraseña temporal).
// blockedReason: el formulario queda deshabilitado con ese motivo (p. ej. falta elegir el cargo).
// La contraseña actual se comprueba iniciando sesión, que pasa por el captcha de Auth: como en
// Iniciar sesión, si el widget no carga se deja intentar sin token y Auth decide.
export default function PasswordForm({
  onChanged,
  blockedReason,
}: {
  onChanged?: () => Promise<void> | void
  blockedReason?: string
}) {
  const { email } = useProfile()
  const [fields, setFields] = useState<PasswordFields>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof PasswordFields, string>>>({})
  const [message, setMessage] = useState<{ variant: 'success' | 'error'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaFailed, setCaptchaFailed] = useState(false)
  const captchaRef = useRef<TurnstileInstance>(null)

  function update(field: keyof PasswordFields, value: string) {
    setFields((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    const result = passwordSchema.safeParse(fields)
    if (!result.success) {
      const next: typeof errors = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof PasswordFields
        next[field] ??= issue.message
      }
      setErrors(next)
      return
    }
    setErrors({})
    if (!captchaToken && !captchaFailed) {
      setMessage({ variant: 'error', text: 'Complete la verificación de seguridad.' })
      return
    }
    setSaving(true)
    try {
      await changePassword(email, result.data.current, result.data.password, captchaToken)
      setFields(EMPTY)
      setMessage({ variant: 'success', text: 'Contraseña actualizada.' })
      await onChanged?.()
    } catch (err) {
      setMessage({
        variant: 'error',
        text: err instanceof Error ? err.message : 'No se pudo cambiar la contraseña.',
      })
    } finally {
      setSaving(false)
      // Los tokens de Turnstile se usan una sola vez.
      captchaRef.current?.reset()
      setCaptchaToken(null)
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} noValidate>
        <CardHeader>
          <h2 className="text-lg font-bold">Cambiar contraseña</h2>
          <p className="mt-1 text-sm text-on-surface-variant">{PASSWORD_HINT}</p>
        </CardHeader>
        <CardBody className="space-y-4">
          <Input
            label="Contraseña actual"
            type="password"
            value={fields.current}
            onChange={(e) => update('current', e.target.value)}
            autoComplete="current-password"
            error={errors.current}
          />
          <Input
            label="Nueva contraseña"
            type="password"
            value={fields.password}
            onChange={(e) => update('password', e.target.value)}
            autoComplete="new-password"
            error={errors.password}
          />
          <Input
            label="Confirmar contraseña"
            type="password"
            value={fields.confirm}
            onChange={(e) => update('confirm', e.target.value)}
            autoComplete="new-password"
            error={errors.confirm}
          />
          {!blockedReason && (
            <CaptchaField
              ref={captchaRef}
              onToken={(token) => {
                setCaptchaToken(token)
                if (token) setCaptchaFailed(false)
              }}
              onError={() => setCaptchaFailed(true)}
            />
          )}
          {message && (
            <Alert variant={message.variant} onClose={() => setMessage(null)}>
              {message.text}
            </Alert>
          )}
          {blockedReason && (
            <Alert variant="info" live={false}>
              {blockedReason}
            </Alert>
          )}
        </CardBody>
        <CardFooter className="flex justify-end">
          <Button
            type="submit"
            loading={saving}
            disabled={Boolean(blockedReason) || (!fields.current && !fields.password && !fields.confirm)}
          >
            Cambiar contraseña
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
