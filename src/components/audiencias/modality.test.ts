import { describe, expect, it } from 'vitest'
import { MODALITIES, modalityLabel, modalityOf, modalityShort } from './modality'

describe('modalidad según el tipo de audiencia', () => {
  it('un tipo que requiere enlace es virtual', () => {
    const type = { requires_link: true }
    expect(modalityOf(type)).toBe('virtual')
    expect(modalityLabel(type)).toBe('Virtual (Microsoft Teams)')
    expect(modalityShort(type)).toBe('Virtual')
  })

  it('un tipo sin enlace es presencial', () => {
    const type = { requires_link: false }
    expect(modalityOf(type)).toBe('presencial')
    expect(modalityLabel(type)).toBe('Presencial')
    expect(modalityShort(type)).toBe('Presencial')
  })

  it('las opciones del filtro usan los mismos nombres', () => {
    expect(MODALITIES).toEqual([
      { value: 'virtual', label: modalityLabel({ requires_link: true }) },
      { value: 'presencial', label: modalityLabel({ requires_link: false }) },
    ])
  })
})
