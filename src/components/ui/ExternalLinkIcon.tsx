import { cn } from '../../lib/cn'

// Flecha de enlace externo (Heroicons "arrow-top-right-on-square"). Decorativa: el enlace debe
// avisar con texto oculto que se abre en una pestaña nueva.
export default function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('size-4', className)}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
      />
    </svg>
  )
}
