import { describe, expect, it } from 'vitest'
// Configuración del despliegue como texto: si alguien la cambia o la borra, la app sigue compilando y
// las demás pruebas pasan, pero en producción se rompen las rutas o la caché.
import indexHtml from '../../index.html?raw'
import netlifyToml from '../../netlify.toml?raw'
import packageJson from '../../package.json'
import viteConfig from '../../vite.config.ts?raw'

// import.meta.glob necesita un comodín; solo coincide con _redirects.
const publicFiles = import.meta.glob('/public/_redirect*', { query: '?raw', import: 'default', eager: true })
const redirects = publicFiles['/public/_redirects'] as string | undefined

// Líneas con contenido, sin comentarios, con los espacios normalizados.
const rules = (text: string) =>
  text
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*/, '').trim().replace(/\s+/g, ' '))
    .filter(Boolean)

describe('netlify.toml', () => {
  it('compila con npm run build y publica dist (la salida de Vite)', () => {
    expect(netlifyToml).toMatch(/^\s*command = "npm run build"$/m)
    expect(netlifyToml).toMatch(/^\s*publish = "dist"$/m)
    expect(packageJson.scripts.build).toBe('tsc -b && vite build')
    // Sin outDir ni assetsDir propios, Vite deja todo en dist/ y los archivos con hash en dist/assets/.
    expect(viteConfig).not.toMatch(/outDir|assetsDir/)
  })

  it('usa Node 22 (Vite 8 necesita 20.19+ o 22.12+)', () => {
    expect(netlifyToml).toMatch(/^\s*NODE_VERSION = "22"$/m)
    expect(packageJson.devDependencies.vite).toMatch(/^\^8\./)
  })

  it('guarda en caché para siempre solo /assets/* (nombres con hash)', () => {
    expect(netlifyToml).toMatch(
      /for = "\/assets\/\*"\s*\[headers\.values\]\s*Cache-Control = "public, max-age=31536000, immutable"/,
    )
    // index.html no puede quedar en caché inmutable: cada despliegue cambia los nombres de los assets.
    expect(netlifyToml.match(/immutable/g)).toHaveLength(1)
  })
})

// Bloque [[headers]] de una ruta, hasta el siguiente bloque o el final.
const headersFor = (path: string) => {
  const start = netlifyToml.indexOf(`for = "${path}"`)
  if (start === -1) return ''
  const next = netlifyToml.indexOf('[[headers]]', start)
  return netlifyToml.slice(start, next === -1 ? undefined : next)
}

describe('cabeceras de seguridad', () => {
  it('van en todas las rutas (/*), también en index.html y las rutas de la SPA', () => {
    expect(headersFor('/*')).not.toBe('')
  })

  it.each([
    ['X-Content-Type-Options', 'nosniff'],
    ['Referrer-Policy', 'strict-origin-when-cross-origin'],
    ['X-Frame-Options', 'DENY'],
  ])('%s = %s', (name, value) => {
    expect(headersFor('/*')).toMatch(new RegExp(`^\\s*${name} = "${value}"\\s*$`, 'm'))
  })

  it('la caché inmutable sigue solo en /assets/*, no en todas las rutas', () => {
    expect(headersFor('/*')).not.toContain('Cache-Control')
  })
})

describe('Content-Security-Policy', () => {
  const policy = netlifyToml.match(/^\s*Content-Security-Policy = "([^"]+)"$/m)?.[1] ?? ''
  const directive = (name: string) =>
    policy
      .split(';')
      .map((part) => part.trim().split(/\s+/))
      .find(([key]) => key === name)
      ?.slice(1) ?? []

  it('está activa (bloquea, no solo informa) para todas las rutas', () => {
    expect(policy).not.toBe('')
    expect(netlifyToml).not.toMatch(/^\s*Content-Security-Policy-Report-Only =/m)
    expect(headersFor('/*')).toContain(policy)
  })

  it('permite el script del tema de index.html por su huella (cambia si se edita el script)', async () => {
    const script = indexHtml.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? ''
    expect(script).toContain("localStorage.getItem('theme')")
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(script))
    const hash = btoa(String.fromCharCode(...new Uint8Array(digest)))
    expect(directive('script-src')).toContain(`'sha256-${hash}'`)
  })

  it('nunca permite scripts en línea ni eval en general', () => {
    expect(directive('script-src')).not.toContain("'unsafe-inline'")
    expect(policy).not.toContain("'unsafe-eval'")
    // Solo WebAssembly, para el motor de diseño del PDF de audiencias (no habilita eval de JavaScript).
    expect(directive('script-src')).toContain("'wasm-unsafe-eval'")
    // Ese motor viene incrustado como data: y la librería lo descarga con fetch.
    expect(directive('connect-src')).toContain('data:')
    expect(directive('object-src')).toEqual(["'none'"])
    expect(directive('frame-ancestors')).toEqual(["'none'"])
    expect(directive('base-uri')).toEqual(["'self'"])
  })

  it('permite Supabase, Turnstile y Google Fonts', () => {
    expect(directive('connect-src').some((source) => /^https:\/\/[a-z0-9]{20}\.supabase\.co$/.test(source))).toBe(true)
    for (const name of ['script-src', 'connect-src', 'frame-src'])
      expect(directive(name)).toContain('https://challenges.cloudflare.com')
    expect(directive('style-src')).toContain('https://fonts.googleapis.com')
    expect(directive('font-src')).toContain('https://fonts.gstatic.com')
    expect(indexHtml).toContain('https://fonts.googleapis.com/css2?')
  })
})

describe('public/_redirects', () => {
  it('existe (Vite lo copia a dist/)', () => {
    expect(redirects).toBeTypeOf('string')
  })

  it('entrega index.html para toda ruta con 200, no con una redirección', () => {
    // Sin esta regla, recargar /pqrs o /dashboard/… en producción da el 404 de Netlify.
    expect(rules(redirects ?? '')).toEqual(['/* /index.html 200'])
  })
})
