// Juzgados a los que apoya la oficina: fuente única de sus nombres para todo el sitio (footer y
// Avisos de Remate). Ver docs/plan-footer.md.
import { CONTACT_CITY } from './contact'

export type CourtNumber = 1 | 2

export type CourtInfo = {
  number: CourtNumber
  short: string
  name: string
  // Código del despacho en el portal de publicaciones procesales de la Rama Judicial.
  despacho: string
}

// Nombre oficial: "Juzgado 1 Civil del Circuito de Ejecución de Sentencias de Bucaramanga".
function courtName(number: CourtNumber) {
  return `Juzgado ${number} Civil del Circuito de Ejecución de Sentencias de ${CONTACT_CITY}`
}

export const COURTS: CourtInfo[] = [
  { number: 1, short: 'Juzgado 1', name: courtName(1), despacho: '680013403001' },
  { number: 2, short: 'Juzgado 2', name: courtName(2), despacho: '680013403002' },
]

export function courtByNumber(number: CourtNumber): CourtInfo {
  return COURTS.find((court) => court.number === number) ?? COURTS[0]
}

// Portal de publicaciones procesales. Si la Rama Judicial cambia la página o el identificador
// del portlet, se corrige solo aquí.
export const PUBLICATIONS_PAGE =
  'https://publicacionesprocesales.ramajudicial.gov.co/web/publicaciones-procesales/inicio'
const PORTLET = 'co_com_avanti_efectosProcesales_PublicacionesEfectosProcesalesPortletV2_INSTANCE_BIyXQFHVaYaq'

// Publicaciones procesales de un despacho, ya filtradas (verificado el 2026-10-04).
export function courtPublicationsUrl(despacho: string): string {
  const params = new URLSearchParams({
    p_p_id: PORTLET,
    p_p_lifecycle: '0',
    p_p_state: 'normal',
    p_p_mode: 'view',
    [`_${PORTLET}_action`]: 'busqueda',
    [`_${PORTLET}_idDepto`]: ' ',
    [`_${PORTLET}_idDespacho`]: despacho,
    [`_${PORTLET}_verTotales`]: 'true',
  })
  return `${PUBLICATIONS_PAGE}?${params}`
}
