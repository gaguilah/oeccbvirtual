import { describe, expect, it } from 'vitest'
import { containedRect, isOnScreen, zoomStartTransform } from './zoom'

describe('isOnScreen', () => {
  const rect = (top: number, height = 200) => ({ left: 0, top, width: 300, height })
  it('dentro, cortada arriba o abajo: sí; fuera o sin alto: no', () => {
    expect(isOnScreen(rect(100), 900)).toBe(true)
    expect(isOnScreen(rect(-150), 900)).toBe(true)
    expect(isOnScreen(rect(850), 900)).toBe(true)
    expect(isOnScreen(rect(-200), 900)).toBe(false)
    expect(isOnScreen(rect(900), 900)).toBe(false)
    expect(isOnScreen(rect(100, 0), 900)).toBe(false)
  })
})

describe('containedRect', () => {
  it('imagen horizontal en una caja más alta: centrada en vertical', () => {
    expect(containedRect({ left: 0, top: 0, width: 800, height: 384 }, 1600, 400)).toEqual({
      left: 0,
      top: 92,
      width: 800,
      height: 200,
    })
  })

  it('captura vertical: centrada en horizontal', () => {
    expect(containedRect({ left: 10, top: 20, width: 800, height: 384 }, 400, 800)).toEqual({
      left: 314,
      top: 20,
      width: 192,
      height: 384,
    })
  })

  it('sin tamaño natural devuelve la caja', () => {
    const box = { left: 1, top: 2, width: 3, height: 4 }
    expect(containedRect(box, 0, 0)).toBe(box)
  })
})

describe('zoomStartTransform', () => {
  const dialog = { left: 100, top: 50, width: 1000, height: 700 }
  const zoomed = { left: 124, top: 110, width: 952, height: 476 }

  it('lleva la imagen ampliada sobre la miniatura', () => {
    const thumb = { left: 300, top: 400, width: 476, height: 238 }
    const transform = zoomStartTransform(dialog, zoomed, thumb)!
    const [, x, y, s] = transform.match(/translate\((.+)px, (.+)px\) scale\((.+)\)/)!.map(Number)
    // Esquina de la imagen después de transformar el diálogo desde su esquina superior izquierda.
    expect(dialog.left + x + s * (zoomed.left - dialog.left)).toBeCloseTo(thumb.left, 1)
    expect(dialog.top + y + s * (zoomed.top - dialog.top)).toBeCloseTo(thumb.top, 1)
    expect(s * zoomed.width).toBeCloseTo(thumb.width, 1)
  })

  it('sin medidas no anima', () => {
    expect(zoomStartTransform(dialog, { ...zoomed, width: 0 }, zoomed)).toBeNull()
  })
})
