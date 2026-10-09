import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Card, EmptyState, Pagination, Spinner } from '../../components/ui'
import { cn } from '../../lib/cn'
import { useDocumentMeta } from '../../lib/useDocumentMeta'
import { stickyFilters } from '../ui'
import { PAGE_SIZE } from './api'
import { TABS } from './data'
import RequestsFilters from './RequestsFilters'
import RequestsTable from './RequestsTable'
import StatusDialog, { type StatusAction } from './StatusDialog'
import type { RequestRow } from './types'
import { useRequestFilters } from './useRequestFilters'
import { useRequests } from './useRequests'

// Sección PQRS (/dashboard/pqrs, docs/plan-pqrs-dashboard.md). Ver: pqrs.ver. Cambiar el estado:
// pqrs.gestionar (set_request_status). Responder: pqrs.responder, desde el detalle.
export default function PqrsAdminPage() {
  useDocumentMeta({ title: 'PQRS · Dashboard', noindex: true })
  const { filters, updateFilters } = useRequestFilters()
  const { data, now, loading, error, reload } = useRequests(filters)
  const [dialog, setDialog] = useState<{ action: StatusAction; row: RequestRow } | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const resultsRef = useRef<HTMLElement>(null)

  const outOfRange = !loading && data?.outOfRange
  useEffect(() => {
    if (outOfRange) updateFilters({ page: 1 }, { replace: true })
  }, [outOfRange, updateFilters])

  const total = data?.total ?? 0
  const pageCount = Math.ceil(total / PAGE_SIZE)
  const first = (filters.page - 1) * PAGE_SIZE + 1
  const last = Math.min(filters.page * PAGE_SIZE, total)
  const caption = `PQRS ${TABS.find((tab) => tab.value === filters.tab)?.label.toLowerCase()}`

  function renderResults() {
    if (error) {
      return (
        <Alert variant="error" title="No se pudieron cargar las PQRS">
          <p>{error}</p>
          <Button variant="secondary" size="sm" onClick={reload} className="mt-3">
            Reintentar
          </Button>
        </Alert>
      )
    }
    if (!data || !now) {
      return (
        <div className="flex justify-center py-16 text-primary">
          <Spinner size="lg" label="Cargando PQRS..." />
        </div>
      )
    }
    if (data.rows.length === 0) {
      return (
        <EmptyState
          title={
            filters.tab === 'pendientes' && !filters.query && !filters.type
              ? 'No hay PQRS pendientes'
              : 'No hay PQRS para mostrar'
          }
          description={filters.query || filters.type ? 'Pruebe con otros filtros.' : undefined}
        />
      )
    }
    // La tarjeta no recorta: el menú ⋮ de las últimas filas sobresale hacia abajo.
    return (
      <Card aria-busy={loading} className={cn('overflow-visible transition-opacity', loading && 'opacity-60')}>
        <RequestsTable
          rows={data.rows}
          caption={caption}
          onSetInProgress={(row) => setDialog({ action: 'en_tramite', row })}
          onClose={(row) => setDialog({ action: 'cerrar', row })}
          onReopen={(row) => setDialog({ action: 'reabrir', row })}
        />
        <div className="flex flex-col items-center justify-between gap-4 rounded-b-lg bg-surface-container-low px-4 py-4 sm:flex-row lg:px-6">
          <p className="text-sm text-on-surface-variant">
            Mostrando{' '}
            <span className="font-semibold text-on-surface">
              {first}–{last}
            </span>{' '}
            de <span className="font-semibold text-on-surface">{total}</span> PQRS
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

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-sm text-on-surface-variant">
        Peticiones, quejas, reclamos, sugerencias y felicitaciones recibidas desde el sitio. Se responden dentro de 15
        días hábiles; la respuesta le llega al ciudadano por correo.
      </p>

      {flash && (
        <Alert variant="success" onClose={() => setFlash(null)}>
          {flash}
        </Alert>
      )}

      <RequestsFilters filters={filters} onChange={updateFilters} className={stickyFilters} />

      <section ref={resultsRef} aria-label={caption} className="scroll-mt-20 space-y-3 xl:scroll-mt-60">
        <p aria-live="polite" className="sr-only">
          {!loading && data ? `${total} PQRS` : ''}
        </p>
        {renderResults()}
      </section>

      {dialog && (
        <StatusDialog
          action={dialog.action}
          row={dialog.row}
          onClose={() => setDialog(null)}
          onDone={(message) => {
            setDialog(null)
            setFlash(message)
            reload()
          }}
        />
      )}
    </div>
  )
}
