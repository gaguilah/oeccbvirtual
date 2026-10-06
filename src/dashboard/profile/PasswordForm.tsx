import { useState, type FormEvent } from 'react'
import { Alert, Button, Card, CardBody, CardFooter, CardHeader, Input } from '../../components/ui'
import { changePassword } from './api'
import { useProfile } from './profile'
import { passwordSchema, type PasswordFields } from './schema'

const EMPTY: PasswordFields = { current: '', password: '', confirm: '' }

// Cambio de contraseña del usuario en sesión: pide la actual, la nueva y su confirmación.
// onChanged se llama tras un cambio exitoso (p. ej. para quitar el aviso de contraseña temporal).
export default function PasswordForm({ onChanged }: { onChanged?: () => Promise<void> | void }) {
  const { email } = useProfile()
  const [fields, setFields] = useState<PasswordFields>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof PasswordFields, string>>>({})
  const [message, setMessage] = useState<{ variant: 'success' | 'error'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

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
    setSaving(true)
    try {
      await changePassword(email, result.data.current, result.data.password)
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
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} noValidate>
        <CardHeader>
          <h2 className="text-lg font-bold">Cambiar contraseña</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Mínimo 8 caracteres.</p>
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
          {message && (
            <Alert variant={message.variant} onClose={() => setMessage(null)}>
              {message.text}
            </Alert>
          )}
        </CardBody>
        <CardFooter className="flex justify-end">
          <Button type="submit" loading={saving} disabled={!fields.current && !fields.password && !fields.confirm}>
            Cambiar contraseña
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
