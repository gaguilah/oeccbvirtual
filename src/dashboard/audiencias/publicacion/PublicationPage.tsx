import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { COURTS } from '../../../components/remates/constants'
import { Alert, Button, CopyButton, Select, Spinner, Textarea } from '../../../components/ui'
import { cn } from '../../../lib/cn'
import { useDocumentMeta } from '../../../lib/useDocumentMeta'
import { useAccess } from '../../access'
import { Icon } from '../../ui'
import { HEARINGS_PATH } from '../data'
import { addDays, dayOf, weekTitle } from '../dates'
import type { Court } from '../types'
import { useHearingTypes } from '../useHearingsData'
import {
  auctionTypeIds,
  defaultPublicationWeek,
  hearingTime,
  dayLabel,
  missingLinks,
  publicationDocument,
  publicationFileName,
  selectWeeklyAuctionHearings,
  weeklyPublicationHtml,
} from './data'
import { parsePublicationFilters, serializePublicationFilters, type PublicationFilters } from './filters'
import PublicationPreview from './PublicationPreview'
import { usePublicationHearings } from './usePublicationHearings'

const chevronLeft = ['M15.75 19.5 8.25 12l7.5-7.5']
const download = [
  'M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3',
]

function downloadFile(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/html;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

// Publicación semanal (/dashboard/audiencias/publicacion, docs/plan-audiencias-publicacion-semanal.md):
// el bloque HTML con las audiencias de remate de un juzgado en una semana, para pegarlo el viernes en
// el portal. Solo lee: no guarda nada.
export default function PublicationPage() {
  useDocumentMeta({ title: 'Publicación semanal · Dashboard', noindex: true })
  const { access } = useAccess()
  const forcedCourt = access?.scope === 'court' ? (access.court as Court) : null
  const [now] = useState(() => new Date())
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = parsePublicationFilters(searchParams, forcedCourt, now)
  const { court, monday } = filters
  const { types, error: typesError } = useHearingTypes()
  const typeIds = useMemo(() => (types ? auctionTypeIds(types) : null), [types])
  const { rows, error, loading, reload } = usePublicationHearings(court, monday, typeIds)

  const hearings = useMemo(
    () => (rows && typeIds ? selectWeeklyAuctionHearings(rows, typeIds, court, monday) : null),
    [rows, typeIds, court, monday],
  )
  const missing = hearings ? missingLinks(hearings) : []
  const deletedNotice = hearings?.filter((h) => h.auction_notice_deleted) ?? []
  const html = useMemo(
    () => (hearings ? weeklyPublicationHtml({ court, monday, now, hearings }) : ''),
    [hearings, court, monday, now],
  )
  const blocked = missing.length > 0

  const change = (changes: Partial<PublicationFilters>) =>
    setSearchParams(serializePublicationFilters({ ...filters, ...changes }, forcedCourt, now), { replace: true })

  const nextWeek = defaultPublicationWeek(now)
  const calendarLink = `${HEARINGS_PATH}?vista=semana&fecha=${monday}${forcedCourt ? '' : `&juzgado=${court}`}`

  function renderContent() {
    if (typesError || error)
      return (
        <Alert variant="error" title="No se pudieron cargar las audiencias">
          <p>{typesError ?? error}</p>
          <Button variant="secondary" size="sm" onClick={reload} className="mt-3">
            Reintentar
          </Button>
        </Alert>
      )
    if (typeIds && typeIds.length === 0)
      return (
        <Alert variant="error" title="No existe el tipo «Audiencia de Remate»">
          Pida al Administrador de Sistema que lo cree en Tipos de audiencia.
        </Alert>
      )
    if (!hearings)
      return (
        <div className="flex justify-center py-12 text-primary">
          <Spinner size="lg" label="Cargando audiencias..." />
        </div>
      )
    return (
      <div className={cn('space-y-6 transition-opacity', loading && 'opacity-60')} aria-busy={loading}>
        {blocked && (
          <Alert variant="error" title="Falta el enlace de conexión" live={false}>
            <p>
              Una audiencia no se publica sin enlace. Agréguelo en Audiencias y vuelva a esta página
              {missing.length === 1 ? ' (1 audiencia):' : ` (${missing.length} audiencias):`}
            </p>
            <ul className="mt-2 list-disc space-y-0.5 pl-5">
              {missing.map((h) => (
                <li key={h.id}>
                  {dayLabel(dayOf(h.scheduled_at))}, {hearingTime(h.scheduled_at)} · radicado{' '}
                  <span className="font-mono">{h.case_number}</span>
                </li>
              ))}
            </ul>
            <Link to={calendarLink} className="mt-3 inline-flex font-semibold underline underline-offset-3">
              Abrir esta semana en Audiencias
            </Link>
          </Alert>
        )}
        {deletedNotice.length > 0 && (
          <Alert variant="warning" title="Aviso de remate eliminado" live={false}>
            {deletedNotice.length === 1
              ? `La audiencia del radicado ${deletedNotice[0].case_number} quedó sin aviso: "Ver aviso" no lo encontrará.`
              : `${deletedNotice.length} audiencias quedaron sin aviso: "Ver aviso" no los encontrará.`}{' '}
            Revise si deben publicarse.
          </Alert>
        )}

        <div className="flex flex-wrap items-start gap-3">
          {blocked ? (
            <Button variant="secondary" size="sm" disabled>
              Copiar HTML
            </Button>
          ) : (
            <CopyButton value={html} label="Copiar HTML" />
          )}
          <Button
            variant="secondary"
            size="sm"
            disabled={blocked}
            onClick={() =>
              downloadFile(publicationFileName(court, monday), publicationDocument({ court, monday, now, hearings }))
            }
          >
            <Icon paths={download} className="size-4" />
            Descargar .html
          </Button>
          <p className="basis-full text-xs text-on-surface-variant">
            {blocked
              ? 'Disponible cuando todas las audiencias tengan enlace de conexión.'
              : `${hearings.length} ${hearings.length === 1 ? 'audiencia' : 'audiencias'} de remate. Pegue el código en la sección del portal que acepta código.`}
          </p>
        </div>

        <section aria-labelledby="preview-title" className="space-y-3">
          <h3 id="preview-title" className="text-base font-bold">
            Vista previa
          </h3>
          <PublicationPreview court={court} monday={monday} now={now} hearings={hearings} />
        </section>

        {!blocked && (
          <details className="rounded-lg bg-surface-container-low p-4">
            <summary className="cursor-pointer text-sm font-semibold">Ver código</summary>
            <Textarea
              label="Código de la publicación"
              value={html}
              readOnly
              rows={12}
              className="mt-3 font-mono text-xs"
              onFocus={(e) => e.currentTarget.select()}
            />
          </details>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link to={HEARINGS_PATH} className="inline-flex text-sm font-medium text-primary hover:underline">
          ← Volver a Audiencias
        </Link>
        <h2 className="text-2xl font-extrabold">Publicación semanal</h2>
        <p className="max-w-2xl text-sm text-on-surface-variant">
          Audiencias de remate programadas de un juzgado, de lunes a viernes, listas para pegar en el portal. Se publica
          el viernes para la semana siguiente y se vuelve a publicar si algo cambia.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        {!forcedCourt && (
          <Select
            label="Juzgado"
            value={String(court)}
            onChange={(e) => change({ court: Number(e.target.value) as Court })}
            options={[
              { value: '1', label: COURTS[1].short },
              { value: '2', label: COURTS[2].short },
            ]}
            className="min-w-40"
          />
        )}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => change({ monday: addDays(monday, -7) })}
              aria-label="Semana anterior"
            >
              <Icon paths={chevronLeft} className="size-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="min-h-10"
              onClick={() => change({ monday: nextWeek })}
              disabled={monday === nextWeek}
            >
              Próxima semana
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => change({ monday: addDays(monday, 7) })}
              aria-label="Semana siguiente"
            >
              <Icon paths={chevronLeft} className="size-4 rotate-180" />
            </Button>
          </div>
          <p className="text-base font-bold" aria-live="polite">
            {weekTitle(monday)}
          </p>
        </div>
      </div>

      {renderContent()}
    </div>
  )
}
