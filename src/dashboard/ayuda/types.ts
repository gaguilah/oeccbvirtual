// Contenido de la Ayuda (docs/plan-ayuda.md). Los textos aceptan **negrita** y nada más.

export type GuideSlug = 'mi-perfil' | 'audiencias' | 'avisos-remates' | 'pqrs' | 'encuestas' | 'administracion'

export type GuideBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  // Lista numerada (pasos).
  | { type: 'steps'; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'note'; title?: string; text: string; tone?: 'info' | 'warning' }
  // Tabla "Quién puede hacer qué", armada con los permisos reales de la base (RolesTable).
  | { type: 'roles' }

export type GuideSection = {
  // Ancla dentro de la guía (#<slug>-<id>).
  id: string
  title: string
  blocks: GuideBlock[]
}

export type GuideFaq = { q: string; a: string }

export type GuideContent = {
  summary: string
  sections: GuideSection[]
  faq: GuideFaq[]
}

export type GuideMeta = {
  slug: GuideSlug
  // Nombre de la pestaña.
  title: string
  // Módulos de permisos de la tabla en vivo (vacío: la guía no la muestra).
  modules: string[]
  // Rutas del dashboard que explica: el botón Ayuda de la Topbar abre esta guía desde ellas.
  paths: string[]
}

// Rol con sus permisos, para la tabla en vivo.
export type RoleAccess = {
  name: string
  scope: 'all' | 'court'
  isSystem: boolean
  permissions: string[]
}
