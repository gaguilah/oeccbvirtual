import { describe, expect, it } from 'vitest'
import { testHearing } from '../testHearing'
import { formatCaseNumber, hasFormat, hearingFormatData, hearingFormatFileName } from './data'

const realizada = testHearing({
  status_id: 2,
  // 8:05 p. m. en Bogotá: en UTC ya es el 30.
  scheduled_at: '2026-10-29T20:05:00-05:00',
  recording_url: 'https://grabacion.test/1',
  recording_set_at: '2026-10-30T09:00:00-05:00',
  recording_set_by_name: 'Ana Pérez',
  recording_set_by_position: 'Asistente',
})

describe('formato de referencia cruzada', () => {
  it('solo las realizadas con grabación', () => {
    expect(hasFormat(realizada)).toBe(true)
    expect(hasFormat(testHearing({ status_id: 1, recording_url: 'https://x.test' }))).toBe(false)
    expect(hasFormat(testHearing({ status_id: 2 }))).toBe(false)
  })

  it('radicado con guiones, o tal cual si no tiene 23 dígitos', () => {
    expect(formatCaseNumber('68001310300520170012301')).toBe('68001-31-03-005-2017-00123-01')
    expect(formatCaseNumber('123')).toBe('123')
  })

  it('campos del PDF en hora de Colombia', () => {
    const data = hearingFormatData(realizada, 'Remate')
    expect(data.title).toBe('Referencia cruzada 68001-31-03-005-2017-00123-01')
    expect(data.preparedBy).toBe('Ana Pérez')
    expect(data.position).toBe('Asistente')
    expect(data.description).toBe('Link Remate')
    expect(data.documentDate).toBe('2026/10/29')
    expect(data.recordingUrl).toBe('https://grabacion.test/1')
    expect(data.preparedOn).toMatch(/30/)
  })

  it('sin autor de la grabación muestra una raya', () => {
    const data = hearingFormatData(testHearing({ status_id: 2, recording_url: 'https://x.test' }), 'Remate')
    expect([data.preparedOn, data.preparedBy, data.position]).toEqual(['—', '—', '—'])
  })

  it('nombre del archivo con AAAAMMDDHHmm de la audiencia en Bogotá', () => {
    expect(hearingFormatFileName(realizada)).toBe('Referencia-cruzada-68001310300520170012301-202610292005.pdf')
  })
})
