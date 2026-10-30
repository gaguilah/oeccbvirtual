import { describe, expect, it } from 'vitest'
// Código de la Edge Function como texto, para comprobar que repite las mismas reglas.
import submitRequestSource from '../../../supabase/functions/submit-request/index.ts?raw'
import { REQUEST_STEPS, REQUEST_TYPE_IDS, requestTypes, SUMMARY_MAX_CHARS } from './data'
import { requestSchema, stepFields, validateFields, type RequestDraft } from './schema'

const valid: RequestDraft = {
  type: 'peticion',
  name: 'Ana Gómez',
  email: 'ana@correo.com',
  summary: 'Solicito copia del auto que fijó la fecha del remate.',
  acceptedTerms: true,
}

describe('requestSchema', () => {
  it('acepta una solicitud completa y quita espacios sobrantes', () => {
    expect(requestSchema.parse({ ...valid, name: '  Ana Gómez ', email: ' ana@correo.com ' })).toMatchObject({
      name: 'Ana Gómez',
      email: 'ana@correo.com',
    })
  })

  it('exige aceptar los términos', () => {
    expect(validateFields({ ...valid, acceptedTerms: false }, ['acceptedTerms'])).toEqual({
      acceptedTerms: 'Debe aceptar los términos y condiciones para enviar su solicitud.',
    })
  })

  it(`el mensaje va de 10 a ${SUMMARY_MAX_CHARS} caracteres, sin contar espacios de los extremos`, () => {
    expect(validateFields({ ...valid, summary: '   corto   ' }, ['summary']).summary).toMatch(/muy corto/)
    expect(validateFields({ ...valid, summary: 'a'.repeat(SUMMARY_MAX_CHARS) }, ['summary'])).toEqual({})
    expect(validateFields({ ...valid, summary: 'a'.repeat(SUMMARY_MAX_CHARS + 1) }, ['summary']).summary).toMatch(
      /muy largo/,
    )
  })

  it('rechaza nombre corto, correo inválido y tipo sin elegir', () => {
    expect(validateFields({ ...valid, name: 'A', email: 'ana@', type: null }, ['type', 'name', 'email'])).toEqual({
      type: 'Seleccione el tipo de solicitud.',
      name: 'El nombre es muy corto.',
      email: 'Ingrese un correo electrónico válido.',
    })
  })
})

describe('pasos del formulario', () => {
  it('cada paso valida solo sus campos', () => {
    const draft = { ...valid, type: null, summary: '' }
    expect(Object.keys(validateFields(draft, stepFields[0]))).toEqual(['type'])
    expect(validateFields(draft, stepFields[1])).toEqual({})
    expect(Object.keys(validateFields(draft, stepFields[2]))).toEqual(['summary'])
  })

  it('entre todos los pasos cubren cada campo una vez, y hay un nombre por paso', () => {
    const fields = stepFields.flat()
    expect(new Set(fields).size).toBe(fields.length)
    expect([...fields].sort()).toEqual(Object.keys(requestSchema.shape).sort())
    expect(REQUEST_STEPS).toHaveLength(stepFields.length)
  })

  it('cada tipo tiene etiqueta y descripción', () => {
    expect(Object.keys(requestTypes)).toEqual([...REQUEST_TYPE_IDS])
  })
})

// supabase/functions/submit-request/index.ts repite estas reglas: si cambian, cambiar los dos.
describe('submit-request repite las reglas', () => {
  it('los mismos tipos', () => {
    const match = submitRequestSource.match(/ALLOWED_TYPES = \[([^\]]*)\]/)
    const types = match?.[1].split(',').map((type) => type.trim().replace(/'/g, ''))
    expect(types).toEqual([...REQUEST_TYPE_IDS])
  })

  it('los mismos límites del nombre y del mensaje', () => {
    expect(submitRequestSource).toContain('name.trim().length < 2')
    expect(submitRequestSource).toContain('summary.trim().length < 10')
    expect(submitRequestSource).toContain(`summary.trim().length > ${SUMMARY_MAX_CHARS}`)
  })
})
