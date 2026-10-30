import { describe, expect, it } from 'vitest'
import {
  hearingChangeEmail,
  hearingReminderEmail,
  hearingsWeeklyEmail,
  type HearingEmailData,
} from '../../../supabase/functions/_shared/emails/hearings.ts'
import hearingsSql from '../../../supabase/migrations/20261008150000_hearings.sql?raw'
import { INJECTED_MARKUP, INJECTION_PAYLOADS } from '../../lib/testInjection'
import { hearingSchema, recordingSchema } from './schema'

const hearing: HearingEmailData = {
  id: 'h1',
  scheduledAt: '2026-11-03T09:00:00-05:00',
  type: 'Audiencia de remate',
  caseNumber: '68001310300520170012301',
  courtName: 'Juzgado 1 Civil del Circuito de Ejecución de Sentencias de Bucaramanga',
  courtShort: 'Juzgado 1',
  connectionUrl: 'https://teams.test/reunion',
  requiresLink: true,
}

// Ningún enlace peligroso pasa la validación del formulario ni el check de la base.
const BAD_URLS = [
  'javascript:alert(1)',
  'JAVASCRIPT:alert(1)',
  ' javascript:alert(1)',
  'data:text/html,<script>alert(1)</script>',
  'vbscript:msgbox(1)',
  'https://teams.test/x onmouseover=alert(1)',
  '//evil.test/x',
]

describe('correos de audiencias con código en el tipo o el radicado', () => {
  it.each(INJECTION_PAYLOADS)('recordatorio, listado semanal y avisos de cambio escapan %s', (payload) => {
    const bad = { ...hearing, type: payload, caseNumber: payload }
    const emails = [
      hearingReminderEmail(bad, 'juzgado@test'),
      hearingsWeeklyEmail([bad, hearing], 'del lunes 2 al viernes 6 de noviembre de 2026', 'el Juzgado 1', 'j@test'),
      hearingChangeEmail('nueva', null, bad, 'j@test'),
      hearingChangeEmail('cambio', hearing, bad, 'j@test'),
      hearingChangeEmail('retirada', bad, null, 'j@test'),
    ]
    for (const email of emails) {
      expect(email.html).not.toMatch(INJECTED_MARKUP)
      expect(email.html).not.toContain(payload)
    }
  })

  it('un enlace de conexión con comillas no puede salirse del href', () => {
    const connectionUrl = 'https://teams.test/x"><script>alert(1)</script>'
    const { html } = hearingReminderEmail({ ...hearing, connectionUrl }, 'j@test')
    expect(html).not.toMatch(INJECTED_MARKUP)
    expect(html).toContain('href="https://teams.test/x&quot;&gt;&lt;script&gt;')
  })
})

describe('enlaces de conexión y grabación', () => {
  const valid = {
    court: '1',
    typeId: '2',
    caseNumber: '68001-31-03-005-2017-00123-01',
    date: '2026-10-30',
    time: '09:15',
    connectionUrl: '',
    notes: '',
  }

  it.each(BAD_URLS)('el formulario rechaza %s', (url) => {
    expect(hearingSchema.safeParse({ ...valid, connectionUrl: url }).success).toBe(false)
    expect(recordingSchema.safeParse(url).success).toBe(false)
  })

  it('la base exige lo mismo: https:// y sin espacios', () => {
    expect(hearingsSql).toContain("check (connection_url ~ '^https://\\S+$')")
    expect(hearingsSql).toContain("check (recording_url ~ '^https://\\S+$')")
    const check = /^https:\/\/\S+$/
    for (const url of BAD_URLS) expect(check.test(url)).toBe(false)
  })

  it('las notas son texto libre: el formulario las acepta y React las muestra como texto', () => {
    for (const payload of INJECTION_PAYLOADS) {
      expect(hearingSchema.safeParse({ ...valid, notes: payload }).success).toBe(true)
    }
  })
})
