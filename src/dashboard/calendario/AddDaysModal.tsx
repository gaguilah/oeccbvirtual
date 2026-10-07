import { useId, useState, type FormEvent } from 'react'
import { Alert, Button, Input, Modal, Select } from '../../components/ui'
import { addDays } from './api'
import { KINDS } from './data'
import { weekdaysBetween } from './holidays'
import type { DayKind } from './types'

type AddDaysModalProps = {
  onClose: () => void
  onSaved: (added: number, requested: number) => void
}

const MAX_RANGE_DAYS = 120

// Agregar un día o un rango (p. ej. un cierre de varios días). Del rango solo se guardan los días de
// lunes a viernes; los que ya existan se omiten.
export default function AddDaysModal({ onClose, onSaved }: AddDaysModalProps) {
  const formId = useId()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [kind, setKind] = useState<DayKind>('cierre')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const days = from ? weekdaysBetween(from, to || from) : []

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!from) return setError('Elija la fecha.')
    if (to && to < from) return setError('La fecha final no puede ser anterior a la inicial.')
    const clean = reason.trim().replace(/\s+/g, ' ')
    if (clean.length < 3 || clean.length > 120) return setError('Escriba el motivo (entre 3 y 120 caracteres).')
    if (days.length === 0) return setError('En ese rango no hay días de lunes a viernes.')
    if (days.length > MAX_RANGE_DAYS)
      return setError(`El rango es demasiado largo (máximo ${MAX_RANGE_DAYS} días hábiles).`)
    setSaving(true)
    try {
      const added = await addDays(days.map((day) => ({ day, kind, reason: clean })))
      onSaved(added, days.length)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron agregar los días.')
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={saving ? () => {} : onClose}
      title="Agregar días no hábiles"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} loading={saving}>
            Agregar
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Fecha" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input
            label="Hasta (opcional)"
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => setTo(e.target.value)}
            hint="Para un rango de varios días."
          />
        </div>
        <Select
          label="Tipo"
          value={kind}
          onChange={(e) => setKind(e.target.value as DayKind)}
          options={(Object.keys(KINDS) as DayKind[]).map((value) => ({ value, label: KINDS[value].label }))}
        />
        <Input
          label="Motivo"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={120}
          placeholder="Ej.: Cierre por traslado de sede"
        />
        {from && (
          <p className="text-sm text-on-surface-variant">
            {days.length === 0
              ? 'En ese rango no hay días de lunes a viernes.'
              : `Se agregarán ${days.length} ${days.length === 1 ? 'día hábil' : 'días hábiles'} (sábados y domingos no se guardan).`}
          </p>
        )}
        {error && <Alert variant="error">{error}</Alert>}
      </form>
    </Modal>
  )
}
