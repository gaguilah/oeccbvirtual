// Datos de contacto de la oficina, compartidos por Footer y las páginas públicas.

// Nombre oficial de la oficina (OECCB).
export const OFFICE_NAME =
  'Oficina de Apoyo para los Juzgados Civiles del Circuito de Ejecución de Sentencias de Bucaramanga'

// Nombre del sitio: título de la pestaña ("OECCB Virtual | Página", ver useDocumentMeta).
export const SITE_NAME = 'OECCB Virtual'

export const CONTACT_EMAIL = 'ofejccbuc@cendoj.ramajudicial.gov.co'

// Remitente de los correos automáticos de PQRS (Resend). No es un buzón judicial: solo para el
// trámite de PQRS. Si cambia, cambiarlo también en supabase/functions/_shared/office.ts.
export const NOTIFICATIONS_EMAIL = 'notificaciones@oeccbvirtual.app'
export const CONTACT_ADDRESS = 'Carrera 12 No. 31-08'
export const CONTACT_CITY = 'Bucaramanga'
export const CONTACT_DEPARTMENT = 'Santander'

// Horario de atención.
export const CONTACT_DAYS = 'Lunes a viernes (días hábiles)'
export const CONTACT_HOURS = '08:00 a. m. a 04:00 p. m.'
export const CONTACT_HOURS_NOTE = 'Jornada continua'

// Búsqueda de la dirección en Google Maps (enlace; no se incrusta ningún mapa).
export const CONTACT_MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${CONTACT_ADDRESS}, ${CONTACT_CITY}, ${CONTACT_DEPARTMENT}, Colombia`,
)}`
