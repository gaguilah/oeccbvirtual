// Modalidad de una audiencia: sale de su tipo (hearing_types.requires_link), no se guarda por
// audiencia. Regla y nombres únicos para el sitio público y el dashboard; hearing_stats(p_virtual)
// repite la regla en SQL.
export type Modality = 'virtual' | 'presencial'

const NAMES: Record<Modality, { label: string; short: string }> = {
  virtual: { label: 'Virtual (Microsoft Teams)', short: 'Virtual' },
  presencial: { label: 'Presencial', short: 'Presencial' },
}

export const MODALITIES: { value: Modality; label: string }[] = [
  { value: 'virtual', label: NAMES.virtual.label },
  { value: 'presencial', label: NAMES.presencial.label },
]

type WithLinkRule = { requires_link: boolean }

export const modalityOf = (type: WithLinkRule): Modality => (type.requires_link ? 'virtual' : 'presencial')

export const modalityLabel = (type: WithLinkRule) => NAMES[modalityOf(type)].label

export const modalityShort = (type: WithLinkRule) => NAMES[modalityOf(type)].short
