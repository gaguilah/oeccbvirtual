// Cargas de inyección de código para las pruebas (docs/plan-pruebas.md, Fase 3). Solo las usan los
// archivos *.test.ts: la app no importa este archivo.
export const INJECTION_PAYLOADS = [
  `<script>alert('xss')</script>`,
  `"><img src=x onerror=alert(1)>`,
  `<svg onload=alert(1)>`,
  `'><iframe src="javascript:alert(1)"></iframe>`,
  `<a href="javascript:alert(1)">clic</a>`,
]

// Lo que solo aparecería en el HTML si una carga llegó sin escapar: las plantillas nunca usan estas
// etiquetas ni enlaces javascript:.
export const INJECTED_MARKUP = /<(script|img|svg|iframe)\b|href="javascript:/i
