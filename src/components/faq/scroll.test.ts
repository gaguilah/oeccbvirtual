import { describe, expect, it } from 'vitest'
import { questionScrollTop } from './scroll'

const box = { viewport: 800, offset: 96 }

describe('questionScrollTop', () => {
  it('centra la pregunta en el espacio bajo el encabezado', () => {
    // Espacio visible 704 px; una pregunta de 200 px queda con 252 px arriba y abajo.
    expect(questionScrollTop({ ...box, top: 2000, height: 200 })).toBe(2000 - 96 - 252)
  })

  it('si no cabe, queda arriba, bajo el encabezado', () => {
    expect(questionScrollTop({ ...box, top: 2000, height: 900 })).toBe(2000 - 96)
  })

  it('si cabe justo, también queda arriba', () => {
    expect(questionScrollTop({ ...box, top: 2000, height: 704 })).toBe(2000 - 96)
  })

  it('nunca antes del inicio de la página', () => {
    expect(questionScrollTop({ ...box, top: 150, height: 100 })).toBe(0)
  })
})
