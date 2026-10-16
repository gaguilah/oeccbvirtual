import { DASHBOARD_HOME, HELP_LINK } from '../navigation/links'
import type { GuideMeta, GuideSlug } from './types'

export const HELP_PATH = HELP_LINK.to

// Parámetro de la URL con la pestaña abierta (/dashboard/ayuda?guia=audiencias).
export const GUIDE_PARAM = 'guia'

// Pestañas de la Ayuda, en orden. Todos los usuarios ven todas (docs/plan-ayuda.md).
export const GUIDES: GuideMeta[] = [
  { slug: 'mi-perfil', title: 'Mi perfil', modules: [], paths: [`${DASHBOARD_HOME}/perfil`] },
  { slug: 'audiencias', title: 'Audiencias', modules: ['audiencias'], paths: [`${DASHBOARD_HOME}/audiencias`] },
  {
    slug: 'avisos-remates',
    title: 'Avisos de Remate',
    modules: ['remates'],
    paths: [`${DASHBOARD_HOME}/avisos-remates`],
  },
  { slug: 'pqrs', title: 'PQRS', modules: ['pqrs'], paths: [`${DASHBOARD_HOME}/pqrs`] },
  { slug: 'encuestas', title: 'Encuestas', modules: ['encuestas'], paths: [`${DASHBOARD_HOME}/encuestas`] },
  {
    slug: 'administracion',
    title: 'Administración',
    modules: ['usuarios', 'roles', 'permisos', 'calendario'],
    paths: [
      `${DASHBOARD_HOME}/usuarios`,
      `${DASHBOARD_HOME}/roles`,
      `${DASHBOARD_HOME}/permisos`,
      `${DASHBOARD_HOME}/dias-no-habiles`,
    ],
  },
]

export const DEFAULT_GUIDE: GuideSlug = 'mi-perfil'

export function findGuide(slug: string | null): GuideMeta {
  return GUIDES.find((guide) => guide.slug === slug) ?? GUIDES[0]
}

// Guía que explica una ruta (también sus subrutas, p. ej. /dashboard/pqrs/123); null si ninguna.
export function guideForPath(pathname: string): GuideSlug | null {
  const path = pathname.replace(/\/+$/, '')
  const guide = GUIDES.find((item) => item.paths.some((p) => path === p || path.startsWith(`${p}/`)))
  return guide?.slug ?? null
}

export function helpPath(slug: GuideSlug | null = null): string {
  return slug ? `${HELP_PATH}?${GUIDE_PARAM}=${slug}` : HELP_PATH
}

// Ancla de una sección dentro de su guía.
export const sectionAnchor = (slug: GuideSlug, id: string) => `${slug}-${id}`
