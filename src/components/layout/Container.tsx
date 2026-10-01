import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

// Ancho máximo y márgenes laterales compartidos por todo el sitio.
// En escritorio usa márgenes amplios (px-16) según design.md.
export default function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mx-auto w-full max-w-7xl px-4 sm:px-8 lg:px-16', className)} {...props} />
}
