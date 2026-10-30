import { describe, expect, it } from 'vitest'
import { INTEREST_LINKS } from './externalLinks'

describe('enlaces de interés', () => {
  it('son URL https completas, sin repetir', () => {
    const hrefs = INTEREST_LINKS.map((link) => link.href)
    expect(new Set(hrefs).size).toBe(hrefs.length)
    for (const href of hrefs) expect(new URL(href).protocol).toBe('https:')
  })

  it('cada uno tiene título único, descripción e icono', () => {
    const titles = INTEREST_LINKS.map((link) => link.title)
    expect(new Set(titles).size).toBe(titles.length)
    for (const link of INTEREST_LINKS) {
      expect(link.description.trim()).not.toBe('')
      expect(link.icon.length).toBeGreaterThan(0)
    }
  })
})
