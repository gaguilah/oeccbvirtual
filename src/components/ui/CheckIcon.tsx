import { cn } from '../../lib/cn'

export default function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('size-4', className)}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  )
}
