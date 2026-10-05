// Hasta dos iniciales: primera y última palabra ("Ana María Pérez" → "AP"). Con un correo, la
// primera letra antes de la arroba.
export function initials(name: string): string {
  const words = name.split('@')[0].trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  const first = words[0][0]
  const last = words.length > 1 ? words[words.length - 1][0] : ''
  return (first + last).toLocaleUpperCase('es')
}
