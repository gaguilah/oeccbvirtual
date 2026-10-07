// Datos de la oficina para los correos. Las Edge Functions (Deno) no importan src/: estos valores
// repiten los de src/lib/contact.ts; si cambian allá, cambiarlos aquí también.
export const OFFICE_NAME =
  'Oficina de Apoyo para los Juzgados Civiles del Circuito de Ejecución de Sentencias de Bucaramanga'
export const SITE_NAME = 'OECCB Virtual'
export const SITE_URL = 'https://oeccbvirtual.app'

// Buzón judicial autorizado de la oficina (CONTACT_EMAIL). Recibe el aviso de cada PQRS nueva y
// las respuestas que la oficina dé desde ese aviso van al ciudadano (reply_to).
export const OFFICE_EMAIL = 'ofejccbuc@cendoj.ramajudicial.gov.co'
// Remitente de los correos automáticos (NOTIFICATIONS_EMAIL). Solo envía: no recibe correos.
export const NOTIFICATIONS_EMAIL = 'notificaciones@oeccbvirtual.app'

export const OFFICE_ADDRESS = 'Carrera 12 No. 31-08, Bucaramanga, Santander'
export const OFFICE_HOURS = 'Lunes a viernes (días hábiles), 08:00 a. m. a 04:00 p. m., jornada continua'

// Pie de todos los correos: notificaciones@ es solo para enviar (no recibe correos), así que se
// pide no contestar y se remite a los canales de atención (página /contacto).
export const AUTO_NOTICE = {
  text: 'Este es un mensaje automático. Por favor, no conteste. Estamos disponibles en nuestros',
  linkLabel: 'canales de atención',
  url: `${SITE_URL}/contacto`,
  closing: 'Gracias.',
}
