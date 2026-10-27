import { useState } from 'react'
import { Input, Select } from '../../components/ui'
import {
  hasAny,
  PERSONAL_COLUMNS,
  clearColumns,
  savePersonalInfo,
  type EpsEntity,
  type PersonalInfo,
} from './personalApi'
import { EPS_REGIMES, formatPhone, PERSONAL_HELP } from './personalData'
import { personalInfoSchema, type PersonalInfoInput } from './personalSchema'
import PersonalSectionCard from './PersonalSectionCard'
import { useProfile } from './profile'

type Field = keyof PersonalInfoInput

type Props = {
  userId: string
  info: PersonalInfo | null
  eps: EpsEntity[]
  onSaved: (info: PersonalInfo) => void
}

function toInput(info: PersonalInfo | null): PersonalInfoInput {
  return {
    residenceAddress: info?.residence_address ?? '',
    mobilePhone: info?.mobile_phone ? formatPhone(info.mobile_phone) : '',
    personalEmail: info?.personal_email ?? '',
    epsId: info?.eps_id ? String(info.eps_id) : '',
  }
}

// Pestaña Información personal: dirección, celular, correo personal y EPS, todos opcionales.
export default function PersonalInfoForm({ userId, info, eps, onSaved }: Props) {
  const { email } = useProfile()
  const [values, setValues] = useState(() => toInput(info))
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const [message, setMessage] = useState<{ variant: 'success' | 'error'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const saved = toInput(info)
  const unchanged = (Object.keys(saved) as Field[]).every((key) => values[key].trim() === saved[key])
  const set = (field: Field) => (value: string) => setValues((current) => ({ ...current, [field]: value }))

  const warnings =
    email && values.personalEmail.trim().toLowerCase() === email.toLowerCase()
      ? ['Ese es el correo con el que ingresa al dashboard. Si tiene un correo personal, escríbalo aquí.']
      : []

  // Activas, más la actual aunque esté inactiva; agrupadas por régimen ("Otra" al final).
  const groups = EPS_REGIMES.map((regime) => ({
    ...regime,
    items: eps.filter((item) => item.regime === regime.value && (item.is_active || String(item.id) === saved.epsId)),
  })).filter((group) => group.items.length > 0)

  function finish(row: PersonalInfo, text: string) {
    onSaved(row)
    setValues(toInput(row))
    setErrors({})
    setMessage({ variant: 'success', text })
  }

  async function handleSubmit() {
    setMessage(null)
    const result = personalInfoSchema.safeParse(values)
    if (!result.success) {
      const next: typeof errors = {}
      for (const issue of result.error.issues) next[issue.path[0] as Field] ??= issue.message
      setErrors(next)
      return
    }
    setErrors({})
    setSaving(true)
    try {
      finish(await savePersonalInfo(userId, info !== null, result.data), 'Información guardada.')
    } catch (err) {
      setMessage({ variant: 'error', text: err instanceof Error ? err.message : 'No se pudo guardar.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <PersonalSectionCard
      title="Información personal"
      intro={PERSONAL_HELP.intro}
      warnings={warnings}
      message={message}
      onCloseMessage={() => setMessage(null)}
      onSubmit={handleSubmit}
      saving={saving}
      unchanged={unchanged}
      updatedAt={info?.updated_at ?? null}
      canClear={hasAny(info, PERSONAL_COLUMNS)}
      clearTitle="¿Quitar su información personal?"
      clearText="Se borrarán su dirección, celular, correo personal y EPS. Su contacto de emergencia no cambia."
      onClear={async () => finish(await clearColumns(userId, PERSONAL_COLUMNS), 'Información personal quitada.')}
    >
      <Input
        label="Dirección de residencia"
        value={values.residenceAddress}
        onChange={(e) => set('residenceAddress')(e.target.value)}
        autoComplete="street-address"
        maxLength={200}
        hint={PERSONAL_HELP.address}
        error={errors.residenceAddress}
      />
      <Input
        label="Celular"
        type="tel"
        inputMode="tel"
        value={values.mobilePhone}
        onChange={(e) => set('mobilePhone')(e.target.value)}
        autoComplete="tel-national"
        maxLength={20}
        hint={PERSONAL_HELP.phone}
        error={errors.mobilePhone}
      />
      <Input
        label="Correo personal"
        type="email"
        value={values.personalEmail}
        onChange={(e) => set('personalEmail')(e.target.value)}
        autoComplete="email"
        maxLength={254}
        hint={PERSONAL_HELP.email}
        error={errors.personalEmail}
      />
      <Select
        label="EPS"
        value={values.epsId}
        onChange={(e) => set('epsId')(e.target.value)}
        hint={PERSONAL_HELP.eps}
        error={errors.epsId}
      >
        <option value="">Sin registrar</option>
        {groups.map((group) =>
          group.value === 'otra' ? (
            group.items.map((item) => (
              <option key={item.id} value={String(item.id)}>
                {item.name}
              </option>
            ))
          ) : (
            <optgroup key={group.value} label={group.label}>
              {group.items.map((item) => (
                <option key={item.id} value={String(item.id)}>
                  {item.name}
                </option>
              ))}
            </optgroup>
          ),
        )}
      </Select>
    </PersonalSectionCard>
  )
}
