import { useId, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Badge, Button, EmptyState, Input, Modal, Spinner } from '../../components/ui'
import { cn } from '../../lib/cn'
import { useDocumentMeta } from '../../lib/useDocumentMeta'
import { ActionMenu, ConfirmDialog, Icon, icons } from '../ui'
import { createHearingType, deleteHearingType, updateHearingType } from './api'
import { HEARINGS_PATH } from './data'
import type { HearingType } from './types'
import { useHearingTypes } from './useHearingsData'

type Dialog = { kind: 'form'; type: HearingType | null } | { kind: 'toggle' | 'delete'; type: HearingType } | null

function TypeFormModal({
  type,
  onClose,
  onSaved,
}: {
  type: HearingType | null
  onClose: () => void
  onSaved: (id: number, message: string) => void
}) {
  const formId = useId()
  const [description, setDescription] = useState(type?.description ?? '')
  const [requiresLink, setRequiresLink] = useState(type?.requires_link ?? true)
  const [error, setError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const name = description.trim().replace(/\s+/g, ' ')
    if (name.length < 3 || name.length > 80) return setError('El nombre debe tener entre 3 y 80 caracteres.')
    setSaving(true)
    setServerError(null)
    try {
      if (type) {
        await updateHearingType(type.id, { description: name, requires_link: requiresLink })
        onSaved(type.id, `Tipo "${name}" actualizado.`)
      } else {
        const id = await createHearingType({ description: name, requires_link: requiresLink, is_active: true })
        onSaved(id, `Tipo "${name}" creado.`)
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'No se pudo guardar el tipo.')
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={saving ? () => {} : onClose}
      title={type ? 'Editar tipo de audiencia' : 'Crear tipo de audiencia'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} loading={saving}>
            {type ? 'Guardar cambios' : 'Crear tipo'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          label="Nombre"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value)
            setError(null)
          }}
          maxLength={80}
          error={error ?? undefined}
        />
        <label className="flex items-start gap-3 rounded-lg bg-surface-container-low p-4">
          <input
            type="checkbox"
            checked={requiresLink}
            onChange={(e) => setRequiresLink(e.target.checked)}
            className="mt-0.5 size-4 accent-primary"
          />
          <span>
            <span className="block text-sm font-semibold text-on-surface">Requiere enlace de conexión</span>
            <span className="block text-xs text-on-surface-variant">
              Sin enlace, la audiencia no se comunica. Desmárquelo en los tipos presenciales (diligencias).
            </span>
          </span>
        </label>
        {serverError && <Alert variant="error">{serverError}</Alert>}
      </form>
    </Modal>
  )
}

// Tipos de audiencia (/dashboard/audiencias/tipos, audiencias.tipos: solo superadmin al inicio).
export default function HearingTypesPage() {
  useDocumentMeta({ title: 'Tipos de audiencia · Dashboard', noindex: true })
  const { types, error, reload } = useHearingTypes()
  const [dialog, setDialog] = useState<Dialog>(null)
  const [flash, setFlash] = useState<{ message: string; highlightId: number | null } | null>(null)

  const done = (message: string, highlightId: number | null) => {
    setDialog(null)
    setFlash({ message, highlightId })
    reload()
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="space-y-3">
        <Link to={HEARINGS_PATH} className="inline-flex text-sm font-medium text-primary hover:underline">
          ← Volver a Audiencias
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold">Tipos de audiencia</h2>
            <p className="max-w-xl text-sm text-on-surface-variant">
              Un tipo inactivo no se ofrece al programar, pero las audiencias que ya lo usan lo conservan.
            </p>
          </div>
          <Button onClick={() => setDialog({ kind: 'form', type: null })}>
            <Icon paths={icons.plus} className="size-4" />
            Crear tipo
          </Button>
        </div>
      </div>

      {flash && (
        <Alert variant="success" onClose={() => setFlash(null)}>
          {flash.message}
        </Alert>
      )}
      {error && <Alert variant="error">{error}</Alert>}

      {!types ? (
        <div className="flex justify-center py-12 text-primary">
          <Spinner />
        </div>
      ) : types.length === 0 ? (
        <EmptyState title="Todavía no hay tipos de audiencia" />
      ) : (
        <ul className="space-y-2">
          {types.map((type) => (
            <li
              key={type.id}
              className={cn(
                'flex items-start justify-between gap-3 rounded-lg bg-surface-container-low py-3 pr-2 pl-4',
                flash?.highlightId === type.id && 'bg-primary-container/50',
                !type.is_active && 'opacity-70',
              )}
            >
              <div className="min-w-0 space-y-1">
                <p className="font-semibold text-on-surface">{type.description}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={type.requires_link ? 'primary' : 'neutral'}>
                    {type.requires_link ? 'Requiere enlace' : 'Presencial'}
                  </Badge>
                  {!type.is_active && <Badge>Inactivo</Badge>}
                </div>
              </div>
              <ActionMenu
                label={`Opciones del tipo ${type.description}`}
                items={[
                  { label: 'Editar', icon: icons.pencil, onSelect: () => setDialog({ kind: 'form', type }) },
                  {
                    label: type.is_active ? 'Desactivar' : 'Activar',
                    icon: type.is_active ? icons.eyeSlash : icons.eye,
                    onSelect: () => setDialog({ kind: 'toggle', type }),
                  },
                  {
                    label: 'Eliminar',
                    icon: icons.trash,
                    danger: true,
                    onSelect: () => setDialog({ kind: 'delete', type }),
                  },
                ]}
              />
            </li>
          ))}
        </ul>
      )}

      {dialog?.kind === 'form' && (
        <TypeFormModal
          type={dialog.type}
          onClose={() => setDialog(null)}
          onSaved={(id, message) => done(message, id)}
        />
      )}
      {dialog?.kind === 'toggle' && (
        <ConfirmDialog
          open
          title={dialog.type.is_active ? '¿Desactivar este tipo?' : '¿Activar este tipo?'}
          confirmLabel={dialog.type.is_active ? 'Desactivar' : 'Activar'}
          icon={dialog.type.is_active ? icons.eyeSlash : icons.eye}
          onClose={() => setDialog(null)}
          onConfirm={async () => {
            await updateHearingType(dialog.type.id, { is_active: !dialog.type.is_active })
            done(
              `Tipo "${dialog.type.description}" ${dialog.type.is_active ? 'desactivado' : 'activado'}.`,
              dialog.type.id,
            )
          }}
        >
          <p>
            {dialog.type.is_active
              ? 'Ya no se ofrecerá al programar audiencias. Las que ya lo usan no cambian.'
              : 'Se volverá a ofrecer al programar audiencias.'}
          </p>
        </ConfirmDialog>
      )}
      {dialog?.kind === 'delete' && (
        <ConfirmDialog
          open
          title="¿Eliminar este tipo?"
          confirmLabel="Eliminar"
          tone="danger"
          onClose={() => setDialog(null)}
          onConfirm={async () => {
            await deleteHearingType(dialog.type.id)
            done(`Tipo "${dialog.type.description}" eliminado.`, null)
          }}
        >
          <p>
            Se eliminará <strong className="text-on-surface">{dialog.type.description}</strong>. Si alguna audiencia lo
            usa, no se podrá eliminar: desactívelo en su lugar.
          </p>
        </ConfirmDialog>
      )}
    </div>
  )
}
