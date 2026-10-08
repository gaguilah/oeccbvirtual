import { useState, type FormEvent } from 'react'
import { Alert, Button, Input, Modal, Select, Textarea } from '../../components/ui'
import { cn } from '../../lib/cn'
import { draftToQuestion, QUESTION_TYPES, SCALE_LIMITS } from './data'
import QuestionPreview from './QuestionPreview'
import { questionSchema, type QuestionField } from './schema'
import type { QuestionDraft, QuestionType } from './types'

type Props = {
  // Pregunta a editar, o una nueva (sin id ni code).
  initial: QuestionDraft
  isNew: boolean
  // La encuesta ya tiene respuestas: solo se corrigen textos.
  textsOnly: boolean
  onSave: (question: QuestionDraft) => void
  onClose: () => void
}

const scaleOptions = Array.from({ length: SCALE_LIMITS.max - SCALE_LIMITS.min + 1 }, (_, i) => {
  const value = String(SCALE_LIMITS.min + i)
  return { value, label: value }
})

// Crear o editar una pregunta: texto, ayuda, tipo, escala con sus etiquetas y si es obligatoria,
// con la vista previa tal como la verá el ciudadano.
export default function QuestionModal({ initial, isNew, textsOnly, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<QuestionDraft>(initial)
  const [errors, setErrors] = useState<Partial<Record<QuestionField, string>>>({})

  const update = (changes: Partial<QuestionDraft>) => {
    setDraft((current) => ({ ...current, ...changes }))
    setErrors((current) => {
      const next = { ...current }
      for (const key of Object.keys(changes)) delete next[key as QuestionField]
      return next
    })
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const result = questionSchema.safeParse(draft)
    if (!result.success) {
      const found: Partial<Record<QuestionField, string>> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as QuestionField
        found[field] ??= issue.message
      }
      setErrors(found)
      return
    }
    onSave({ ...draft, ...result.data })
  }

  const formId = `question-form-${draft.key}`

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? 'Agregar pregunta' : 'Editar pregunta'}
      className="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={formId}>
            {isNew ? 'Agregar' : 'Guardar'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-5">
        {textsOnly && (
          <Alert variant="info" live={false}>
            La encuesta ya tiene respuestas: puede corregir los textos, pero no el tipo, la escala ni si es obligatoria.
            Si el cambio altera el sentido de la pregunta, duplique la encuesta y edite la copia.
          </Alert>
        )}

        <Textarea
          label="Pregunta"
          value={draft.text}
          onChange={(e) => update({ text: e.target.value })}
          rows={2}
          maxLength={200}
          showCount
          error={errors.text}
        />
        <Input
          label="Ayuda (opcional)"
          value={draft.help_text}
          onChange={(e) => update({ help_text: e.target.value })}
          maxLength={300}
          hint="Texto corto debajo de la pregunta."
          error={errors.help_text}
        />

        <fieldset disabled={textsOnly} className="space-y-2">
          <legend className="mb-1 text-sm font-medium text-on-surface">Tipo</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(QUESTION_TYPES) as QuestionType[]).map((type) => (
              <label
                key={type}
                className={cn(
                  'flex gap-3 rounded-lg p-4 transition-colors',
                  draft.type === type ? 'bg-primary-container/50' : 'bg-surface-container-low',
                  !textsOnly && 'cursor-pointer hover:bg-primary-container/30',
                )}
              >
                <input
                  type="radio"
                  name="question-type"
                  value={type}
                  checked={draft.type === type}
                  onChange={() => update({ type })}
                  className="mt-0.5 size-4 accent-primary"
                />
                <span>
                  <span className="block text-sm font-semibold text-on-surface">{QUESTION_TYPES[type].label}</span>
                  <span className="block text-xs text-on-surface-variant">{QUESTION_TYPES[type].description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {draft.type === 'scale' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Valor mínimo"
              value={String(draft.scale_min)}
              onChange={(e) => update({ scale_min: Number(e.target.value) })}
              options={scaleOptions}
              disabled={textsOnly}
              error={errors.scale_min}
            />
            <Select
              label="Valor máximo"
              value={String(draft.scale_max)}
              onChange={(e) => update({ scale_max: Number(e.target.value) })}
              options={scaleOptions}
              disabled={textsOnly}
              error={errors.scale_max}
            />
            <Input
              label={`Etiqueta del ${draft.scale_min}`}
              value={draft.min_label}
              onChange={(e) => update({ min_label: e.target.value })}
              maxLength={40}
              placeholder="Ej.: Muy malo"
              error={errors.min_label}
            />
            <Input
              label={`Etiqueta del ${draft.scale_max}`}
              value={draft.max_label}
              onChange={(e) => update({ max_label: e.target.value })}
              maxLength={40}
              placeholder="Ej.: Excelente"
              error={errors.max_label}
            />
          </div>
        )}

        <label className={cn('flex items-center gap-3 text-sm', textsOnly ? 'opacity-60' : 'cursor-pointer')}>
          <input
            type="checkbox"
            checked={draft.is_required}
            onChange={(e) => update({ is_required: e.target.checked })}
            disabled={textsOnly}
            className="size-4 accent-primary"
          />
          Obligatoria (el ciudadano debe responderla)
        </label>

        <section aria-label="Vista previa" className="space-y-2 rounded-lg bg-surface-container-low p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Vista previa</p>
          {/* key: la vista previa se reinicia al cambiar de tipo o de escala. */}
          <QuestionPreview
            key={`${draft.type}-${draft.scale_min}-${draft.scale_max}`}
            question={draftToQuestion(draft, 1)}
          />
        </section>
      </form>
    </Modal>
  )
}
