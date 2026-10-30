import { describe, expect, it } from 'vitest'
import { passwordChangedEmail, passwordResetEmail } from '../../../supabase/functions/_shared/emails/account.ts'
import { escapeHtml } from '../../../supabase/functions/_shared/emails/layout.ts'
import { INJECTED_MARKUP, INJECTION_PAYLOADS } from '../../lib/testInjection'
import { nameSchema } from './schema'

const to = 'ana@correo.com'
const url = 'https://oeccbvirtual.app/restablecer-contrasena?token_hash=abc&type=recovery'

describe('correos de la cuenta con código en el nombre del funcionario', () => {
  // El nombre de la base ya no admite < ni >, pero el correo no depende de eso.
  it.each(INJECTION_PAYLOADS)('escapan %s en el saludo', (name) => {
    for (const email of [
      passwordResetEmail({ to, name, url }),
      passwordChangedEmail({ to, name, changedAt: '2026-10-30T10:00:00-05:00' }),
    ]) {
      expect(email.html).not.toMatch(INJECTED_MARKUP)
      expect(email.html).toContain(escapeHtml(`Hola, ${name}.`))
    }
  })

  it('el enlace de recuperación va escapado dentro de href', () => {
    expect(passwordResetEmail({ to, name: null, url }).html).toContain(
      'href="https://oeccbvirtual.app/restablecer-contrasena?token_hash=abc&amp;type=recovery"',
    )
  })
})

describe('el nombre del perfil rechaza código', () => {
  it.each(INJECTION_PAYLOADS)('%s', (payload) => {
    expect(nameSchema.safeParse(payload).success).toBe(false)
    expect(nameSchema.safeParse(`Ana ${payload}`).success).toBe(false)
  })
})
