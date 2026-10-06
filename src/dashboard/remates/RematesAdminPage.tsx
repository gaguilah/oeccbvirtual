import { useEffect, useRef, useState } from 'react'
import { COURTS, formatDate, formatTime, PAGE_SIZE, type Court } from '../../components/remates'
import { Alert, Button, ButtonLink, Card, EmptyState, Pagination, Spinner } from '../../components/ui'
import { cn } from '../../lib/cn'
import { useDocumentMeta } from '../../lib/useDocumentMeta'
import { useAccess } from '../access'
import { ConfirmDialog, Icon, icons } from '../ui'
import AdminRematesFilters from './AdminRematesFilters'
import AdminRematesTable from './AdminRematesTable'
import { deleteNotice, fetchFolders, updateNotice } from './api'
import { REMATES_ADMIN_PATH } from './constants'
import NoticeDetailModal from './NoticeDetailModal'
import NoticeFormModal from './NoticeFormModal'
import type { AdminNotice, PdfFolder, RematesFlash } from './types'
import { useAdminFilters } from './useAdminFilters'
import { useAdminNotices } from './useAdminNotices'

type Dialog =
  | { kind: 'form'; notice: AdminNotice | null; key: number }
  | { kind: 'view' | 'hide' | 'delete'; notice: AdminNotice }
  | null

const PERIOD_LABELS = { proximos: 'Próximos remates', pasados: 'Remates pasados', todos: 'Todos los remates' }

// Sección Avisos de Remate (/dashboard/avisos-remates, docs/plan-remates-dashboard.md). La misma
// tabla del sitio público con publicación y acciones; cada acción con su permiso en el juzgado del
// aviso (RLS y el trigger auction_notices_authorize lo vuelven a exigir).
export default function RematesAdminPage() {
  useDocumentMeta({ title: 'Avisos de Remate · Dashboard', noindex: true })
  const { access, can } = useAccess()
  const forcedCourt = access?.scope === 'court' ? (access.court as Court) : null
  const { filters, updateFilters } = useAdminFilters(forcedCourt)
  const { data, now, loading, error, reload } = useAdminNotices(filters)
  const [dialog, setDialog] = useState<Dialog>(null)
  const [flash, setFlash] = useState<RematesFlash | null>(null)
  const [folders, setFolders] = useState<PdfFolder[]>([])
  const resultsRef = useRef<HTMLElement>(null)

  const canCreate = can('remates.crear', forcedCourt ?? undefined)
  const canWrite = canCreate || can('remates.editar')

  // Carpetas para la vista previa de la URL del PDF (solo quien crea o edita puede leerlas).
  useEffect(() => {
    if (!canWrite) return
    fetchFolders()
      .then(setFolders)
      .catch(() => setFolders([]))
  }, [canWrite])

  // Página que ya no existe (p. ej. tras eliminar el último aviso de la página): ir a la primera.
  const outOfRange = !loading && data?.outOfRange
  useEffect(() => {
    if (outOfRange) updateFilters({ page: 1 }, { replace: true })
  }, [outOfRange, updateFilters])

  const done = (message: string, highlightId: string | null) => {
    setDialog(null)
    setFlash({ message, highlightId })
    reload()
  }

  const total = data?.total ?? 0
  const pageCount = Math.ceil(total / PAGE_SIZE)
  const first = (filters.page - 1) * PAGE_SIZE + 1
  const last = Math.min(filters.page * PAGE_SIZE, total)
  const periodLabel = PERIOD_LABELS[filters.period]
  const caption = filters.court ? `${periodLabel} del ${COURTS[filters.court].short}` : periodLabel

  async function publish(notice: AdminNotice) {
    try {
      await updateNotice(notice.id, { is_published: true })
      done(`Aviso del radicado ${notice.case_number} publicado.`, notice.id)
    } catch (err) {
      setFlash({ message: err instanceof Error ? err.message : 'No se pudo publicar.', highlightId: null, error: true })
    }
  }

  function renderResults() {
    if (error) {
      return (
        <Alert variant="error" title="No se pudieron cargar los avisos">
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
          <Spinner size="lg" label="Cargando avisos de remate..." />
        </div>
      )
    }
    if (data.rows.length === 0) {
      return (
        <EmptyState
          title={filters.query ? 'No hay avisos con ese radicado' : 'No hay avisos para mostrar'}
          description="Pruebe con otro periodo o con otros filtros."
        />
      )
    }
    // La tarjeta no recorta (overflow-visible): el menú de tres puntos de las últimas filas sobresale
    // hacia abajo. Por eso el encabezado de la tabla y el pie llevan sus propias esquinas redondeadas.
    return (
      <Card aria-busy={loading} className={cn('overflow-visible transition-opacity', loading && 'opacity-60')}>
        <AdminRematesTable
          rows={data.rows}
          caption={caption}
          highlightId={flash?.highlightId ?? null}
          onView={(notice) => setDialog({ kind: 'view', notice })}
          onEdit={(notice) => setDialog({ kind: 'form', notice, key: Date.now() })}
          onTogglePublished={(notice) => (notice.is_published ? setDialog({ kind: 'hide', notice }) : publish(notice))}
          onDelete={(notice) => setDialog({ kind: 'delete', notice })}
        />
        <div className="flex flex-col items-center justify-between gap-4 rounded-b-lg bg-surface-container-low px-4 py-4 sm:flex-row lg:px-6">
          <p className="text-sm text-on-surface-variant">
            Mostrando{' '}
            <span className="font-semibold text-on-surface">
              {first}–{last}
            </span>{' '}
            de <span className="font-semibold text-on-surface">{total}</span> {total === 1 ? 'aviso' : 'avisos'}
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="max-w-xl text-sm text-on-surface-variant">
          {forcedCourt
            ? `Avisos de remate del ${COURTS[forcedCourt].short}, publicados y ocultos.`
            : 'Avisos de remate de los dos juzgados, publicados y ocultos.'}{' '}
          Solo los publicados aparecen en el sitio público.
        </p>
        <div className="flex flex-wrap gap-2">
          {can('remates.carpetas') && (
            <ButtonLink to={`${REMATES_ADMIN_PATH}/carpetas`} variant="secondary">
              <Icon paths={icons.folder} className="size-4" />
              Carpetas
            </ButtonLink>
          )}
          {canCreate && (
            <Button onClick={() => setDialog({ kind: 'form', notice: null, key: Date.now() })} aria-haspopup="dialog">
              <Icon paths={icons.plus} className="size-4" />
              Crear aviso
            </Button>
          )}
        </div>
      </div>

      {flash && (
        <Alert variant={flash.error ? 'error' : 'success'} onClose={() => setFlash(null)}>
          {flash.message}
        </Alert>
      )}

      <AdminRematesFilters filters={filters} showCourt={!forcedCourt} onChange={updateFilters} />

      <section ref={resultsRef} aria-label={caption} className="scroll-mt-20 space-y-3">
        <p aria-live="polite" className="sr-only">
          {!loading && data ? `${total} ${total === 1 ? 'aviso encontrado' : 'avisos encontrados'}` : ''}
        </p>
        {renderResults()}
      </section>

      {dialog?.kind === 'form' && (
        <NoticeFormModal
          key={dialog.key}
          notice={dialog.notice}
          folders={folders}
          forcedCourt={forcedCourt}
          onClose={() => setDialog(null)}
          onSaved={(id, message) => done(message, id)}
        />
      )}

      {dialog?.kind === 'view' && <NoticeDetailModal notice={dialog.notice} onClose={() => setDialog(null)} />}

      {dialog?.kind === 'hide' && (
        <ConfirmDialog
          open
          title="¿Ocultar este aviso?"
          confirmLabel="Ocultar"
          icon={icons.eyeSlash}
          onClose={() => setDialog(null)}
          onConfirm={async () => {
            await updateNotice(dialog.notice.id, { is_published: false })
            done(`Aviso del radicado ${dialog.notice.case_number} oculto.`, dialog.notice.id)
          }}
        >
          <p>
            El aviso del radicado <strong className="text-on-surface tabular-nums">{dialog.notice.case_number}</strong>{' '}
            dejará de verse en el sitio público. Podrá publicarlo de nuevo cuando quiera.
          </p>
        </ConfirmDialog>
      )}

      {dialog?.kind === 'delete' && (
        <ConfirmDialog
          open
          title="¿Eliminar este aviso?"
          confirmLabel="Eliminar"
          tone="danger"
          onClose={() => setDialog(null)}
          onConfirm={async () => {
            await deleteNotice(dialog.notice.id)
            done(`Aviso del radicado ${dialog.notice.case_number} eliminado.`, null)
          }}
        >
          <p>
            Se eliminará el aviso del radicado{' '}
            <strong className="text-on-surface tabular-nums">{dialog.notice.case_number}</strong> del{' '}
            {COURTS[dialog.notice.court].short}, programado para el {formatDate(dialog.notice.scheduled_at)} a las{' '}
            {formatTime(dialog.notice.scheduled_at)}
            {dialog.notice.is_published && ', que hoy está publicado en el sitio'}.
          </p>
          <p className="font-semibold text-on-surface">Esta acción no se puede deshacer.</p>
        </ConfirmDialog>
      )}
    </div>
  )
}
