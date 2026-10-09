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
      data.connectionUrl
        ? `Enlace de conexión: ${data.connectionUrl}`
        : 'Audiencia presencial: no tiene enlace de conexión.',
      '',
      `Calendario de audiencias: ${dashboardUrl}`,
    ].join('\n'),
  })
  return { to, subject, html, text }
}

const weekdayFormatter = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})
const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' })

const capitalize = (text: string) => text.charAt(0).toLocaleUpperCase('es') + text.slice(1)

function linkCell(data: HearingEmailData): { html: string; text: string } {
  if (data.connectionUrl)
    return {
      html: `<a href="${escapeHtml(data.connectionUrl)}" style="display:inline-block;padding:6px 12px;background:#193cb8;color:#ffffff;font-size:13px;font-weight:bold;text-decoration:none;border-radius:6px;white-space:nowrap;">Conectarse</a>`,
      text: `Enlace: ${data.connectionUrl}`,
    }
  return {
    html: `<span style="font-size:13px;color:#64748b;white-space:nowrap;">Presencial</span>`,
    text: 'Presencial',
  }
}

// Listado semanal (lunes o siguiente día hábil): audiencias de la semana agrupadas por día.
// `period`: "del lunes 5 al viernes 9 de octubre de 2026"; `scope`: "los Juzgados 1 y 2".
export function hearingsWeeklyEmail(hearings: HearingEmailData[], period: string, scope: string, to: string) {
  const count = hearings.length
  const subject = `Audiencias de la semana: ${count} ${count === 1 ? 'programada' : 'programadas'} (${period})`
  const title = 'Audiencias de la semana'
  const intro = `${capitalize(period)} hay ${count} ${count === 1 ? 'audiencia programada' : 'audiencias programadas'} en ${scope}.`

  const days = new Map<string, HearingEmailData[]>()
  for (const h of hearings) {
    const key = dayKey.format(new Date(h.scheduledAt))
    days.set(key, [...(days.get(key) ?? []), h])
  }

  const htmlDays = [...days.values()]
    .map((items) => {
      const heading = capitalize(weekdayFormatter.format(new Date(items[0].scheduledAt)))
      const rows = items
        .map((h) => {
          const link = linkCell(h)
          return `<tr>
<td style="padding:10px 12px;background:#f8fafc;font-size:14px;font-weight:bold;color:#0f172a;white-space:nowrap;vertical-align:top;width:1%;">${escapeHtml(hearingTime(h.scheduledAt))}</td>
<td style="padding:10px 12px;background:#f8fafc;font-size:14px;color:#1e293b;vertical-align:top;"><strong>${escapeHtml(h.type)}</strong><br><span style="font-size:13px;color:#475569;">${escapeHtml(formatCaseNumber(h.caseNumber))} · ${escapeHtml(h.courtShort)}</span></td>
<td style="padding:10px 12px;background:#f8fafc;vertical-align:middle;text-align:right;width:1%;">${link.html}</td>
</tr>`
        })
        .join('<tr><td colspan="3" style="height:4px;line-height:4px;font-size:0;">&nbsp;</td></tr>')
      return `<h2 style="margin:24px 0 8px;font-size:15px;color:#193cb8;">${escapeHtml(heading)}</h2>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:separate;">${rows}</table>`
    })
    .join('')

  const textDays = [...days.values()]
    .map((items) =>
      [
        capitalize(weekdayFormatter.format(new Date(items[0].scheduledAt))),
        ...items.map(
          (h) =>
            `  ${hearingTime(h.scheduledAt)} · ${h.type} · ${formatCaseNumber(h.caseNumber)} · ${h.courtShort} · ${linkCell(h).text}`,
        ),
      ].join('\n'),
    )
    .join('\n\n')

  const dashboardUrl = `${SITE_URL}/dashboard/audiencias?vista=semana`
  const { html, text } = layout({
    preview: intro,
    title,
    bodyHtml:
      `<p style="margin:0;">${escapeHtml(intro)}</p>` +
      htmlDays +
      `<p style="margin:24px 0 0;font-size:13px;">Si hay cambios durante la semana, le llegará un aviso de cada uno. Vea todo en el <a href="${dashboardUrl}" style="color:#193cb8;">calendario de audiencias</a>.</p>`,
    bodyText: [intro, '', textDays, '', `Calendario de audiencias: ${dashboardUrl}`].join('\n'),
  })
  return { to, subject, html, text }
}
