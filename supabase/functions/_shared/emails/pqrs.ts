// Correos de PQRS: acuse de recibo para el ciudadano y aviso de PQRS nueva para la oficina.
import { OFFICE_EMAIL, SITE_URL } from '../office.ts'
import { escapeHtml, layout, multiline, rowsHtml, rowsText, type Row } from './layout.ts'

// Nombres de los tipos: repiten los de src/components/pqrs/data.ts (requestTypes).
const TYPE_LABELS: Record<string, string> = {
  peticion: 'Petición',
  queja: 'Queja',
  reclamo: 'Reclamo',
  sugerencia: 'Sugerencia',
  felicitacion: 'Felicitación',
}

// Plazo que se informa en el acuse (Ley 1755 de 2015).
const RESPONSE_TERM = 'dentro de los términos de ley (15 días hábiles)'

export type PqrsEmailData = {
  requestNumber: string
  type: string
  name: string
  email: string
  summary: string
  createdAt: string
}

const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

function rows(data: PqrsEmailData, withContact: boolean): Row[] {
  return [
    { label: 'Radicado', value: data.requestNumber },
    { label: 'Tipo', value: TYPE_LABELS[data.type] ?? data.type },
    { label: 'Fecha', value: dateFormatter.format(new Date(data.createdAt)) },
    ...(withContact
      ? [
          { label: 'Nombre', value: data.name },
          { label: 'Correo', value: data.email },
        ]
      : []),
  ]
}

// Acuse para el ciudadano. Sin reply_to: notificaciones@ solo envía; el pie remite a /contacto.
export function requestReceivedEmail(data: PqrsEmailData) {
  const type = (TYPE_LABELS[data.type] ?? 'solicitud').toLowerCase()
  const subject = `Recibimos su PQRS – Radicado ${data.requestNumber}`
  const { html, text } = layout({
    preview: `Su ${type} quedó radicada con el número ${data.requestNumber}.`,
    title: 'Recibimos su solicitud',
    bodyHtml:
      `<p style="margin:0 0 12px;">Hola, ${escapeHtml(data.name)}.</p>` +
      `<p style="margin:0 0 12px;">Su ${escapeHtml(type)} quedó radicada. Guarde el número de radicado para cualquier consulta.</p>` +
      rowsHtml(rows(data, false)) +
      `<p style="margin:0 0 6px;font-weight:bold;color:#0f172a;">Su solicitud</p>` +
      `<div style="margin:0 0 16px;padding:12px 14px;background:#f8fafc;border-left:3px solid #193cb8;color:#334155;">${multiline(data.summary)}</div>` +
      `<p style="margin:0;">Le enviaremos la respuesta a este correo ${RESPONSE_TERM}.</p>`,
    bodyText: [
      `Hola, ${data.name}.`,
      '',
      `Su ${type} quedó radicada. Guarde el número de radicado para cualquier consulta.`,
      '',
      rowsText(rows(data, false)),
      '',
      'Su solicitud:',
      data.summary,
      '',
      `Le enviaremos la respuesta a este correo ${RESPONSE_TERM}.`,
    ].join('\n'),
  })
  return { to: data.email, subject, html, text }
}

// Aviso para el buzón de la oficina. Responder ese correo le escribe al ciudadano (reply_to).
export function officeNewRequestEmail(data: PqrsEmailData) {
  const type = TYPE_LABELS[data.type] ?? data.type
  const subject = `Nueva PQRS ${data.requestNumber} – ${type}`
  const { html, text } = layout({
    preview: `${type} de ${data.name}: ${data.summary.slice(0, 80)}`,
    title: `Nueva PQRS: ${type}`,
    bodyHtml:
      `<p style="margin:0 0 12px;">Se recibió una PQRS desde el sitio. Al ciudadano se le envió el acuse de recibo con su número de radicado.</p>` +
      rowsHtml(rows(data, true)) +
      `<p style="margin:0 0 6px;font-weight:bold;color:#0f172a;">Solicitud</p>` +
      `<div style="margin:0 0 16px;padding:12px 14px;background:#f8fafc;border-left:3px solid #193cb8;color:#334155;">${multiline(data.summary)}</div>` +
      `<p style="margin:0;"><a href="${SITE_URL}/dashboard" style="color:#193cb8;">Abrir el dashboard</a></p>`,
    bodyText: [
      'Se recibió una PQRS desde el sitio. Al ciudadano se le envió el acuse de recibo con su número de radicado.',
      '',
      rowsText(rows(data, true)),
      '',
      'Solicitud:',
      data.summary,
      '',
      `Dashboard: ${SITE_URL}/dashboard`,
    ].join('\n'),
  })
  return { to: OFFICE_EMAIL, subject, html, text, replyTo: data.email }
}

export type PqrsResponseData = PqrsEmailData & { response: string; respondedAt: string }

// Respuesta de la oficina al ciudadano. Sin reply_to (notificaciones@ solo envía); el pie remite a
// los canales de atención.
export function requestResponseEmail(data: PqrsResponseData) {
  const type = (TYPE_LABELS[data.type] ?? 'solicitud').toLowerCase()
  const subject = `Respuesta a su PQRS – Radicado ${data.requestNumber}`
  const { html, text } = layout({
    preview: `Respuesta a su ${type} con radicado ${data.requestNumber}.`,
    title: 'Respuesta a su solicitud',
    bodyHtml:
      `<p style="margin:0 0 12px;">Hola, ${escapeHtml(data.name)}.</p>` +
      `<p style="margin:0 0 12px;">Esta es la respuesta a su ${escapeHtml(type)}.</p>` +
      rowsHtml([
        ...rows(data, false),
        { label: 'Fecha de respuesta', value: dateFormatter.format(new Date(data.respondedAt)) },
      ]) +
      `<p style="margin:0 0 6px;font-weight:bold;color:#0f172a;">Respuesta</p>` +
      `<div style="margin:0 0 20px;padding:14px 16px;background:#eff6ff;border-left:3px solid #193cb8;color:#1e293b;">${multiline(data.response)}</div>` +
      `<p style="margin:0 0 6px;font-weight:bold;color:#64748b;font-size:13px;">Su solicitud</p>` +
      `<div style="margin:0;padding:12px 14px;background:#f8fafc;border-left:3px solid #cbd5e1;color:#64748b;font-size:14px;">${multiline(data.summary)}</div>`,
    bodyText: [
      `Hola, ${data.name}.`,
      '',
      `Esta es la respuesta a su ${type}.`,
      '',
      rowsText([
        ...rows(data, false),
        { label: 'Fecha de respuesta', value: dateFormatter.format(new Date(data.respondedAt)) },
      ]),
      '',
      'Respuesta:',
      data.response,
      '',
      'Su solicitud:',
      data.summary,
    ].join('\n'),
  })
  return { to: data.email, subject, html, text }
}
