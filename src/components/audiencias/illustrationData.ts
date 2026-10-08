// Datos de la ilustración de Audiencias (decorativa): agenda genérica, sin fechas ni radicados
// reales, para no confundirla con la programación.

export const videoIcon = [
  'm15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z',
]

export const todayPanel = {
  label: 'Agenda',
  today: {
    title: 'Hoy',
    rows: [
      { time: '08:30 a. m.', status: 'Virtual' },
      { time: '10:00 a. m.', status: 'Presencial' },
    ],
  },
  done: { title: 'Realizadas', rows: ['09:00 a. m.', '02:30 p. m.'] },
}

// Semana: columnas de lunes a viernes con bloques (fila de inicio y alto en filas de 1 hora). Las
// clases van completas para que Tailwind las genere.
export const week = {
  days: ['L', 'M', 'M', 'J', 'V'],
  blocks: [
    { day: 0, className: 'top-1 h-5', delay: '[--illustration-delay:450ms]' },
    { day: 1, className: 'top-7 h-5', delay: '[--illustration-delay:500ms]', selected: true },
    { day: 1, className: 'top-17 h-5', delay: '[--illustration-delay:550ms]' },
    { day: 2, className: 'top-4 h-5', delay: '[--illustration-delay:600ms]' },
    { day: 3, className: 'top-1 h-5', delay: '[--illustration-delay:650ms]' },
    { day: 3, className: 'top-12 h-5', delay: '[--illustration-delay:700ms]' },
    { day: 4, className: 'top-9 h-5', delay: '[--illustration-delay:750ms]' },
  ],
}

export const mainPanel = {
  label: 'Juzgados de Ejecución · Bucaramanga',
  week: 'Semana de audiencias',
  hearing: 'Audiencia de Remate',
  hearingTime: '08:30 a. m. · Juzgado 1',
  connect: 'Conectarse',
  recording: 'Ver grabación',
  recorded: 'Grabación disponible',
}
