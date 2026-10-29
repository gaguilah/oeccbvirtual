import { describe, expect, it } from 'vitest'
// Rutas de la app y de la Edge Function como texto, para comprobar que los enlaces tienen destino.
import appSource from '../../App.tsx?raw'
import passwordResetSource from '../../../supabase/functions/password-reset/index.ts?raw'
import { LOGIN_PATH, RECOVER_PATH, RESET_PATH } from '../account/paths'
import { AUDIENCIAS_PATH } from '../audiencias/constants'
import { AVISOS_REMATES_PATH } from '../remates/constants'
import { services } from '../services/data'
import { TUTORIALS_PATH } from '../tutorials/data'
import { mainLinks } from './links'

const routes = [...appSource.matchAll(/<Route path="([^"]+)"/g)].map((match) => match[1])

describe('navegación pública', () => {
  it('cada enlace del menú es único y tiene su ruta en App.tsx', () => {
    const paths = mainLinks.map((link) => link.to)
    expect(new Set(paths).size).toBe(paths.length)
    for (const path of paths) expect(routes, path).toContain(path)
  })

  it('las constantes de ruta de cada sección están en el menú', () => {
    const paths = mainLinks.map((link) => link.to)
    for (const path of [AVISOS_REMATES_PATH, AUDIENCIAS_PATH, TUTORIALS_PATH]) expect(paths).toContain(path)
  })

  it('cada servicio del inicio apunta a una ruta del menú', () => {
    const paths = mainLinks.map((link) => link.to)
    for (const service of services) expect(paths, service.to).toContain(service.to)
  })

  it('las rutas de la cuenta existen', () => {
    for (const path of [LOGIN_PATH, RECOVER_PATH, RESET_PATH]) expect(routes, path).toContain(path)
  })

  it('password-reset arma el enlace con la misma ruta que la página', () => {
    expect(passwordResetSource).toContain(`const RESET_PATH = '${RESET_PATH}'`)
  })
})
