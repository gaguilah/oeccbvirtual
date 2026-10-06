import { useId, useState, type FormEvent } from 'react'
import { COURTS, type Court } from '../../components/remates'
import { Alert, Button, Input, Modal, Select } from '../../components/ui'
import { useAccess } from '../access'
import { createNotice, updateNotice } from './api'
import { bogotaParts, toScheduledAt, todayInBogota } from './datetime'
import { folderFor, previewPdfUrl } from './pdfUrl'
import { noticeSchema, pdfUrlSchema, type NoticeFields } from './schema'
import type { AdminNotice, NoticeDraft, PdfFolder } from './types'

type NoticeFormModalProps = {
  // null: crear. Con aviso: editar.
  notice: AdminNotice | null
  folders: PdfFolder[]
  // Usuario de alcance juzgado: el juzgado queda fijo en el suyo.
  forcedCourt: Court | null
  onClose: () => void
  onSaved: (id: string, message: string) => void
}

const courtOptions = ([1, 2] as const).map((court) => ({ value: String(court), label: COURTS[court].short }))

function initialDraft(notice: AdminNotice | null, forcedCourt: Court | null): NoticeDraft {
  if (!notice) {
    return {
      caseNumber: '',
      court: forcedCourt ? String(forcedCourt) : '',
      date: '',
      time: '',
      isPublished: true,
      manualUrl: false,
      pdfUrl: '',
    }
  }
  const { date, time } = bogotaParts(notice.scheduled_at)
  return {
    caseNumber: notice.case_number,
    court: String(notice.court),
    date,
    time,
    isPublished: notice.is_published,
    manualUrl: false,
    pdfUrl: notice.pdf_url,
  }
}

// Crear o editar un aviso. La URL del PDF la arma la base de datos; aquí se muestra una vista
// previa con la misma fórmula y la carpeta vigente, para comprobar que el PDF ya está en el portal.
export default function NoticeFormModal({ notice, folders, forcedCourt, onClose, onSaved }: NoticeFormModalProps) {
  const formId = useId()
  const { can } = useAccess()
  const [draft, setDraft] = useState<NoticeDraft>(() => initialDraft(notice, forcedCourt))
  const [errors, setErrors] = useState<Partial<Record<NoticeFields, string>>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const court = draft.court ? (Number(draft.court) as Court) : null
  const canPublish = court ? can('remates.publicar', court) : false

  function update<K extends keyof NoticeDraft>(field: K, value: NoticeDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  // Vista previa de la URL: la del aviso si no cambian sus datos; si no, la que generará la base.
  const parsed = noticeSchema.safeParse(draft)
  const scheduledAt = parsed.success ? toScheduledAt(parsed.data.date, parsed.data.time) : null
  const unchanged =
    notice &&
    parsed.success &&
    parsed.data.caseNumber === notice.case_number &&
    Number(parsed.data.court) === notice.court &&
    scheduledAt === new Date(notice.scheduled_at).toISOString()
  const folder = folderFor(folders, notice ? bogotaParts(notice.created_at).date : todayInBogota())
  const preview = unchanged
    ? notice.pdf_url
    : parsed.success && scheduledAt && folder
      ? previewPdfUrl(folder, parsed.data.caseNumber, Number(parsed.data.court), scheduledAt)
      : null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setServerError(null)
    const next: Partial<Record<NoticeFields, string>> = {}
    if (!parsed.success) {
      for (const issue of parsed.error.issues) next[issue.path[0] as NoticeFields] ??= issue.message
    }
    const url = draft.manualUrl ? pdfUrlSchema.safeParse(draft.pdfUrl) : null
    if (url && !url.success) next.pdfUrl = url.error.issues[0].message
    setErrors(next)
    if (!parsed.success || !scheduledAt || Object.keys(next).length > 0) return

    const data = {
      case_number: parsed.data.caseNumber,
      court: Number(parsed.data.court) as Court,
      scheduled_at: scheduledAt,
    }
    setSaving(true)
    try {
      if (notice) {
        await updateNotice(notice.id, {
          ...data,
          ...(canPublish && draft.isPublished !== notice.is_published && { is_published: draft.isPublished }),
          ...(url?.success && { pdf_url: url.data }),
        })
        onSaved(notice.id, `Aviso del radicado ${data.case_number} actualizado.`)
      } else {
        const id = await createNotice({ ...data, is_published: canPublish && draft.isPublished })
        const published = canPublish && draft.isPublished
        onSaved(id, `Aviso del radicado ${data.case_number} creado${published ? ' y publicado' : ' (oculto)'}.`)
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'No se pudo guardar el aviso.')
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={saving ? () => {} : onClose}
      title={notice ? 'Editar aviso' : 'Crear aviso'}
      className="max-w-xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} loading={saving}>
            {notice ? 'Guardar cambios' : 'Crear aviso'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          label="Radicado"
          value={draft.caseNumber}
          onChange={(e) => update('caseNumber', e.target.value)}
          inputMode="numeric"
          autoComplete="off"
          maxLength={40}
          error={errors.caseNumber}
          hint="Número de radicación del proceso: 23 dígitos (puede pegarlo con espacios o guiones)."
        />
        <Select
          label="Juzgado"
          value={draft.court}
          onChange={(e) => update('court', e.target.value)}
          placeholder="Elija el juzgado"
          options={courtOptions}
          disabled={Boolean(forcedCourt)}
          error={errors.court}
          hint={forcedCourt ? 'Solo puede gestionar los avisos de su juzgado.' : undefined}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Fecha del remate"
            type="date"
            value={draft.date}
            onChange={(e) => update('date', e.target.value)}
            error={errors.date}
          />
          <Input
            label="Hora"
            type="time"
            value={draft.time}
            onChange={(e) => update('time', e.target.value)}
            error={errors.time}
            hint="Hora de Colombia."
          />
        </div>

        {canPublish ? (
          <label className="flex items-start gap-3 rounded-lg bg-surface-container-low p-4">
            <input
              type="checkbox"
              checked={draft.isPublished}
              onChange={(e) => update('isPublished', e.target.checked)}
              className="mt-0.5 size-4 accent-primary"
            />
            <span>
              <span className="block text-sm font-semibold text-on-surface">Publicado</span>
              <span className="block text-xs text-on-surface-variant">
                Visible en Avisos de Remate del sitio público.
              </span>
            </span>
          </label>
        ) : (
          court && (
            <Alert variant="info" live={false}>
              {notice
                ? 'No tiene permiso para publicar u ocultar avisos de este juzgado.'
                : 'Se creará oculto: no tiene permiso para publicar avisos de este juzgado.'}
            </Alert>
          )
        )}

        <div className="space-y-2 rounded-lg bg-surface-container-low p-4">
          <p className="text-sm font-semibold text-on-surface">URL del PDF</p>
          {draft.manualUrl ? (
            <Input
              label="URL corregida"
              type="url"
              value={draft.pdfUrl}
              onChange={(e) => update('pdfUrl', e.target.value)}
              error={errors.pdfUrl}
              hint="Se respeta solo si no cambian el radicado, el juzgado ni la fecha y hora."
            />
          ) : preview ? (
            <>
              <p className="text-xs break-all text-on-surface-variant">{preview}</p>
              <a
                href={preview}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex text-sm font-medium text-primary hover:underline"
              >
                Abrir para comprobar que el PDF ya está en el portal ↗
              </a>
            </>
          ) : (
            <p className="text-xs text-on-surface-variant">
              {folder
                ? 'Complete radicado, juzgado, fecha y hora para ver la URL.'
                : 'No hay carpeta de publicación vigente: la URL no se puede generar.'}
            </p>
          )}
          {notice && can('remates.editar', notice.court) && (
            <label className="flex items-center gap-2 pt-1 text-xs text-on-surface-variant">
              <input
                type="checkbox"
                checked={draft.manualUrl}
                onChange={(e) => update('manualUrl', e.target.checked)}
                className="size-4 accent-primary"
              />
              Corregir la URL manualmente
            </label>
          )}
        </div>

        {serverError && <Alert variant="error">{serverError}</Alert>}
      </form>
    </Modal>
  )
}
