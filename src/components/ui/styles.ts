// Clases compartidas por los campos de formulario (Input, Select).
// Estilo minimalista: fondo sutil y solo una línea inferior que pasa a `primary` al enfocar.
export const fieldBase =
  'block min-h-10 w-full rounded-t-md border-0 border-b bg-surface-variant px-3 py-2 text-on-surface placeholder:text-on-surface-variant/60 transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-60'

export const fieldState = {
  normal: 'border-outline-variant/20 focus:border-primary',
  error: 'border-red-600 dark:border-red-400',
}

export const labelClasses = 'block text-sm font-medium text-on-surface-variant'
