import { useId, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { groupFaq, sectionSlug, SECTION_TITLE_MAX, type FaqSection } from '../../components/faq'
import { Alert, Button, EmptyState, Input, Modal, Spinner } from '../../components/ui'
import { cn } from '../../lib/cn'
import { useDocumentMeta } from '../../lib/useDocumentMeta'
import { ActionMenu, ConfirmDialog, Icon, icons } from '../ui'
import { createSection, deleteSection, moveSection, renameSection } from './api'
import { FAQ_ADMIN_PATH } from './data'
import { sectionSchema } from './schema'
import { useFaqAdmin } from './useFaqAdmin'

type Dialog = { kind: 'form'; section: FaqSection | null } | { kind: 'delete'; section: FaqSection } | null

type Flash = { variant: 'success' | 'error'; message: string; highlightId: number | null }

function SectionFormModal({
  section,
  takenSlugs,
  onClose,
  onSaved,
}: {
  section: FaqSection | null
  takenSlugs: string[]
  onClose: () => void
  onSaved: (id: number, message: string) => void
}) {
  const formId = useId()
  const [title, setTitle] = useState(section?.title ?? '')
  const [error, setError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const result = sectionSchema.safeParse({ title })
    if (!result.success) return setError(result.error.issues[0]?.message ?? 'Revise el nombre.')
    const name = result.data.title
    setSaving(true)
    setServerError(null)
    try {
      if (section) {
        await renameSection(section.id, name)
        onSaved(section.id, `Sección "${name}" renombrada.`)
      } else {
        const id = await createSection({ title: name, slug: sectionSlug(name, takenSlugs) })
        onSaved(id, `Sección "${name}" creada.`)
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'No se pudo guardar la sección.')
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={saving ? () => {} : onClose}
      title={section ? 'Renombrar sección' : 'Crear sección'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} loading={saving}>
            {section ? 'Guardar cambios' : 'Crear sección'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          label="Nombre"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            setError(null)
          }}
          maxLength={SECTION_TITLE_MAX}
          error={error ?? undefined}
          hint={
            section
              ? 'El enlace directo a la sección no cambia al renombrarla.'
              : 'Queda al final; puede cambiar el orden después.'
          }
        />
        {serverError && <Alert variant="error">{serverError}</Alert>}
      </form>
    </Modal>
  )
}

// Secciones de las preguntas frecuentes (/dashboard/preguntas-frecuentes/secciones,
// preguntas.gestionar). Su orden es el de la página pública.
export default function SectionsPage() {
  useDocumentMeta({ title: 'Secciones de preguntas frecuentes · Dashboard', noindex: true })
  const { data, error, reload } = useFaqAdmin()
  const [dialog, setDialog] = useState<Dialog>(null)
  const [flash, setFlash] = useState<Flash | null>(null)
  const [moving, setMoving] = useState<number | null>(null)

  const groups = data ? groupFaq(data.sections, data.questions, { keepEmpty: true }) : []

  const done = (message: string, highlightId: number | null) => {
    setDialog(null)
    setFlash({ variant: 'success', message, highlightId })
    reload()
  }

  async function move(section: FaqSection, up: boolean) {
    setMoving(section.id)
    try {
      await moveSection(section.id, up)
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

  return (
    <div className="max-w-4xl space-y-6">
      <div className="space-y-3">
        <Link to={FAQ_ADMIN_PATH} className="inline-flex text-sm font-medium text-primary hover:underline">
          ← Volver a Preguntas frecuentes
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold">Secciones</h2>
            <p className="max-w-xl text-sm text-on-surface-variant">
              Agrupan las preguntas en la página pública, en este orden. Una sección sin preguntas publicadas no se
              muestra.
            </p>
          </div>
          <Button onClick={() => setDialog({ kind: 'form', section: null })} disabled={!data}>
            <Icon paths={icons.plus} className="size-4" />
            Crear sección
          </Button>
        </div>
      </div>

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
      ) : groups.length === 0 ? (
        <EmptyState title="Todavía no hay secciones" description="Cree la primera, por ejemplo Títulos." />
      ) : (
        <ul className="space-y-2">
          {groups.map(({ section, questions }, index) => {
            const published = questions.filter((question) => question.is_published).length
            return (
              <li
                key={section.id}
                className={cn(
                  'flex items-start justify-between gap-3 rounded-lg bg-surface-container-low py-3 pr-2 pl-4',
                  flash?.highlightId === section.id && 'bg-primary-container/50',
                  moving === section.id && 'opacity-60',
                )}
              >
                <div className="min-w-0 space-y-1">
                  <p className="font-semibold text-on-surface">{section.title}</p>
                  <p className="text-sm text-on-surface-variant">
                    {questions.length === 0
                      ? 'Sin preguntas'
                      : `${questions.length} ${questions.length === 1 ? 'pregunta' : 'preguntas'}, ${published} ${
                          published === 1 ? 'publicada' : 'publicadas'
                        }`}
                  </p>
                </div>
                <ActionMenu
                  className="shrink-0"
                  label={`Opciones de la sección ${section.title}`}
                  items={[
                    {
                      label: 'Renombrar',
                      icon: icons.pencil,
                      onSelect: () => setDialog({ kind: 'form', section }),
                    },
                    {
                      label: 'Subir',
                      icon: icons.arrowUp,
                      onSelect: () => move(section, true),
                      disabledReason: index === 0 ? 'Ya es la primera' : undefined,
                    },
                    {
                      label: 'Bajar',
                      icon: icons.arrowDown,
                      onSelect: () => move(section, false),
                      disabledReason: index === groups.length - 1 ? 'Ya es la última' : undefined,
                    },
                    {
                      label: 'Eliminar',
                      icon: icons.trash,
                      danger: true,
                      onSelect: () => setDialog({ kind: 'delete', section }),
                      disabledReason: questions.length ? 'Tiene preguntas: muévalas o elimínelas primero' : undefined,
                    },
                  ]}
                />
              </li>
            )
          })}
        </ul>
      )}

      {dialog?.kind === 'form' && data && (
        <SectionFormModal
          section={dialog.section}
          takenSlugs={data.sections.map((section) => section.slug)}
          onClose={() => setDialog(null)}
          onSaved={(id, message) => done(message, id)}
        />
      )}
      {dialog?.kind === 'delete' && (
        <ConfirmDialog
          open
          title="¿Eliminar esta sección?"
          confirmLabel="Eliminar"
          tone="danger"
          onClose={() => setDialog(null)}
          onConfirm={async () => {
            await deleteSection(dialog.section.id)
            done(`Sección "${dialog.section.title}" eliminada.`, null)
          }}
        >
          <p>
            Se eliminará <strong className="text-on-surface">{dialog.section.title}</strong>. No tiene preguntas.
          </p>
        </ConfirmDialog>
      )}
    </div>
  )
}
