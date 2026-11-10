import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import {
  ANSWER_MAX,
  FaqAnswer,
  faqImageSrc,
  FAQ_IMAGE_TYPES,
  IMAGE_ALT_MAX,
  imageFileProblem,
  QUESTION_MAX,
  type FaqSection,
} from '../../components/faq'
import { Alert, Button, Input, Modal, Select, Textarea } from '../../components/ui'
import { createQuestion, removeFaqImages, updateQuestion, uploadFaqImage } from './api'
import { imageAltSchema, normalizeAnswer, questionSchema, type QuestionField } from './schema'
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

// Imagen de apoyo en el formulario: ninguna, la que ya tiene la pregunta o un archivo nuevo elegido
// (se sube al guardar).
type ImageState = { kind: 'none' } | { kind: 'current'; path: string } | { kind: 'new'; file: File; url: string }

const ACCEPT = Object.keys(FAQ_IMAGE_TYPES).join(',')

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
  const fileRef = useRef<HTMLInputElement>(null)
  const [sectionId, setSectionId] = useState(String(question?.section_id ?? defaultSectionId ?? ''))
  const [text, setText] = useState(question?.question ?? '')
  const [answer, setAnswer] = useState(question?.answer ?? '')
  const [image, setImage] = useState<ImageState>(
    question?.image_path ? { kind: 'current', path: question.image_path } : { kind: 'none' },
  )
  const [imageAlt, setImageAlt] = useState(question?.image_alt ?? '')
  const [errors, setErrors] = useState<Partial<Record<QuestionField, string>>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Libera la URL temporal del archivo elegido al cambiarlo o al cerrar.
  useEffect(() => {
    if (image.kind !== 'new') return
    return () => URL.revokeObjectURL(image.url)
  }, [image])

  const clear = (field: QuestionField) => setErrors((current) => ({ ...current, [field]: undefined }))

  function chooseFile(file: File | undefined) {
    if (!file) return
    const problem = imageFileProblem(file)
    if (problem) {
      setErrors((current) => ({ ...current, image: problem }))
      return
    }
    clear('image')
    setImage({ kind: 'new', file, url: URL.createObjectURL(file) })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const result = questionSchema.safeParse({ sectionId, question: text, answer })
    const alt = image.kind === 'none' ? null : imageAltSchema.safeParse(imageAlt)
    if (!result.success || (alt && !alt.success)) {
      const next: Partial<Record<QuestionField, string>> = {}
      for (const issue of result.error?.issues ?? []) {
        const field = issue.path[0] as QuestionField
        next[field] ??= issue.message
      }
      if (alt && !alt.success) next.imageAlt = alt.error.issues[0]?.message
      setErrors(next)
      return
    }

    setSaving(true)
    setServerError(null)
    let uploaded: string | null = null
    try {
      if (image.kind === 'new') uploaded = await uploadFaqImage(image.file)
      const imagePath = uploaded ?? (image.kind === 'current' ? image.path : null)
      const input = {
        section_id: result.data.sectionId,
        question: result.data.question,
        answer: result.data.answer,
        image_path: imagePath,
        image_alt: alt?.success ? alt.data : null,
      }
      if (question) {
        await updateQuestion(question.id, input)
        // La imagen anterior ya no la usa nadie.
        if (question.image_path && question.image_path !== imagePath) void removeFaqImages([question.image_path])
        onSaved(question.id, 'Pregunta actualizada.')
      } else {
        const id = await createQuestion(input)
        onSaved(id, 'Pregunta creada. Está oculta: publíquela desde su menú cuando esté lista.')
      }
    } catch (err) {
      // La pregunta no se guardó: el archivo recién subido sobra.
      if (uploaded) void removeFaqImages([uploaded])
      setServerError(err instanceof Error ? err.message : 'No se pudo guardar la pregunta.')
      setSaving(false)
    }
  }

  const preview = normalizeAnswer(answer)
  const imageSrc = image.kind === 'new' ? image.url : image.kind === 'current' ? faqImageSrc(image.path) : null

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

        <fieldset className="space-y-3 rounded-lg bg-surface-container-low p-4">
          <legend className="sr-only">Imagen de apoyo</legend>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-on-surface">Imagen de apoyo (opcional)</p>
              <p className="text-xs text-on-surface-variant">
                PNG, JPG o WebP, hasta 2 MB. Se muestra debajo de la respuesta.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
                {image.kind === 'none' ? 'Elegir imagen' : 'Cambiar imagen'}
              </Button>
              {image.kind !== 'none' && (
                <Button
                  type="button"
                  variant="tertiary"
                  size="sm"
                  onClick={() => {
                    setImage({ kind: 'none' })
                    clear('imageAlt')
                  }}
                >
                  Quitar imagen
                </Button>
              )}
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              chooseFile(e.target.files?.[0])
              e.target.value = ''
            }}
          />
          {errors.image && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {errors.image}
            </p>
          )}
          {imageSrc && (
            <>
              <img
                src={imageSrc}
                alt=""
                className="mx-auto h-auto max-h-60 w-full rounded-md bg-surface-container object-contain"
              />
              <Input
                label="Descripción de la imagen"
                value={imageAlt}
                onChange={(e) => {
                  setImageAlt(e.target.value)
                  clear('imageAlt')
                }}
                maxLength={IMAGE_ALT_MAX}
                error={errors.imageAlt}
                hint="Qué muestra la imagen, para quien no puede verla (lectores de pantalla). También es el título al ampliarla."
              />
              <Alert variant="warning" live={false}>
                Antes de subir una captura, oculte los nombres de las partes y del beneficiario, los números de
                documento y los radicados reales: el sitio es público.
              </Alert>
            </>
          )}
        </fieldset>

        <Alert variant="warning" live={false}>
          Revise con cuidado números de cuenta, convenios y correos: se publican tal cual.
        </Alert>

        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-widest text-on-surface-variant uppercase">Vista previa</p>
          <div className="space-y-4 rounded-lg bg-surface-container-low px-4 pt-3 pb-4">
            <p className="font-medium text-on-surface">{text.trim() || 'Pregunta'}</p>
            {preview ? (
              <FaqAnswer text={preview} />
            ) : (
              <p className="text-sm text-on-surface-variant">La respuesta aparecerá aquí.</p>
            )}
            {imageSrc && (
              <img
                src={imageSrc}
                alt={imageAlt.trim()}
                className="h-auto max-h-96 w-full rounded-md bg-surface-container object-contain py-3"
              />
            )}
          </div>
        </div>

        {serverError && <Alert variant="error">{serverError}</Alert>}
      </form>
    </Modal>
  )
}
