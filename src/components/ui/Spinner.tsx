import { cn } from '../../lib/cn'

const sizes = {
  sm: 'size-4 border-2',
  md: 'size-6 border-2',
  lg: 'size-10 border-4',
}

type SpinnerProps = {
  size?: keyof typeof sizes
  label?: string
  className?: string
}

export default function Spinner({ size = 'md', label = 'Cargando...', className }: SpinnerProps) {
  return (
    <span role="status" className={cn('inline-flex items-center', className)}>
      <span
        aria-hidden="true"
        className={cn('animate-spin rounded-full border-current border-t-transparent', sizes[size])}
      />
      <span className="sr-only">{label}</span>
    </span>
  )
}
