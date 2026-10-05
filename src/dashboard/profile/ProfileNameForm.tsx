import { useState, type FormEvent } from 'react'
import { Alert, Button, Card, CardBody, CardFooter, CardHeader, Input } from '../../components/ui'
import { useProfile } from './profile'
import { nameSchema } from './schema'

// Datos personales: el nombre se puede cambiar; el correo se muestra solo de lectura (es el de la
// cuenta de Supabase Auth).
export default function ProfileNameForm({ initialName }: { initialName: string }) {
  const { email, saveFullName } = useProfile()
  const [name, setName] = useState(initialName)
  const [savedName, setSavedName] = useState(initialName)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<{ variant: 'success' | 'error'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    const result = nameSchema.safeParse(name)
    if (!result.success) {
      setError(result.error.issues[0].message)
      return
    }
    setError(null)
    setSaving(true)
    try {
      await saveFullName(result.data)
      setName(result.data)
      setSavedName(result.data)
      setMessage({ variant: 'success', text: 'Nombre guardado.' })
    } catch (err) {
      setMessage({ variant: 'error', text: err instanceof Error ? err.message : 'No se pudo guardar el nombre.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} noValidate>
        <CardHeader>
          <h2 className="text-lg font-bold">Datos personales</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Así aparece su nombre en el dashboard.</p>
        </CardHeader>
        <CardBody className="space-y-4">
          <Input
            label="Nombre completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            maxLength={120}
            hint="Solo letras, espacios, guiones (-) y apóstrofos (')."
            error={error ?? undefined}
          />
          <Input label="Correo" value={email} readOnly hint="El correo de la cuenta no se cambia desde aquí." />
          {message && (
            <Alert variant={message.variant} onClose={() => setMessage(null)}>
              {message.text}
            </Alert>
          )}
        </CardBody>
        <CardFooter className="flex justify-end">
          <Button type="submit" loading={saving} disabled={name.trim() === savedName}>
            Guardar nombre
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
