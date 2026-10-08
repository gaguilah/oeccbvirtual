// Correos de Audiencias (docs/plan-audiencias.md, fase 4): por ahora el recordatorio de 15 minutos
// antes. El listado semanal y el aviso de cambio usarán estas mismas piezas.
import { SITE_URL } from '../office.ts'
import { escapeHtml, layout, rowsHtml, rowsText, type Row } from './layout.ts'

export type HearingEmailData = {
  id: string
  scheduledAt: string
  type: string
  caseNumber: string
  // "Juzgado 1 Civil del Circuito de Ejecución de Sentencias de Bucaramanga"
  courtName: string
  courtShort: string
  connectionUrl: string | null
  requiresLink: boolean
}

const timeFormatter = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

const dayFormatter = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export const hearingTime = (iso: string) => timeFormatter.format(new Date(iso))
export const hearingDay = (iso: string) => dayFormatter.format(new Date(iso))

// Radicado legible: 68001-31-03-005-2016-00296-01.
export function formatCaseNumber(value: string): string {
  const m = /^(\d{5})(\d{2})(\d{2})(\d{3})(\d{4})(\d{5})(\d{2})$/.exec(value)
  return m ? m.slice(1).join('-') : value
}

function hearingRows(data: HearingEmailData): Row[] {
  return [
    { label: 'Audiencia', value: data.type },
    { label: 'Fecha', value: hearingDay(data.scheduledAt) },
    { label: 'Hora', value: hearingTime(data.scheduledAt) },
    { label: 'Radicado', value: formatCaseNumber(data.caseNumber) },
    { label: 'Juzgado', value: data.courtName },
    { label: 'Modalidad', value: data.requiresLink ? 'Virtual (Microsoft Teams)' : 'Presencial' },
  ]
}

function buttonHtml(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 16px;"><tr><td style="border-radius:8px;background:#193cb8;">
<a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 22px;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;border-radius:8px;">${escapeHtml(label)}</a>
</td></tr></table>`
}

// Recordatorio 15 minutos antes (para los usuarios del juzgado; nunca para las partes).
export function hearingReminderEmail(data: HearingEmailData, to: string) {
  const time = hearingTime(data.scheduledAt)
  const subject = `Recordatorio: ${data.type} a las ${time} · ${data.courtShort}`
  const title = `${data.type} en 15 minutos`
  const intro = `Hoy a las ${time} empieza la audiencia del radicado ${formatCaseNumber(data.caseNumber)}.`
  const link = data.connectionUrl
    ? buttonHtml(data.connectionUrl, 'Conectarse a la audiencia') +
      `<p style="margin:0 0 16px;font-size:12px;color:#64748b;">Si el botón no funciona, copie este enlace en el navegador:<br><span style="word-break:break-all;">${escapeHtml(data.connectionUrl)}</span></p>`
    : `<p style="margin:16px 0;padding:10px 12px;background:#f1f5f9;border-radius:6px;">Audiencia presencial: no tiene enlace de conexión.</p>`
  const dashboardUrl = `${SITE_URL}/dashboard/audiencias?vista=semana`

  const { html, text } = layout({
    preview: intro,
    title,
    bodyHtml:
      `<p style="margin:0 0 8px;">${escapeHtml(intro)}</p>` +
      rowsHtml(hearingRows(data)) +
      link +
      `<p style="margin:0;font-size:13px;">Véala en el <a href="${dashboardUrl}" style="color:#193cb8;">calendario de audiencias</a> del dashboard.</p>`,
    bodyText: [
      intro,
      '',
      rowsText(hearingRows(data)),
      '',
      data.connectionUrl ? `Enlace de conexión: ${data.connectionUrl}` : 'Audiencia presencial: no tiene enlace de conexión.',
      '',
      `Calendario de audiencias: ${dashboardUrl}`,
    ].join('\n'),
  })
  return { to, subject, html, text }
}
