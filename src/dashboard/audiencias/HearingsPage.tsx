import { useEffect, useRef, useState } from 'react'
import { COURTS, formatDate, formatTime, type Court } from '../../components/remates'
import { Alert, Button, ButtonLink, Card, EmptyState, Input, Pagination, Spinner, Textarea } from '../../components/ui'
import { cn } from '../../lib/cn'
import { useDocumentMeta } from '../../lib/useDocumentMeta'
import { useAccess } from '../access'
import { ConfirmDialog, Icon, icons, stickyFilters } from '../ui'
import type { HearingAction } from './actions'
import { deleteHearing, updateHearing } from './api'
import { HEARING_TYPES_PATH, PAGE_SIZE, TABS, typeName, VIEWS } from './data'
import HearingDetailModal from './HearingDetailModal'
import HearingFormModal from './HearingFormModal'
import HearingsCalendar from './HearingsCalendar'
import HearingsFilters from './HearingsFilters'
import HearingsTable from './HearingsTable'
import { recordingSchema } from './schema'
import type { Hearing, HearingsFlash, HearingView } from './types'
import { useHearingFilters } from './useHearingFilters'
import { useHearingsCalendar, useHearingsTable, useHearingTypes } from './useHearingsData'

type Dialog =
  | { kind: 'form'; hearing: Hearing | null; key: number }
  | { kind: Exclude<HearingAction, 'edit'>; hearing: Hearing }
  | null

const tagIcon = [
  'M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z',
  'M6 6h.008v.008H6V6Z',
]

const label = (hearing: Hearing) =>
  `${formatDate(hearing.scheduled_at)} a las ${formatTime(hearing.scheduled_at)} (radicado ${hearing.case_number})`

// Audiencias (/dashboard/audiencias, docs/plan-audiencias.md): tabla o calendario (semana y mes),
// cada acción con su permiso en el juzgado de la audiencia (RLS y hearings_rules lo exigen de nuevo).
export default function HearingsPage() {
  useDocumentMeta({ title: 'Audiencias · Dashboard', noindex: true })
  const { access, can } = useAccess()
  const forcedCourt = access?.scope === 'court' ? (access.court as Court) : null
  const { filters, updateFilters } = useHearingFilters(forcedCourt)
  const isTable = filters.view === 'tabla'
  const table = useHearingsTable(filters, isTable)
  const calendar = useHearingsCalendar(filters, !isTable)
  const { types, error: typesError } = useHearingTypes()
  const [dialog, setDialog] = useState<Dialog>(null)
  const [flash, setFlash] = useState<HearingsFlash | null>(null)
  const [recording, setRecording] = useState('')
  const [notes, setNotes] = useState('')
  const resultsRef = useRef<HTMLElement>(null)

  const now = (isTable ? table.now : calendar.now) ?? new Date()
  const reload = isTable ? table.reload : calendar.reload
  const canCreate = can('audiencias.crear', forcedCourt ?? undefined)

  const outOfRange = isTable && !table.loading && table.data?.outOfRange
  useEffect(() => {
    if (outOfRange) updateFilters({ page: 1 }, { replace: true })
  }, [outOfRange, updateFilters])

  const done = (message: string, highlightId: string | null) => {
    setDialog(null)
    setFlash({ message, highlightId })
    reload()
  }

  const onAction = (action: HearingAction, hearing: Hearing) => {
    setRecording(action === 'recording' ? (hearing.recording_url ?? '') : '')
    setNotes(hearing.notes ?? '')
    if (action === 'edit') setDialog({ kind: 'form', hearing, key: Date.now() })
    else setDialog({ kind: action, hearing })
  }

  const tabLabel = TABS.find((tab) => tab.value === filters.tab)?.label ?? ''
  const caption = `Audiencias: ${tabLabel.toLowerCase()}${filters.court ? ` del ${COURTS[filters.court].short}` : ''}`

  function renderTable() {
    const { data, error, loading } = table
    if (error)
      return (
        <Alert variant="error" title="No se pudieron cargar las audiencias">
          <p>{error}</p>
          <Button variant="secondary" size="sm" onClick={table.reload} className="mt-3">
            Reintentar
          </Button>
        </Alert>
      )
    if (!data || !types)
      return (
        <div className="flex justify-center py-16 text-primary">
          <Spinner size="lg" label="Cargando audiencias..." />
        </div>
      )
    if (data.rows.length === 0)
      return (
        <EmptyState
          title={filters.query ? 'No hay audiencias con ese radicado' : 'No hay audiencias para mostrar'}
          description="Pruebe con otra pestaña o con otros filtros."
        />
      )
    const pageCount = Math.ceil(data.total / PAGE_SIZE)
    const first = (filters.page - 1) * PAGE_SIZE + 1
    const last = Math.min(filters.page * PAGE_SIZE, data.total)
    return (
      <Card aria-busy={loading} className={cn('overflow-visible transition-opacity', loading && 'opacity-60')}>
        <HearingsTable
          rows={data.rows}
          types={types}
          now={now}
          caption={caption}
          highlightId={flash?.highlightId ?? null}
          onAction={onAction}
        />
        <div className="flex flex-col items-center justify-between gap-4 rounded-b-lg bg-surface-container-low px-4 py-4 sm:flex-row lg:px-6">
          <p className="text-sm text-on-surface-variant">
            Mostrando{' '}
            <span className="font-semibold text-on-surface">
              {first}–{last}
            </span>{' '}
            de <span className="font-semibold text-on-surface">{data.total}</span>{' '}
            {data.total === 1 ? 'audiencia' : 'audiencias'}
          </p>
          <Pagination
            page={filters.page}
            pageCount={pageCount}
            onPageChange={(page) => {
              updateFilters({ page })
              resultsRef.current?.scrollIntoView({ block: 'start' })
            }}
          />
        </div>
      </Card>
    )
  }

  function renderCalendar() {
    if (calendar.error)
      return (
        <Alert variant="error" title="No se pudo cargar el calendario">
          <p>{calendar.error}</p>
          <Button variant="secondary" size="sm" onClick={calendar.reload} className="mt-3">
            Reintentar
          </Button>
        </Alert>
      )
    if (!calendar.hearings || !types)
      return (
        <div className="flex justify-center py-16 text-primary">
          <Spinner size="lg" label="Cargando calendario..." />
        </div>
      )
    return (
      <HearingsCalendar
        view={filters.view as Exclude<HearingView, 'tabla'>}
        date={filters.date}
        hearings={calendar.hearings}
        nonBusiness={calendar.nonBusiness}
        types={types}
        now={now}
        loading={calendar.loading}
        onNavigate={(date, view) => updateFilters({ date, ...(view && { view }) })}
        onOpen={(hearing) => onAction('view', hearing)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <p className="max-w-xl text-sm text-on-surface-variant">
        {forcedCourt ? `Audiencias del ${COURTS[forcedCourt].short}.` : 'Audiencias de los dos juzgados.'} Se programan
        en días hábiles y, después de la fecha, se cierran como realizadas (con la grabación) o canceladas.
      </p>

      {flash && (
        <Alert variant={flash.error ? 'error' : 'success'} onClose={() => setFlash(null)}>
          {flash.message}
        </Alert>
      )}
      {typesError && <Alert variant="error">{typesError}</Alert>}

      <HearingsFilters
        filters={filters}
        types={types ?? []}
        showCourt={!forcedCourt}
        pendingClose={table.pending}
        onChange={updateFilters}
        className={isTable ? stickyFilters : undefined}
        toolbar={
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex gap-1 rounded-lg bg-surface-container p-1" role="group" aria-label="Vista">
              {VIEWS.map((view) => (
                <button
                  key={view.value}
                  type="button"
                  aria-pressed={filters.view === view.value}
                  onClick={() => updateFilters({ view: view.value })}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-primary',
                    filters.view === view.value
                      ? 'bg-surface-container-lowest text-primary shadow-ambient'
                      : 'text-on-surface-variant hover:text-on-surface',
                  )}
                >
                  {view.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {can('audiencias.tipos') && (
                <ButtonLink to={HEARING_TYPES_PATH} variant="secondary">
                  <Icon paths={tagIcon} className="size-4" />
                  Tipos de audiencia
                </ButtonLink>
              )}
              {canCreate && (
                <Button
                  onClick={() => setDialog({ kind: 'form', hearing: null, key: Date.now() })}
                  disabled={!types}
                  aria-haspopup="dialog"
                >
                  <Icon paths={icons.plus} className="size-4" />
                  Programar audiencia
                </Button>
              )}
            </div>
          </div>
        }
      />

      <section
        ref={resultsRef}
        aria-label={isTable ? caption : 'Calendario de audiencias'}
        className="scroll-mt-20 xl:scroll-mt-72"
      >
        <p aria-live="polite" className="sr-only">
          {isTable && !table.loading && table.data
            ? `${table.data.total} ${table.data.total === 1 ? 'audiencia encontrada' : 'audiencias encontradas'}`
            : ''}
        </p>
        {isTable ? renderTable() : renderCalendar()}
      </section>

      {dialog?.kind === 'form' && types && (
        <HearingFormModal
          key={dialog.key}
          hearing={dialog.hearing}
          types={types}
          forcedCourt={forcedCourt}
          onClose={() => setDialog(null)}
          onSaved={(id, message) => done(message, id)}
        />
      )}

      {dialog?.kind === 'view' && types && (
        <HearingDetailModal
          hearing={dialog.hearing}
          types={types}
          now={now}
          onClose={() => setDialog(null)}
          onAction={onAction}
        />
      )}

      {dialog?.kind === 'realize' && (
        <ConfirmDialog
          open
          title="¿Marcar como realizada?"
          confirmLabel="Marcar realizada"
          icon={['m4.5 12.75 6 6 9-13.5']}
          onClose={() => setDialog(null)}
          onConfirm={async () => {
            const url = recordingSchema.safeParse(recording)
            if (!url.success) throw new Error(url.error.issues[0].message)
            await updateHearing(dialog.hearing.id, { status_id: 2, recording_url: url.data })
            done(`Audiencia del radicado ${dialog.hearing.case_number} marcada como realizada.`, dialog.hearing.id)
          }}
        >
          <p>
            {typeName(types ?? [], dialog.hearing.hearing_type_id)} del {label(dialog.hearing)}. Después solo podrá
            corregir el enlace de la grabación.
          </p>
          <Input
            label="Enlace de la grabación"
            type="url"
            value={recording}
            onChange={(e) => setRecording(e.target.value)}
            placeholder="https://"
            className="text-left"
          />
        </ConfirmDialog>
      )}

      {dialog?.kind === 'cancel' && (
        <ConfirmDialog
          open
          title="¿Marcar como cancelada?"
          confirmLabel="Marcar cancelada"
          icon={['M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636']}
          onClose={() => setDialog(null)}
          onConfirm={async () => {
            await updateHearing(dialog.hearing.id, { status_id: 3, notes: notes.trim() || null })
            done(`Audiencia del radicado ${dialog.hearing.case_number} marcada como cancelada.`, dialog.hearing.id)
          }}
        >
          <p>La audiencia del {label(dialog.hearing)} quedará como no realizada y ya no se podrá editar.</p>
          <Textarea
            label="Observaciones (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={1000}
            className="text-left"
          />
        </ConfirmDialog>
      )}

      {dialog?.kind === 'recording' && (
        <ConfirmDialog
          open
          title="¿Corregir la grabación?"
          confirmLabel="Guardar"
          onClose={() => setDialog(null)}
          onConfirm={async () => {
            const url = recordingSchema.safeParse(recording)
            if (!url.success) throw new Error(url.error.issues[0].message)
            await updateHearing(dialog.hearing.id, { recording_url: url.data })
            done(`Grabación de la audiencia del radicado ${dialog.hearing.case_number} actualizada.`, dialog.hearing.id)
          }}
        >
          <Input
            label="Enlace de la grabación"
            type="url"
            value={recording}
            onChange={(e) => setRecording(e.target.value)}
            placeholder="https://"
            className="text-left"
          />
        </ConfirmDialog>
      )}

      {dialog?.kind === 'delete' && (
        <ConfirmDialog
          open
          title="¿Eliminar esta audiencia?"
          confirmLabel="Eliminar"
          tone="danger"
          onClose={() => setDialog(null)}
          onConfirm={async () => {
            await deleteHearing(dialog.hearing.id)
            done(`Audiencia del radicado ${dialog.hearing.case_number} eliminada.`, null)
          }}
        >
          <p>Se eliminará la audiencia del {label(dialog.hearing)}. Esta acción no se puede deshacer.</p>
        </ConfirmDialog>
      )}
    </div>
  )
}
