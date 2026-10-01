import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type DivProps = HTMLAttributes<HTMLDivElement>

// Elevación por capas tonales: la tarjeta (lowest) se separa del fondo sin bordes ni sombras.
export default function Card({ className, ...props }: DivProps) {
  return <div className={cn('overflow-hidden rounded-lg bg-surface-container-lowest', className)} {...props} />
}

export function CardHeader({ className, ...props }: DivProps) {
  return <div className={cn('px-4 pt-5 sm:px-6 sm:pt-6', className)} {...props} />
}

export function CardBody({ className, ...props }: DivProps) {
  return <div className={cn('px-4 py-5 sm:p-6', className)} {...props} />
}

export function CardFooter({ className, ...props }: DivProps) {
  return <div className={cn('bg-surface-container-low px-4 py-4 sm:px-6', className)} {...props} />
}
