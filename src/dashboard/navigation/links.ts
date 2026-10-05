// Opciones del dashboard: fuente única del menú lateral, del título de la Topbar y de las tarjetas
// de Inicio. El orden del arreglo es el orden del menú. Ver docs/plan-dashboard.md.
import { services } from '../../components/services'
import { icons } from '../ui/icons'

export type DashboardLink = {
  to: string
  label: string
  // Texto de la tarjeta en Inicio.
  description: string
  // Trazos del icono (Heroicons outline, viewBox 24×24).
  icon: string[]
  // 'admin' va al final del menú, bajo el título "Administración". 'account' (Mi perfil) no va en
  // el menú ni en Inicio: se abre desde el botón de perfil de la Topbar.
  group: 'main' | 'admin' | 'account'
  // false: el menú muestra "Pronto", Inicio "Próximamente" y la ruta muestra SectionPending.
  ready: boolean
  // Permiso que muestra la opción en el menú y en Inicio y deja entrar a su ruta (RequirePermission).
  // Sin permiso: cualquier usuario con acceso (Inicio, Mi perfil). superadmin las ve todas, incluso
  // las de permisos que aún no existen en el catálogo (los crea la migración de cada sección).
  permission?: string
  // Solo Inicio: así no queda resaltado en las subrutas.
  end?: boolean
}

export const DASHBOARD_HOME = '/dashboard'

// Mismo ícono que el servicio público de Avisos de Remate.
const auctionIcon = services.find((service) => service.to === '/avisos-remates')?.icon ?? []

export const dashboardLinks: DashboardLink[] = [
  {
    to: DASHBOARD_HOME,
    label: 'Inicio',
    description: 'Resumen y accesos a las secciones.',
    icon: [
      'm2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
    ],
    group: 'main',
    ready: true,
    end: true,
  },
  {
    to: `${DASHBOARD_HOME}/avisos-remates`,
    permission: 'remates.ver',
    label: 'Avisos de Remate',
    description: 'Cree, edite y publique los avisos de remate.',
    icon: auctionIcon,
    group: 'main',
    ready: false,
  },
  {
    to: `${DASHBOARD_HOME}/audiencias`,
    permission: 'audiencias.ver',
    label: 'Audiencias',
    description: 'Programación y seguimiento de las audiencias.',
    icon: [
      'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5',
    ],
    group: 'main',
    ready: false,
  },
  {
    to: `${DASHBOARD_HOME}/pqrs`,
    permission: 'pqrs.ver',
    label: 'PQRS',
    description: 'Revise y responda las solicitudes de los ciudadanos.',
    icon: [
      'M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z',
    ],
    group: 'main',
    ready: false,
  },
  {
    to: `${DASHBOARD_HOME}/encuestas`,
    permission: 'encuestas.ver',
    label: 'Encuestas',
    description: 'Estadísticas de la encuesta de satisfacción.',
    icon: [
      'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z',
    ],
    group: 'main',
    ready: false,
  },
  {
    to: `${DASHBOARD_HOME}/usuarios`,
    permission: 'usuarios.ver',
    label: 'Usuarios',
    description: 'Cuentas, roles y permisos de acceso al dashboard.',
    icon: [
      'M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z',
    ],
    group: 'admin',
    ready: true,
  },
  {
    to: `${DASHBOARD_HOME}/roles`,
    permission: 'roles.ver',
    label: 'Roles',
    description: 'Roles, su alcance (un juzgado o los dos) y sus permisos.',
    icon: icons.shield,
    group: 'admin',
    ready: false,
  },
  {
    to: `${DASHBOARD_HOME}/permisos`,
    permission: 'permisos.ver',
    label: 'Permisos',
    description: 'Catálogo de permisos agrupado por módulo.',
    icon: icons.key,
    group: 'admin',
    ready: false,
  },
  {
    to: `${DASHBOARD_HOME}/perfil`,
    label: 'Mi perfil',
    description: 'Nombre y contraseña de su cuenta.',
    icon: [],
    group: 'account',
    ready: true,
  },
]

export const PROFILE_LINK = dashboardLinks.find((link) => link.group === 'account')!

// Opción que corresponde a una ruta: Inicio solo con la ruta exacta; las demás también en sus
// subrutas (p. ej. /dashboard/pqrs/123).
export function linkForPath(pathname: string): DashboardLink | undefined {
  const path = pathname.replace(/\/+$/, '')
  return dashboardLinks.find((link) =>
    link.end ? path === link.to : path === link.to || path.startsWith(`${link.to}/`),
  )
}

// Ruta relativa a /dashboard, para las rutas anidadas (p. ej. 'pqrs').
export function relativePath(link: DashboardLink): string {
  return link.to.slice(DASHBOARD_HOME.length + 1)
}
