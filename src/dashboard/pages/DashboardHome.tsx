import { useEffect, useState } from 'react'
import { Badge, EmptyState } from '../../components/ui'
import { useDocumentMeta } from '../../lib/useDocumentMeta'
import { useAccess } from '../access'
import { fetchHearingsSummary } from '../audiencias/api'
import { fetchSurveySummary, type SurveySummary } from '../encuestas/api'
import { dashboardLinks } from '../navigation'
import { fetchPqrsSummary } from '../pqrs/api'
import type { PqrsSummary } from '../pqrs/types'
import { useProfile } from '../profile'
import DashboardSectionCard from './DashboardSectionCard'

const sections = dashboardLinks.filter((link) => !link.end && link.group !== 'account')

// Inicio del dashboard: saludo y un acceso por cada sección que el rol del usuario permite ver.
export default function DashboardHome() {
  useDocumentMeta({ title: 'Dashboard', noindex: true })
  const { displayName, loading } = useProfile()
  const { can } = useAccess()
  const visible = sections.filter((link) => can(link.permission))
  const canSeePqrs = can('pqrs.ver')
  const [pqrs, setPqrs] = useState<PqrsSummary | null>(null)
  const canSeeSurveys = can('encuestas.ver')
  const canSeeHearings = can('audiencias.ver')
  const [hearings, setHearings] = useState<{ today: number; pendingClose: number } | null>(null)
  const [survey, setSurvey] = useState<SurveySummary | null>(null)

  // Resumen de PQRS para su tarjeta (pendientes y vencidas).
  useEffect(() => {
    if (!canSeePqrs) return
    let active = true
    fetchPqrsSummary()
      .then((summary) => {
        if (active) setPqrs(summary)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [canSeePqrs])

  // Respuestas del año en curso de la encuesta activa, para su tarjeta.
  useEffect(() => {
    if (!canSeeSurveys) return
    let active = true
    fetchSurveySummary()
      .then((summary) => {
        if (active) setSurvey(summary)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [canSeeSurveys])

  // Audiencias de hoy y por cerrar, para su tarjeta (según el alcance del usuario).
  useEffect(() => {
    if (!canSeeHearings) return
    let active = true
    fetchHearingsSummary()
      .then((summary) => {
        if (active) setHearings(summary)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [canSeeHearings])

  const extraFor = (to: string) =>
    to.endsWith('/audiencias') && hearings ? (
      <span className="flex flex-wrap gap-2">
        <Badge variant={hearings.today > 0 ? 'primary' : 'neutral'}>{hearings.today} hoy</Badge>
        {hearings.pendingClose > 0 && <Badge variant="warning">{hearings.pendingClose} por cerrar</Badge>}
      </span>
    ) : to.endsWith('/encuestas') && survey ? (
      <Badge variant={survey.responses > 0 ? 'primary' : 'neutral'} className="self-start">
        {survey.responses.toLocaleString('es-CO')} {survey.responses === 1 ? 'respuesta' : 'respuestas'} en{' '}
        {survey.year}
      </Badge>
    ) : to.endsWith('/pqrs') && pqrs ? (
      <span className="flex flex-wrap gap-2">
        <Badge variant={pqrs.pending > 0 ? 'primary' : 'neutral'}>
          {pqrs.pending} {pqrs.pending === 1 ? 'pendiente' : 'pendientes'}
        </Badge>
        {pqrs.overdue > 0 && (
          <Badge variant="danger">
            {pqrs.overdue} {pqrs.overdue === 1 ? 'vencida' : 'vencidas'}
          </Badge>
        )}
      </span>
    ) : undefined

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-extrabold sm:text-3xl">{loading ? 'Hola' : `Hola, ${displayName}`}</h2>
        <p className="text-sm text-on-surface-variant sm:text-base">Elija una sección para empezar.</p>
      </div>
      {visible.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
          {visible.map((link) => (
            <li key={link.to}>
              <DashboardSectionCard link={link} extra={extraFor(link.to)} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Todavía no tiene secciones asignadas"
          description="Las verá aquí cuando un administrador le dé permisos."
        />
      )}
    </div>
  )
}
