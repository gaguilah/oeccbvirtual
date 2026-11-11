import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FAQ_PATH, FaqAnswer, faqImageSrc, groupFaq, plainAnswer, questionAnchor } from '../../components/faq'
import { Alert, Badge, Button, ButtonAnchor, ButtonLink, EmptyState, Modal, Select, Spinner } from '../../components/ui'
import { cn } from '../../lib/cn'
import { useDocumentMeta } from '../../lib/useDocumentMeta'
import { useAccess } from '../access'
import { ActionMenu, ConfirmDialog, Icon, icons, type ActionMenuItem } from '../ui'
import { deleteQuestion, moveQuestion, removeFaqImages, updateQuestion } from './api'
import { FAQ_SECTIONS_PATH } from './data'
import QuestionFormModal from './QuestionFormModal'
import type { AdminFaqQuestion } from './types'
import { useFaqAdmin } from './useFaqAdmin'

type Dialog =
  | { kind: 'form'; question: AdminFaqQuestion | null }
  | { kind: 'preview' | 'publish' | 'delete'; question: AdminFaqQuestion }
  | null

type Flash = { variant: 'success' | 'error'; message: string; highlightId: number | null }

const SECTION_PARAM = 'seccion'

const dateFormat = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export function PublishedBadge({ published }: { published: boolean }) {
  return published ? <Badge variant="success">Publicada</Badge> : <Badge>Oculta</Badge>
}

// Preguntas frecuentes del sitio público (/dashboard/preguntas-frecuentes; preguntas.ver, y
// preguntas.gestionar para cambiarlas). Docs: docs/modulos/preguntas-frecuentes.md.
export default function FaqAdminPage() {
  useDocumentMeta({ title: 'Preguntas frecuentes · Dashboard', noindex: true })
  const { can } = useAccess()
  const canManage = can('preguntas.gestionar')
  const { data, error, reload } = useFaqAdmin()
  const [params, setParams] = useSearchParams()
  const [dialog, setDialog] = useState<Dialog>(null)
  const [flash, setFlash] = useState<Flash | null>(null)
  const [moving, setMoving] = useState<number | null>(null)

  const sectionFilter = Number(params.get(SECTION_PARAM)) || null
  const groups = data ? groupFaq(data.sections, data.questions, { keepEmpty: true }) : []
  const visible = sectionFilter ? groups.filter((group) => group.section.id === sectionFilter) : groups

  const done = (message: string, highlightId: number | null) => {
    setDialog(null)
    setFlash({ variant: 'success', message, highlightId })
    reload()
  }

  async function move(question: AdminFaqQuestion, up: boolean) {
    setMoving(question.id)
    try {
      await moveQuestion(question.id, up)
      setFlash(null)
      reload()
    } catch (err) {
      setFlash({
        variant: 'error',
        message: err instanceof Error ? err.message : 'No se pudo mover.',
        highlightId: null,
      })
    } finally {
      setMoving(null)
    }
  }

  function menuItems(question: AdminFaqQuestion, index: number, count: number): ActionMenuItem[] {
    const items: ActionMenuItem[] = [
      { label: 'Vista previa', icon: icons.eye, onSelect: () => setDialog({ kind: 'preview', question }) },
    ]
    if (!canManage) return items
    return [
      ...items,
      { label: 'Editar', icon: icons.pencil, onSelect: () => setDialog({ kind: 'form', question }) },
      {
        label: 'Subir',
        icon: icons.arrowUp,
        onSelect: () => move(question, true),
        disabledReason: index === 0 ? 'Ya es la primera de su sección' : undefined,
      },
      {
        label: 'Bajar',
        icon: icons.arrowDown,
        onSelect: () => move(question, false),
        disabledReason: index === count - 1 ? 'Ya es la última de su sección' : undefined,
      },
      {
        label: question.is_published ? 'Ocultar' : 'Publicar',
        icon: question.is_published ? icons.eyeSlash : icons.globe,
        onSelect: () => setDialog({ kind: 'publish', question }),
      },
      {
        label: 'Eliminar',
        icon: icons.trash,
        danger: true,
        onSelect: () => setDialog({ kind: 'delete', question }),
      },
    ]
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold">Preguntas frecuentes</h2>
          <p className="max-w-xl text-sm text-on-surface-variant">
            Preguntas y respuestas de la{' '}
            <a href={FAQ_PATH} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              página pública
              <span className="sr-only"> (se abre en una pestaña nueva)</span>
            </a>
            . Solo se muestran las publicadas.
          </p>
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <ButtonLink to={FAQ_SECTIONS_PATH} variant="secondary">
              <Icon paths={icons.folder} className="size-4" />
              Secciones
            </ButtonLink>
            <Button onClick={() => setDialog({ kind: 'form', question: null })} disabled={!data?.sections.length}>
              <Icon paths={icons.plus} className="size-4" />
              Crear pregunta
            </Button>
          </div>
        )}
      </div>

      {data && data.sections.length > 1 && (
        <div className="max-w-xs">
          <Select
            label="Sección"
            value={sectionFilter ? String(sectionFilter) : ''}
            onChange={(e) => {
              const next = new URLSearchParams(params)
              if (e.target.value) next.set(SECTION_PARAM, e.target.value)
              else next.delete(SECTION_PARAM)
              setParams(next, { replace: true })
            }}
            options={[
              { value: '', label: 'Todas' },
              ...data.sections.map((section) => ({ value: String(section.id), label: section.title })),
            ]}
          />
        </div>
      )}

      {flash && (
        <Alert variant={flash.variant} onClose={() => setFlash(null)}>
          {flash.message}
        </Alert>
      )}
      {error && <Alert variant="error">{error}</Alert>}

      {!data ? (
        !error && (
          <div className="flex justify-center py-12 text-primary">
            <Spinner />
          </div>
        )
      ) : data.sections.length === 0 ? (
        <EmptyState
          title="Todavía no hay secciones"
          description={
            canManage
              ? 'Cree primero una sección (por ejemplo, Títulos) y luego sus preguntas.'
              : 'Quien gestiona las preguntas frecuentes debe crear las secciones.'
          }
          action={
            canManage ? (
              <ButtonLink to={FAQ_SECTIONS_PATH} variant="secondary">
                Ir a Secciones
              </ButtonLink>
            ) : undefined
          }
        />
      ) : (
        visible.map(({ section, questions }) => (
          <section key={section.id} aria-labelledby={`seccion-${section.id}`} className="space-y-3">
            <h3 id={`seccion-${section.id}`} className="text-lg font-bold text-on-surface">
              {section.title}{' '}
              <span className="text-sm font-normal text-on-surface-variant">
                ({questions.length} {questions.length === 1 ? 'pregunta' : 'preguntas'})
              </span>
            </h3>
            {questions.length === 0 ? (
              <p className="rounded-lg bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
                Sin preguntas. Esta sección no se muestra en la página pública.
              </p>
            ) : (
              <ul className="space-y-2">
                {questions.map((question, index) => (
                  <li
                    key={question.id}
                    className={cn(
                      'flex items-start justify-between gap-3 rounded-lg bg-surface-container-low py-3 pr-2 pl-4',
                      flash?.highlightId === question.id && 'bg-primary-container/50',
                      moving === question.id && 'opacity-60',
                    )}
                  >
                    <div className="min-w-0 space-y-2">
                      <p className="font-semibold text-on-surface">{question.question}</p>
                      <p className="line-clamp-2 text-sm text-on-surface-variant">{plainAnswer(question.answer)}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <PublishedBadge published={question.is_published} />
                        {question.image_path && <Badge variant="primary">Con imagen</Badge>}
                        <span className="text-xs text-on-surface-variant">
                          Actualizada el {dateFormat.format(new Date(question.updated_at))}
                        </span>
                      </div>
                    </div>
                    <ActionMenu
                      className="shrink-0"
                      label={`Opciones de la pregunta ${question.question}`}
                      items={menuItems(question, index, questions.length)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))
      )}

      {dialog?.kind === 'form' && data && (
        <QuestionFormModal
          question={dialog.question}
          sections={data.sections}
          defaultSectionId={sectionFilter ?? undefined}
          onClose={() => setDialog(null)}
          onSaved={(id, message) => done(message, id)}
        />
      )}
      {dialog?.kind === 'preview' && (
        <Modal
          open
          onClose={() => setDialog(null)}
          title="Vista previa"
          className="max-w-2xl"
          footer={
            <>
              {dialog.question.is_published && (
                <ButtonAnchor href={`${FAQ_PATH}#${questionAnchor(dialog.question.id)}`} external variant="secondary">
                  Ver en el sitio
                  <span className="sr-only"> (se abre en una pestaña nueva)</span>
                </ButtonAnchor>
              )}
              <Button onClick={() => setDialog(null)}>Cerrar</Button>
            </>
          }
        >
          <div className="space-y-3">
            <PublishedBadge published={dialog.question.is_published} />
            <div className="rounded-lg bg-surface-container-low">
              <p className="px-4 pt-3 font-medium text-on-surface">{dialog.question.question}</p>
              <div className="space-y-4 px-4 pt-2 pb-4">
                <FaqAnswer text={dialog.question.answer} />
                {dialog.question.image_path && dialog.question.image_alt && (
                  <img
                    src={faqImageSrc(dialog.question.image_path)}
                    alt={dialog.question.image_alt}
                    className="h-auto max-h-96 w-full rounded-md bg-surface-container object-contain py-3"
                  />
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
      {dialog?.kind === 'publish' && (
        <ConfirmDialog
          open
          title={dialog.question.is_published ? '¿Ocultar esta pregunta?' : '¿Publicar esta pregunta?'}
          confirmLabel={dialog.question.is_published ? 'Ocultar' : 'Publicar'}
          icon={dialog.question.is_published ? icons.eyeSlash : icons.globe}
          onClose={() => setDialog(null)}
          onConfirm={async () => {
            await updateQuestion(dialog.question.id, { is_published: !dialog.question.is_published })
            done(
              dialog.question.is_published
                ? 'Pregunta oculta: ya no se ve en el sitio público.'
                : 'Pregunta publicada en el sitio público.',
              dialog.question.id,
            )
          }}
        >
          <p>
            {dialog.question.is_published
              ? 'Dejará de verse en la página pública. Puede volver a publicarla cuando quiera.'
              : 'Se verá en la página pública de inmediato. Revise antes los números de cuenta, convenios y correos.'}
          </p>
        </ConfirmDialog>
      )}
      {dialog?.kind === 'delete' && (
        <ConfirmDialog
          open
          title="¿Eliminar esta pregunta?"
          confirmLabel="Eliminar"
          tone="danger"
          onClose={() => setDialog(null)}
          onConfirm={async () => {
            await deleteQuestion(dialog.question.id)
            void removeFaqImages([dialog.question.image_path])
            done('Pregunta eliminada.', null)
          }}
        >
          <p>
            Se eliminará <strong className="text-on-surface">{dialog.question.question}</strong>. No se puede deshacer;
            si solo quiere quitarla del sitio, ocúltela.
          </p>
        </ConfirmDialog>
      )}
    </div>
  )
}
