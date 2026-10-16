// Correos de la cuenta del dashboard: enlace para crear una contraseña nueva y aviso de que se
// cambió (docs/plan-recuperar-contrasena.md).
import { escapeHtml, layout } from './layout.ts'

// Vigencia del enlace: la del token de recuperación de Supabase Auth (1 hora, panel de Auth).
const LINK_VALIDITY = '1 hora'

const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

function buttonHtml(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 16px;"><tr><td style="border-radius:8px;background:#193cb8;">
<a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 22px;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;border-radius:8px;">${escapeHtml(label)}</a>
</td></tr></table>`
}

const greeting = (name: string | null) => (name ? `Hola, ${name}.` : 'Hola.')

export function passwordResetEmail({ to, name, url }: { to: string; name: string | null; url: string }) {
  const subject = 'Cree una contraseña nueva – OECCB Virtual'
  const { html, text } = layout({
    preview: `Enlace para crear una contraseña nueva, válido por ${LINK_VALIDITY}.`,
    title: 'Cree una contraseña nueva',
    bodyHtml:
      `<p style="margin:0 0 12px;">${escapeHtml(greeting(name))}</p>` +
      `<p style="margin:0 0 12px;">Recibimos una solicitud para recuperar la contraseña de su cuenta del dashboard de OECCB Virtual. Use este botón para crear una nueva:</p>` +
      buttonHtml(url, 'Crear contraseña nueva') +
      `<p style="margin:0 0 12px;">El enlace es válido por <strong>${LINK_VALIDITY}</strong> y se puede usar una sola vez.</p>` +
      `<p style="margin:0;">Si usted no lo pidió, ignore este correo: su contraseña actual sigue funcionando.</p>`,
    bodyText: [
      greeting(name),
      '',
      'Recibimos una solicitud para recuperar la contraseña de su cuenta del dashboard de OECCB Virtual. Abra este enlace para crear una nueva:',
      url,
      '',
      `El enlace es válido por ${LINK_VALIDITY} y se puede usar una sola vez.`,
      '',
      'Si usted no lo pidió, ignore este correo: su contraseña actual sigue funcionando.',
    ].join('\n'),
  })
  return { to, subject, html, text }
}

export function passwordChangedEmail({ to, name, changedAt }: { to: string; name: string | null; changedAt: string }) {
  const when = dateFormatter.format(new Date(changedAt))
  const subject = 'Su contraseña se cambió – OECCB Virtual'
  const { html, text } = layout({
    preview: `La contraseña de su cuenta se cambió el ${when}.`,
    title: 'Su contraseña se cambió',
    bodyHtml:
      `<p style="margin:0 0 12px;">${escapeHtml(greeting(name))}</p>` +
      `<p style="margin:0 0 12px;">La contraseña de su cuenta del dashboard de OECCB Virtual se cambió el <strong>${escapeHtml(when)}</strong>. Las sesiones abiertas en otros equipos se cerraron.</p>` +
      `<p style="margin:0;">Si usted no hizo este cambio, avise de inmediato al Administrador de Sistema.</p>`,
    bodyText: [
      greeting(name),
      '',
      `La contraseña de su cuenta del dashboard de OECCB Virtual se cambió el ${when}. Las sesiones abiertas en otros equipos se cerraron.`,
      '',
      'Si usted no hizo este cambio, avise de inmediato al Administrador de Sistema.',
    ].join('\n'),
  })
  return { to, subject, html, text }
}
