import { describe, expect, it } from 'vitest'
import { DASHBOARD_HOME, dashboardLinks } from '../navigation/links'
import { MODULE_LABELS } from '../permisos/data'
import { GUIDE_CONTENT } from './data'
import { DEFAULT_GUIDE, findGuide, GUIDES, guideForPath, helpPath, sectionAnchor } from './guides'
import type { GuideBlock } from './types'

// Todos los textos de una guía (resumen, títulos, bloques y preguntas frecuentes).
function blockTexts(block: GuideBlock): string[] {
  switch (block.type) {
    case 'paragraph':
      return [block.text]
    case 'list':
    case 'steps':
      return block.items
    case 'table':
      return [...block.headers, ...block.rows.flat()]
    case 'note':
      return [block.title ?? '', block.text]
    case 'roles':
      return []
  }
}
const texts = Object.values(GUIDE_CONTENT).flatMap((guide) => [
  guide.summary,
  ...guide.sections.flatMap((section) => [section.title, ...section.blocks.flatMap(blockTexts)]),
  ...guide.faq.flatMap((item) => [item.q, item.a]),
])

describe('GUIDES', () => {
  it('slugs únicos, cada uno con su contenido, y la predeterminada primero', () => {
    const slugs = GUIDES.map((guide) => guide.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(Object.keys(GUIDE_CONTENT).sort()).toEqual([...slugs].sort())
    expect(GUIDES[0].slug).toBe(DEFAULT_GUIDE)
  })

  it('cada ruta que explica es una opción del dashboard', () => {
    const paths = dashboardLinks.map((link) => link.to)
    for (const path of GUIDES.flatMap((guide) => guide.paths)) expect(paths, path).toContain(path)
  })

  it('cada sección del menú tiene una guía', () => {
    const sections = dashboardLinks.filter((link) => link.group !== 'account' && link.to !== DASHBOARD_HOME)
    for (const link of sections) expect(guideForPath(link.to), link.to).not.toBeNull()
  })

  it('cada módulo de la tabla "Quién puede hacer qué" tiene nombre', () => {
    for (const module of GUIDES.flatMap((guide) => guide.modules)) {
      expect(Object.keys(MODULE_LABELS), module).toContain(module)
    }
  })
})

describe('guideForPath y enlaces', () => {
  it('la guía de una ruta y sus subrutas; null fuera de ellas', () => {
    expect(guideForPath('/dashboard/pqrs')).toBe('pqrs')
    expect(guideForPath('/dashboard/pqrs/123/')).toBe('pqrs')
    expect(guideForPath('/dashboard/dias-no-habiles')).toBe('administracion')
    expect(guideForPath('/dashboard')).toBeNull()
    expect(guideForPath('/dashboard/pqrsx')).toBeNull()
  })

  it('findGuide con un slug desconocido abre la primera', () => {
    expect(findGuide('encuestas').slug).toBe('encuestas')
    expect(findGuide('no-existe').slug).toBe(DEFAULT_GUIDE)
    expect(findGuide(null).slug).toBe(DEFAULT_GUIDE)
  })

  it('helpPath y sectionAnchor', () => {
    expect(helpPath()).toBe('/dashboard/ayuda')
    expect(helpPath('audiencias')).toBe('/dashboard/ayuda?guia=audiencias')
    expect(sectionAnchor('pqrs', 'plazos')).toBe('pqrs-plazos')
  })
})

describe('contenido de la Ayuda', () => {
  it('ids de sección únicos dentro de cada guía', () => {
    for (const [slug, guide] of Object.entries(GUIDE_CONTENT)) {
      const ids = guide.sections.map((section) => section.id)
      expect(new Set(ids).size, slug).toBe(ids.length)
    }
  })

  it('las tablas tienen tantas celdas como encabezados', () => {
    for (const guide of Object.values(GUIDE_CONTENT)) {
      for (const block of guide.sections.flatMap((section) => section.blocks)) {
        if (block.type !== 'table') continue
        for (const row of block.rows) expect(row, row[0]).toHaveLength(block.headers.length)
      }
    }
  })

  it('solo **negrita** bien cerrada, sin HTML', () => {
    for (const text of texts) {
      expect(text.replace(/\*\*(.+?)\*\*/g, '$1'), text).not.toContain('*')
      expect(text, text).not.toMatch(/<[a-z/]/i)
    }
  })

  it('para el personal: "Administrador de Sistema", nunca "superadmin"', () => {
    for (const text of texts) expect(text.toLowerCase(), text).not.toContain('superadmin')
  })
})
