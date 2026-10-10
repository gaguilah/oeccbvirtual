import { useEffect, useRef, useState } from 'react'
import { Container, PageHeader } from '../components/layout'
import {
  COURTS,
  PAGE_SIZE,
  RemateDetailModal,
  RematesFilters,
  RematesIllustration,
  RematesTable,
  stickyFilters,
  useAuctionNotices,
  useRematesFilters,
  type NoticeSelection,
} from '../components/remates'
import { Alert, Button, Card, EmptyState, Pagination, Spinner } from '../components/ui'
import { useDocumentMeta } from '../lib/useDocumentMeta'

export default function Remates() {
  useDocumentMeta({ title: 'Avisos de Remate' })
  const { filters, updateFilters } = useRematesFilters()
  const { data, now, loading, error, retry } = useAuctionNotices(filters)
  const resultsRef = useRef<HTMLElement>(null)
  const [selection, setSelection] = useState<NoticeSelection | null>(null)

  // Enlace a una página que ya no existe (p. ej. ?pagina=9 con menos avisos): ir a la primera.
  const outOfRange = !loading && data?.outOfRange
  useEffect(() => {
    if (outOfRange) updateFilters({ page: 1 }, { replace: true })
  }, [outOfRange, updateFilters])

  function handlePageChange(page: number) {
    updateFilters({ page })
    resultsRef.current?.scrollIntoView({ block: 'start' })
  }

  const periodLabel = filters.period === 'proximos' ? 'Próximos remates' : 'Remates pasados'
  const caption = filters.court ? `${periodLabel} del ${COURTS[filters.court].short}` : periodLabel
  const total = data?.total ?? 0
  const pageCount = Math.ceil(total / PAGE_SIZE)
  const first = (filters.page - 1) * PAGE_SIZE + 1
  const last = Math.min(filters.page * PAGE_SIZE, total)

  function renderResults() {
    if (error) {
      return (
        <Alert variant="error" title="No se pudieron cargar los avisos">
          <p>Revise su conexión e intente de nuevo.</p>
          <Button variant="secondary" size="sm" onClick={retry} className="mt-3">
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
          description={
            filters.query
              ? 'Revise el número o pruebe en la otra pestaña o con otro juzgado.'
              : filters.period === 'proximos'
                ? 'No hay remates programados por ahora.'
                : 'No hay remates realizados con estos filtros.'
          }
        />
      )
    }

    return (
      <Card aria-busy={loading} className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
        <RematesTable
          rows={data.rows}
          now={now}
          caption={caption}
          onSelect={(id) => setSelection({ id, openedAt: Date.now() })}
        />
        <div className="flex flex-col items-center justify-between gap-4 bg-surface-container-low px-4 py-4 sm:flex-row lg:px-6">
          <p className="text-sm text-on-surface-variant">
            Mostrando{' '}
            <span className="font-semibold text-on-surface">
              {first}–{last}
            </span>{' '}
            de <span className="font-semibold text-on-surface">{total}</span> {total === 1 ? 'aviso' : 'avisos'}
          </p>
          <Pagination page={filters.page} pageCount={pageCount} onPageChange={handlePageChange} />
        </div>
      </Card>
    )
  }

  return (
    <Container className="space-y-8 py-12 sm:py-16">
      {/* Encabezado: título a la izquierda e ilustración a la derecha (escritorio); en tableta la
          ilustración va debajo y en celular se oculta para no alejar la tabla. */}
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <PageHeader
          title="Avisos de Remate"
          description="Consulta los avisos de remate publicados por los Juzgados Civiles del Circuito de Ejecución de Sentencias de Bucaramanga."
          breadcrumb={[{ label: 'Inicio', to: '/' }, { label: 'Avisos de Remate' }]}
          className="pb-0"
        />
        <RematesIllustration className="mx-auto hidden w-[90%] max-w-lg md:block lg:mx-0 lg:w-full lg:max-w-none" />
      </div>
      {/* Filtros y resultados juntos: la fila de filtros queda fija (desde tableta) solo mientras
          se ve la tabla. */}
      <div className="space-y-8 pt-4 md:pt-8">
        <RematesFilters filters={filters} onChange={updateFilters} className={stickyFilters} />
        <section
          ref={resultsRef}
          aria-label={caption}
          className="scroll-mt-20 space-y-3 md:scroll-mt-60 lg:scroll-mt-40"
        >
          {/* Anuncia el total a lectores de pantalla cuando cambian los filtros. */}
          <p aria-live="polite" className="sr-only">
            {!loading && data ? `${total} ${total === 1 ? 'aviso encontrado' : 'avisos encontrados'}` : ''}
          </p>
          {renderResults()}
        </section>
      </div>
      <RemateDetailModal selection={selection} onClose={() => setSelection(null)} />
    </Container>
  )
}
