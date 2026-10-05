// Enlaces de interés: sitios externos de la Rama Judicial. Fuente única para el footer y el
// inicio. El orden del arreglo es el orden en pantalla. Ver docs/plan-enlaces-interes.md.
import { PUBLICATIONS_PAGE } from './courts'

export type ExternalLink = {
  href: string
  title: string
  description: string
  // Trazos del icono (Heroicons outline, viewBox 24×24).
  icon: string[]
}

// URL verificadas el 2026-10-05.
export const INTEREST_LINKS: ExternalLink[] = [
  {
    href: 'https://www.ramajudicial.gov.co',
    title: 'Rama Judicial',
    description: 'Portal oficial de la Rama Judicial de Colombia.',
    icon: [
      'M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z',
    ],
  },
  {
    href: PUBLICATIONS_PAGE,
    title: 'Publicaciones Procesales',
    description: 'Estados, traslados, edictos y demás publicaciones de los despachos.',
    icon: [
      'M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z',
    ],
  },
  {
    href: 'https://consultaprocesos.ramajudicial.gov.co/procesos/bienvenida',
    title: 'Consulta de Procesos',
    description: 'Consulte el estado y las actuaciones de un proceso por número de radicación o por nombre.',
    icon: [
      'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z',
    ],
  },
]
