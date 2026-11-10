import { useId, useState, type FormEvent } from 'react'
import { ANSWER_MAX, FaqAnswer, QUESTION_MAX, type FaqSection } from '../../components/faq'
import { Alert, Button, Input, Modal, Select, Textarea } from '../../components/ui'
import { createQuestion, updateQuestion } from './api'
import { normalizeAnswer, questionSchema, type QuestionField } from './schema'
import type { AdminFaqQuestion } from './types'

type QuestionFormModalProps = {
  // null: crear.
  question: AdminFaqQuestion | null
  sections: FaqSection[]
  // Sección elegida al crear (el filtro de la página).
  defaultSectionId?: number
  onClose: () => void
  onSaved: (id: number, message: string) => void
}

// Crear o editar una pregunta, con la vista previa igual a la del sitio público. Crear la deja
// oculta: se publica desde el menú de la pregunta.
export default function QuestionFormModal({
  question,
  sections,
  defaultSectionId,
  onClose,
  onSaved,
}: QuestionFormModalProps) {
  const formId = useId()
  const [sectionId, setSectionId] = useState(String(question?.section_id ?? defaultSectionId ?? ''))
  const [text, setText] = useState(question?.question ?? '')
  const [answer, setAnswer] = useState(question?.answer ?? '')
  const [errors, setErrors] = useState<Partial<Record<QuestionField, string>>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const clear = (field: QuestionField) => setErrors((current) => ({ ...current, [field]: undefined }))

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const result = questionSchema.safeParse({ sectionId, question: text, answer })
    if (!result.success) {
      const next: Partial<Record<QuestionField, string>> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as QuestionField
        next[field] ??= issue.message
      }
      setErrors(next)
      return
    }
    const input = { section_id: result.data.sectionId, question: result.data.question, answer: result.data.answer }
    setSaving(true)
    setServerError(null)
    try {
      if (question) {
        await updateQuestion(question.id, input)
        onSaved(question.id, 'Pregunta actualizada.')
      } else {
        const id = await createQuestion(input)
        onSaved(id, 'Pregunta creada. Está oculta: publíquela desde su menú cuando esté lista.')
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'No se pudo guardar la pregunta.')
      setSaving(false)
    }
  }

  const preview = normalizeAnswer(answer)

  return (
    <Modal
      open
      onClose={saving ? () => {} : onClose}
      title={question ? 'Editar pregunta' : 'Crear pregunta'}
      className="max-w-3xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} loading={saving}>
            {question ? 'Guardar cambios' : 'Crear pregunta'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-4">
        <Select
          label="Sección"
          value={sectionId}
          onChange={(e) => {
            setSectionId(e.target.value)
            clear('sectionId')
          }}
          placeholder="Elija la sección"
          options={sections.map((section) => ({ value: String(section.id), label: section.title }))}
          error={errors.sectionId}
          hint={question ? 'Si cambia la sección, la pregunta queda al final de la nueva.' : undefined}
        />
        <Input
          label="Pregunta"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            clear('question')
          }}
          maxLength={QUESTION_MAX}
          error={errors.question}
        />
        <Textarea
          label="Respuesta"
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value)
            clear('answer')
          }}
          rows={8}
          maxLength={ANSWER_MAX}
          showCount
          error={errors.answer}
          hint='Negrita: **texto**. Lista: cada elemento en su línea, empezando con "- ". Párrafo nuevo: deje una línea en blanco.'
        />
        <Alert variant="warning" live={false}>
          Revise con cuidado números de cuenta, convenios y correos: se publican tal cual.
        </Alert>

        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-widest text-on-surface-variant uppercase">Vista previa</p>
          <div className="rounded-lg bg-surface-container-low">
            <p className="px-4 pt-3 font-medium text-on-surface">{text.trim() || 'Pregunta'}</p>
            {preview ? (
              <FaqAnswer text={preview} className="px-4 pt-2 pb-4" />
            ) : (
              <p className="px-4 pt-2 pb-4 text-sm text-on-surface-variant">La respuesta aparecerá aquí.</p>
            )}
          </div>
        </div>

        {serverError && <Alert variant="error">{serverError}</Alert>}
      </form>
    </Modal>
  )
}
