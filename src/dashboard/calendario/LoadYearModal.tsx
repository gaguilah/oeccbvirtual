import { useState } from 'react'
import { Alert, Button, Modal } from '../../components/ui'
import { cn } from '../../lib/cn'
import { addDays } from './api'
import { longDay } from './data'
import { colombianHolidays, judicialDays, type CandidateDay } from './holidays'

type LoadYearModalProps = {
  year: number
  // Días que ya están en el calendario (para marcarlos y no volver a agregarlos).
  existing: Set<string>
  onClose: () => void
  onSaved: (added: number) => void
}

type Group = { id: 'festivos' | 'rama'; title: string; kind: 'festivo' | 'cierre'; days: CandidateDay[] }

// Vista previa del calendario de un año, en dos grupos con su casilla: festivos nacionales de
// Colombia y días de la Rama Judicial (Semana Santa, 17 de diciembre y vacancia judicial).
export default function LoadYearModal({ year, existing, onClose, onSaved }: LoadYearModalProps) {
  const groups: Group[] = [
    { id: 'festivos', title: 'Festivos nacionales de Colombia', kind: 'festivo', days: colombianHolidays(year) },
    { id: 'rama', title: 'Días de la Rama Judicial', kind: 'cierre', days: judicialDays(year) },
  ]
  const [selected, setSelected] = useState({ festivos: true, rama: true })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const toAdd = groups
    .filter((group) => selected[group.id])
    .flatMap((group) => group.days.filter((day) => !existing.has(day.day)).map((day) => ({ ...day, kind: group.kind })))

  async function save() {
    setError(null)
    setSaving(true)
    try {
      onSaved(await addDays(toAdd))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el calendario.')
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={saving ? () => {} : onClose}
      title={`Cargar calendario ${year}`}
      className="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={save} loading={saving} disabled={toAdd.length === 0}>
            {toAdd.length === 0 ? 'Nada por agregar' : `Agregar ${toAdd.length} ${toAdd.length === 1 ? 'día' : 'días'}`}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <p className="text-sm text-on-surface-variant">
          Revise los días antes de guardarlos. Solo se incluyen los de lunes a viernes; los que ya están en el
          calendario se omiten.
        </p>
        {groups.map((group) => {
          const fresh = group.days.filter((day) => !existing.has(day.day)).length
          return (
            <section key={group.id} className="space-y-2 rounded-lg bg-surface-container-low p-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selected[group.id]}
                  onChange={(e) => setSelected({ ...selected, [group.id]: e.target.checked })}
                  className="size-4 accent-primary"
                />
                <span className="text-sm font-semibold text-on-surface">
                  {group.title}{' '}
                  <span className="font-normal text-on-surface-variant">
                    ({fresh} de {group.days.length} por agregar)
                  </span>
                </span>
              </label>
              <ul className="space-y-1 pl-7 text-sm">
                {group.days.map((day) => {
                  const taken = existing.has(day.day)
                  return (
                    <li
                      key={day.day}
                      className={cn(
                        'first-letter:uppercase',
                        taken ? 'text-on-surface-variant line-through' : 'text-on-surface',
                      )}
                    >
                      {longDay(day.day)} · {day.reason}
                      {taken && <span className="ml-1 text-xs no-underline">(ya registrado)</span>}
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
        {error && <Alert variant="error">{error}</Alert>}
      </div>
    </Modal>
  )
}
