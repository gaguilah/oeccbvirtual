import { useEffect, useState, type FormEvent } from 'react'
import { Alert, Button, Card, CardBody, CardFooter, CardHeader, Input, Select } from '../../components/ui'
import { fetchJobPositions, type JobPosition } from './api'
import { useProfile } from './profile'
import { nameSchema } from './schema'

type Props = { initialName: string; initialPositionId: number | null }

// Datos personales: nombre y cargo (de la lista job_positions) se pueden cambiar; el correo se
// muestra solo de lectura (es el de la cuenta de Supabase Auth). El cargo sale en el formato de
// audiencias realizadas (docs/plan-audiencias-formato.md) y es obligatorio.
export default function ProfileNameForm({ initialName, initialPositionId }: Props) {
  const { email, saveProfile } = useProfile()
  const [name, setName] = useState(initialName)
  const [positionId, setPositionId] = useState(initialPositionId ? String(initialPositionId) : '')
  const [saved, setSaved] = useState({
    name: initialName,
    positionId: initialPositionId ? String(initialPositionId) : '',
  })
  const [positions, setPositions] = useState<JobPosition[] | null>(null)
  const [positionsError, setPositionsError] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ name?: string; position?: string }>({})
  const [message, setMessage] = useState<{ variant: 'success' | 'error'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    fetchJobPositions()
      .then((data) => {
        if (active) setPositions(data)
      })
      .catch((err: Error) => {
        if (active) setPositionsError(err.message)
      })
    return () => {
      active = false
    }
  }, [])

  // Activos, más el actual aunque esté inactivo (para no perderlo de vista).
  const options = (positions ?? [])
    .filter((p) => p.is_active || String(p.id) === saved.positionId)
    .map((p) => ({ value: String(p.id), label: p.name }))

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    const result = nameSchema.safeParse(name)
    const next: typeof errors = {}
    if (!result.success) next.name = result.error.issues[0].message
    if (!positionId) next.position = 'Elija su cargo'
    setErrors(next)
    if (!result.success || !positionId) return
    setSaving(true)
    try {
      await saveProfile({ fullName: result.data, positionId: Number(positionId) })
      setName(result.data)
      setSaved({ name: result.data, positionId })
      setMessage({ variant: 'success', text: 'Datos guardados.' })
    } catch (err) {
      setMessage({ variant: 'error', text: err instanceof Error ? err.message : 'No se pudieron guardar sus datos.' })
    } finally {
      setSaving(false)
    }
  }

  const unchanged = name.trim() === saved.name && positionId === saved.positionId

  return (
    <Card>
      <form onSubmit={handleSubmit} noValidate>
        <CardHeader>
          <h2 className="text-lg font-bold">Datos personales</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Así aparecen su nombre y su cargo en el dashboard y en los formatos que genera.
          </p>
        </CardHeader>
        <CardBody className="space-y-4">
          <Input
            label="Nombre completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            maxLength={120}
            hint="Solo letras, espacios, guiones (-) y apóstrofos (')."
            error={errors.name}
          />
          <Select
            label="Cargo"
            value={positionId}
            onChange={(e) => setPositionId(e.target.value)}
            options={options}
            placeholder={positions ? 'Elija su cargo' : 'Cargando cargos...'}
            disabled={!positions}
            hint={positionsError ?? 'Si su cargo no está en la lista, pídale al administrador que lo agregue.'}
            error={errors.position}
          />
          <Input label="Correo" value={email} readOnly hint="El correo de la cuenta no se cambia desde aquí." />
          {message && (
            <Alert variant={message.variant} onClose={() => setMessage(null)}>
              {message.text}
            </Alert>
          )}
        </CardBody>
        <CardFooter className="flex justify-end">
          <Button type="submit" loading={saving} disabled={unchanged}>
            Guardar datos
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
