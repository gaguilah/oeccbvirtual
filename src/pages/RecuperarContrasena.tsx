import type { TurnstileInstance } from '@marsidev/react-turnstile'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { LOGIN_PATH, requestPasswordReset } from '../components/account'
import { Container } from '../components/layout'
import { Alert, Button, CaptchaField, Card, CardBody, Input } from '../components/ui'
import { useDocumentMeta } from '../lib/useDocumentMeta'

const emailSchema = z.string().trim().email('Escriba un correo válido')

const linkClass = 'font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary'

// Pide el enlace para crear una contraseña nueva (docs/plan-recuperar-contrasena.md). El mensaje
// final es el mismo exista o no la cuenta.
export default function RecuperarContrasena() {
  useDocumentMeta({ title: 'Recuperar contraseña', noindex: true })
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const captchaRef = useRef<TurnstileInstance>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    const result = emailSchema.safeParse(email)
    if (!result.success) {
      setEmailError(result.error.issues[0].message)
      return
    }
    setEmailError(null)
    if (!captchaToken) {
      setError('Complete la verificación de seguridad.')
      return
    }

    setLoading(true)
    const response = await requestPasswordReset(result.data, captchaToken)
    setLoading(false)
    if (response.ok) {
      setSent(true)
      return
    }
    setError(response.error)
    // Los tokens de Turnstile se usan una sola vez.
    captchaRef.current?.reset()
    setCaptchaToken(null)
  }

  return (
    <Container className="flex justify-center py-12 sm:py-20">
      <Card className="w-full max-w-sm">
        <CardBody className="space-y-6">
          <h1 className="text-2xl font-bold">Recuperar contraseña</h1>

          {sent ? (
            <>
              <Alert variant="success" title="Revise su correo">
                Si el correo está registrado, le enviamos un enlace para crear una contraseña nueva. Es válido por 1
                hora. Revise también el correo no deseado.
              </Alert>
              <p className="text-sm text-on-surface-variant">
                ¿No le llegó? Espere unos minutos antes de pedir otro, o pídale al Administrador de Sistema que
                restablezca su contraseña.
              </p>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <p className="text-sm text-on-surface-variant">
                Escriba el correo de su cuenta del dashboard y le enviaremos un enlace para crear una contraseña nueva.
              </p>
              <Input
                label="Correo"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                error={emailError ?? undefined}
              />
              <CaptchaField
                ref={captchaRef}
                onToken={setCaptchaToken}
                onError={() => setError('No se pudo cargar la verificación de seguridad. Recargue la página.')}
              />
              <Button type="submit" loading={loading} fullWidth>
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </Button>
              {error && <Alert variant="error">{error}</Alert>}
            </form>
          )}

          <p className="text-center text-sm">
            <Link to={LOGIN_PATH} className={linkClass}>
              Volver a Iniciar sesión
            </Link>
          </p>
        </CardBody>
      </Card>
    </Container>
  )
}
