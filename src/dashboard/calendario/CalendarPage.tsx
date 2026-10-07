import { useEffect, useState } from 'react'
import { Alert, Badge, Button, EmptyState, Select, Spinner } from '../../components/ui'
import { useDocumentMeta } from '../../lib/useDocumentMeta'
import { useAccess } from '../access'
import { ActionMenu, ConfirmDialog, Icon, icons } from '../ui'
import { deleteDay, fetchDays } from './api'
import AddDaysModal from './AddDaysModal'
import { KINDS, longDay } from './data'
import LoadYearModal from './LoadYearModal'
import type { NonBusinessDay } from './types'

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1, CURRENT_YEAR + 2]

function useDays(year: number) {
  const [days, setDays] = useState<NonBusinessDay[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const key = `${year}|${version}`

  useEffect(() => {
    let active = true
    fetchDays(year)
      .then((rows) => {
        if (!active) return
        setDays(rows)
        setError(null)
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'No se pudo cargar el calendario.')
      })
      .finally(() => {
        if (active) setLoadedKey(`${year}|${version}`)
      })
    return () => {
      active = false
    }
  }, [year, version])

  return { days, error, loading: loadedKey !== key, reload: () => setVersion((v) => v + 1) }
}

// Días no hábiles (/dashboard/dias-no-habiles, docs/plan-dias-no-habiles.md): festivos y cierres
// que no cuentan en los plazos. Ver: calendario.ver; agregar, cargar y eliminar: calendario.gestionar.
export default function CalendarPage() {
  useDocumentMeta({ title: 'Días no hábiles · Dashboard', noindex: true })
  const canManage = useAccess().can('calendario.gestionar')
  const [year, setYear] = useState(CURRENT_YEAR)
  const { days, error, loading, reload } = useDays(year)
  const [dialog, setDialog] = useState<'add' | 'load' | { delete: NonBusinessDay } | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const done = (message: string) => {
    setDialog(null)
    setFlash(message)
    reload()
  }
  const count = (n: number) => `${n} ${n === 1 ? 'día' : 'días'}`

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-sm text-on-surface-variant">
        Festivos y cierres que no cuentan como días hábiles en los plazos (p. ej. los 15 días hábiles de las PQRS).
        Sábados y domingos ya están excluidos. Al agregar o eliminar un día, los plazos pendientes se recalculan solos.
      </p>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <Select
          label="Año"
          value={String(year)}
          onChange={(e) => setYear(Number(e.target.value))}
          options={YEARS.map((value) => ({ value: String(value), label: String(value) }))}
          className="w-32"
        />
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setDialog('load')} disabled={!days}>
              <Icon paths={icons.refresh} className="size-4" />
              Cargar calendario {year}
            </Button>
            <Button onClick={() => setDialog('add')}>
              <Icon paths={icons.plus} className="size-4" />
              Agregar
            </Button>
          </div>
        )}
      </div>

      {flash && (
        <Alert variant="success" onClose={() => setFlash(null)}>
          {flash}
        </Alert>
      )}
      {error && <Alert variant="error">{error}</Alert>}

      {!days ? (
        <div className="flex justify-center py-12 text-primary">
          <Spinner />
        </div>
      ) : days.length === 0 ? (
        <EmptyState
          title={`No hay días no hábiles registrados en ${year}`}
          description={
            canManage
              ? `Use "Cargar calendario ${year}" para agregar los festivos y los días de la Rama Judicial.`
              : undefined
          }
        />
      ) : (
        <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <p className="mb-3 text-sm text-on-surface-variant">
            {count(days.length)} en {year}
          </p>
          <ul className="space-y-2">
            {days.map((day) => (
              <li
                key={day.day}
                className="flex items-center justify-between gap-3 rounded-lg bg-surface-container-low px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-on-surface first-letter:uppercase">{longDay(day.day)}</p>
                  <p className="text-xs text-on-surface-variant">{day.reason}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Badge variant={KINDS[day.kind].variant}>{KINDS[day.kind].label}</Badge>
                  {canManage && (
                    <ActionMenu
                      label={`Opciones del ${longDay(day.day)}`}
                      items={[
                        {
                          label: 'Eliminar',
                          icon: icons.trash,
                          danger: true,
                          onSelect: () => setDialog({ delete: day }),
                        },
                      ]}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {dialog === 'add' && (
        <AddDaysModal
          onClose={() => setDialog(null)}
          onSaved={(added, requested) =>
            done(
              added === requested
                ? `${count(added)} agregado${added === 1 ? '' : 's'}.`
                : `${count(added)} agregado${added === 1 ? '' : 's'}; ${requested - added} ya estaba${requested - added === 1 ? '' : 'n'} registrado${requested - added === 1 ? '' : 's'}.`,
            )
          }
        />
      )}

      {dialog === 'load' && days && (
        <LoadYearModal
          year={year}
          existing={new Set(days.map((day) => day.day))}
          onClose={() => setDialog(null)}
          onSaved={(added) => done(`Calendario ${year}: ${count(added)} agregado${added === 1 ? '' : 's'}.`)}
        />
      )}

      {dialog && typeof dialog === 'object' && (
        <ConfirmDialog
          open
          title="¿Eliminar este día no hábil?"
          confirmLabel="Eliminar"
          tone="danger"
          onClose={() => setDialog(null)}
          onConfirm={async () => {
            await deleteDay(dialog.delete.day)
            done(`Se eliminó el ${longDay(dialog.delete.day)}.`)
          }}
        >
          <p>
            El <strong className="text-on-surface">{longDay(dialog.delete.day)}</strong> ({dialog.delete.reason})
            volverá a contar como día hábil, y los plazos de las PQRS pendientes se recalcularán.
          </p>
        </ConfirmDialog>
      )}
    </div>
  )
}
