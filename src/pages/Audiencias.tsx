import { useEffect, useRef } from 'react'
import {
  AudienciasFilters,
  AudienciasIllustration,
  AudienciasTable,
  PAGE_SIZE,
  useAudiencias,
  useAudienciasFilters,
  useHearingTypeOptions,
} from '../components/audiencias'
import { Container, PageHeader } from '../components/layout'
import { COURTS } from '../components/remates'
import { Alert, Button, Card, EmptyState, Pagination, Spinner } from '../components/ui'
import { useDocumentMeta } from '../lib/useDocumentMeta'

// Audiencias públicas (docs/plan-audiencias.md, fase 2): solo lectura, desde 3 meses atrás, con
// enlaces de conexión y grabación; nunca las observaciones (list_public_hearings).
export default function Audiencias() {
  useDocumentMeta({ title: 'Audiencias' })
  const { filters, updateFilters } = useAudienciasFilters()
  const { data, loading, error, retry } = useAudiencias(filters)
  const types = useHearingTypeOptions()
  const resultsRef = useRef<HTMLElement>(null)

  // Enlace a una página que ya no existe: ir a la primera.
  const outOfRange = !loading && data?.outOfRange
  useEffect(() => {
    if (outOfRange) updateFilters({ page: 1 }, { replace: true })
  }, [outOfRange, updateFilters])

  const periodLabel = filters.period === 'proximas' ? 'Próximas audiencias' : 'Audiencias anteriores'
  const caption = filters.court ? `${periodLabel} del ${COURTS[filters.court].short}` : periodLabel
  const total = data?.total ?? 0
  const pageCount = Math.ceil(total / PAGE_SIZE)
  const first = (filters.page - 1) * PAGE_SIZE + 1
  const last = Math.min(filters.page * PAGE_SIZE, total)

  function renderResults() {
    if (error)
      return (
        <Alert variant="error" title="No se pudieron cargar las audiencias">
          <p>Revise su conexión e intente de nuevo.</p>
          <Button variant="secondary" size="sm" onClick={retry} className="mt-3">
            Reintentar
          </Button>
        </Alert>
      )
    if (!data)
      return (
        <div className="flex justify-center py-16 text-primary">
          <Spinner size="lg" label="Cargando audiencias..." />
        </div>
      )
    if (data.rows.length === 0)
      return (
        <EmptyState
          title={filters.query ? 'No hay audiencias con ese radicado' : 'No hay audiencias para mostrar'}
          description={
            filters.period === 'proximas'
              ? 'No hay audiencias programadas con estos filtros. Revise también las anteriores.'
              : 'No hay audiencias de los últimos 3 meses con estos filtros.'
          }
        />
      )
    return (
      <Card aria-busy={loading} className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
        <AudienciasTable rows={data.rows} caption={caption} />
        <div className="flex flex-col items-center justify-between gap-4 bg-surface-container-low px-4 py-4 sm:flex-row lg:px-6">
          <p className="text-sm text-on-surface-variant">
            Mostrando{' '}
            <span className="font-semibold text-on-surface">
              {first}–{last}
            </span>{' '}
            de <span className="font-semibold text-on-surface">{total}</span> {total === 1 ? 'audiencia' : 'audiencias'}
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
    <Container className="space-y-8 py-12 sm:py-16">
      {/* Como Avisos de Remate: ilustración a la derecha en escritorio, debajo en tableta y oculta
          en celular para no alejar la tabla. */}
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <PageHeader
          title="Audiencias"
          description="Consulte las audiencias de los Juzgados Civiles del Circuito de Ejecución de Sentencias de Bucaramanga: fecha, hora, enlace de conexión y grabación."
          breadcrumb={[{ label: 'Inicio', to: '/' }, { label: 'Audiencias' }]}
          className="pb-0"
        />
        <AudienciasIllustration className="mx-auto hidden w-[90%] max-w-lg md:block lg:mx-0 lg:w-full lg:max-w-none" />
      </div>
      <AudienciasFilters filters={filters} types={types} onChange={updateFilters} className="pt-4 md:pt-8" />
      <section ref={resultsRef} aria-label={caption} className="scroll-mt-20 space-y-3">
        <p aria-live="polite" className="sr-only">
          {!loading && data ? `${total} ${total === 1 ? 'audiencia encontrada' : 'audiencias encontradas'}` : ''}
        </p>
        {renderResults()}
        <p className="text-xs text-on-surface-variant">
          Se muestran las audiencias de los últimos 3 meses y todas las programadas. Hora de Colombia.
        </p>
      </section>
    </Container>
  )
}
