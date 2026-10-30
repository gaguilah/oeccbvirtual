import { describe, expect, it } from 'vitest'
import { INJECTION_PAYLOADS } from '../../lib/testInjection'
import personalInfoModalSource from '../usuarios/PersonalInfoModal.tsx?raw'
import { emergencyContactSchema, personalInfoSchema } from './personalSchema'

const emptyPersonal = { residenceAddress: '', mobilePhone: '', personalEmail: '', epsId: '' }
const emptyEmergency = { emergencyName: '', emergencyRelationship: '', emergencyPhone: '' }

// Primer mensaje de error del campo, o null si es válido.
function personalError(field: keyof typeof emptyPersonal, value: string) {
  const result = personalInfoSchema.safeParse({ ...emptyPersonal, [field]: value })
  return result.success ? null : result.error.issues[0].message
}

function emergencyError(field: keyof typeof emptyEmergency, value: string) {
  const result = emergencyContactSchema.safeParse({ ...emptyEmergency, [field]: value })
  return result.success ? null : result.error.issues[0].message
}

describe('información personal', () => {
  it('todo vacío es válido y se guarda como null', () => {
    expect(personalInfoSchema.parse(emptyPersonal)).toEqual({
      residenceAddress: null,
      mobilePhone: null,
      personalEmail: null,
      epsId: null,
    })
  })

  it('normaliza lo que se guarda', () => {
    expect(
      personalInfoSchema.parse({
        residenceAddress: '  Calle 35   # 12-40,  Centro, Bucaramanga ',
        mobilePhone: '+57 300-123-4567',
        personalEmail: ' Nombre@Correo.COM ',
        epsId: '7',
      }),
    ).toEqual({
      residenceAddress: 'Calle 35 # 12-40, Centro, Bucaramanga',
      mobilePhone: '3001234567',
      personalEmail: 'nombre@correo.com',
      epsId: 7,
    })
  })

  describe('celular', () => {
    it('rechaza letras con un mensaje (antes se guardaba vacío sin aviso)', () => {
      expect(personalError('mobilePhone', 'abc')).toBe('Escriba solo números (puede separarlos con espacios)')
      expect(personalError('mobilePhone', '300abc4567')).toBe('Escriba solo números (puede separarlos con espacios)')
    })

    it('rechaza números que no son celulares', () => {
      expect(personalError('mobilePhone', '12345')).toBe('Escriba un celular de 10 dígitos que empiece por 3')
      expect(personalError('mobilePhone', '607 123 4567')).toBe('Escriba un celular de 10 dígitos que empiece por 3')
    })

    it('solo espacios cuenta como vacío', () => {
      expect(personalInfoSchema.parse({ ...emptyPersonal, mobilePhone: '   ' }).mobilePhone).toBeNull()
    })
  })

  describe('dirección', () => {
    it('exige al menos 5 caracteres', () => {
      expect(personalError('residenceAddress', 'Cra')).toBe('Escriba la dirección completa')
      expect(personalError('residenceAddress', 'Cra 1')).toBeNull()
    })

    it('no pasa de 200 caracteres', () => {
      expect(personalError('residenceAddress', 'a'.repeat(200))).toBeNull()
      expect(personalError('residenceAddress', 'a'.repeat(201))).toBe('La dirección no puede pasar de 200 caracteres')
    })
  })

  describe('correo personal', () => {
    it('rechaza correos sin formato válido', () => {
      const message = 'Escriba un correo válido, por ejemplo nombre@correo.com'
      expect(personalError('personalEmail', 'nombre')).toBe(message)
      expect(personalError('personalEmail', 'nombre@correo')).toBe(message)
      expect(personalError('personalEmail', 'nom bre@correo.com')).toBe(message)
    })

    it('solo acepta caracteres ASCII (como la restricción de la base)', () => {
      const message = 'Escriba el correo sin tildes, eñes ni otros caracteres especiales'
      expect(personalError('personalEmail', 'josé@correo.com')).toBe(message)
      expect(personalError('personalEmail', 'peña@correo.com')).toBe(message)
      expect(personalError('personalEmail', 'İnes@correo.com')).toBe(message)
      expect(personalError('personalEmail', 'jose.pena+1@correo.com')).toBeNull()
    })

    it('no pasa de 254 caracteres', () => {
      expect(personalError('personalEmail', `${'a'.repeat(245)}@correo.co`)).toBe(
        'El correo no puede pasar de 254 caracteres',
      )
    })
  })
})

describe('contacto de emergencia', () => {
  it('todo vacío es válido y se guarda como null', () => {
    expect(emergencyContactSchema.parse(emptyEmergency)).toEqual({
      emergencyName: null,
      emergencyRelationship: null,
      emergencyPhone: null,
    })
  })

  it('normaliza el nombre y el celular', () => {
    expect(
      emergencyContactSchema.parse({
        emergencyName: '  María   José  O’Neil ',
        emergencyRelationship: 'madre',
        emergencyPhone: '310 555 1234',
      }),
    ).toEqual({ emergencyName: "María José O'Neil", emergencyRelationship: 'madre', emergencyPhone: '3105551234' })
  })

  it('usa la regla del nombre del perfil con su propio mensaje', () => {
    expect(emergencyError('emergencyName', 'Al')).toBe('Escriba el nombre completo de su contacto')
    expect(emergencyError('emergencyName', 'Ana 2')).toBe('El nombre no puede tener números')
    expect(emergencyError('emergencyName', 'Ana--María')).toBe(
      "Use solo letras, espacios, guiones (-) y apóstrofos ('), sin signos seguidos",
    )
  })

  it('solo acepta parentescos de la lista', () => {
    expect(emergencyError('emergencyRelationship', 'conyuge')).toBeNull()
    expect(emergencyError('emergencyRelationship', 'primo')).toBe('Elija un parentesco de la lista')
  })

  it('valida el celular igual que el propio', () => {
    expect(emergencyError('emergencyPhone', 'abc')).toBe('Escriba solo números (puede separarlos con espacios)')
  })
})

// Se muestran en Usuarios → "Ver información personal": el celular en un enlace tel: y el correo en
// uno mailto:, así que no pueden llevar código. La dirección es texto libre que React muestra como texto.
describe('código en la información personal', () => {
  it.each(INJECTION_PAYLOADS)('celulares, correo, nombre y parentesco rechazan %s', (payload) => {
    expect(personalError('mobilePhone', payload)).not.toBeNull()
    expect(personalError('personalEmail', payload)).not.toBeNull()
    expect(emergencyError('emergencyPhone', payload)).not.toBeNull()
    expect(emergencyError('emergencyName', payload)).not.toBeNull()
    expect(emergencyError('emergencyRelationship', payload)).not.toBeNull()
  })

  // El formato del correo es amplio (igual que el check de la base) y admite comillas; no es un
  // riesgo porque el enlace siempre empieza por mailto: y React escapa las comillas del atributo.
  it('los enlaces del modal empiezan siempre por mailto: y tel:', () => {
    expect(personalInfoModalSource).toContain('href={`mailto:${info.personal_email}`}')
    expect(personalInfoModalSource).toContain('href={`tel:+57${value}`}')
  })
})
