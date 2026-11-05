import { describe, expect, it } from 'vitest'
import keysSource from '../../supabase/functions/_shared/keys.ts?raw'

// Las Edge Functions como texto (docs/plan-seguridad-supabase.md, Fase 2): las claves antiguas de
// Supabase (anon y service_role) se retiran a inicios de 2027.
const functions = import.meta.glob<string>('/supabase/functions/*/index.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const entries = Object.entries(functions)

describe('claves de Supabase en las Edge Functions', () => {
  it('encuentra las funciones', () => {
    expect(entries.length).toBeGreaterThanOrEqual(6)
  })

  it('ninguna función lee las claves antiguas', () => {
    for (const [path, source] of entries) {
      expect(source, path).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY|SUPABASE_ANON_KEY/)
    }
  })

  it('cada función que crea un cliente toma sus claves de _shared/keys.ts', () => {
    for (const [path, source] of entries) {
      if (!source.includes('createClient(')) continue
      expect(source, path).toContain("from '../_shared/keys.ts'")
      for (const call of source.matchAll(/createClient\(([^,]+),\s*([\w.]+(?:\(\))?)/g)) {
        expect(call[2].trim(), path).toMatch(/^(secretKey|publishableKey)\(\)$/)
      }
    }
  })

  it('keys.ts lee las claves nuevas por nombre y sin volver a las antiguas', () => {
    expect(keysSource).toContain("readKey('SUPABASE_SECRET_KEYS')")
    expect(keysSource).toContain("readKey('SUPABASE_PUBLISHABLE_KEYS')")
    expect(keysSource).toContain("const KEY_NAME = 'default'")
  })
})
