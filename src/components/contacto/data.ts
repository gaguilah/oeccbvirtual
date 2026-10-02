// Textos de la ilustración de contacto (decorativa). Los datos salen de lib/contact.ts.
import {
  CONTACT_ADDRESS,
  CONTACT_CITY,
  CONTACT_DEPARTMENT,
  CONTACT_EMAIL,
  CONTACT_HOURS,
  CONTACT_HOURS_NOTE,
} from '../../lib/contact'

export const contactMap = {
  panel: 'Ubicación',
  title: 'Oficina OECCB',
  address: CONTACT_ADDRESS,
  city: `${CONTACT_CITY}, ${CONTACT_DEPARTMENT}`,
}

export const contactEmail = {
  title: 'Correo electrónico',
  to: CONTACT_EMAIL,
  subject: 'Solicitud de información',
}

export const contactAttention = {
  panel: 'Atención',
  title: 'Horario',
  days: 'Lunes a viernes',
  hours: CONTACT_HOURS.replace(' a ', ' – '),
  note: CONTACT_HOURS_NOTE,
  channels: ['PQRS', 'Encuesta', 'Tutoriales'],
  channelStatus: 'En línea',
}
