import { describe, expect, it } from 'vitest'
import { hearingSchema, recordingSchema } from './schema'

const valid = {
  court: '1',
  typeId: '2',
  caseNumber: '68001-31-03-005-2017-00123-01',
  date: '2026-10-30',
  time: '09:15',
  connectionUrl: '',
  notes: '',
}

describe('hearingSchema', () => {
  it('acepta un formulario completo y deja el radicado en dígitos', () => {
    const result = hearingSchema.safeParse(valid)
    expect(result.success).toBe(true)
    expect(result.data?.caseNumber).toBe('68001310300520170012301')
  })

  it('la hora debe ser una de las opciones', () => {
    expect(hearingSchema.safeParse({ ...valid, time: '09:10' }).success).toBe(false)
    expect(hearingSchema.safeParse({ ...valid, time: '18:00' }).success).toBe(false)
  })

  it('el enlace de conexión es opcional, pero completo con https', () => {
    expect(hearingSchema.safeParse({ ...valid, connectionUrl: '  https://meet.test/x ' }).success).toBe(true)
    expect(hearingSchema.safeParse({ ...valid, connectionUrl: 'http://meet.test/x' }).success).toBe(false)
    expect(hearingSchema.safeParse({ ...valid, connectionUrl: 'meet.test' }).success).toBe(false)
  })

  it('juzgado, tipo y notas', () => {
    expect(hearingSchema.safeParse({ ...valid, court: '3' }).success).toBe(false)
    expect(hearingSchema.safeParse({ ...valid, typeId: '' }).success).toBe(false)
    expect(hearingSchema.safeParse({ ...valid, notes: 'a'.repeat(1001) }).success).toBe(false)
  })
})

describe('recordingSchema', () => {
  it('obligatoria y con https', () => {
    expect(recordingSchema.safeParse(' https://grabacion.test/1 ').data).toBe('https://grabacion.test/1')
    expect(recordingSchema.safeParse('').success).toBe(false)
    expect(recordingSchema.safeParse('http://grabacion.test').success).toBe(false)
  })
})
