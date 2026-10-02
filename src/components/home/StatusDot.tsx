import { cn } from '../../lib/cn'

// Estado "activo" de la ilustración: punto verde + etiqueta (colores de estado).
export default function StatusDot({ label, className }: { label: string; className?: string }) {
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1.5 text-green-700 dark:text-green-400', className)}>
      <span className="size-2 rounded-full bg-green-500" />
      {label}
    </span>
  )
}
