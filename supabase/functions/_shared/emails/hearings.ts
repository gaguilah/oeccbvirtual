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

// Juzgados (repiten src/lib/courts.ts: si cambian allá, cambiarlos aquí).
export const COURT_NAMES: Record<number, { short: string; name: string }> = {
  1: { short: 'Juzgado 1', name: 'Juzgado 1 Civil del Circuito de Ejecución de Sentencias de Bucaramanga' },
  2: { short: 'Juzgado 2', name: 'Juzgado 2 Civil del Circuito de Ejecución de Sentencias de Bucaramanga' },
}

// Fila de hearing_notifications.before / after (public.hearing_snapshot).
export type HearingSnapshot = {
  scheduled_at: string
  type: string
  requires_link: boolean
  case_number: string
  court_id: number
  connection_url: string | null
}

export function fromSnapshot(id: string, s: HearingSnapshot): HearingEmailData {
  const court = COURT_NAMES[s.court_id] ?? { short: `Juzgado ${s.court_id}`, name: `Juzgado ${s.court_id}` }
  return {
    id,
    scheduledAt: s.scheduled_at,
    type: s.type,
    caseNumber: s.case_number,
    courtName: court.name,
    courtShort: court.short,
    connectionUrl: s.connection_url,
    requiresLink: s.requires_link,
  }
}

export type ChangeKind = 'nueva' | 'cambio' | 'retirada'

const when = (h: HearingEmailData) => `${hearingDay(h.scheduledAt)}, ${hearingTime(h.scheduledAt)}`
const linkLabel = (h: HearingEmailData) => h.connectionUrl ?? (h.requiresLink ? 'Sin enlace' : 'Presencial')

// Aviso de un cambio en las audiencias de la semana, después de enviado el listado.
export function hearingChangeEmail(
  kind: ChangeKind,
  before: HearingEmailData | null,
  after: HearingEmailData | null,
  to: string,
) {
  const current = (after ?? before)!
  const short = `${current.type} · ${hearingTime(current.scheduledAt)} · ${current.courtShort}`
  const moved = kind === 'retirada' && after !== null
  const subject =
    kind === 'nueva'
      ? `Nueva audiencia esta semana: ${short}`
      : kind === 'cambio'
        ? `Cambio en audiencia de esta semana: ${short}`
        : `Audiencia retirada de esta semana: ${current.type} · ${current.courtShort}`
  const title =
    kind === 'nueva' ? 'Nueva audiencia esta semana' : kind === 'cambio' ? 'Cambió una audiencia' : 'Audiencia retirada'
  const intro =
    kind === 'nueva'
      ? `Se agregó a las audiencias de esta semana la audiencia del radicado ${formatCaseNumber(current.caseNumber)}.`
      : kind === 'cambio'
        ? `Cambiaron datos de la audiencia del radicado ${formatCaseNumber(current.caseNumber)}.`
        : moved
          ? `La audiencia del radicado ${formatCaseNumber(current.caseNumber)} ya no es esta semana: se reprogramó para el ${when(after!)}.`
          : `La audiencia del radicado ${formatCaseNumber(before!.caseNumber)} se eliminó y ya no está programada.`

  let bodyHtml = `<p style="margin:0 0 8px;">${escapeHtml(intro)}</p>`
  let bodyText = intro
  if (kind === 'cambio' && before && after) {
    const fields: [string, string, string][] = [
      ['Fecha y hora', when(before), when(after)],
      ['Audiencia', before.type, after.type],
      ['Radicado', formatCaseNumber(before.caseNumber), formatCaseNumber(after.caseNumber)],
      ['Juzgado', before.courtShort, after.courtShort],
      ['Enlace', linkLabel(before), linkLabel(after)],
    ]
    const changed = fields.filter(([, a, b]) => a !== b)
    bodyHtml += `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:16px 0;">
<tr><td></td><td style="padding:6px 12px;font-size:12px;color:#64748b;">Antes</td><td style="padding:6px 12px;font-size:12px;color:#64748b;">Ahora</td></tr>
${changed
  .map(
    ([label, a, b]) =>
      `<tr><td style="padding:8px 12px;background:#f1f5f9;color:#475569;font-size:13px;vertical-align:top;">${escapeHtml(label)}</td>` +
      `<td style="padding:8px 12px;background:#f8fafc;color:#64748b;font-size:14px;text-decoration:line-through;vertical-align:top;overflow-wrap:anywhere;">${escapeHtml(a)}</td>` +
      `<td style="padding:8px 12px;background:#f8fafc;color:#1e293b;font-size:14px;font-weight:600;vertical-align:top;overflow-wrap:anywhere;">${escapeHtml(b)}</td></tr>`,
  )
  .join('')}
</table>`
    bodyText += '\n\n' + changed.map(([label, a, b]) => `${label}: ${a} → ${b}`).join('\n')
  }
  const shown = kind === 'retirada' ? before! : after!
  bodyHtml += rowsHtml(hearingRows(shown))
  bodyText += '\n\n' + rowsText(hearingRows(shown))
  if (kind !== 'retirada' && shown.connectionUrl) {
    bodyHtml += buttonHtml(shown.connectionUrl, 'Conectarse a la audiencia')
    bodyText += `\n\nEnlace de conexión: ${shown.connectionUrl}`
  }
  const dashboardUrl = `${SITE_URL}/dashboard/audiencias?vista=semana`
  bodyHtml += `<p style="margin:16px 0 0;font-size:13px;">Véala en el <a href="${dashboardUrl}" style="color:#193cb8;">calendario de audiencias</a>.</p>`
  bodyText += `\n\nCalendario de audiencias: ${dashboardUrl}`

  const { html, text } = layout({ preview: intro, title, bodyHtml, bodyText })
  return { to, subject, html, text }
}
