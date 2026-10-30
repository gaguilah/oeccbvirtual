import { describe, expect, it } from 'vitest'
import { escapeHtml } from '../../../supabase/functions/_shared/emails/layout.ts'
import { requestResponseEmail } from '../../../supabase/functions/_shared/emails/pqrs.ts'
import respondRequestSource from '../../../supabase/functions/respond-request/index.ts?raw'
import { INJECTED_MARKUP, INJECTION_PAYLOADS } from '../../lib/testInjection'

const response = {
  requestNumber: 'PQRS-2026-000123',
  type: 'peticion',
  name: 'Ana Gómez',
  email: 'ana@correo.com',
  summary: 'Solicito copia del auto que fijó la fecha del remate.',
  createdAt: '2026-10-29T08:00:00-05:00',
  response: 'Se le envía la copia solicitada.',
  respondedAt: '2026-10-30T10:00:00-05:00',
}

describe('respuesta de PQRS con código', () => {
  it('respond-request arma el correo con esta plantilla', () => {
    expect(respondRequestSource).toContain("import { requestResponseEmail } from '../_shared/emails/pqrs.ts'")
  })

  it.each(INJECTION_PAYLOADS)('escapa %s en la respuesta del funcionario y en la solicitud', (payload) => {
    const { html } = requestResponseEmail({
      ...response,
      name: payload,
      summary: payload,
      response: `Primera línea\n${payload}`,
    })
    expect(html).not.toMatch(INJECTED_MARKUP)
    expect(html).not.toContain(payload)
    expect(html).toContain(`Primera línea<br>${escapeHtml(payload)}`)
  })
})
