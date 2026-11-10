import { describe, expect, it } from 'vitest'
import { INJECTION_PAYLOADS } from '../../lib/testInjection'
import { inlineParts, parseAnswer, plainAnswer } from './format'

describe('parseAnswer', () => {
  it('párrafos separados por una línea en blanco; un salto simple queda dentro del párrafo', () => {
    expect(parseAnswer('Primera línea.\nSegunda línea.\n\nOtro párrafo.')).toEqual([
      { type: 'paragraph', lines: ['Primera línea.', 'Segunda línea.'] },
      { type: 'paragraph', lines: ['Otro párrafo.'] },
    ])
  })

  it('líneas con "- " forman una lista, también pegada al párrafo', () => {
    expect(parseAnswer('Envíe un correo con:\n- el radicado;\n- el recibo.\n\nLa oficina le responde.')).toEqual([
      { type: 'paragraph', lines: ['Envíe un correo con:'] },
      { type: 'list', items: ['el radicado;', 'el recibo.'] },
      { type: 'paragraph', lines: ['La oficina le responde.'] },
    ])
  })

  it('acepta viñetas "•", saltos de Windows y quita espacios sobrantes', () => {
    expect(parseAnswer('  • uno  \r\n•   dos\r\n\r\n\r\n  fin  ')).toEqual([
      { type: 'list', items: ['uno', 'dos'] },
      { type: 'paragraph', lines: ['fin'] },
    ])
  })

  it('un guion sin espacio no es lista y un elemento vacío se ignora', () => {
    expect(parseAnswer('-sin espacio\n- \n- con texto')).toEqual([
      { type: 'paragraph', lines: ['-sin espacio'] },
      { type: 'list', items: ['con texto'] },
    ])
  })

  it('texto vacío: sin bloques', () => {
    expect(parseAnswer('')).toEqual([])
    expect(parseAnswer('\n \n')).toEqual([])
  })

  it('el HTML queda como texto (FaqAnswer nunca lo interpreta)', () => {
    for (const payload of INJECTION_PAYLOADS) {
      expect(parseAnswer(payload)).toEqual([{ type: 'paragraph', lines: [payload] }])
    }
  })
})

describe('inlineParts', () => {
  it('separa la negrita', () => {
    expect(inlineParts('Acuda al **Banco Agrario** con su **cédula**.')).toEqual([
      { text: 'Acuda al ', bold: false },
      { text: 'Banco Agrario', bold: true },
      { text: ' con su ', bold: false },
      { text: 'cédula', bold: true },
      { text: '.', bold: false },
    ])
  })

  it('un ** sin cerrar se deja como texto', () => {
    expect(inlineParts('Cuenta **680012031800')).toEqual([{ text: 'Cuenta **680012031800', bold: false }])
  })

  it('negrita al inicio y al final', () => {
    expect(inlineParts('**Cuenta:** 3-0820-000755-4')).toEqual([
      { text: 'Cuenta:', bold: true },
      { text: ' 3-0820-000755-4', bold: false },
    ])
  })
})

describe('plainAnswer', () => {
  it('una sola línea sin marcas', () => {
    expect(plainAnswer('- **Cuenta corriente:** 3-0820-000755-4\n- **Convenio:** 14975')).toBe(
      'Cuenta corriente: 3-0820-000755-4 Convenio: 14975',
    )
  })
})
