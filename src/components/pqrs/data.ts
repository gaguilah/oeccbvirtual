export const REQUEST_TYPE_IDS = ['peticion', 'queja', 'reclamo', 'sugerencia', 'felicitacion'] as const

export type RequestTypeId = (typeof REQUEST_TYPE_IDS)[number]

export const SUMMARY_MAX_CHARS = 2000

// Pasos del formulario (los usan PqrsForm y la ilustración del encabezado).
export const REQUEST_STEPS = ['Tipo de solicitud', 'Datos de contacto', 'Su solicitud']

export const requestTypes: Record<RequestTypeId, { label: string; description: string }> = {
  peticion: {
    label: 'Petición',
    description: 'Solicitud respetuosa de información, documentos o una actuación de la oficina.',
  },
  queja: {
    label: 'Queja',
    description: 'Inconformidad con la conducta o atención de un servidor de la oficina.',
  },
  reclamo: {
    label: 'Reclamo',
    description: 'Inconformidad por la prestación deficiente o irregular de un servicio.',
  },
  sugerencia: {
    label: 'Sugerencia',
    description: 'Propuesta para mejorar un trámite o servicio.',
  },
  felicitacion: {
    label: 'Felicitación',
    description: 'Reconocimiento a un servidor o a la calidad de un servicio recibido.',
  },
}
