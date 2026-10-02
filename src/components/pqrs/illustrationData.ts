// Datos de la ilustración de PQRS (decorativa). Ver docs/plan-pqrs-ilustracion.md.
// Los tipos y los pasos salen de los mismos datos del formulario.
import { REQUEST_STEPS, REQUEST_TYPE_IDS, requestTypes, type RequestTypeId } from './data'

const SELECTED_TYPE: RequestTypeId = 'peticion'

export const typeOptions = REQUEST_TYPE_IDS.map((id) => ({
  id,
  label: requestTypes[id].label,
  selected: id === SELECTED_TYPE,
}))

// El último paso es el activo; los anteriores aparecen completados.
export const steps = {
  count: REQUEST_STEPS.length,
  current: `Paso ${REQUEST_STEPS.length} de ${REQUEST_STEPS.length} · ${REQUEST_STEPS[REQUEST_STEPS.length - 1]}`,
}

export const texts = {
  formPanel: 'Formulario',
  typeCard: REQUEST_STEPS[0],
  mainPanel: 'Radicación en línea',
  requestCard: REQUEST_STEPS[REQUEST_STEPS.length - 1],
  name: 'Nombre',
  email: 'Correo',
  // Frase que se escribe sola; corta para que quepa en una línea del cuadro de texto.
  summary: 'Solicito información sobre mi proceso…',
  captcha: 'Verificación de seguridad',
  send: 'Enviar solicitud',
  sentCard: 'Solicitud recibida',
  sentTitle: '¡Gracias! Su solicitud fue recibida.',
  sentHint: 'Respuesta al correo registrado',
  sentStatus: 'Recibida',
}
