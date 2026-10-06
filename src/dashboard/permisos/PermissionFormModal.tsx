import { useId, useState, type FormEvent } from 'react'
import { Alert, Button, Input, Modal, Textarea } from '../../components/ui'
import { updatePermission } from './api'
import type { Permission } from './types'

type PermissionFormModalProps = {
  permission: Permission
  onClose: () => void
  onSaved: (permission: Permission) => void
}

// Editar nombre y descripción de un permiso: es lo que se ve en la matriz de Roles. El código no
// cambia (lo revisan las políticas y el dashboard).
export default function PermissionFormModal({ permission, onClose, onSaved }: PermissionFormModalProps) {
  const formId = useId()
  const [name, setName] = useState(permission.name)
  const [description, setDescription] = useState(permission.description ?? '')
  const [nameError, setNameError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setServerError(null)
    const cleanName = name.trim().replace(/\s+/g, ' ')
    if (cleanName.length < 3 || cleanName.length > 80) {
      setNameError('El nombre debe tener entre 3 y 80 caracteres.')
      return
    }
    setNameError(null)
    setSaving(true)
    try {
      onSaved(await updatePermission(permission.code, cleanName, description.trim()))
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'No se pudo guardar el permiso.')
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={saving ? () => {} : onClose}
      title="Editar permiso"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} loading={saving}>
            Guardar cambios
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input label="Código" value={permission.code} readOnly hint="El código no se puede cambiar." />
        <Input
          label="Nombre"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setNameError(null)
          }}
          maxLength={80}
          error={nameError ?? undefined}
        />
        <Textarea
          label="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={300}
          showCount
        />
        {serverError && <Alert variant="error">{serverError}</Alert>}
      </form>
    </Modal>
  )
}
