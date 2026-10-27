import { describe, expect, it } from 'vitest'
import { AUDIENCIAS_PATH } from '../audiencias/constants'
import { AVISOS_REMATES_PATH } from '../remates/constants'
import { TUTORIALS_PATH } from '../tutorials/data'
import { serviceDescription, services } from './data'

describe('serviceDescription', () => {
  it('da el subtítulo de las páginas que lo toman de los servicios', () => {
    for (const path of [AVISOS_REMATES_PATH, AUDIENCIAS_PATH, TUTORIALS_PATH]) {
      expect(serviceDescription(path)).toBe(services.find((service) => service.to === path)?.description)
      expect(serviceDescription(path)).toMatch(/Oficina/)
    }
  })

  it('no inventa una descripción para una ruta que no es un servicio', () => {
    expect(serviceDescription('/contacto')).toBeUndefined()
  })
})
