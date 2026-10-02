import { cn } from '../../lib/cn'

type Tone = 'primary' | 'neutral'

type IllustrationHatchProps = {
  tone?: Tone
  // Posición y tamaño: los de la tarjeta que acompaña, desplazados (p. ej. +2 en top y left).
  className?: string
}

// El color del rayado y del contorno sale de --hatch (un token), así funciona en ambos temas.
const tones: Record<Tone, string> = {
  primary: '[--hatch:var(--color-primary)]',
  neutral: '[--hatch:var(--color-on-surface)]',
}

// Fondo rayado de acento que asoma detrás de una tarjeta (como una sombra de color).
export default function IllustrationHatch({ tone = 'primary', className }: IllustrationHatchProps) {
  return <div className={cn('illustration-hatch absolute rounded-lg', tones[tone], className)} />
}
