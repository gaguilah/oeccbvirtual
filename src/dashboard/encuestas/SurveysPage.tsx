import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Alert, Badge, ButtonLink, EmptyState, Spinner } from '../../components/ui'
import { cn } from '../../lib/cn'
import { useDocumentMeta } from '../../lib/useDocumentMeta'
import { useAccess } from '../access'
import { ActionMenu, ConfirmDialog, Icon, icons, type ActionMenuItem } from '../ui'
import { deleteSurvey, fetchSurvey, saveSurvey, setSurveyActive } from './api'
import { formatDate, plural, SURVEYS_PATH, surveyPath, uniqueCode } from './data'
import type { SurveyRow, SurveysFlash } from './types'
import { useSurveys } from './useSurveyData'

type Dialog = { kind: 'activate' | 'deactivate' | 'duplicate' | 'delete'; survey: SurveyRow }

const copyIcon = [
  'M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75',
]
const chartIcon = [
  'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z',
]
const listIcon = [
  'M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z',
]

// Encuestas (/dashboard/encuestas, docs/plan-encuestas-dashboard.md). Ver: encuestas.ver; crear,
// editar, duplicar, activar y eliminar: encuestas.gestionar (lo vuelven a exigir las políticas).
export default function SurveysPage() {
  useDocumentMeta({ title: 'Encuestas · Dashboard', noindex: true })
  const location = useLocation()
  const navigate = useNavigate()
  const canManage = useAccess().can('encuestas.gestionar')
  const { surveys, loading, error, reload } = useSurveys()
  const [flash, setFlash] = useState<SurveysFlash | null>(
    () => (location.state as { flash?: SurveysFlash } | null)?.flash ?? null,
  )
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const activeSurvey = surveys.find((survey) => survey.is_active)

  // El aviso llega una vez por location.state: se quita del historial para que no vuelva al recargar.
  useEffect(() => {
    if (location.state) navigate(location.pathname, { replace: true, state: null })
  }, [location.state, location.pathname, navigate])

  const done = (message: string, highlightId = '') => {
    setDialog(null)
    setFlash({ message, highlightId })
    reload()
  }

  async function duplicate(survey: SurveyRow) {
    const detail = await fetchSurvey(survey.id)
    if (!detail) throw new Error('La encuesta ya no existe.')
    const title = `Copia de ${survey.title}`.slice(0, 120)
    const code = uniqueCode(
      `${survey.code}-copia`.slice(0, 60),
      surveys.map((s) => s.code),
    )
    const id = await saveSurvey(
      null,
      code,
      title,
      detail.questions.map((q, i) => ({
        key: `copy-${i}`,
        code: q.code,
        text: q.text,
        help_text: q.help_text ?? '',
        type: q.type === 'scale' ? 'scale' : 'yes_no',
        scale_min: q.scale_min ?? 1,
        scale_max: q.scale_max ?? 5,
        min_label: q.min_label ?? '',
        max_label: q.max_label ?? '',
        is_required: q.is_required,
      })),
    )
    done(`Encuesta "${title}" creada como copia (inactiva).`, id)
  }

  function itemsFor(survey: SurveyRow): ActionMenuItem[] {
    const items: ActionMenuItem[] = [
      { label: 'Ver resultados', icon: chartIcon, onSelect: () => navigate(surveyPath(survey.id)) },
      { label: 'Ver preguntas', icon: listIcon, onSelect: () => navigate(`${surveyPath(survey.id)}/preguntas`) },
    ]
    if (!canManage) return items
    return [
      ...items,
      { label: 'Editar', icon: icons.pencil, onSelect: () => navigate(`${surveyPath(survey.id)}/editar`) },
      survey.is_active
        ? { label: 'Desactivar', icon: icons.eyeSlash, onSelect: () => setDialog({ kind: 'deactivate', survey }) }
        : {
            label: 'Activar',
            icon: icons.eye,
            disabledReason: survey.question_count === 0 ? 'Agregue al menos una pregunta' : undefined,
            onSelect: () => setDialog({ kind: 'activate', survey }),
          },
      { label: 'Duplicar', icon: copyIcon, onSelect: () => setDialog({ kind: 'duplicate', survey }) },
      {
        label: 'Eliminar',
        icon: icons.trash,
        danger: true,
        disabledReason:
          survey.response_count > 0
            ? 'Tiene respuestas; desactívela en su lugar'
            : survey.is_active
              ? 'Está activa: desactívela primero'
              : undefined,
        onSelect: () => setDialog({ kind: 'delete', survey }),
      },
    ]
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="max-w-xl text-sm text-on-surface-variant">
          La encuesta activa es la que responden los ciudadanos en el sitio público. Solo puede haber una activa a la
          vez. Los resultados muestran solo totales, nunca respuestas individuales.
        </p>
        {canManage && (
          <ButtonLink to={`${SURVEYS_PATH}/nueva`}>
            <Icon paths={icons.plus} className="size-4" />
            Crear encuesta
          </ButtonLink>
        )}
      </div>

      {flash && (
        <Alert variant="success" onClose={() => setFlash(null)}>
          {flash.message}
        </Alert>
      )}
      {error && <Alert variant="error">{error}</Alert>}

      {loading ? (
        <div className="flex justify-center py-12 text-primary">
          <Spinner />
        </div>
      ) : surveys.length === 0 ? (
        <EmptyState title="Todavía no hay encuestas" />
      ) : (
        <ul className="grid gap-4">
          {surveys.map((survey) => (
            <li
              key={survey.id}
              className={cn(
                'flex flex-col gap-3 rounded-lg bg-surface-container-low p-5 sm:p-6',
                flash?.highlightId === survey.id && 'bg-primary-container/50',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <h2 className="text-lg font-bold">{survey.title}</h2>
                  <code className="block font-mono text-xs text-on-surface-variant">{survey.code}</code>
                </div>
                <ActionMenu
                  label={`Opciones de la encuesta ${survey.title}`}
                  className="-mt-1 -mr-2 shrink-0"
                  items={itemsFor(survey)}
                />
              </div>
              <p className="text-sm text-on-surface">
                {plural(survey.question_count, 'pregunta', 'preguntas')} ·{' '}
                {plural(survey.response_count, 'respuesta', 'respuestas')} · creada el {formatDate(survey.created_at)}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant={survey.is_active ? 'success' : 'neutral'}>
                  {survey.is_active ? 'Activa' : 'Inactiva'}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      )}

      {dialog?.kind === 'activate' && (
        <ConfirmDialog
          open
          title="¿Activar esta encuesta?"
          confirmLabel="Activar"
          icon={icons.eye}
          onClose={() => setDialog(null)}
          onConfirm={async () => {
            await setSurveyActive(dialog.survey.id, true)
            done(`Encuesta "${dialog.survey.title}" activada.`, dialog.survey.id)
          }}
        >
          <p>
            <strong className="text-on-surface">{dialog.survey.title}</strong> será la encuesta del sitio público.
            {activeSurvey && activeSurvey.id !== dialog.survey.id && (
              <>
                {' '}
                Reemplazará a <strong className="text-on-surface">{activeSurvey.title}</strong>, que quedará inactiva.
              </>
            )}
          </p>
        </ConfirmDialog>
      )}
      {dialog?.kind === 'deactivate' && (
        <ConfirmDialog
          open
          title="¿Desactivar esta encuesta?"
          confirmLabel="Desactivar"
          icon={icons.eyeSlash}
          onClose={() => setDialog(null)}
          onConfirm={async () => {
            await setSurveyActive(dialog.survey.id, false)
            done(`Encuesta "${dialog.survey.title}" desactivada.`, dialog.survey.id)
          }}
        >
          <p>El sitio público dejará de mostrar una encuesta hasta que active otra. Sus resultados se conservan.</p>
        </ConfirmDialog>
      )}
      {dialog?.kind === 'duplicate' && (
        <ConfirmDialog
          open
          title="¿Duplicar esta encuesta?"
          confirmLabel="Duplicar"
          icon={copyIcon}
          onClose={() => setDialog(null)}
          onConfirm={() => duplicate(dialog.survey)}
        >
          <p>
            Se creará una copia inactiva de <strong className="text-on-surface">{dialog.survey.title}</strong> con las
            mismas preguntas y sin respuestas. Así puede cambiar sus preguntas sin alterar los resultados de la
            original.
          </p>
        </ConfirmDialog>
      )}
      {dialog?.kind === 'delete' && (
        <ConfirmDialog
          open
          title="¿Eliminar esta encuesta?"
          confirmLabel="Eliminar"
          tone="danger"
          onClose={() => setDialog(null)}
          onConfirm={async () => {
            await deleteSurvey(dialog.survey.id)
            done(`Encuesta "${dialog.survey.title}" eliminada.`)
          }}
        >
          <p>
            Se eliminará <strong className="text-on-surface">{dialog.survey.title}</strong> con sus preguntas. Esta
            acción no se puede deshacer.
          </p>
        </ConfirmDialog>
      )}
    </div>
  )
}
