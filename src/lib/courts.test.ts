import { describe, expect, it } from 'vitest'
import { COURTS, courtByNumber, courtPublicationsUrl, PUBLICATIONS_PAGE } from './courts'

describe('juzgados', () => {
  it('tiene los juzgados 1 y 2 con nombre corto y oficial', () => {
    expect(COURTS.map((court) => court.number)).toEqual([1, 2])
    expect(courtByNumber(1).short).toBe('Juzgado 1')
    expect(courtByNumber(2).name).toBe('Juzgado 2 Civil del Circuito de Ejecución de Sentencias de Bucaramanga')
  })

  it('cada juzgado tiene un código de despacho distinto de 12 dígitos', () => {
    const codes = COURTS.map((court) => court.despacho)
    expect(new Set(codes).size).toBe(codes.length)
    for (const code of codes) expect(code).toMatch(/^\d{12}$/)
  })
})

describe('courtPublicationsUrl', () => {
  it('abre el portal filtrado por el despacho', () => {
    const url = new URL(courtPublicationsUrl('680013403001'))
    expect(`${url.origin}${url.pathname}`).toBe(PUBLICATIONS_PAGE)
    const portlet = url.searchParams.get('p_p_id')
    expect(portlet).toBeTruthy()
    expect(url.searchParams.get(`_${portlet}_action`)).toBe('busqueda')
    expect(url.searchParams.get(`_${portlet}_idDespacho`)).toBe('680013403001')
    expect(url.searchParams.get(`_${portlet}_verTotales`)).toBe('true')
  })
})
