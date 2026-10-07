// Términos y condiciones de tratamiento de datos personales de las PQRS (texto aprobado en
// docs/terminos-tratamiento-datos.md). Se muestran en TermsModal; para cambiarlos, editar solo aquí
// (y el documento). Los datos de la oficina salen de src/lib/contact.ts.
import {
  CONTACT_ADDRESS,
  CONTACT_CITY,
  CONTACT_DAYS,
  CONTACT_DEPARTMENT,
  CONTACT_EMAIL,
  CONTACT_HOURS,
  NOTIFICATIONS_EMAIL,
  OFFICE_NAME,
} from '../../lib/contact'

export type TermsSection = {
  title: string
  paragraphs?: string[]
  items?: string[]
  // Texto después de la lista.
  after?: string[]
}

export const TERMS_TITLE = 'Términos y condiciones de tratamiento de datos personales'

export const TERMS_INTRO = `Al enviar una petición, queja, reclamo, sugerencia o felicitación (PQRS) por este sitio, usted autoriza de manera previa, expresa e informada a la ${OFFICE_NAME} para tratar sus datos personales en los términos que se describen a continuación, conforme al artículo 15 de la Constitución Política, la Ley 1581 de 2012, la Ley 1266 de 2008, la Ley 1712 de 2014 y el Decreto 1074 de 2015 (capítulo 25).`

export const TERMS_SECTIONS: TermsSection[] = [
  {
    title: '1. Responsable del tratamiento',
    items: [
      `Entidad: ${OFFICE_NAME} (Rama Judicial).`,
      `Dirección: ${CONTACT_ADDRESS}, ${CONTACT_CITY}, ${CONTACT_DEPARTMENT}.`,
      `Correo: ${CONTACT_EMAIL}`,
      // CONTACT_HOURS ya termina en "p. m.": sin punto final.
      `Horario de atención: ${CONTACT_DAYS.toLowerCase()}, ${CONTACT_HOURS}`,
    ],
  },
  {
    title: '2. Datos que se recolectan',
    items: [
      'Nombre completo.',
      'Correo electrónico.',
      'Tipo de solicitud y el contenido que usted escriba en ella.',
      'Fecha y hora de la solicitud y el número de radicado asignado.',
      'Datos técnicos de la verificación de seguridad (captcha), usados solo para evitar envíos automatizados.',
    ],
    after: [
      'No incluya datos sensibles (salud, origen étnico, orientación política, religiosa o sexual, datos biométricos, etc.) ni datos de niños, niñas o adolescentes en el texto de su solicitud, salvo que sean indispensables para el trámite.',
    ],
  },
  {
    title: '3. Finalidad',
    paragraphs: ['Sus datos se usan únicamente para:'],
    items: [
      'Radicar, tramitar y responder su PQRS.',
      'Enviarle a su correo el número de radicado y la respuesta.',
      'Contactarle, si es necesario, para aclarar o completar su solicitud.',
      'Elaborar estadísticas internas sin datos que le identifiquen, para mejorar el servicio.',
    ],
    after: ['No se usan con fines comerciales ni publicitarios, ni se venden o ceden a terceros.'],
  },
  {
    title: '4. Cómo se tratan y almacenan',
    items: [
      'La información se guarda en la base de datos del sitio, con acceso restringido al personal autorizado de la oficina.',
      'Para operar el sitio se usan proveedores tecnológicos que actúan como encargados del tratamiento: alojamiento y base de datos (Supabase), envío de correos (Resend), publicación del sitio (Netlify) y verificación de seguridad (Cloudflare Turnstile). Sus servidores pueden estar fuera de Colombia; al aceptar estos términos usted autoriza esa transmisión, que se hace solo para las finalidades descritas.',
      'Los datos permanecen almacenados por el tiempo determinado o indicado por la ley para el cumplimiento de las finalidades descritas.',
    ],
  },
  {
    title: '5. Derechos del titular',
    paragraphs: ['Como titular de los datos, usted tiene derecho a (artículo 8 de la Ley 1581 de 2012):'],
    items: [
      'Conocer, actualizar y rectificar sus datos.',
      'Solicitar prueba de la autorización otorgada.',
      'Ser informado sobre el uso que se ha dado a sus datos.',
      'Presentar quejas ante la Superintendencia de Industria y Comercio por infracciones a la ley.',
      'Revocar la autorización y solicitar la supresión de sus datos, cuando no exista un deber legal o contractual de conservarlos.',
      'Acceder gratuitamente a sus datos.',
    ],
  },
  {
    title: '6. Cómo ejercer sus derechos',
    paragraphs: [
      `Escriba a ${CONTACT_EMAIL} indicando su nombre, el número de radicado (si lo tiene) y lo que solicita.`,
    ],
    items: [
      'Consultas: se responden en un máximo de diez (10) días hábiles.',
      'Reclamos (corrección, actualización, supresión o revocatoria): se responden en un máximo de quince (15) días hábiles.',
    ],
    after: [
      'Estos plazos son los de los artículos 14 y 15 de la Ley 1581 de 2012 y pueden prorrogarse en los casos que la ley permite.',
    ],
  },
  {
    title: '7. Correo de notificaciones',
    paragraphs: [
      `Los correos automáticos se envían desde ${NOTIFICATIONS_EMAIL}, que solo envía mensajes y no recibe correos. Para cualquier comunicación utilice los canales de atención publicados en la página de Contacto. Ese buzón no es un canal judicial.`,
    ],
  },
  {
    title: '8. Aceptación y vigencia',
    paragraphs: [
      'Al marcar la casilla "He leído y acepto los términos y condiciones de tratamiento de datos personales" y enviar su solicitud, usted declara que leyó estos términos y autoriza el tratamiento de sus datos. Se guarda la fecha y hora de su aceptación como prueba de la autorización.',
      'Estos términos rigen desde su publicación en este sitio. Cualquier cambio se publicará aquí.',
    ],
  },
  {
    title: '9. Política de la Rama Judicial',
    paragraphs: [
      'En lo no previsto en estos términos, se aplica la Política de privacidad y tratamiento de datos personales de la Rama Judicial, publicada en www.ramajudicial.gov.co.',
    ],
  },
]
