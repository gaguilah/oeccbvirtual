// Estructura común de los correos: HTML sencillo con tablas y estilos en línea (lo que mejor se
// ve en Gmail, Outlook y celulares) y su versión en texto plano.
import { AUTO_NOTICE, OFFICE_ADDRESS, OFFICE_EMAIL, OFFICE_HOURS, OFFICE_NAME, SITE_NAME, SITE_URL } from '../office.ts'

// Todo texto que venga de un usuario (nombre, resumen) pasa por aquí antes de ir al HTML.
export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

// Texto con saltos de línea → párrafo HTML (ya escapado).
export function multiline(value: string): string {
  return escapeHtml(value).replaceAll('\n', '<br>')
}

export type Row = { label: string; value: string }

// Tabla de datos (radicado, tipo, fecha…). Los valores se escapan.
export function rowsHtml(rows: Row[]): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:16px 0;">${rows
    .map(
      (row) =>
        `<tr><td style="padding:8px 12px;background:#f1f5f9;color:#475569;font-size:13px;width:35%;vertical-align:top;">${escapeHtml(row.label)}</td>` +
        `<td style="padding:8px 12px;background:#f8fafc;color:#1e293b;font-size:14px;font-weight:600;vertical-align:top;">${escapeHtml(row.value)}</td></tr>`,
    )
    .join('')}</table>`
}

export function rowsText(rows: Row[]): string {
  return rows.map((row) => `${row.label}: ${row.value}`).join('\n')
}

type Layout = {
  // Texto de vista previa (lo que muestra la bandeja junto al asunto).
  preview: string
  title: string
  // Contenido ya en HTML (escapar lo que venga de usuarios).
  bodyHtml: string
  bodyText: string
}

// Envoltura de marca: encabezado OECCB Virtual, contenido, datos de contacto y el aviso de mensaje
// automático (AUTO_NOTICE: no contestar, ir a los canales de atención).
export function layout({ preview, title, bodyHtml, bodyText }: Layout): { html: string; text: string } {
  const html = `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#1e293b;">
<span style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preview)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
<tr><td style="background:#193cb8;padding:20px 28px;">
<span style="color:#ffffff;font-size:20px;font-weight:bold;">OECCB</span><span style="color:#bfdbfe;font-size:20px;font-weight:bold;"> Virtual</span>
</td></tr>
<tr><td style="padding:28px;">
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0f172a;">${escapeHtml(title)}</h1>
<div style="font-size:15px;line-height:1.6;color:#334155;">${bodyHtml}</div>
</td></tr>
<tr><td style="padding:20px 28px;background:#f8fafc;font-size:12px;line-height:1.6;color:#64748b;">
<p style="margin:0 0 8px;"><strong style="color:#334155;">${escapeHtml(OFFICE_NAME)}</strong><br>${escapeHtml(OFFICE_ADDRESS)}<br>${escapeHtml(OFFICE_HOURS)}<br><a href="mailto:${OFFICE_EMAIL}" style="color:#193cb8;">${OFFICE_EMAIL}</a></p>
<p style="margin:0 0 8px;padding:10px 12px;background:#e2e8f0;color:#334155;border-radius:6px;">${escapeHtml(AUTO_NOTICE.text)} <a href="${AUTO_NOTICE.url}" style="color:#193cb8;font-weight:bold;">${escapeHtml(AUTO_NOTICE.linkLabel)}</a>. ${escapeHtml(AUTO_NOTICE.closing)}</p>
<p style="margin:0;"><a href="${SITE_URL}" style="color:#193cb8;">${SITE_NAME}</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`

  const text = [
    title,
    '',
    bodyText,
    '',
    '—',
    OFFICE_NAME,
    OFFICE_ADDRESS,
    OFFICE_HOURS,
    OFFICE_EMAIL,
    '',
    `${AUTO_NOTICE.text} ${AUTO_NOTICE.linkLabel}: ${AUTO_NOTICE.url}. ${AUTO_NOTICE.closing}`,
    '',
    `${SITE_NAME} · ${SITE_URL}`,
  ].join('\n')

  return { html, text }
}
