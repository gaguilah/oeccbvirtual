import { describe, expect, it } from 'vitest'
// Plantillas de las Edge Functions (Deno): son TypeScript puro, sin APIs de Deno, así que se importan.
import { escapeHtml, layout, multiline, rowsHtml } from '../../../supabase/functions/_shared/emails/layout.ts'
import { officeNewRequestEmail, requestReceivedEmail } from '../../../supabase/functions/_shared/emails/pqrs.ts'
import { INJECTED_MARKUP, INJECTION_PAYLOADS } from '../../lib/testInjection'
import { requestSchema } from './schema'

const request = {
  requestNumber: 'PQRS-2026-000123',
  type: 'peticion',
  name: 'Ana Gómez',
  email: 'ana@correo.com',
  summary: 'Solicito copia del auto que fijó la fecha del remate.',
  createdAt: '2026-10-29T08:00:00-05:00',
}

describe('escapeHtml', () => {
  it('escapa los cinco caracteres especiales de HTML', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;')
  })

  it('escapa primero el &: un texto ya escapado se muestra tal cual, no se interpreta', () => {
    expect(escapeHtml('&lt;script&gt;')).toBe('&amp;lt;script&amp;gt;')
  })

  it('ninguna carga sale con etiquetas o comillas sin escapar', () => {
    for (const payload of INJECTION_PAYLOADS) {
      expect(escapeHtml(payload)).not.toMatch(/[<>"']/)
    }
  })

  it('multiline escapa y solo agrega <br> por cada salto de línea', () => {
    expect(multiline('<b>hola</b>\nadiós')).toBe('&lt;b&gt;hola&lt;/b&gt;<br>adiós')
  })

  it('rowsHtml y layout escapan etiquetas, valores, título y vista previa', () => {
    const [payload] = INJECTION_PAYLOADS
    expect(rowsHtml([{ label: payload, value: payload }])).not.toMatch(INJECTED_MARKUP)
    const { html } = layout({ preview: payload, title: payload, bodyHtml: '', bodyText: '' })
    expect(html).not.toMatch(INJECTED_MARKUP)
  })
})

describe('correos de PQRS con código en lo que escribe el ciudadano', () => {
  it.each(INJECTION_PAYLOADS)('acuse y aviso a la oficina escapan %s', (payload) => {
    const data = { ...request, name: payload, email: payload, summary: `${payload}\n${payload}` }
    for (const email of [requestReceivedEmail(data), officeNewRequestEmail(data)]) {
      expect(email.html).not.toMatch(INJECTED_MARKUP)
      expect(email.html).not.toContain(payload)
      expect(email.html).toContain(escapeHtml(payload))
    }
  })

  it('un tipo que no está en la lista también se escapa', () => {
    const [payload] = INJECTION_PAYLOADS
    expect(officeNewRequestEmail({ ...request, type: payload }).html).not.toMatch(INJECTED_MARKUP)
  })

  it('la versión de texto plano lleva el texto tal cual (no es HTML)', () => {
    const [payload] = INJECTION_PAYLOADS
    expect(requestReceivedEmail({ ...request, summary: payload }).text).toContain(payload)
  })
})

describe('el formulario no filtra el código: lo guarda como texto y se escapa al mostrarlo', () => {
  it.each(INJECTION_PAYLOADS)('acepta %s en el nombre y el mensaje', (payload) => {
    const result = requestSchema.safeParse({
      type: 'peticion',
      name: payload,
      email: 'ana@correo.com',
      summary: `Mensaje con código: ${payload}`,
      acceptedTerms: true,
    })
    expect(result.success).toBe(true)
  })

  it('rechaza código en el correo', () => {
    for (const payload of INJECTION_PAYLOADS) {
      expect(requestSchema.shape.email.safeParse(payload).success).toBe(false)
    }
  })
})
