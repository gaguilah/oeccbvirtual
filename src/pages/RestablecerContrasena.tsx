import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { RECOVER_PATH, RESET_PATH, saveNewPassword, verifyRecoveryLink } from '../components/account'
import { Container } from '../components/layout'
import { Alert, Button, ButtonLink, Card, CardBody, Input } from '../components/ui'
import { newPasswordSchema, PASSWORD_MIN } from '../lib/password'
import { useDocumentMeta } from '../lib/useDocumentMeta'

type Step = 'verifying' | 'invalid' | 'form' | 'done'

// Crear contraseña nueva desde el enlace del correo (docs/plan-recuperar-contrasena.md). El enlace
// (?token_hash=…&type=recovery) se valida una sola vez y se quita de la dirección enseguida.
export default function RestablecerContrasena() {
  useDocumentMeta({ title: 'Crear contraseña nueva', noindex: true })
  const navigate = useNavigate()
  const [params] = useSearchParams()
  // Se lee una vez: después se quita de la dirección.
  const [tokenHash] = useState(() => (params.get('type') === 'recovery' ? params.get('token_hash') : null))
  const [step, setStep] = useState<Step>(tokenHash ? 'verifying' : 'invalid')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({})
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  // El enlace es de un solo uso: en desarrollo (StrictMode) el efecto corre dos veces.
  const verified = useRef(false)

  useEffect(() => {
    if (!tokenHash || verified.current) return
    verified.current = true
    navigate(RESET_PATH, { replace: true })
    verifyRecoveryLink(tokenHash).then((ok) => setStep(ok ? 'form' : 'invalid'))
  }, [tokenHash, navigate])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    const result = newPasswordSchema.safeParse({ password, confirm })
    if (!result.success) {
      const errors: { password?: string; confirm?: string } = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as 'password' | 'confirm'
        errors[field] ??= issue.message
      }
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setSaving(true)
    try {
      await saveNewPassword(result.data.password)
      setStep('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña. Intente de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container className="flex justify-center py-12 sm:py-20">
      <Card className="w-full max-w-sm">
        <CardBody className="space-y-6">
          <h1 className="text-2xl font-bold">Crear contraseña nueva</h1>

          {step === 'verifying' && <p className="text-on-surface-variant">Revisando el enlace…</p>}

          {step === 'invalid' && (
            <>
              <Alert variant="warning" title="Este enlace ya no es válido">
                Venció, ya se usó o está incompleto. Pida otro enlace para crear su contraseña.
              </Alert>
              <ButtonLink to={RECOVER_PATH} fullWidth>
                Pedir otro enlace
              </ButtonLink>
            </>
          )}

          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                label="Contraseña nueva"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                hint={`Al menos ${PASSWORD_MIN} caracteres.`}
                error={fieldErrors.password}
              />
              <Input
                label="Repita la contraseña"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                error={fieldErrors.confirm}
              />
              <Button type="submit" loading={saving} fullWidth>
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
              {error && <Alert variant="error">{error}</Alert>}
            </form>
          )}

          {step === 'done' && (
            <>
              <Alert variant="success" title="Contraseña guardada">
                Ya puede usar su contraseña nueva. Cerramos las sesiones abiertas en otros equipos y le enviamos un
                correo de aviso.
              </Alert>
              <ButtonLink to="/dashboard" fullWidth>
                Ir al dashboard
              </ButtonLink>
            </>
          )}
        </CardBody>
      </Card>
    </Container>
  )
}
