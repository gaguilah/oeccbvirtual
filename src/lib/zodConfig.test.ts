import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import mainSource from '../main.tsx?raw'
import './zodConfig'

describe('zod sin eval', () => {
  it('queda en modo jitless (la Content-Security-Policy no permite eval)', () => {
    expect(z.config().jitless).toBe(true)
  })

  it('main.tsx lo importa antes que todo lo demás', () => {
    expect(mainSource.trimStart().startsWith("import './lib/zodConfig'")).toBe(true)
  })

  it('las validaciones siguen funcionando', () => {
    const schema = z.object({ name: z.string().min(2) })
    expect(schema.safeParse({ name: 'Ana' }).success).toBe(true)
    expect(schema.safeParse({ name: 'A' }).success).toBe(false)
  })
})
