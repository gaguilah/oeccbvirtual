import { describe, expect, it } from 'vitest'
// Rutas del dashboard como texto, para comprobar que cada opción del menú tiene destino y el mismo permiso.
import routesSource from '../routes.tsx?raw'
import { DASHBOARD_HOME, dashboardLinks, HELP_LINK, linkForPath, PROFILE_LINK, relativePath } from './links'

const migrations = import.meta.glob('/supabase/migrations/*.sql', { query: '?raw', import: 'default', eager: true })
// Códigos que crean las migraciones (insert into public.permissions … values ('modulo.accion', …)).
const permissionCodes = new Set(
  Object.values(migrations).flatMap((sql) =>
    [...(sql as string).matchAll(/\(\s*'([a-z_]+\.[a-z_]+)',\s*'[a-z_]+',/g)].map((m) => m[1]),
  ),
)

// path → permiso de RequirePermission (o null si la ruta no lo pide).
const routes = new Map(
  [
    ...routesSource.matchAll(/<Route\s+path="([^"]+)"\s+element=\{\s*(?:<RequirePermission permission="([^"]+)")?/g),
  ].map((match) => [match[1], match[2] ?? null]),
)

describe('dashboardLinks', () => {
  it('rutas únicas, todas bajo /dashboard', () => {
    const paths = dashboardLinks.map((link) => link.to)
    expect(new Set(paths).size).toBe(paths.length)
    for (const path of paths) expect(path === DASHBOARD_HOME || path.startsWith(`${DASHBOARD_HOME}/`), path).toBe(true)
  })

  it('cada opción lista tiene su ruta en routes.tsx con el mismo permiso', () => {
    for (const link of dashboardLinks.filter((link) => link.ready && link.to !== DASHBOARD_HOME)) {
      const path = relativePath(link)
      expect(routes.has(path), path).toBe(true)
      expect(routes.get(path), path).toBe(link.permission ?? null)
    }
  })

  it('las opciones del menú y de Inicio piden permiso, salvo Inicio', () => {
    for (const link of dashboardLinks.filter((link) => link.group !== 'account' && link.to !== DASHBOARD_HOME)) {
      expect(link.permission, link.to).toBeTruthy()
    }
  })

  it('cada permiso de las opciones y de las rutas lo crea alguna migración', () => {
    expect(permissionCodes.size).toBeGreaterThan(10)
    const used = [...dashboardLinks.map((link) => link.permission), ...routes.values()].filter(Boolean)
    for (const code of used) expect(permissionCodes, code!).toContain(code)
  })

  it('Mi perfil y Ayuda son de la cuenta y no piden permiso', () => {
    for (const link of [PROFILE_LINK, HELP_LINK]) {
      expect(link.group).toBe('account')
      expect(link.permission).toBeUndefined()
    }
  })
})

describe('linkForPath', () => {
  it('Inicio solo con la ruta exacta (con o sin barra final)', () => {
    expect(linkForPath('/dashboard')?.label).toBe('Inicio')
    expect(linkForPath('/dashboard/')?.label).toBe('Inicio')
    expect(linkForPath('/dashboard/no-existe')).toBeUndefined()
  })

  it('las demás opciones también en sus subrutas', () => {
    expect(linkForPath('/dashboard/pqrs')?.label).toBe('PQRS')
    expect(linkForPath('/dashboard/pqrs/123')?.label).toBe('PQRS')
    expect(linkForPath('/dashboard/avisos-remates/carpetas')?.label).toBe('Avisos de Remate')
    expect(linkForPath('/dashboard/audiencias/tipos/')?.label).toBe('Audiencias')
  })

  it('no confunde un prefijo con una subruta', () => {
    expect(linkForPath('/dashboard/pqrsx')).toBeUndefined()
  })
})

describe('relativePath', () => {
  it('quita /dashboard/', () => {
    expect(relativePath(PROFILE_LINK)).toBe('perfil')
  })
})
