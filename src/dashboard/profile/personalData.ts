// Información personal y contacto de emergencia (docs/plan-perfil-informacion-personal.md). Los
// códigos de parentesco y la regla del celular se repiten en la base de datos (migración
// 20261027120000_profile_personal_info.sql): si cambian, cambiar los dos.

export const RELATIONSHIPS = [
  { value: 'madre', label: 'Madre' },
  { value: 'padre', label: 'Padre' },
  { value: 'conyuge', label: 'Cónyuge o compañero(a) permanente' },
  { value: 'hijo', label: 'Hijo(a)' },
  { value: 'hermano', label: 'Hermano(a)' },
  { value: 'otro_familiar', label: 'Otro familiar' },
  { value: 'amigo', label: 'Amigo(a)' },
  { value: 'otro', label: 'Otro' },
] as const

export type Relationship = (typeof RELATIONSHIPS)[number]['value']

export function relationshipLabel(value: string | null): string | null {
  return RELATIONSHIPS.find((item) => item.value === value)?.label ?? value
}

// Celular colombiano: 10 dígitos que empiezan por 3.
export const PHONE_PATTERN = /^3\d{9}$/

// Lo que se puede escribir en un celular: dígitos, espacios, guiones, puntos, paréntesis y +.
export const PHONE_CHARS = /^[\d\s().+-]*$/

// Deja solo los dígitos (acepta espacios, guiones, puntos, paréntesis y el indicativo +57).
export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  return digits.length === 12 && digits.startsWith('57') ? digits.slice(2) : digits
}

// 3001234567 → "300 123 4567".
export function formatPhone(value: string): string {
  return PHONE_PATTERN.test(value) ? `${value.slice(0, 3)} ${value.slice(3, 6)} ${value.slice(6)}` : value
}

const updatedFormat = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  dateStyle: 'long',
  timeStyle: 'short',
})

// "27 de octubre de 2026, 3:40 p. m." (hora de Bogotá).
export function formatUpdatedAt(value: string): string {
  return updatedFormat.format(new Date(value))
}

// Grupos de la lista de EPS, en el orden del formulario ('otra' al final).
export const EPS_REGIMES = [
  { value: 'contributivo', label: 'Régimen contributivo' },
  { value: 'subsidiado', label: 'Régimen subsidiado' },
  { value: 'especial', label: 'Régimen especial o de excepción' },
  { value: 'otra', label: 'Otra' },
] as const

// Textos de ayuda (decisión del 2026-10-27: ayudas junto a los campos, sin casilla de aceptación).
export const PERSONAL_HELP = {
  intro:
    'Estos datos son opcionales: registre solo los que quiera. Solo usted puede editarlos; el Director de oficina y el Administrador de Sistema pueden consultarlos para comunicarse con usted o atender una emergencia.',
  address: 'Dirección completa, con barrio y municipio.',
  phone: '10 dígitos, por ejemplo 300 123 4567.',
  email: 'Distinto del correo con el que ingresa al dashboard.',
  eps: 'Se usa solo para informar a los servicios de salud en caso de emergencia.',
  emergencyIntro:
    'Persona a quien la oficina llamará si usted tiene una emergencia en el trabajo. Asegúrese de que esté de acuerdo en que registre su número.',
} as const
