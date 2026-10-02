// Datos de la ilustración de Avisos de Remate (decorativa). Ver docs/plan-remates-ilustracion.md.
// Es una agenda genérica: sin mes, año ni radicados, para no confundirla con la programación real.

export const calendar = {
  // Columna (0 = lunes) en la que cae el día 1 y cantidad de días del mes.
  offset: 2,
  days: 30,
  weekdays: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
  // Días con remate (martes y jueves: con offset 2, martes = 7, 14, 21, 28 y jueves = 2, 9, 16, 23, 30)
  // y el retraso de entrada de su punto. Las clases van completas para que Tailwind las genere.
  dots: [
    { day: 2, delay: '[animation-delay:450ms]' },
    { day: 7, delay: '[animation-delay:500ms]' },
    { day: 9, delay: '[animation-delay:550ms]' },
    { day: 14, delay: '[animation-delay:600ms]' },
    { day: 21, delay: '[animation-delay:650ms]' },
    { day: 23, delay: '[animation-delay:700ms]' },
    { day: 28, delay: '[animation-delay:750ms]' },
  ],
  selected: 16,
  tooltip: 'Remate · 08:30 a. m.',
}

export const statusPanel = {
  label: 'Estado',
  upcoming: { title: 'Próximos', times: ['08:30 a. m.', '10:00 a. m.'] },
  past: { title: 'Pasados', times: ['09:00 a. m.', '10:00 a. m.'] },
}

export const mainPanel = {
  label: 'Juzgados de Ejecución · Bucaramanga',
  agenda: 'Agenda de remates',
  notice: 'Aviso de remate',
  downloaded: 'Descargado',
}
