import { describe, expect, it } from 'vitest'

// Todas las migraciones como texto (docs/plan-seguridad-supabase.md, Fase 1).
const migrations = import.meta.glob<string>('/supabase/migrations/*.sql', {
  query: '?raw',
  import: 'default',
  eager: true,
})

// Tablas creadas antes de que las migraciones hicieran `revoke all` en el mismo archivo. Sus permisos
// se corrigieron después (por último en 20261103120000_security_cleanup.sql). No agregar tablas nuevas
// aquí: cada tabla nueva trae su RLS y su `revoke all` en la migración que la crea.
const LEGACY_WITHOUT_REVOKE = new Set([
  'surveys',
  'survey_questions',
  'survey_responses',
  'survey_answers',
  'customer_requests',
  'pdf_folders',
  'auction_notices',
  'profiles', // solo `revoke all` para anon; a authenticated le quita la escritura
])

// Quita los comentarios de línea para no contar SQL de ejemplo escrito en ellos.
const stripComments = (sql: string) => sql.replace(/--.*$/gm, '')

const createdTables = (sql: string) =>
  [...sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?public\.([a-z_]+)/gi)].map((match) =>
    match[1].toLowerCase(),
  )

// Roles a los que una migración quita todo sobre la tabla (`revoke all on [table] public.a, public.b from x, y`).
function revokedRoles(sql: string, table: string): Set<string> {
  const roles = new Set<string>()
  for (const match of sql.matchAll(/revoke\s+all\s+on\s+(?:table\s+)?([^;]+?)\s+from\s+([^;]+);/gi)) {
    const tables = match[1].split(',').map((name) => name.trim().toLowerCase())
    if (!tables.includes(`public.${table}`)) continue
    for (const role of match[2].split(',')) roles.add(role.trim().toLowerCase())
  }
  return roles
}

const enablesRls = (sql: string, table: string) =>
  new RegExp(
    `alter\\s+table\\s+(?:if\\s+exists\\s+)?(?:only\\s+)?public\\.${table}\\s+enable\\s+row\\s+level\\s+security`,
    'i',
  ).test(sql)

const entries = Object.entries(migrations).map(([path, sql]) => [path, stripComments(sql)] as const)

describe('migraciones de Supabase', () => {
  it('encuentra las migraciones', () => {
    expect(entries.length).toBeGreaterThan(20)
  })

  it('cada tabla nueva activa RLS en la misma migración', () => {
    for (const [path, sql] of entries) {
      for (const table of createdTables(sql)) expect(enablesRls(sql, table), `${path}: ${table}`).toBe(true)
    }
  })

  it('cada tabla nueva quita todos los permisos a anon y authenticated en la misma migración', () => {
    for (const [path, sql] of entries) {
      for (const table of createdTables(sql)) {
        if (LEGACY_WITHOUT_REVOKE.has(table)) continue
        const roles = revokedRoles(sql, table)
        expect(roles.has('anon') && roles.has('authenticated'), `${path}: ${table}`).toBe(true)
      }
    }
  })

  it('la lista de excepciones solo tiene tablas que existen', () => {
    const all = new Set(entries.flatMap(([, sql]) => createdTables(sql)))
    for (const table of LEGACY_WITHOUT_REVOKE) expect(all.has(table), table).toBe(true)
  })

  it('la limpieza de seguridad quita los permisos que la RLS no frena', () => {
    const cleanup = entries.find(([path]) => path.endsWith('20261103120000_security_cleanup.sql'))?.[1]
    expect(cleanup).toBeDefined()
    expect(cleanup).toMatch(
      /revoke all on table public\.survey_responses, public\.survey_answers from anon, authenticated;/,
    )
    expect(cleanup).toMatch(
      /revoke truncate, references, trigger, maintain on all tables in schema public from anon, authenticated;/,
    )
    expect(cleanup).toMatch(/alter function public\.handle_new_user\(\) set search_path = '';/)
  })
})
