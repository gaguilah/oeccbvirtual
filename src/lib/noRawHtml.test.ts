import { describe, expect, it } from 'vitest'

// Todo el código de la app como texto (sin las pruebas, que nombran estas APIs a propósito).
const sources = import.meta.glob(['/src/**/*.{ts,tsx}', '!/src/**/*.test.ts'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

// APIs que convierten un texto en HTML o en código. React escapa todo lo que muestra; con estas,
// un texto escrito por alguien (PQRS, nombres, preguntas de encuestas) podría ejecutarse.
const RAW_HTML =
  /dangerouslySetInnerHTML|\.innerHTML|\.outerHTML|insertAdjacentHTML|document\.write|\beval\(|new Function\(/

describe('ningún texto se muestra como HTML', () => {
  it('la búsqueda lee los archivos de la app', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(100)
    expect(Object.keys(sources)).toContain('/src/App.tsx')
  })

  it('src no usa innerHTML, dangerouslySetInnerHTML, eval ni similares', () => {
    const offenders = Object.entries(sources)
      .filter(([, source]) => RAW_HTML.test(source))
      .map(([path]) => path)
    expect(offenders).toEqual([])
  })
})
