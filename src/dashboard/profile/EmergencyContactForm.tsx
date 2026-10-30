import { useState } from 'react'
import { Input, Select } from '../../components/ui'
import { clearColumns, EMERGENCY_COLUMNS, hasAny, saveEmergencyContact, type PersonalInfo } from './personalApi'
import { formatPhone, normalizePhone, PERSONAL_HELP, RELATIONSHIPS } from './personalData'
import { emergencyContactSchema, type EmergencyContactInput } from './personalSchema'
import PersonalSectionCard from './PersonalSectionCard'

type Field = keyof EmergencyContactInput

type Props = {
  userId: string
  info: PersonalInfo | null
  onSaved: (info: PersonalInfo) => void
}

function toInput(info: PersonalInfo | null): EmergencyContactInput {
  return {
    emergencyName: info?.emergency_name ?? '',
    emergencyRelationship: info?.emergency_relationship ?? '',
    emergencyPhone: info?.emergency_phone ? formatPhone(info.emergency_phone) : '',
  }
}

// Pestaña Contacto de emergencia: nombre, parentesco y celular, todos opcionales.
export default function EmergencyContactForm({ userId, info, onSaved }: Props) {
  const [values, setValues] = useState(() => toInput(info))
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const [message, setMessage] = useState<{ variant: 'success' | 'error'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const saved = toInput(info)
  const unchanged = (Object.keys(saved) as Field[]).every((key) => values[key].trim() === saved[key])
  const set = (field: Field) => (value: string) => setValues((current) => ({ ...current, [field]: value }))

  const phone = normalizePhone(values.emergencyPhone)
  const warnings = [
    values.emergencyName.trim() && !phone ? 'Sin celular, la oficina no podrá llamar a su contacto.' : null,
    phone && phone === info?.mobile_phone
      ? 'Es el mismo celular que registró como suyo. Escriba el de su contacto de emergencia.'
      : null,
  ].filter((warning): warning is string => warning !== null)

  function finish(row: PersonalInfo, text: string) {
    onSaved(row)
    setValues(toInput(row))
    setErrors({})
    setMessage({ variant: 'success', text })
  }

  async function handleSubmit() {
    setMessage(null)
    const result = emergencyContactSchema.safeParse(values)
    if (!result.success) {
      const next: typeof errors = {}
      for (const issue of result.error.issues) next[issue.path[0] as Field] ??= issue.message
      setErrors(next)
      return
    }
    setErrors({})
    setSaving(true)
    try {
      finish(await saveEmergencyContact(userId, info !== null, result.data), 'Contacto de emergencia guardado.')
    } catch (err) {
      setMessage({ variant: 'error', text: err instanceof Error ? err.message : 'No se pudo guardar.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <PersonalSectionCard
      title="Contacto de emergencia"
      intro={PERSONAL_HELP.emergencyIntro}
      warnings={warnings}
      message={message}
      onCloseMessage={() => setMessage(null)}
      onSubmit={handleSubmit}
      saving={saving}
      unchanged={unchanged}
      updatedAt={info?.emergency_updated_at ?? null}
      canClear={hasAny(info, EMERGENCY_COLUMNS)}
      clearTitle="¿Quitar su contacto de emergencia?"
      clearText="Se borrarán el nombre, el parentesco y el celular de su contacto. Su información personal no cambia."
      onClear={async () => finish(await clearColumns(userId, EMERGENCY_COLUMNS), 'Contacto de emergencia quitado.')}
    >
      <Input
        label="Nombre completo"
        value={values.emergencyName}
        onChange={(e) => set('emergencyName')(e.target.value)}
        autoComplete="off"
        maxLength={120}
        hint="Solo letras, espacios, guiones (-) y apóstrofos (')."
        error={errors.emergencyName}
      />
      <Select
        label="Parentesco"
        value={values.emergencyRelationship}
        onChange={(e) => set('emergencyRelationship')(e.target.value)}
        error={errors.emergencyRelationship}
      >
        <option value="">Sin registrar</option>
        {RELATIONSHIPS.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </Select>
      <Input
        label="Celular"
        type="tel"
        inputMode="tel"
        value={values.emergencyPhone}
        onChange={(e) => set('emergencyPhone')(e.target.value)}
        autoComplete="off"
        maxLength={20}
        hint={PERSONAL_HELP.phone}
        error={errors.emergencyPhone}
      />
    </PersonalSectionCard>
  )
}
