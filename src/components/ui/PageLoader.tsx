import { cn } from '../../lib/cn'
import Spinner from './Spinner'

// Spinner centrado a pantalla completa: sesión cargando o una página que se descarga (lazy).
export default function PageLoader({ className }: { className?: string }) {
  return (
    <div className={cn('flex min-h-svh items-center justify-center bg-surface text-primary', className)}>
      <Spinner size="lg" />
    </div>
  )
}
