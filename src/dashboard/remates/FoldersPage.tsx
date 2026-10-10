import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { formatLongDate } from '../../components/remates'
import { Alert, Badge, Button, Card, CardBody, Input, Spinner } from '../../components/ui'
import { useDocumentMeta } from '../../lib/useDocumentMeta'
import { ActionMenu, ConfirmDialog, icons } from '../ui'
import { addFolder, deleteFolder, fetchFolders } from './api'
import { REMATES_ADMIN_PATH } from './constants'
import { todayInBogota } from './datetime'
import { folderFor } from './pdfUrl'
import type { PdfFolder } from './types'

// "2026-01-01" → "1 de enero de 2026" (mediodía, para no cambiar de día por la zona horaria).
const longDate = (date: string) => formatLongDate(`${date}T12:00:00-05:00`)

const positiveInt = (value: string) => (/^\d{1,15}$/.test(value) && Number(value) > 0 ? Number(value) : null)

// Carpetas de publicación (/dashboard/avisos-remates/carpetas, remates.carpetas): las dos
// secciones de números de la URL de los PDF en el portal. Cuando la Rama Judicial cambia de
// carpeta se agrega una nueva con su fecha; las anteriores no se editan y los avisos ya creados
// conservan su URL. Solo se borran las que todavía no están vigentes.
export default function FoldersPage() {
  useDocumentMeta({ title: 'Carpetas · Avisos de Remate · Dashboard', noindex: true })
  const [folders, setFolders] = useState<PdfFolder[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const [form, setForm] = useState({ groupId: '', folderId: '', validFrom: '' })
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<PdfFolder | null>(null)

  useEffect(() => {
    let active = true
    fetchFolders()
      .then((rows) => {
        if (active) setFolders(rows)
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'No se pudieron cargar las carpetas.')
      })
    return () => {
      active = false
    }
  }, [version])

  const today = todayInBogota()
  const current = folders ? folderFor(folders, today) : null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaved(null)
    const groupId = positiveInt(form.groupId.trim())
    const folderId = positiveInt(form.folderId.trim())
    if (!groupId || !folderId) return setFormError('Los dos números deben ser enteros positivos.')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.validFrom)) return setFormError('Elija desde qué fecha rige la carpeta.')
    setFormError(null)
    setSaving(true)
    try {
      await addFolder(groupId, folderId, form.validFrom)
      setForm({ groupId: '', folderId: '', validFrom: '' })
      setSaved(`Carpeta ${groupId} / ${folderId} agregada, vigente desde el ${longDate(form.validFrom)}.`)
      setVersion((v) => v + 1)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo agregar la carpeta.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <Link to={REMATES_ADMIN_PATH} className="inline-flex text-sm font-medium text-primary hover:underline">
        ← Volver a Avisos de Remate
      </Link>
      <div className="space-y-2">
        <h2 className="text-2xl font-extrabold">Carpetas de publicación</h2>
        <p className="text-sm text-on-surface-variant">
          La URL del PDF de cada aviso usa dos números de carpeta del portal de publicaciones:
          <code className="mx-1 rounded bg-surface-container-low px-1.5 py-0.5 font-mono text-xs break-all">
            …/documents/<strong>grupo</strong>/<strong>carpeta</strong>/radicado….pdf
          </code>
          Cada aviso usa la carpeta vigente en la fecha en que se creó. Si la Rama Judicial cambia la carpeta, agregue
          la nueva con la fecha desde la que rige: los avisos anteriores conservan su URL.
        </p>
      </div>

      {saved && (
        <Alert variant="success" onClose={() => setSaved(null)}>
          {saved}
        </Alert>
      )}
      {error && <Alert variant="error">{error}</Alert>}

      {!folders && !error ? (
        <div className="flex justify-center py-12 text-primary">
          <Spinner />
        </div>
      ) : (
        <ul className="space-y-2">
          {folders?.map((folder) => {
            const future = folder.valid_from > today
            return (
              <li
                key={folder.id}
                className="flex items-start justify-between gap-3 rounded-lg bg-surface-container-low p-4"
              >
                <div className="min-w-0 space-y-2">
                  <div>
                    <p className="font-mono text-sm text-on-surface">
                      {folder.group_id} / {folder.folder_id}
                    </p>
                    <p className="text-xs text-on-surface-variant">Desde el {longDate(folder.valid_from)}</p>
                  </div>
                  {(folder.id === current?.id || future) && (
                    <div className="flex flex-wrap gap-2">
                      {folder.id === current?.id && <Badge variant="success">Vigente</Badge>}
                      {future && <Badge variant="primary">Próxima</Badge>}
                    </div>
                  )}
                </div>
                <ActionMenu
                  label={`Opciones de la carpeta ${folder.group_id} / ${folder.folder_id}`}
                  items={[
                    {
                      label: 'Borrar',
                      icon: icons.trash,
                      danger: true,
                      // Solo las futuras: una vigente o pasada ya la usan avisos creados.
                      disabledReason: future ? undefined : 'Ya rige: la usan avisos creados',
                      onSelect: () => setToDelete(folder),
                    },
                  ]}
                />
              </li>
            )
          })}
          {folders?.length === 0 && (
            <li className="text-sm text-on-surface-variant">No hay carpetas: los avisos nuevos no tendrán URL.</li>
          )}
        </ul>
      )}

      <Card className="bg-surface-container-lowest">
        <CardBody>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <h3 className="text-lg font-bold">Agregar carpeta</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Grupo"
                inputMode="numeric"
                value={form.groupId}
                onChange={(e) => setForm({ ...form, groupId: e.target.value })}
                placeholder="6098902"
              />
              <Input
                label="Carpeta"
                inputMode="numeric"
                value={form.folderId}
                onChange={(e) => setForm({ ...form, folderId: e.target.value })}
                placeholder="210268129"
              />
              <Input
                label="Vigente desde"
                type="date"
                value={form.validFrom}
                onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
              />
            </div>
            {formError && <Alert variant="error">{formError}</Alert>}
            <div className="flex justify-end">
              <Button type="submit" loading={saving}>
                Agregar carpeta
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {toDelete && (
        <ConfirmDialog
          open
          title="¿Borrar esta carpeta?"
          confirmLabel="Borrar"
          tone="danger"
          onClose={() => setToDelete(null)}
          onConfirm={async () => {
            await deleteFolder(toDelete.id)
            setToDelete(null)
            setSaved(`Carpeta ${toDelete.group_id} / ${toDelete.folder_id} borrada.`)
            setVersion((v) => v + 1)
          }}
        >
          <p>
            Se borrará la carpeta{' '}
            <strong className="font-mono text-on-surface">
              {toDelete.group_id} / {toDelete.folder_id}
            </strong>
            , que iba a regir desde el {longDate(toDelete.valid_from)}.
          </p>
        </ConfirmDialog>
      )}
    </div>
  )
}
