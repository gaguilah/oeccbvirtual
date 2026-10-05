import { useId, useState, type FormEvent } from 'react'
import { Alert, Button, Input, Modal, Select } from '../../components/ui'
import { COURTS, type CourtNumber } from '../../lib/courts'
import { manageUsers, type ManageResult } from './api'
import { userSchema, type UserFields } from './schema'
import type { RoleOption, UserDraft, UserRow } from './types'

type UserFormModalProps = {
  open: boolean
  // Sin usuario: crear. Con usuario: editar (el correo no se cambia).
  user: UserRow | null
  roles: RoleOption[]
  onClose: () => void
  onSaved: (result: ManageResult, draft: UserDraft) => void
}

const courtOptions = COURTS.map((court) => ({ value: String(court.number), label: court.short }))

// Crear o editar un usuario: nombre, correo (solo al crear), rol y juzgado (solo si el rol es de
// alcance 'court'). Guarda con la Edge Function manage-users.
export default function UserFormModal({ open, user, roles, onClose, onSaved }: UserFormModalProps) {
  const formId = useId()
  const [draft, setDraft] = useState<UserDraft>({
    fullName: user?.full_name ?? '',
    email: user?.email ?? '',
    roleId: user?.role_id ?? '',
    court: user?.court ? String(user.court) : '',
  })
  const [errors, setErrors] = useState<Partial<Record<UserFields, string>>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const role = roles.find((option) => option.id === draft.roleId)
  const needsCourt = role?.scope === 'court'

  // Al cambiar un campo se quita su error (y el del juzgado si cambia el rol).
  function update(field: UserFields, value: string) {
    setDraft((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined, ...(field === 'roleId' && { court: undefined }) }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setServerError(null)
    const result = userSchema.safeParse(draft)
    const next: Partial<Record<UserFields, string>> = {}
    if (!result.success) {
      for (const issue of result.error.issues) next[issue.path[0] as UserFields] ??= issue.message
    }
    if (needsCourt && !draft.court) next.court = 'Elija el juzgado'
    setErrors(next)
    if (!result.success || Object.keys(next).length > 0) return

    const court = needsCourt ? (Number(draft.court) as CourtNumber) : null
    setSaving(true)
    try {
      const saved = user
        ? await manageUsers({
            action: 'update',
            userId: user.id,
            fullName: result.data.fullName,
            roleId: result.data.roleId,
            court,
          })
        : await manageUsers({
            action: 'create',
            fullName: result.data.fullName,
            email: result.data.email,
            roleId: result.data.roleId,
            court,
          })
      onSaved(saved, { ...draft, fullName: result.data.fullName })
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={saving ? () => {} : onClose}
      title={user ? 'Editar usuario' : 'Crear usuario'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} loading={saving}>
            {user ? 'Guardar cambios' : 'Crear usuario'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          label="Nombre completo"
          value={draft.fullName}
          onChange={(e) => update('fullName', e.target.value)}
          autoComplete="off"
          maxLength={120}
          error={errors.fullName}
        />
        {user ? (
          <Input label="Correo" value={user.email} readOnly hint="El correo de la cuenta no se cambia." />
        ) : (
          <Input
            label="Correo"
            type="email"
            value={draft.email}
            onChange={(e) => update('email', e.target.value)}
            autoComplete="off"
            error={errors.email}
            hint="Se crea con una contraseña temporal que verá al guardar."
          />
        )}
        <Select
          label="Rol"
          value={draft.roleId}
          onChange={(e) => update('roleId', e.target.value)}
          placeholder="Elija un rol"
          options={roles.map((option) => ({ value: option.id, label: option.name }))}
          error={errors.roleId}
        />
        {needsCourt && (
          <Select
            label="Juzgado"
            value={draft.court}
            onChange={(e) => update('court', e.target.value)}
            placeholder="Elija el juzgado"
            options={courtOptions}
            error={errors.court}
            hint="Este rol solo gestiona lo de su juzgado."
          />
        )}
        {serverError && <Alert variant="error">{serverError}</Alert>}
      </form>
    </Modal>
  )
}
