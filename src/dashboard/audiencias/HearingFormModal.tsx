import { useEffect, useId, useState, type FormEvent } from 'react'
import { COURTS, formatTime } from '../../components/remates'
import { Alert, Button, Input, Modal, Select, Textarea } from '../../components/ui'
import { createHearing, fetchOverlaps, updateHearing } from './api'
import { TIME_OPTIONS, typeName } from './data'
import { bogotaParts, todayInBogota, toScheduledAt } from './dates'
import { scheduleProblem } from './schedule'
import { hearingSchema, type HearingField } from './schema'
import type { Court, Hearing, HearingDraft, HearingType } from './types'
import { useNonBusinessMonth } from './useHearingsData'

type Props = {
  // null: crear. Con audiencia: editar (solo Programadas).
  hearing: Hearing | null
  types: HearingType[]
  // Usuario de alcance juzgado: el juzgado queda fijo en el suyo.
  forcedCourt: Court | null
  onClose: () => void
  onSaved: (id: string, message: string) => void
}

const courtOptions = ([1, 2] as const).map((court) => ({ value: String(court), label: COURTS[court].short }))

function initialDraft(hearing: Hearing | null, forcedCourt: Court | null): HearingDraft {
  if (!hearing)
    return {
      court: forcedCourt ? String(forcedCourt) : '',
      typeId: '',
      caseNumber: '',
      date: '',
      time: '',
      connectionUrl: '',
      notes: '',
    }
  const { date, time } = bogotaParts(hearing.scheduled_at)
  return {
    court: String(hearing.court_id),
    typeId: String(hearing.hearing_type_id),
    caseNumber: hearing.case_number,
    date,
    time,
    connectionUrl: hearing.connection_url ?? '',
    notes: hearing.notes ?? '',
  }
}

// Crear o editar una audiencia Programada. Las reglas de fecha y hora (futura, día hábil, de 7:00
// a. m. a 5:00 p. m., saltos de 15 minutos) se revisan aquí y otra vez en la base de datos.
export default function HearingFormModal({ hearing, types, forcedCourt, onClose, onSaved }: Props) {
  const formId = useId()
  const [draft, setDraft] = useState<HearingDraft>(() => initialDraft(hearing, forcedCourt))
  const [errors, setErrors] = useState<Partial<Record<HearingField, string>>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [overlaps, setOverlaps] = useState<Hearing[]>([])
  const nonBusiness = useNonBusinessMonth(draft.date || null)
  // Momento en que se abrió el formulario: referencia de "futura" sin leer el reloj al renderizar.
  const [openedAt] = useState(() => Date.now())

  const update = <K extends keyof HearingDraft>(field: K, value: HearingDraft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const original = hearing ? bogotaParts(hearing.scheduled_at) : null
  const scheduleChanged = !original || original.date !== draft.date || original.time !== draft.time
  const scheduledAt = draft.date && draft.time ? toScheduledAt(draft.date, draft.time) : null

  // Fecha: futura y hábil (solo si cambió: una audiencia por cerrar se puede editar sin moverla).
  const scheduleError = scheduleChanged ? scheduleProblem(draft.date, draft.time, nonBusiness, openedAt) : null

  // Cruce de horario: otra audiencia programada del juzgado en esa hora (solo aviso).
  const court = draft.court ? (Number(draft.court) as Court) : null
  useEffect(() => {
    if (!court || !scheduledAt) return
    let active = true
    fetchOverlaps(court, scheduledAt, hearing?.id ?? null)
      .then((rows) => {
        if (active) setOverlaps(rows)
      })
      .catch(() => {
        if (active) setOverlaps([])
      })
    return () => {
      active = false
    }
  }, [court, scheduledAt, hearing?.id])
  const visibleOverlaps = court && scheduledAt ? overlaps : []

  const typeOptions = types
    .filter((type) => type.is_active || type.id === hearing?.hearing_type_id)
    .map((type) => ({
      value: String(type.id),
      label: type.is_active ? type.description : `${type.description} (inactivo)`,
    }))
  const selectedType = types.find((type) => String(type.id) === draft.typeId)
  const linkPending = selectedType?.requires_link && !draft.connectionUrl.trim()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setServerError(null)
    const parsed = hearingSchema.safeParse(draft)
    const next: Partial<Record<HearingField, string>> = {}
    if (!parsed.success) for (const issue of parsed.error.issues) next[issue.path[0] as HearingField] ??= issue.message
    if (scheduleError) next.date ??= scheduleError
    setErrors(next)
    if (!parsed.success || Object.keys(next).length > 0) return

    const data = {
      scheduled_at: toScheduledAt(parsed.data.date, parsed.data.time),
      hearing_type_id: Number(parsed.data.typeId),
      case_number: parsed.data.caseNumber,
      court_id: Number(parsed.data.court) as Court,
      connection_url: parsed.data.connectionUrl || null,
      notes: parsed.data.notes || null,
    }
    setSaving(true)
    try {
      if (hearing) {
        await updateHearing(hearing.id, data)
        onSaved(hearing.id, `Audiencia del radicado ${data.case_number} actualizada.`)
      } else {
        const id = await createHearing(data)
        onSaved(id, `Audiencia del radicado ${data.case_number} programada.`)
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'No se pudo guardar la audiencia.')
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={saving ? () => {} : onClose}
      title={hearing ? 'Editar audiencia' : 'Programar audiencia'}
      className="max-w-xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} loading={saving}>
            {hearing ? 'Guardar cambios' : 'Programar'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Juzgado"
            value={draft.court}
            onChange={(e) => update('court', e.target.value)}
            placeholder="Elija el juzgado"
            options={courtOptions}
            disabled={Boolean(forcedCourt)}
            error={errors.court}
          />
          <Select
            label="Tipo de audiencia"
            value={draft.typeId}
            onChange={(e) => update('typeId', e.target.value)}
            placeholder="Elija el tipo"
            options={typeOptions}
            error={errors.typeId}
          />
        </div>
        <Input
          label="Radicado"
          value={draft.caseNumber}
          onChange={(e) => update('caseNumber', e.target.value)}
          inputMode="numeric"
          autoComplete="off"
          maxLength={40}
          error={errors.caseNumber}
          hint="23 dígitos (puede pegarlo con espacios, puntos o guiones)."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Fecha"
            type="date"
            min={todayInBogota()}
            value={draft.date}
            onChange={(e) => update('date', e.target.value)}
            error={errors.date ?? scheduleError ?? undefined}
            hint="De lunes a viernes, en días hábiles."
          />
          <Select
            label="Hora"
            value={draft.time}
            onChange={(e) => update('time', e.target.value)}
            placeholder="Elija la hora"
            options={TIME_OPTIONS}
            error={errors.time}
            hint="De 7:00 a. m. a 5:00 p. m. (hora de Colombia)."
          />
        </div>

        {visibleOverlaps.length > 0 && (
          <Alert variant="warning" live={false} title="Cruce de horario">
            <ul className="list-disc space-y-1 pl-5">
              {visibleOverlaps.map((other) => (
                <li key={other.id}>
                  El {COURTS[other.court_id].short} ya tiene {typeName(types, other.hearing_type_id).toLowerCase()} a
                  las {formatTime(other.scheduled_at)} (radicado {other.case_number}).
                </li>
              ))}
            </ul>
            <p className="mt-1">Puede programarla de todos modos.</p>
          </Alert>
        )}

        <Input
          label="Enlace de conexión"
          type="url"
          value={draft.connectionUrl}
          onChange={(e) => update('connectionUrl', e.target.value)}
          placeholder="https://"
          error={errors.connectionUrl}
          hint={
            selectedType && !selectedType.requires_link
              ? 'Opcional: este tipo es presencial.'
              : linkPending
                ? 'Puede guardarla sin enlace, pero no se comunicará hasta que lo agregue.'
                : undefined
          }
        />
        <Textarea
          label="Observaciones (opcional)"
          value={draft.notes}
          onChange={(e) => update('notes', e.target.value)}
          rows={3}
          maxLength={1000}
          showCount
          error={errors.notes}
          hint="Notas internas: no se publican."
        />

        {serverError && <Alert variant="error">{serverError}</Alert>}
      </form>
    </Modal>
  )
}
