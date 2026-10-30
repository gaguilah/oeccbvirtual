import { describe, expect, it } from 'vitest'
import { findTutorial, findTutorialIndex, tutorialPath, tutorials, TUTORIALS_PATH } from './data'
import { cycleTutorials } from './illustrationData'

// Archivos de public/img/tutoriales, para comprobar que cada captura existe.
const publicImages = new Set(
  Object.keys(import.meta.glob('/public/img/tutoriales/**/*')).map((path) => path.replace(/^\/public/, '')),
)
const slugs = tutorials.map((tutorial) => tutorial.slug)

describe('tutoriales', () => {
  it('los slugs son únicos y sirven en la URL', () => {
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it('requisitos y siguiente paso apuntan a otros tutoriales que existen', () => {
    for (const tutorial of tutorials) {
      for (const slug of [...(tutorial.prerequisites ?? []), ...(tutorial.next ? [tutorial.next] : [])]) {
        expect(slugs, `${tutorial.slug} → ${slug}`).toContain(slug)
        expect(slug, `${tutorial.slug} se referencia a sí mismo`).not.toBe(tutorial.slug)
      }
    }
  })

  it('cada tutorial tiene título, descripción, resumen y pasos con texto', () => {
    for (const tutorial of tutorials) {
      expect(tutorial.title.trim(), tutorial.slug).not.toBe('')
      expect(tutorial.description.trim(), tutorial.slug).not.toBe('')
      expect(tutorial.summary.trim(), tutorial.slug).not.toBe('')
      expect(tutorial.steps.length, tutorial.slug).toBeGreaterThan(0)
      for (const step of tutorial.steps) expect(step.text.trim(), tutorial.slug).not.toBe('')
    }
  })

  it('cada captura existe en public/ y está en la carpeta de su tutorial, con texto alternativo', () => {
    for (const tutorial of tutorials) {
      for (const { image } of tutorial.steps) {
        if (!image) continue
        expect(publicImages, image.src).toContain(image.src)
        expect(image.src.startsWith(`/img/tutoriales/${tutorial.slug}/`), image.src).toBe(true)
        expect(image.alt.trim(), image.src).not.toBe('')
      }
    }
  })

  it('los enlaces de los pasos son https', () => {
    for (const tutorial of tutorials) {
      for (const { link } of tutorial.steps) {
        if (link) expect(new URL(link.href).protocol, link.href).toBe('https:')
      }
    }
  })

  it('arma la ruta y encuentra cada tutorial por su slug', () => {
    expect(tutorialPath('estados')).toBe(`${TUTORIALS_PATH}/estados`)
    expect(findTutorial('estados')?.slug).toBe('estados')
    expect(findTutorial('no-existe')).toBeUndefined()
    expect(findTutorialIndex(slugs[1])).toBe(1)
    expect(findTutorialIndex(undefined)).toBe(-1)
  })
})

describe('ilustración de Tutoriales', () => {
  it('el ciclo de la tarjeta recorre todos los tutoriales', () => {
    // Si cambia la cantidad de tutoriales, ajustar CYCLE_DELAYS y animate-illustration-cycle (index.css).
    expect(cycleTutorials.map((item) => item.slug)).toEqual(slugs)
  })
})
